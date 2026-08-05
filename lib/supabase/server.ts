import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createClient() {
  if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
    try {
      const { createMockSupabaseClient } = require('./mock');
      return createMockSupabaseClient();
    } catch {
      // Fallback mock
      return {
        auth: {
          getSession: async () => ({ data: { session: null }, error: null }),
        },
        from: () => ({
          select: () => ({ data: [], error: null, then: (fn: any) => Promise.resolve(fn({ data: [], error: null })) }),
          insert: async () => ({ data: null, error: null }),
          update: async () => ({ eq: async () => ({ data: null, error: null }) }),
          delete: () => ({ eq: async () => ({ data: null, error: null }) }),
        }),
      };
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Fallback to mock if credentials are missing
    try {
      const { createMockSupabaseClient } = require('./mock');
      return createMockSupabaseClient();
    } catch {
      return {
        auth: {
          getSession: async () => ({ data: { session: null }, error: null }),
        },
        from: () => ({
          select: () => ({ data: [], error: null, then: (fn: any) => Promise.resolve(fn({ data: [], error: null })) }),
          insert: async () => ({ data: null, error: null }),
          update: async () => ({ eq: async () => ({ data: null, error: null }) }),
          delete: () => ({ eq: async () => ({ data: null, error: null }) }),
        }),
      };
    }
  }

  return createSupabaseClient(supabaseUrl, supabaseKey);
}
