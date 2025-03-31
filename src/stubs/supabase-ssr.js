// This is a stub for the @supabase/ssr module for build purposes
// Implements mock versions of createServerClient and createBrowserClient functions

// Mock for createServerClient
export function createServerClient(supabaseUrl, supabaseKey, options = {}) {
  console.log('Using stub @supabase/ssr.createServerClient');
  
  return {
    from: (table) => ({
      select: (columns) => ({
        eq: (column, value) => ({
          eq: (column2, value2) => ({
            single: () => Promise.resolve(null),
            maybeSingle: () => Promise.resolve(null),
            limit: () => ({
              order: () => Promise.resolve([])
            }),
            order: () => Promise.resolve([])
          }),
          single: () => Promise.resolve(null),
          limit: () => ({
            order: () => Promise.resolve([])
          }),
          order: () => Promise.resolve([])
        })
      })
    }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithOAuth: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        list: () => Promise.resolve({ data: [], error: null }),
      })
    },
    rpc: () => Promise.resolve([])
  };
}

// Mock for createBrowserClient
export function createBrowserClient(supabaseUrl, supabaseKey, options = {}) {
  console.log('Using stub @supabase/ssr.createBrowserClient');
  
  return createServerClient(supabaseUrl, supabaseKey, options);
}

// Default export
export default {
  createServerClient,
  createBrowserClient
}; 