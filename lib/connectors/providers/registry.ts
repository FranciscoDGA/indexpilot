import { ConnectorProvider, ConnectorType, ProviderInfo } from '@/types/connectors';

/**
 * Registry of all supported providers and their metadata.
 * Used by the Connector Manager to create connectors and
 * by the UI to display available integration options.
 */
export const PROVIDER_REGISTRY: Record<string, ProviderInfo> = {
  // ============================================================================
  // CMS
  // ============================================================================
  wordpress: {
    provider: 'wordpress',
    name: 'WordPress',
    type: 'cms',
    description: 'O CMS mais popular do mundo. Suporte a REST API e webhooks via plugins.',
    icon: '📰',
    auth_type: 'api_key',
    supports_webhook: true,
    supports_polling: true,
    config_fields: [
      { key: 'api_url', label: 'URL do Site', type: 'url', required: true, placeholder: 'https://meusite.com' },
      { key: 'api_key', label: 'Application Password', type: 'password', required: true, placeholder: 'xxxx xxxx xxxx xxxx' },
    ],
  },
  ghost: {
    provider: 'ghost',
    name: 'Ghost',
    type: 'cms',
    description: 'Plataforma de publicação profissional com API robusta.',
    icon: '👻',
    auth_type: 'api_key',
    supports_webhook: true,
    supports_polling: true,
    config_fields: [
      { key: 'api_url', label: 'URL do Ghost', type: 'url', required: true, placeholder: 'https://meusite.ghost.io' },
      { key: 'api_key', label: 'Content API Key', type: 'password', required: true },
    ],
  },
  drupal: {
    provider: 'drupal',
    name: 'Drupal',
    type: 'cms',
    description: 'CMS empresarial com JSON:API e webhooks.',
    icon: '💧',
    auth_type: 'token',
    supports_webhook: true,
    supports_polling: true,
    config_fields: [
      { key: 'api_url', label: 'URL do Drupal', type: 'url', required: true, placeholder: 'https://meusite.com' },
      { key: 'access_token', label: 'Access Token', type: 'password', required: true },
    ],
  },
  joomla: {
    provider: 'joomla',
    name: 'Joomla',
    type: 'cms',
    description: 'CMS flexível com API REST nativa.',
    icon: '🔺',
    auth_type: 'api_key',
    supports_webhook: false,
    supports_polling: true,
    config_fields: [
      { key: 'api_url', label: 'URL do Joomla', type: 'url', required: true, placeholder: 'https://meusite.com' },
      { key: 'api_key', label: 'API Token', type: 'password', required: true },
    ],
  },

  // ============================================================================
  // HEADLESS CMS
  // ============================================================================
  strapi: {
    provider: 'strapi',
    name: 'Strapi',
    type: 'headless_cms',
    description: 'Headless CMS open-source com webhooks nativos.',
    icon: '🚀',
    auth_type: 'api_key',
    supports_webhook: true,
    supports_polling: true,
    config_fields: [
      { key: 'api_url', label: 'URL do Strapi', type: 'url', required: true, placeholder: 'https://cms.meusite.com/api' },
      { key: 'api_key', label: 'API Token', type: 'password', required: true },
    ],
  },
  contentful: {
    provider: 'contentful',
    name: 'Contentful',
    type: 'headless_cms',
    description: 'Plataforma de conteúdo headless enterprise.',
    icon: '📦',
    auth_type: 'api_key',
    supports_webhook: true,
    supports_polling: true,
    config_fields: [
      { key: 'api_url', label: 'Space ID', type: 'text', required: true, placeholder: 'abc123def456' },
      { key: 'api_key', label: 'Content Delivery Token', type: 'password', required: true },
    ],
  },
  sanity: {
    provider: 'sanity',
    name: 'Sanity',
    type: 'headless_cms',
    description: 'Plataforma de conteúdo com GROQ e webhooks.',
    icon: '🧠',
    auth_type: 'token',
    supports_webhook: true,
    supports_polling: true,
    config_fields: [
      { key: 'api_url', label: 'Project ID', type: 'text', required: true, placeholder: 'abc123' },
      { key: 'access_token', label: 'API Token', type: 'password', required: true },
    ],
  },
  directus: {
    provider: 'directus',
    name: 'Directus',
    type: 'headless_cms',
    description: 'Headless CMS open-source com REST e GraphQL.',
    icon: '🔷',
    auth_type: 'api_key',
    supports_webhook: true,
    supports_polling: true,
    config_fields: [
      { key: 'api_url', label: 'URL do Directus', type: 'url', required: true, placeholder: 'https://cms.meusite.com' },
      { key: 'api_key', label: 'Static Token', type: 'password', required: true },
    ],
  },
  hygraph: {
    provider: 'hygraph',
    name: 'Hygraph',
    type: 'headless_cms',
    description: 'Headless CMS GraphQL-first.',
    icon: '📊',
    auth_type: 'token',
    supports_webhook: true,
    supports_polling: true,
    config_fields: [
      { key: 'api_url', label: 'GraphQL Endpoint', type: 'url', required: true, placeholder: 'https://api.hygraph.com/v1/xxx/master' },
      { key: 'access_token', label: 'Permanent Auth Token', type: 'password', required: true },
    ],
  },

  // ============================================================================
  // FRAMEWORKS
  // ============================================================================
  nextjs: {
    provider: 'nextjs',
    name: 'Next.js',
    type: 'framework',
    description: 'Framework React full-stack. Suporte a file watching e deploy hooks.',
    icon: '▲',
    auth_type: 'webhook',
    supports_webhook: true,
    supports_polling: false,
    config_fields: [
      { key: 'api_url', label: 'URL do Site', type: 'url', required: true, placeholder: 'https://meusite.com' },
      { key: 'webhook_secret', label: 'Webhook Secret', type: 'password', required: false },
    ],
  },
  nuxt: {
    provider: 'nuxt',
    name: 'Nuxt',
    type: 'framework',
    description: 'Framework Vue.js full-stack com SSR/SSG.',
    icon: '💚',
    auth_type: 'webhook',
    supports_webhook: true,
    supports_polling: false,
    config_fields: [
      { key: 'api_url', label: 'URL do Site', type: 'url', required: true },
      { key: 'webhook_secret', label: 'Webhook Secret', type: 'password', required: false },
    ],
  },
  astro: {
    provider: 'astro',
    name: 'Astro',
    type: 'framework',
    description: 'Framework web estático com islands architecture.',
    icon: '🚀',
    auth_type: 'webhook',
    supports_webhook: true,
    supports_polling: false,
    config_fields: [
      { key: 'api_url', label: 'URL do Site', type: 'url', required: true },
      { key: 'webhook_secret', label: 'Webhook Secret', type: 'password', required: false },
    ],
  },
  remix: {
    provider: 'remix',
    name: 'Remix',
    type: 'framework',
    description: 'Framework web full-stack focado em padrões web.',
    icon: '💿',
    auth_type: 'webhook',
    supports_webhook: true,
    supports_polling: false,
    config_fields: [
      { key: 'api_url', label: 'URL do Site', type: 'url', required: true },
      { key: 'webhook_secret', label: 'Webhook Secret', type: 'password', required: false },
    ],
  },
  sveltekit: {
    provider: 'sveltekit',
    name: 'SvelteKit',
    type: 'framework',
    description: 'Framework web full-stack com Svelte.',
    icon: '🔥',
    auth_type: 'webhook',
    supports_webhook: true,
    supports_polling: false,
    config_fields: [
      { key: 'api_url', label: 'URL do Site', type: 'url', required: true },
      { key: 'webhook_secret', label: 'Webhook Secret', type: 'password', required: false },
    ],
  },

  // ============================================================================
  // STATIC SITE GENERATORS
  // ============================================================================
  hugo: {
    provider: 'hugo',
    name: 'Hugo',
    type: 'ssg',
    description: 'Gerador de sites estáticos ultrarrápido em Go.',
    icon: '📋',
    auth_type: 'webhook',
    supports_webhook: true,
    supports_polling: false,
    config_fields: [
      { key: 'api_url', label: 'URL do Site', type: 'url', required: true },
      { key: 'webhook_secret', label: 'Webhook Secret', type: 'password', required: false },
    ],
  },
  jekyll: {
    provider: 'jekyll',
    name: 'Jekyll',
    type: 'ssg',
    description: 'Gerador de sites estáticos com Ruby.',
    icon: '💎',
    auth_type: 'webhook',
    supports_webhook: true,
    supports_polling: false,
    config_fields: [
      { key: 'api_url', label: 'URL do Site', type: 'url', required: true },
      { key: 'webhook_secret', label: 'Webhook Secret', type: 'password', required: false },
    ],
  },
  eleventy: {
    provider: 'eleventy',
    name: 'Eleventy',
    type: 'ssg',
    description: 'Gerador de sites estáticos simples e flexível.',
    icon: '🔢',
    auth_type: 'webhook',
    supports_webhook: true,
    supports_polling: false,
    config_fields: [
      { key: 'api_url', label: 'URL do Site', type: 'url', required: true },
      { key: 'webhook_secret', label: 'Webhook Secret', type: 'password', required: false },
    ],
  },
  docusaurus: {
    provider: 'docusaurus',
    name: 'Docusaurus',
    type: 'ssg',
    description: 'Gerador de documentação otimizado pelo Meta.',
    icon: '📝',
    auth_type: 'webhook',
    supports_webhook: true,
    supports_polling: false,
    config_fields: [
      { key: 'api_url', label: 'URL do Site', type: 'url', required: true },
      { key: 'webhook_secret', label: 'Webhook Secret', type: 'password', required: false },
    ],
  },

  // ============================================================================
  // E-COMMERCE
  // ============================================================================
  shopify: {
    provider: 'shopify',
    name: 'Shopify',
    type: 'ecommerce',
    description: 'Plataforma de e-commerce mais popular.',
    icon: '🛒',
    auth_type: 'token',
    supports_webhook: true,
    supports_polling: true,
    config_fields: [
      { key: 'api_url', label: 'Loja Shopify', type: 'url', required: true, placeholder: 'https://minhaloja.myshopify.com' },
      { key: 'access_token', label: 'Admin API Access Token', type: 'password', required: true },
    ],
  },
  woocommerce: {
    provider: 'woocommerce',
    name: 'WooCommerce',
    type: 'ecommerce',
    description: 'Plugin de e-commerce para WordPress.',
    icon: ' store',
    auth_type: 'api_key',
    supports_webhook: true,
    supports_polling: true,
    config_fields: [
      { key: 'api_url', label: 'URL da Loja', type: 'url', required: true, placeholder: 'https://minhaloja.com' },
      { key: 'api_key', label: 'Consumer Key', type: 'password', required: true },
    ],
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get provider info by provider key.
 */
export function getProviderInfo(provider: ConnectorProvider): ProviderInfo | undefined {
  return PROVIDER_REGISTRY[provider];
}

/**
 * Get all providers of a specific type.
 */
export function getProvidersByType(type: ConnectorType): ProviderInfo[] {
  return Object.values(PROVIDER_REGISTRY).filter((p) => p.type === type);
}

/**
 * List all available providers.
 */
export function listAllProviders(): ProviderInfo[] {
  return Object.values(PROVIDER_REGISTRY);
}

/**
 * Get all providers that support webhooks.
 */
export function getWebhookProviders(): ProviderInfo[] {
  return Object.values(PROVIDER_REGISTRY).filter((p) => p.supports_webhook);
}

/**
 * Get all providers that support polling.
 */
export function getPollingProviders(): ProviderInfo[] {
  return Object.values(PROVIDER_REGISTRY).filter((p) => p.supports_polling);
}
