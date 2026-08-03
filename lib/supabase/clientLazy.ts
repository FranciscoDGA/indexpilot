// Lazy load Supabase client to avoid build-time issues
export async function getSupabaseClient() {
  const { supabase } = await import('./client');
  return supabase;
}
