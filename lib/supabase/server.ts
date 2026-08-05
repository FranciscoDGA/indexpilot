import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createClient() {
  if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
    const { createMockSupabaseClient } = require('./mock');
    return createMockSupabaseClient();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createSupabaseClient(supabaseUrl, supabaseKey);
}
