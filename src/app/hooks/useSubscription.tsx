import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { getSupabaseClient } from '../../../utils/supabase/client';
import { fetchWithTokenRefresh } from '../../utils/api-client';
import { toast } from 'sonner';

interface SubscriptionStatus {
  hasAccess: boolean;
  isTrialActive: boolean;
  trialEndsAt: number;
  trialDaysLeft: number;
  subscription: {
    status: string;
    currentPeriodEnd?: number;
    cancelAtPeriodEnd: boolean;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  };
}

interface SubscriptionContextType {
  status: SubscriptionStatus | null;
  loading: boolean;
  error: string | null;
  refreshStatus: () => Promise<SubscriptionStatus | null>;
  syncSubscription: () => Promise<void>;
  resetSubscription: () => Promise<void>;
  openCheckout: () => Promise<void>;
  openPortal: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Capture session_id BEFORE React Router's <Navigate> strips it from the URL.
  // Reading in a useState initializer runs synchronously during render, prior to effects.
  // Also persist it to sessionStorage so the sync button can retry complete-checkout later.
  const [checkoutSessionId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('session_id');
    if (id) sessionStorage.setItem('pendingStripeSession', id);
    return id ?? sessionStorage.getItem('pendingStripeSession');
  });

  const refreshStatus = async (): Promise<SubscriptionStatus | null> => {
    try {
      const supabase = getSupabaseClient();

      // Always ask Supabase for the current session — it auto-refreshes if expired
      const { data: { session } } = await supabase.auth.getSession();
      let token = session?.access_token ?? localStorage.getItem('accessToken');

      if (!token) {
        setStatus(null);
        setLoading(false);
        return null;
      }

      // Keep localStorage in sync with whatever token Supabase has
      if (session?.access_token) {
        localStorage.setItem('accessToken', session.access_token);
      }

      const doFetch = (t: string) => fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/subscription/status`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-User-Token': t,
          },
        }
      );

      let response = await doFetch(token);

      // Still 401 — force an explicit session refresh and retry once
      if (response.status === 401) {
        const body401 = await response.clone().text().catch(() => '');

        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        const freshToken = refreshData?.session?.access_token;
        if (freshToken) {
          localStorage.setItem('accessToken', freshToken);
          token = freshToken;
          response = await doFetch(token);
        }
      }

      if (!response.ok) {
        throw new Error('Failed to fetch subscription status');
      }

      const data: SubscriptionStatus = await response.json();
      setStatus(data);
      setError(null);
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const syncSubscription = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Try complete-checkout first — either with a stored pending session_id,
      // or with the stripeCustomerId already known from the current status object.
      // This recovers the case where the automatic post-checkout call was missed.
      const pendingSession = sessionStorage.getItem('pendingStripeSession');
      const knownCustomerId = status?.subscription?.stripeCustomerId;

      if (pendingSession || knownCustomerId) {
        const ccResponse = await fetchWithTokenRefresh(
          `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/subscription/complete-checkout`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId: pendingSession || undefined,
              customerId: !pendingSession ? knownCustomerId : undefined,
            }),
          }
        );
        if (ccResponse.ok) {
          sessionStorage.removeItem('pendingStripeSession');
          await refreshStatus();
          return;
        }
      }

      const response = await fetchWithTokenRefresh(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/subscription/sync`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 404) {
        const body = await response.json();
        throw new Error(body.message || 'No active subscription found in Stripe');
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to sync subscription: ${response.status} - ${errorText}`);
      }

      await response.json();

      // Refresh status after sync
      await refreshStatus();
    } catch (err: any) {
      throw err;
    }
  };

  const resetSubscription = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetchWithTokenRefresh(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/subscription/reset`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to reset subscription: ${response.status} - ${errorText}`);
      }

      await response.json();

      // Refresh status after reset
      await refreshStatus();
    } catch (err: any) {
      throw err;
    }
  };

  const openCheckout = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetchWithTokenRefresh(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/subscription/create-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            returnUrl: window.location.origin,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        
        // Show detailed error message from backend
        const errorMessage = errorData.details 
          ? `Failed to create checkout: ${errorData.details}` 
          : errorData.error || 'Failed to create checkout session';
        
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err: any) {
      setError(err.message);
      
      // Only show toast for unexpected errors (not auth errors)
      if (!err.message.includes('Not authenticated') && !err.message.includes('Failed to create checkout')) {
        toast.error(err.message || 'Failed to open checkout');
      }
      
      throw err;
    }
  };

  const openPortal = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetchWithTokenRefresh(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/subscription/create-portal`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            returnUrl: window.location.origin,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const data = await response.json();
      
      // Redirect to Stripe portal
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    refreshStatus();

    // Check if we're returning from Stripe checkout.
    // Use checkoutSessionId captured at render time — by the time this effect
    // runs, React Router's <Navigate> has already removed the param from the URL.
    if (checkoutSessionId) {
      // Clean URL (pathname may have already been updated by the router)
      window.history.replaceState({}, '', window.location.pathname);

      // Poll regardless of whether complete-checkout succeeds — the Stripe
      // webhook may have already updated the status in the database.
      const delays = [500, 1000, 2000, 4000, 8000];
      const pollAccess = async (remaining: number[]) => {
        const latest = await refreshStatus();
        if (latest?.hasAccess || remaining.length === 0) return;
        setTimeout(() => pollAccess(remaining.slice(1)), remaining[0]);
      };
      pollAccess(delays);

      // Fire complete-checkout in parallel as a best-effort sync.
      // It saves the Stripe subscription data to the DB so future status
      // calls return the correct result even without a webhook.
      const completeCheckout = async () => {
        try {
          const token = localStorage.getItem('accessToken');
          if (!token) {
            return;
          }
          const response = await fetchWithTokenRefresh(
            `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/subscription/complete-checkout`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ sessionId: checkoutSessionId }),
            }
          );

          if (response.ok) {
            sessionStorage.removeItem('pendingStripeSession');
            toast.success('Subscription activated successfully! 🎉');
            // One extra refresh after complete-checkout saves the data
            await refreshStatus();
          } else {
            const text = await response.text();
            // Keep pendingStripeSession so the sync button can retry
          }
        } catch (error) {
        }
      };

      completeCheckout();
    }

    // Listen for storage changes (when user logs in/out in another tab or same tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken') {
        refreshStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom login event
    const handleLogin = () => {
      // Add small delay to ensure token is properly set in localStorage
      setTimeout(() => {
        refreshStatus();
      }, 100);
    };

    window.addEventListener('userLoggedIn', handleLogin);

    // Refresh when the tab becomes visible again (user returns to the app)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodically re-check subscription so stale "active" status can't persist
    const REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
    const intervalId = setInterval(refreshStatus, REFRESH_INTERVAL_MS);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLoggedIn', handleLogin);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [checkoutSessionId]);

  return (
    <SubscriptionContext.Provider
      value={{
        status,
        loading,
        error,
        refreshStatus,
        syncSubscription,
        resetSubscription,
        openCheckout,
        openPortal,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}