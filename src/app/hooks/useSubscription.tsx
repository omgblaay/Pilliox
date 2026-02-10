import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
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
  refreshStatus: () => Promise<void>;
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

  const refreshStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setStatus(null);
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/subscription/status`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-User-Token': token,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch subscription status');
      }

      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
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

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/subscription/sync`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-User-Token': token,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to sync subscription: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

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

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/subscription/reset`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-User-Token': token,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to reset subscription: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

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

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/subscription/create-checkout`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-User-Token': token,
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

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/subscription/create-portal`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-User-Token': token,
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
    
    // Check if we're returning from Stripe checkout
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    if (sessionId) {
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      
      // Fetch checkout session details and update subscription
      const fetchCheckoutSession = async () => {
        try {
          const token = localStorage.getItem('accessToken');
          if (!token) return;
          
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-c7e1f966/subscription/complete-checkout`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
                'X-User-Token': token,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ sessionId }),
            }
          );
          
          if (response.ok) {
            toast.success('Subscription activated successfully! 🎉');
            // Refresh status after a short delay
            setTimeout(() => refreshStatus(), 1000);
          }
        } catch (error) {
          // Silently fail
        }
      };
      
      fetchCheckoutSession();
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

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLoggedIn', handleLogin);
    };
  }, []);

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