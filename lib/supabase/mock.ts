// Mock Supabase client for development without backend setup
// Set NEXT_PUBLIC_USE_MOCK=true in .env.local

const mockUser = {
  id: 'mock-user-123',
  email: 'demo@example.com',
  user_metadata: {
    full_name: 'Demo User',
  },
};

const mockSession = {
  user: mockUser,
  access_token: 'mock-token',
};

const mockSites = [
  {
    id: 'site-1',
    user_id: 'mock-user-123',
    name: 'Tech Blog',
    domain: 'techblog.com',
    status: 'active' as const,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'site-2',
    user_id: 'mock-user-123',
    name: 'News Portal',
    domain: 'newscenter.io',
    status: 'active' as const,
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'site-3',
    user_id: 'mock-user-123',
    name: 'E-commerce Store',
    domain: 'shop.example.com',
    status: 'active' as const,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockPublications = [
  {
    id: 'pub-1',
    site_id: 'site-1',
    title: 'React 19 Released',
    url: 'https://techblog.com/react-19-released',
    slug: 'react-19-released',
    type: 'article' as const,
    status: 'INDEXED' as const,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    error_message: null,
  },
  {
    id: 'pub-2',
    site_id: 'site-1',
    title: 'Next.js 15 Performance Tips',
    url: 'https://techblog.com/nextjs-15-tips',
    slug: 'nextjs-15-tips',
    type: 'article' as const,
    status: 'INDEXED' as const,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    error_message: null,
  },
  {
    id: 'pub-3',
    site_id: 'site-2',
    title: 'Breaking News',
    url: 'https://newscenter.io/breaking-news',
    slug: 'breaking-news',
    type: 'news' as const,
    status: 'PROCESSING' as const,
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    error_message: null,
  },
  {
    id: 'pub-4',
    site_id: 'site-2',
    title: 'Market Update',
    url: 'https://newscenter.io/market-update',
    slug: 'market-update',
    type: 'news' as const,
    status: 'RECEIVED' as const,
    created_at: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    error_message: null,
  },
  {
    id: 'pub-5',
    site_id: 'site-3',
    title: 'New Product Launch',
    url: 'https://shop.example.com/products/new-item',
    slug: 'new-product-launch',
    type: 'product' as const,
    status: 'ERROR' as const,
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    error_message: 'Failed to connect to indexing service',
  },
];

const mockApiKeys = [
  {
    id: 'key-1',
    site_id: 'site-1',
    name: 'Production Key',
    key_hash: 'mock-hash-1',
    key_type: 'live' as const,
    last_used_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    publications_count: 42,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'key-2',
    site_id: 'site-1',
    name: 'Test Key',
    key_hash: 'mock-hash-2',
    key_type: 'test' as const,
    last_used_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    publications_count: 12,
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockEvents = [
  {
    id: 'event-1',
    publication_id: 'pub-1',
    event_type: 'RECEIVED' as const,
    message: 'Publication received from API',
    created_at: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
  },
  {
    id: 'event-2',
    publication_id: 'pub-1',
    event_type: 'PROCESSING' as const,
    message: 'Processing publication content',
    created_at: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
  },
  {
    id: 'event-3',
    publication_id: 'pub-1',
    event_type: 'INDEXED' as const,
    message: 'Successfully indexed by search engine',
    created_at: new Date(Date.now() - 100 * 60 * 1000).toISOString(),
  },
];

const mockLogs = [
  {
    id: 'log-1',
    publication_id: 'pub-1',
    level: 'info' as const,
    message: 'Started processing publication',
    created_at: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
  },
  {
    id: 'log-2',
    publication_id: 'pub-1',
    level: 'success' as const,
    message: 'Metadata extracted successfully',
    created_at: new Date(Date.now() - 105 * 60 * 1000).toISOString(),
  },
];

type QueryBuilder = {
  eq: (field: string, value: any) => QueryBuilder;
  in: (field: string, values: any[]) => QueryBuilder;
  order: (field: string, options?: any) => QueryBuilder;
  single: () => Promise<{ data: any; error: null }>;
};

function createQueryBuilder(data: any[]): QueryBuilder {
  let filtered = [...data];

  return {
    eq: (field: string, value: any) => {
      filtered = filtered.filter((d) => d[field] === value);
      return createQueryBuilder(filtered);
    },
    in: (field: string, values: any[]) => {
      filtered = filtered.filter((d) => values.includes(d[field]));
      return createQueryBuilder(filtered);
    },
    order: (field: string, options?: any) => {
      filtered.sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];
        return options?.ascending === false ? (bVal > aVal ? 1 : -1) : (aVal > bVal ? 1 : -1);
      });
      return createQueryBuilder(filtered);
    },
    single: async () => ({
      data: filtered[0] || null,
      error: null,
    }),
  };
}

export function createMockSupabaseClient() {
  return {
    auth: {
      getSession: async () => ({
        data: { session: mockSession },
        error: null,
      }),
      signInWithPassword: async ({ email, password }: any) => {
        if (email === 'demo@example.com' && password === 'demo') {
          return { data: { session: mockSession }, error: null };
        }
        return {
          data: null,
          error: { message: 'Invalid credentials' },
        };
      },
      signUp: async ({ email, password }: any) => {
        return {
          data: { user: { id: 'new-user', email } },
          error: null,
        };
      },
      signOut: async () => ({
        error: null,
      }),
    },
    from: (table: string) => {
      let data: any[] = [];

      switch (table) {
        case 'sites':
          data = mockSites;
          break;
        case 'publication_queue':
          data = mockPublications;
          break;
        case 'api_keys':
          data = mockApiKeys;
          break;
        case 'publication_events':
          data = mockEvents;
          break;
        case 'publication_logs':
          data = mockLogs;
          break;
        case 'users':
          data = [
            {
              id: 'mock-user-123',
              email: 'demo@example.com',
              full_name: 'Demo User',
              language: 'pt-BR',
              timezone: 'America/Sao_Paulo',
              theme: 'system',
              created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ];
          break;
      }

      return {
        select: () => createQueryBuilder(data),
        insert: async (records: any[]) => ({
          data: records,
          error: null,
        }),
        update: () => ({
          eq: () => ({
            data: null,
            error: null,
          }),
        }),
        delete: () => ({
          eq: () => ({
            data: null,
            error: null,
          }),
        }),
      };
    },
  };
}
