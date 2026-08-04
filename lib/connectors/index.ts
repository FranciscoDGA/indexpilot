export { BaseConnector } from './baseConnector';
export { GoogleConnector, googleConnector } from './googleConnector';
export { IndexNowConnector, indexNowConnector } from './indexNowConnector';

// Connector registry
export const connectors = {
  google: () => require('./googleConnector').googleConnector,
  indexnow: () => require('./indexNowConnector').indexNowConnector,
} as const;
