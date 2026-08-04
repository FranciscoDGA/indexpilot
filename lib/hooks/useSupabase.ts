import { useEffect, useState } from 'react';

export function useSupabase() {
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
          const { createMockSupabaseClient } = await import('@/lib/supabase/mock');
          setSupabase(createMockSupabaseClient());
        } else {
          const { supabase: realClient } = await import('@/lib/supabase/client');
          setSupabase(realClient);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { supabase, loading };
}
