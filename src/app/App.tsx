import { useState, useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import i18n from "../i18n/config";
import { CalendarView } from "./components/CalendarView";
import { TermsOfService } from "./pages/TermsOfService";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { LandingPage } from "./pages/LandingPage";
import { AuthPage } from "./pages/AuthPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { projectId, publicAnonKey } from "../../utils/supabase/info";
import { getSupabaseClient } from "../../utils/supabase/client";
import { useTheme } from "./hooks/useTheme";
import { SubscriptionProvider } from "./hooks/useSubscription";
import { SubscriptionBanner } from "./components/SubscriptionBanner";
import { SubscriptionPaywall } from "./components/SubscriptionPaywall";
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
                <SubscriptionPaywall />
              </>
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
