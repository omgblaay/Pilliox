import { getSupabaseClient } from '../../utils/supabase/client';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

/**
 * Utility function to make API calls to Supabase edge functions with automatic token refresh.
 * If a 401 error is received, it attempts to refresh the token and retry once.
 */
export async function fetchWithTokenRefresh(
  url: string,
  options?: RequestInit,
  retryCount = 0
): Promise<Response> {
  // Get current token
  let token = localStorage.getItem('accessToken');

  if (!token) {
    throw new Error('Not authenticated - no token available');
  }

  // Prepare headers
  const headers = new Headers(options?.headers || {});
  
  // Ensure we have the required auth headers
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${publicAnonKey}`);
  }
  if (!headers.has('X-User-Token')) {
    headers.set('X-User-Token', token);
  }

  // Make the request
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // If we get a 401, try to refresh the token and retry once
  if (response.status === 401 && retryCount === 0) {
    
    try {
      const supabase = getSupabaseClient();
      
      // Try to get current session first (auto-refreshes if expired)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        // Save the fresh token
        localStorage.setItem('accessToken', session.access_token);
        token = session.access_token;
        // Retry the request with the fresh token
        return fetchWithTokenRefresh(url, options, retryCount + 1);
      } else {
        // If getSession didn't provide a token, try explicit refresh
        const { data: refreshData } = await supabase.auth.refreshSession();
        if (refreshData?.session?.access_token) {
          localStorage.setItem('accessToken', refreshData.session.access_token);
          token = refreshData.session.access_token;
          // Retry the request with the fresh token
          return fetchWithTokenRefresh(url, options, retryCount + 1);
        }
      }
    } catch (error) {
      // Fall through to return the original 401 response
    }
  }

  return response;
}
