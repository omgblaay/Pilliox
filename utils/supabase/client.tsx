// Simple client for our custom auth system
// No Supabase dependencies needed

export const createSimpleClient = () => {
  return {
    // Not used anymore - we have custom auth
    auth: {
      signInWithPassword: async () => ({ data: null, error: new Error('Use custom auth') }),
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
    }
  };
};

// Export for compatibility
export const supabase = createSimpleClient();
