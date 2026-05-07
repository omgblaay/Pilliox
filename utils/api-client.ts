import { getSupabaseClient } from './supabase/client';
import { projectId, publicAnonKey } from './supabase/info';

async function getFreshToken(): Promise<string | null> {
  const supabase = getSupabaseClient();
  // refreshSession() makes an actual network call to exchange the refresh token.
  // getSession() only reads from storage and returns stale (expired) tokens.
  const { data } = await supabase.auth.refreshSession();
  const freshToken = data?.session?.access_token ?? null;
  if (freshToken) {
    localStorage.setItem('accessToken', freshToken);
  }
  return freshToken;
}

export async function fetchWithTokenRefresh(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('Not authenticated');
  }

  const makeRequest = (t: string) => {
    const headers = new Headers(options?.headers || {});
    if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${publicAnonKey}`);
    headers.set('X-User-Token', t);
    return fetch(url, { ...options, headers });
  };

  const response = await makeRequest(token);

  if (response.status === 401) {
    console.log('[api] 401 received, refreshing session...');
    try {
      const freshToken = await getFreshToken();
      if (freshToken) {
        console.log('[api] Session refreshed, retrying request');
        return makeRequest(freshToken);
      }
    } catch (err) {
      console.warn('[api] Session refresh failed:', err);
    }
  }

  return response;
}
