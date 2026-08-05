import { createBrowserClient } from '@supabase/auth-helpers-nextjs';

let supabaseInstance: ReturnType<typeof createBrowserClient>;

if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
  // Mock mode - will be handled by clientLazy.ts
  const { createMockSupabaseClient } = require('./mock');
  supabaseInstance = createMockSupabaseClient();
} else {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  supabaseInstance = createBrowserClient(supabaseUrl, supabaseKey);
}

export const supabase = supabaseInstance;
