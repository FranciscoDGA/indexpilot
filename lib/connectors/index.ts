export { BaseConnector } from './baseConnector';
export { GoogleConnector, googleConnector } from './googleConnector';
export { IndexNowConnector, indexNowConnector } from './indexNowConnector';

// Sprint 11 - CMS Connectors & Auto Sync Platform
export { BaseCMSConnector } from './sdk/connectorInterface';
export { ConnectorManager } from './connectorManager';
export { WebhookEngine } from './webhookEngine';
export { PollingEngine } from './pollingEngine';
export { DiffEngine } from './diffEngine';
export {
  PROVIDER_REGISTRY,
  getProviderInfo,
  getProvidersByType,
  listAllProviders,
  getWebhookProviders,
  getPollingProviders,
} from './providers/registry';

// Connector registry (lazy loading for existing connectors)
export const connectors = {
  google: () => require('./googleConnector').googleConnector,
  indexnow: () => require('./indexNowConnector').indexNowConnector,
} as const;
