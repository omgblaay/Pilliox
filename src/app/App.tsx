import { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  BrowserRouter,
} from "react-router";
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n/config";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import LandingPage from "./pages/LandingPage";
import { AuthPage } from "./pages/AuthPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import {
  projectId,
  publicAnonKey,
} from "../../utils/supabase/info";
import { getSupabaseClient } from "../../utils/supabase/client";
import { useTheme } from "./hooks/useTheme";
import { SubscriptionProvider } from "./hooks/useSubscription";
import { SubscriptionBanner } from "./components/SubscriptionBanner";
import { SubscriptionPaywall } from "./components/SubscriptionPaywall";
import { NotificationPermissionBanner } from "./components/NotificationPermissionBanner";
import { Toaster } from "sonner";
import { CookieBanner } from "./components/CookieBanner";
import CalendarPage from "./pages/CalendarPage";
import { MedicationsPage } from "./pages/MedicationsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SettingsPage } from "./pages/SettingsPage";
import { SubscriptionPage } from "./pages/SubscriptionPage";
import { TermsOfService } from "./pages/TermsOfService";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { OnboardingPage } from "./pages/OnboardingPage";

function AppRoutes() {
  // Initialize theme system to detect browser preference
  useTheme("system");
  const navigate = useNavigate();

  const [accessToken, setAccessToken] = useState<string | null>(
    null,
  );
  const [userEmail, setUserEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();
    let subscription: any;

    const initAuth = async () => {
      try {
        // CRITICAL: Check for password reset parameters FIRST
        const urlParams = new URLSearchParams(
          window.location.search,
        );
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1),
        );

        const code = urlParams.get("code");
        const token = urlParams.get("token");
        const type = urlParams.get("type");

        // Check hash params for recovery tokens (from direct Supabase redirect)
        const hashAccessToken = hashParams.get("access_token");
        const hashType = hashParams.get("type");

        // Redirect to reset password if this is explicitly a password recovery
        // Check multiple formats: code, token, or hash access_token with type=recovery
        // CRITICAL: Check if we're landing on root (/) with recovery tokens
        if (
          (code && type === "recovery") ||
          (token && type === "recovery") ||
          (hashAccessToken && hashType === "recovery")
        ) {
          // Only redirect if we're not already on the reset password page
          if (window.location.pathname !== "/reset-password") {
            // CRITICAL: Use full window.location to preserve all parameters
            const newUrl =
              "/reset-password" +
              window.location.search +
              window.location.hash;
            window.location.replace(newUrl); // Use replace to avoid adding to history
            return;
          }

          setIsLoading(false);
          return;
        }

        // Set up auth state listener to handle OAuth callbacks
        const {
          data: { subscription: sub },
        } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            // CRITICAL: Handle password recovery event FIRST before any other logic
            // DO NOT store tokens or log the user in - just navigate to reset page
            if (event === "PASSWORD_RECOVERY") {
              setIsLoading(false);
              navigate("/reset-password");
              // CRITICAL: return early to prevent automatic login
              return;
            }

            // Only process session and log in user for non-recovery events
            if (session?.access_token) {
              // IMPORTANT: Skip auto-login if we're on the reset-password page
              // This prevents the user from being logged in while resetting their password
              const currentPath = window.location.pathname;
              if (currentPath === "/reset-password") {
                return;
              }

              // OAuth providers (e.g. Google) may surface email via user_metadata
              const email =
                session.user.email ??
                (session.user.user_metadata?.email as string | undefined) ??
                "";

              setAccessToken(session.access_token);
              setUserEmail(email);
              localStorage.setItem("accessToken", session.access_token);
              localStorage.setItem("userEmail", email);

              // Emit custom event to notify subscription hook
              window.dispatchEvent(new Event("userLoggedIn"));

              // Clear URL hash after successful auth
              if (window.location.hash) {
                window.history.replaceState(
                  null,
                  "",
                  window.location.pathname,
                );
              }

              // Check if onboarding is completed and navigate accordingly
              // IMPORTANT: Only navigate if we're not already on the correct route
              const onboardingCompleted = localStorage.getItem(
                "pilliox_onboarding_completed",
              );

              if (
                !onboardingCompleted &&
                !currentPath.includes("/onboarding")
              ) {
                // Check if this is a legacy OAuth account by checking settings
                try {
                  const settingsResponse = await fetch(
                    `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/settings`,
                    {
                      headers: {
                        Authorization: `Bearer ${publicAnonKey}`,
                        "X-User-Token": session.access_token,
                      },
                    },
                  );
                  const settingsData =
                    await settingsResponse.json();

                  if (settingsData.user) {
                    // Legacy account detected - skip onboarding
                    localStorage.setItem(
                      "pilliox_onboarding_completed",
                      "true",
                    );
                    if (
                      !currentPath.startsWith("/app") &&
                      !currentPath.startsWith("/docs/") &&
                      currentPath !== "/home"
                    ) {
                      navigate("/app");
                    }
                  } else {
                    navigate("/app/onboarding");
                  }
                } catch (err) {
                  navigate("/app/onboarding");
                }
              } else if (
                onboardingCompleted &&
                !currentPath.startsWith("/app") &&
                !currentPath.startsWith("/docs/") &&
                currentPath !== "/home"
              ) {
                navigate("/app");
              }

              setIsLoading(false);
            } else if (event === "SIGNED_OUT") {
              setAccessToken(null);
              setUserEmail("");
              localStorage.removeItem("accessToken");
              localStorage.removeItem("userEmail");
              setIsLoading(false);
              navigate("/auth");
            } else if (event !== "INITIAL_SESSION") {
              // Covers: no session, or session without email — always unblock the spinner
              setIsLoading(false);
            }
          },
        );

        subscription = sub;

        // Check for existing session on initial load
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          setIsLoading(false);
        } else if (session?.access_token) {
          const currentPath = window.location.pathname;

          const sessionEmail =
            session.user.email ??
            (session.user.user_metadata?.email as string | undefined) ??
            "";

          // Check AMR (Authentication Method Reference) for recovery
          const hasRecoveryAmr = (session.user as any).amr?.some(
            (a: any) =>
              a.method === "recovery" || a.method === "otp",
          );

          if (hasRecoveryAmr && currentPath === "/") {
            navigate("/reset-password");
            setIsLoading(false);
            return;
          }

          // If session is brand new and we're on root, wait for auth event
          const sessionCreatedAt = new Date(
            session.user.created_at ||
              session.user.confirmed_at ||
              0,
          ).getTime();
          const sessionAgeSeconds = (Date.now() - sessionCreatedAt) / 1000;

          if (currentPath === "/" && sessionAgeSeconds < 10) {
            setTimeout(() => {
              supabase.auth
                .getSession()
                .then(({ data: { session: newSession } }) => {
                  if (newSession) {
                    const hasRecovery = (newSession.user as any).amr?.some(
                      (a: any) => a.method === "recovery" || a.method === "otp",
                    );
                    if (hasRecovery) {
                      navigate("/reset-password");
                    } else {
                      const email =
                        newSession.user.email ??
                        (newSession.user.user_metadata?.email as string | undefined) ??
                        "";
                      setAccessToken(newSession.access_token);
                      setUserEmail(email);
                      localStorage.setItem("accessToken", newSession.access_token);
                      localStorage.setItem("userEmail", email);

                      const onboardingCompleted = localStorage.getItem("pilliox_onboarding_completed");
                      if (!onboardingCompleted) {
                        navigate("/app/onboarding");
                      } else {
                        navigate("/app");
                      }
                    }
                  }
                  setIsLoading(false);
                });
            }, 2000);
            return;
          }

          // Regular session login
          setAccessToken(session.access_token);
          setUserEmail(sessionEmail);
          localStorage.setItem("accessToken", session.access_token);
          localStorage.setItem("userEmail", sessionEmail);
          setIsLoading(false);
        } else {
          // No active Supabase session — clear any stale localStorage auth data.
          // It cannot be refreshed without a valid refresh token, so using it
          // would cause every API call to 401.
          localStorage.removeItem("accessToken");
          localStorage.removeItem("userEmail");
          // Give 2s for an in-progress OAuth callback to complete.
          // onAuthStateChange (registered above) handles the actual login.
          setTimeout(() => {
            setIsLoading(false);
          }, 2000);
        }
      } catch (err) {
        setIsLoading(false);
      }
    };

    initAuth();

    // Cleanup listener on unmount
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [navigate]);

  const handleAuthSuccess = (token: string, email: string, refreshToken?: string) => {
    setAccessToken(token);
    setUserEmail(email);
    localStorage.setItem("accessToken", token);
    localStorage.setItem("userEmail", email);

    // Establish the client-side Supabase session so auto-refresh and
    // onAuthStateChange work correctly going forward.
    if (refreshToken) {
      getSupabaseClient().auth.setSession({ access_token: token, refresh_token: refreshToken })
        .catch(() => {});
    }

    // Emit custom event to notify subscription hook
    window.dispatchEvent(new Event("userLoggedIn"));

    // Check if onboarding is completed
    const onboardingCompleted = localStorage.getItem(
      "pilliox_onboarding_completed",
    );
    if (!onboardingCompleted) {
      // Check if this is a legacy account by checking if they have calendar data
      fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/settings`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "X-User-Token": token,
          },
        },
      )
        .then((res) => res.json())
        .then((data) => {
          // If user has settings, it's a legacy account - skip onboarding
          if (data.user) {
            localStorage.setItem(
              "pilliox_onboarding_completed",
              "true",
            );
            navigate("/app");
          } else {
            navigate("/app/onboarding");
          }
        })
        .catch(() => {
          // On error, assume new account
          navigate("/app/onboarding");
        });
    } else {
      navigate("/app");
    }
  };

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
    } catch (err) {
      // Error signing out
    }

    // Clear local state and storage
    setAccessToken(null);
    setUserEmail("");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("pilliox-auth-token");
    navigate("/");
  };

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            accessToken ? (
              <Navigate to="/app" replace />
            ) : (
              <Navigate
                to={`/auth${window.location.search}${window.location.hash}`}
                replace
              />
            )
          }
        />
        <Route
          path="/auth"
          element={
            accessToken ? (
              <Navigate to="/app" replace />
            ) : (
              <AuthPage onAuthSuccess={handleAuthSuccess} />
            )
          }
        />
        <Route path="/home" element={<LandingPage />} />
        <Route path="/landing" element={<Navigate to="/home" replace />} />
        <Route
          path="/docs/terms"
          element={
            <TermsOfService onBack={() => navigate(-1)} />
          }
        />
        <Route
          path="/docs/privacy"
          element={
            <PrivacyPolicy onBack={() => navigate(-1)} />
          }
        />
        <Route
          path="/reset-password"
          element={<ResetPasswordPage />}
        />
        <Route
          path="/forgot-password"
          element={<ForgotPasswordPage />}
        />

        {/* Protected Routes */}
        <Route
          path="/app"
          element={
            <ProtectedRoute
              isAuthenticated={!!accessToken}
              isLoading={isLoading}
            >
              <>
                <CalendarPage
                  accessToken={accessToken!}
                  projectId={projectId}
                  anonKey={publicAnonKey}
                />
                <SubscriptionBanner />
                <SubscriptionPaywall onLogout={handleLogout} />
              </>
            </ProtectedRoute>
          }
        />
        {/* Alias routes for backward compatibility */}
        <Route
          path="/medications"
          element={<Navigate to="/app/medications" replace />}
        />
        <Route
          path="/profile"
          element={<Navigate to="/app/profile" replace />}
        />
        <Route
          path="/settings"
          element={<Navigate to="/app/settings" replace />}
        />

        <Route
          path="/app/onboarding"
          element={
            <ProtectedRoute
              isAuthenticated={!!accessToken}
              isLoading={isLoading}
            >
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/subscription"
          element={
            <ProtectedRoute
              isAuthenticated={!!accessToken}
              isLoading={isLoading}
            >
              <SubscriptionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/medications"
          element={
            <ProtectedRoute
              isAuthenticated={!!accessToken}
              isLoading={isLoading}
            >
              <MedicationsPage
                accessToken={accessToken!}
                projectId={projectId}
                anonKey={publicAnonKey}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/profile"
          element={
            <ProtectedRoute
              isAuthenticated={!!accessToken}
              isLoading={isLoading}
            >
              <ProfilePage
                accessToken={accessToken!}
                userEmail={userEmail}
                projectId={projectId}
                anonKey={publicAnonKey}
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/settings"
          element={
            <ProtectedRoute
              isAuthenticated={!!accessToken}
              isLoading={isLoading}
            >
              <SettingsPage
                accessToken={accessToken!}
                onLogout={handleLogout}
                projectId={projectId}
                anonKey={publicAnonKey}
                onNavigateToTerms={() =>
                  navigate("/docs/terms")
                }
                onNavigateToPrivacy={() =>
                  navigate("/docs/privacy")
                }
              />
            </ProtectedRoute>
          }
        />

        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-center" richColors />
      <CookieBanner />
    </>
  );
}

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <SubscriptionProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </SubscriptionProvider>
    </I18nextProvider>
  );
}