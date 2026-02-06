import { useState, useEffect } from "react";
import { AuthForm } from "@/app/components/AuthForm";
import { CalendarView } from "@/app/components/CalendarView";
import { TermsOfService } from "@/app/pages/TermsOfService";
import { PrivacyPolicy } from "@/app/pages/PrivacyPolicy";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { getSupabaseClient } from "@/utils/supabase/client";
import { useTheme } from "@/app/hooks/useTheme";
import { SubscriptionProvider } from "@/app/hooks/useSubscription";
import { SubscriptionBanner } from "@/app/components/SubscriptionBanner";
import { SubscriptionPaywall } from "@/app/components/SubscriptionPaywall";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { Toaster } from "sonner";
import "@/i18n/config"; // Initialize i18n

type Page = "auth" | "calendar" | "terms" | "privacy";

function AppContent() {
  // Initialize theme system to detect browser preference
  useTheme("system");

  const [accessToken, setAccessToken] = useState<string | null>(
    null,
  );
  const [userEmail, setUserEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>("auth");

  // Log platform info for debugging
  useEffect(() => {
    // Platform info available via Capacitor.getPlatform() and Capacitor.isNativePlatform()
  }, []);

  // Handle path-based routing for legal pages
  useEffect(() => {
    const handleRouteChange = () => {
      const path = window.location.pathname;
      if (path === "/docs/terms") {
        setCurrentPage("terms");
      } else if (path === "/docs/privacy") {
        setCurrentPage("privacy");
      } else if (path === "/" || path === "") {
        // Reset to appropriate page based on login status
        if (accessToken) {
          setCurrentPage("calendar");
        } else {
          setCurrentPage("auth");
        }
      }
    };

    // Check initial path on mount
    handleRouteChange();

    // Listen for popstate events (browser back/forward)
    window.addEventListener("popstate", handleRouteChange);
    return () => window.removeEventListener("popstate", handleRouteChange);
  }, [accessToken]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    let subscription: any;

    const initAuth = async () => {
      try {
        // Check if this is a legal page access first
        const path = window.location.pathname;
        const isLegalPage = path === "/docs/terms" || path === "/docs/privacy";

        // CRITICAL: Handle OAuth callback from URL hash
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1),
        );
        const accessTokenFromHash =
          hashParams.get("access_token");
        const searchParams = new URLSearchParams(
          window.location.search,
        );
        const errorParam = searchParams.get("error");
        const errorDescription = searchParams.get(
          "error_description",
        );

        if (errorParam) {
          setError(
            `OAuth error: ${errorDescription || errorParam}`,
          );
        }

        // Set up auth state listener to handle OAuth callbacks
        const {
          data: { subscription: sub },
        } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (session?.access_token && session?.user?.email) {
              setAccessToken(session.access_token);
              setUserEmail(session.user.email);
              localStorage.setItem(
                "accessToken",
                session.access_token,
              );
              localStorage.setItem(
                "userEmail",
                session.user.email,
              );

              // Emit custom event to notify subscription hook
              window.dispatchEvent(new Event('userLoggedIn'));

              // Clear URL hash after successful auth
              if (window.location.hash) {
                window.history.replaceState(
                  null,
                  "",
                  window.location.pathname,
                );
              }

              setIsLoading(false);
            } else if (event === "SIGNED_OUT") {
              setAccessToken(null);
              setUserEmail("");
              localStorage.removeItem("accessToken");
              localStorage.removeItem("userEmail");
              setIsLoading(false);
            } else if (
              event === "INITIAL_SESSION" &&
              !session
            ) {
              // During OAuth flow, INITIAL_SESSION may be null - don't stop loading yet
            } else if (!session) {
              // No session after all auth events - safe to stop loading
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
        } else if (
          session?.access_token &&
          session?.user?.email
        ) {
          setAccessToken(session.access_token);
          setUserEmail(session.user.email);
          localStorage.setItem(
            "accessToken",
            session.access_token,
          );
          localStorage.setItem("userEmail", session.user.email);
          setIsLoading(false);
        } else {
          // No active session - check localStorage as fallback
          const storedToken =
            localStorage.getItem("accessToken");
          const storedEmail = localStorage.getItem("userEmail");

          if (storedToken && storedEmail) {
            setAccessToken(storedToken);
            setUserEmail(storedEmail);
            setIsLoading(false);
          } else {
            // Give OAuth callback time to complete (wait a bit for SIGNED_IN event)
            setTimeout(() => {
              if (!accessToken) {
                setIsLoading(false);
              }
            }, 2000); // Increased timeout to 3 seconds
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
  }, []);

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
      // Sign out from Supabase (for OAuth users)
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
    localStorage.removeItem("pilliox-auth-token"); // Clear Supabase session storage
  };

  // Show legal pages (accessible without login)
  if (currentPage === "terms") {
    return <TermsOfService onBack={() => {
      window.history.pushState(null, "", "/");
      if (accessToken) {
        setCurrentPage("calendar");
      } else {
        setCurrentPage("auth");
      }
    }} />;
  }

  if (currentPage === "privacy") {
    return <PrivacyPolicy onBack={() => {
      window.history.pushState(null, "", "/");
      if (accessToken) {
        setCurrentPage("calendar");
      } else {
        setCurrentPage("auth");
      }
    }} />;
  }

  if (!accessToken) {
    return (
      <>
        <AuthForm
          onAuthSuccess={handleAuthSuccess}
          onNavigateToTerms={() => {
            window.history.pushState(null, "", "/docs/terms");
            setCurrentPage("terms");
          }}
          onNavigateToPrivacy={() => {
            window.history.pushState(null, "", "/docs/privacy");
            setCurrentPage("privacy");
          }}
        />
        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-700 border-t-blue-400"></div>
              <p className="mt-4 text-white font-medium text-sm">
                Loading...
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <CalendarView
        accessToken={accessToken}
        onLogout={handleLogout}
        projectId={projectId}
        anonKey={publicAnonKey}
        onNavigateToTerms={() => {
          window.history.pushState(null, "", "/docs/terms");
          setCurrentPage("terms");
        }}
        onNavigateToPrivacy={() => {
          window.history.pushState(null, "", "/docs/privacy");
          setCurrentPage("privacy");
        }}
      />
      <SubscriptionBanner />
      <SubscriptionPaywall />
    </>
  );
}

export default function App() {
  return (
    <SubscriptionProvider>
      <AppContent />
      <Toaster position="top-center" richColors />
    </SubscriptionProvider>
  );
}