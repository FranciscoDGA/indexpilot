import { createBrowserClient } from '@supabase/auth-helpers-nextjs';

let supabaseInstance: any;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (process.env.NEXT_PUBLIC_USE_MOCK === 'true' || !supabaseUrl || !supabaseKey) {
  // Mock mode or missing credentials - use mock client
  try {
    const { createMockSupabaseClient } = require('./mock');
    supabaseInstance = createMockSupabaseClient();
  } catch {
    // Fallback: create a minimal mock if import fails
    supabaseInstance = {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        signInWithPassword: async ({ email }: any) => {
          const user = { id: 'mock-user-123', email, user_metadata: { full_name: email?.split('@')[0] || 'Demo User' } };
          return { data: { session: { user, access_token: 'mock-token' } }, error: null };
        },
        signUp: async ({ email }: any) => ({ data: { user: { id: 'new-user', email } }, error: null }),
        signOut: async () => ({ error: null }),
      },
      from: () => ({
        select: () => ({ data: [], error: null, then: (fn: any) => Promise.resolve(fn({ data: [], error: null })) }),
        insert: async () => ({ data: null, error: null }),
        update: async () => ({ eq: async () => ({ data: null, error: null }) }),
        delete: () => ({ eq: async () => ({ data: null, error: null }) }),
      }),
    };
  }
} else {
  supabaseInstance = createBrowserClient(supabaseUrl, supabaseKey);
}

export const supabase = supabaseInstance;
