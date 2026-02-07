import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// Create a singleton Supabase client instance
let supabaseClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(
      `https://${projectId}.supabase.co`,
      publicAnonKey,
      {
        auth: {
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          storageKey: 'pilliox-auth-token',
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true, // CRITICAL: Detect OAuth callback in URL
          flowType: 'pkce' // Use PKCE flow for OAuth
        }
      }
    );
  }
  return supabaseClient;
}

// Export singleton instance
export const supabase = getSupabaseClient();