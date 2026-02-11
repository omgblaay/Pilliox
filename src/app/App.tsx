import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router";
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n/config";
import { useState, useEffect } from "react";
import { CalendarView } from "./components/CalendarView";
import { TermsOfService } from "./pages/TermsOfService";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { OnboardingPage } from "./pages/OnboardingPage";
import { SubscriptionPage } from "./pages/SubscriptionPage";
import { MedicationsPage } from "./pages/MedicationsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SettingsPage } from "./pages/SettingsPage";
import LandingPage from "./pages/LandingPage";
import { AuthPage } from "./pages/AuthPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { projectId, publicAnonKey } from "../../utils/supabase/info";
import { getSupabaseClient } from "../../utils/supabase/client";
import { useTheme } from "./hooks/useTheme";
import { SubscriptionProvider } from "./hooks/useSubscription";
import { SubscriptionBanner } from "./components/SubscriptionBanner";
import { SubscriptionPaywall } from "./components/SubscriptionPaywall";
import { NotificationPermissionBanner } from "./components/NotificationPermissionBanner";
import { Toaster } from "sonner";

function AppRoutes() {
  // Initialize theme system to detect browser preference
  useTheme("system");
  const navigate = useNavigate();

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();
    let subscription: any;

    const initAuth = async () => {
      try {
        // Set up auth state listener to handle OAuth callbacks
        const {
          data: { subscription: sub },
        } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (session?.access_token && session?.user?.email) {
              setAccessToken(session.access_token);
              setUserEmail(session.user.email);
              localStorage.setItem("accessToken", session.access_token);
              localStorage.setItem("userEmail", session.user.email);

              // Emit custom event to notify subscription hook
              window.dispatchEvent(new Event('userLoggedIn'));

              // Clear URL hash after successful auth
              if (window.location.hash) {
                window.history.replaceState(null, "", window.location.pathname);
              }

              // Check if onboarding is completed and navigate accordingly
              // IMPORTANT: Only navigate if we're not already on the correct route
              const onboardingCompleted = localStorage.getItem("pilliox_onboarding_completed");
              const currentPath = window.location.pathname;
              
              if (!onboardingCompleted && !currentPath.includes("/onboarding")) {
                // Check if this is a legacy OAuth account by checking settings
                try {
                  const settingsResponse = await fetch(
                    `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/settings`,
                    {
                      headers: {
                        'Authorization': `Bearer ${publicAnonKey}`,
                        'X-User-Token': session.access_token
                      }
                    }
                  );
                  const settingsData = await settingsResponse.json();
                  
                  if (settingsData.user) {
                    // Legacy account detected - skip onboarding
                    console.log('Legacy OAuth account detected, skipping onboarding');
                    localStorage.setItem("pilliox_onboarding_completed", "true");
                    if (!currentPath.startsWith("/app")) {
                      navigate("/app");
                    }
                  } else {
                    navigate("/app/onboarding");
                  }
                } catch {
                  // On error, send to onboarding
                  navigate("/app/onboarding");
                }
              } else if (onboardingCompleted && !currentPath.startsWith("/app")) {
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
            } else if (!session && event !== "INITIAL_SESSION") {
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
        } else if (session?.access_token && session?.user?.email) {
          setAccessToken(session.access_token);
          setUserEmail(session.user.email);
          localStorage.setItem("accessToken", session.access_token);
          localStorage.setItem("userEmail", session.user.email);
          setIsLoading(false);
        } else {
          // No active session - check localStorage as fallback
          const storedToken = localStorage.getItem("accessToken");
          const storedEmail = localStorage.getItem("userEmail");

          if (storedToken && storedEmail) {
            setAccessToken(storedToken);
            setUserEmail(storedEmail);
            setIsLoading(false);
          } else {
            // Give OAuth callback time to complete
            setTimeout(() => {
              setIsLoading(false);
            }, 2000);
          }
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

  const handleAuthSuccess = (token: string, email: string) => {
    setAccessToken(token);
    setUserEmail(email);
    localStorage.setItem("accessToken", token);
    localStorage.setItem("userEmail", email);

    // Emit custom event to notify subscription hook
    window.dispatchEvent(new Event('userLoggedIn'));

    // Check if onboarding is completed
    const onboardingCompleted = localStorage.getItem("pilliox_onboarding_completed");
    if (!onboardingCompleted) {
      // Check if this is a legacy account by checking if they have calendar data
      fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/settings`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-User-Token': token
        }
      })
      .then(res => res.json())
      .then(data => {
        // If user has settings, it's a legacy account - skip onboarding
        if (data.user) {
          console.log('Legacy account detected, skipping onboarding');
          localStorage.setItem("pilliox_onboarding_completed", "true");
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
        <Route path="/" element={<LandingPage />} />
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
        <Route path="/docs/terms" element={<TermsOfService onBack={() => navigate(-1)} />} />
        <Route path="/docs/privacy" element={<PrivacyPolicy onBack={() => navigate(-1)} />} />

        {/* Protected Routes */}
        <Route
          path="/app"
          element={
            <ProtectedRoute isAuthenticated={!!accessToken} isLoading={isLoading}>
              <>
                <CalendarView
                  accessToken={accessToken!}
                  onLogout={handleLogout}
                  projectId={projectId}
                  anonKey={publicAnonKey}
                  onNavigateToTerms={() => navigate("/docs/terms")}
                  onNavigateToPrivacy={() => navigate("/docs/privacy")}
                />
                <SubscriptionBanner />
                <SubscriptionPaywall onLogout={handleLogout} />
                <NotificationPermissionBanner />
              </>
            </ProtectedRoute>
          }
        />
        {/* Alias routes for backward compatibility */}
        <Route path="/home" element={<Navigate to="/app" replace />} />
        <Route path="/medications" element={<Navigate to="/app/medications" replace />} />
        <Route path="/profile" element={<Navigate to="/app/profile" replace />} />
        <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
        
        <Route
          path="/app/onboarding"
          element={
            <ProtectedRoute isAuthenticated={!!accessToken} isLoading={isLoading}>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/subscription"
          element={
            <ProtectedRoute isAuthenticated={!!accessToken} isLoading={isLoading}>
              <SubscriptionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/medications"
          element={
            <ProtectedRoute isAuthenticated={!!accessToken} isLoading={isLoading}>
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
            <ProtectedRoute isAuthenticated={!!accessToken} isLoading={isLoading}>
              <ProfilePage 
                accessToken={accessToken!}
                userEmail={userEmail}
                projectId={projectId}
                anonKey={publicAnonKey}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/settings"
          element={
            <ProtectedRoute isAuthenticated={!!accessToken} isLoading={isLoading}>
              <SettingsPage 
                accessToken={accessToken!}
                onLogout={handleLogout}
                projectId={projectId}
                anonKey={publicAnonKey}
                onNavigateToTerms={() => navigate("/docs/terms")}
                onNavigateToPrivacy={() => navigate("/docs/privacy")}
              />
            </ProtectedRoute>
          }
        />

        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-center" richColors />
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