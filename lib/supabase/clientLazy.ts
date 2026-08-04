// Lazy load Supabase client to avoid build-time issues
export async function getSupabaseClient() {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
    const { createMockSupabaseClient } = await import('./mock');
    return createMockSupabaseClient();
  }
  const { supabase } = await import('./client');
  return supabase;
}
