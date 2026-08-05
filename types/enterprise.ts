// ============================================================================
// SPRINT 16: ENTERPRISE SECURITY, MULTI-TENANCY & WHITE LABEL TYPES
// ============================================================================

// --- Tenants ---
export type TenantPlan = 'free' | 'pro' | 'enterprise' | 'custom';
export type TenantStatus = 'active' | 'suspended' | 'cancelled' | 'trial';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: TenantPlan;
  status: TenantStatus;
  trial_ends_at?: string;
  settings: Record<string, any>;
  limits: TenantLimits;
  created_at: string;
  updated_at: string;
}

export interface TenantLimits {
  max_sites?: number;
  max_urls?: number;
  max_users?: number;
  max_crawls_concurrent?: number;
  max_api_calls_monthly?: number;
  max_storage_gb?: number;
}

// --- Workspaces ---
export type WorkspaceStatus = 'active' | 'archived';

export interface Workspace {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  status: WorkspaceStatus;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// --- Roles (RBAC) ---
export interface Role {
  id: string;
  tenant_id?: string;
  name: string;
  description?: string;
  permissions: Permission[];
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete' | 'manage')[];
}

export type SystemRole = 'super_admin' | 'tenant_admin' | 'manager' | 'seo_specialist' | 'editor' | 'viewer' | 'api_user';

// --- User Roles ---
export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  workspace_id?: string;
  granted_by?: string;
  granted_at: string;
  expires_at?: string;
}

// --- Audit Logs ---
export type AuditAction =
  | 'login'
  | 'logout'
  | 'password_changed'
  | 'mfa_enabled'
  | 'mfa_disabled'
  | 'role_granted'
  | 'role_revoked'
  | 'user_invited'
  | 'user_removed'
  | 'site_created'
  | 'site_deleted'
  | 'url_indexed'
  | 'audit_completed'
  | 'automation_executed'
  | 'settings_changed'
  | 'secret_rotated'
  | 'export_requested'
  | 'data_deleted';

export interface AuditLog {
  id: string;
  tenant_id: string;
  user_id?: string;
  action: AuditAction;
  resource_type?: string;
  resource_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// --- Tenant Settings ---
export type SettingsCategory = 'branding' | 'limits' | 'security' | 'features' | 'notifications' | 'integrations';

export interface TenantSetting {
  id: string;
  tenant_id: string;
  category: SettingsCategory;
  key: string;
  value: any;
  created_at: string;
  updated_at: string;
}

// --- Secrets Manager ---
export interface Secret {
  id: string;
  tenant_id: string;
  name: string;
  encrypted_value: string;
  description?: string;
  last_rotated_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

// --- Feature Flags ---
export interface FeatureFlag {
  id: string;
  tenant_id?: string;
  name: string;
  description?: string;
  enabled: boolean;
  rollout_percentage: number;
  target_plans: string[];
  target_tenants: string[];
  target_users: string[];
  created_at: string;
  updated_at: string;
}

// --- White Label ---
export interface WhiteLabelConfig {
  id: string;
  tenant_id: string;
  platform_name: string;
  logo_url?: string;
  favicon_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  login_background_url?: string;
  email_template_id?: string;
  custom_domain?: string;
  ssl_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// --- Domain Mappings ---
export type SSLStatus = 'pending' | 'active' | 'expired' | 'failed';

export interface DomainMapping {
  id: string;
  tenant_id: string;
  domain: string;
  ssl_status: SSLStatus;
  ssl_expires_at?: string;
  verified: boolean;
  created_at: string;
}

// --- Security Sessions ---
export interface SecuritySession {
  id: string;
  user_id: string;
  tenant_id: string;
  ip_address?: string;
  user_agent?: string;
  device_info: Record<string, any>;
  last_active_at: string;
  expires_at: string;
  revoked_at?: string;
  created_at: string;
}

// --- Security Alerts ---
export type SecurityAlertType = 'login_suspicious' | 'password_changed' | 'mfa_disabled' | 'api_key_exposed' | 'session_hijack' | 'brute_force';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityAlert {
  id: string;
  tenant_id: string;
  user_id?: string;
  alert_type: SecurityAlertType;
  severity: AlertSeverity;
  details: Record<string, any>;
  resolved: boolean;
  resolved_at?: string;
  created_at: string;
}

// --- Compliance ---
export type ComplianceExportType = 'data_deletion' | 'data_export' | 'audit_trail' | 'consent_report';
export type ComplianceExportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ComplianceExport {
  id: string;
  tenant_id: string;
  user_id: string;
  export_type: ComplianceExportType;
  status: ComplianceExportStatus;
  file_url?: string;
  requested_at: string;
  completed_at?: string;
  expires_at?: string;
}

// --- Enterprise Dashboard ---
export interface EnterpriseDashboard {
  tenants: TenantSummary[];
  total_users: number;
  total_workspaces: number;
  security_alerts: number;
  recent_audit_logs: AuditLog[];
}

export interface TenantSummary {
  id: string;
  name: string;
  plan: TenantPlan;
  status: TenantStatus;
  users_count: number;
  workspaces_count: number;
  sites_count: number;
  created_at: string;
}

// --- Auth Provider ---
export type AuthProvider = 'email' | 'google' | 'microsoft' | 'github' | 'saml' | 'oidc';

export interface AuthProviderConfig {
  provider: AuthProvider;
  enabled: boolean;
  client_id?: string;
  tenant_id?: string;
  settings: Record<string, any>;
}