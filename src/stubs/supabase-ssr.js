// Stub implementation for @supabase/ssr
export function createBrowserClient(supabaseUrl, supabaseKey, options = {}) {
  return {
    auth: {
      getSession: async () => ({
        data: { session: { user: { id: 'mock-user-id', email: 'user@example.com' } } },
        error: null
      }),
      getUser: async () => ({
        data: { user: { id: 'mock-user-id', email: 'user@example.com' } },
        error: null
      }),
      signOut: async () => ({ error: null }),
      signInWithOAuth: async () => ({ error: null }),
    },
    from: (table) => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: {}, error: null }),
          maybeSingle: async () => ({ data: {}, error: null }),
          order: () => ({
            limit: () => ({
              data: [],
              error: null
            })
          }),
          data: [],
          error: null
        })
      }),
      insert: () => ({ error: null, data: [] }),
      update: () => ({ eq: () => ({ error: null, data: [] }) }),
      delete: () => ({ eq: () => ({ error: null }) }),
    })
  };
}

export function createServerClient(supabaseUrl, supabaseKey, options = {}) {
  return {
    auth: {
      getSession: async () => ({
        data: { session: { user: { id: 'mock-user-id', email: 'user@example.com' } } },
        error: null
      }),
      getUser: async () => ({
        data: { user: { id: 'mock-user-id', email: 'user@example.com' } },
        error: null
      }),
    },
    from: (table) => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: {}, error: null }),
          maybeSingle: async () => ({ data: {}, error: null }),
          order: () => ({
            limit: () => ({
              data: [],
              error: null
            })
          }),
          data: [],
          error: null
        })
      }),
      insert: () => ({ error: null, data: [] }),
      update: () => ({ eq: () => ({ error: null, data: [] }) }),
      delete: () => ({ eq: () => ({ error: null }) }),
    })
  };
} 