// ============================================================================
// SPRINT 20: AI OPERATIONS CENTER & INDEXPILOT OS TYPES
// ============================================================================

// --- Goals ---
export type GoalCategory = 'seo' | 'indexation' | 'content' | 'performance' | 'growth' | 'revenue' | 'custom';
export type GoalStatus = 'active' | 'paused' | 'completed' | 'abandoned';

export interface AIGoal {
  id: string;
  tenant_id: string;
  title: string;
  description?: string;
  category: GoalCategory;
  metric_key: string;
  target_value: number;
  current_value: number;
  deadline?: string;
  priority: number;
  status: GoalStatus;
  progress_pct: number;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

// --- Strategies ---
export type StrategyStatus = 'draft' | 'pending_approval' | 'approved' | 'executing' | 'completed' | 'failed' | 'cancelled';

export interface StrategyStep {
  order: number;
  title: string;
  description: string;
  module: string;
  action: string;
  params: Record<string, any>;
  estimated_duration_hours: number;
  dependencies: number[];
  auto_executable: boolean;
}

export interface AIStrategy {
  id: string;
  tenant_id: string;
  goal_id?: string;
  title: string;
  description?: string;
  steps: StrategyStep[];
  status: StrategyStatus;
  confidence: number;
  estimated_impact: number;
  estimated_duration_days?: number;
  approved_by?: string;
  approved_at?: string;
  execution_log: ExecutionLogEntry[];
  result_summary?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ExecutionLogEntry {
  step: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  started_at?: string;
  completed_at?: string;
  result?: string;
  error?: string;
}

// --- Decisions ---
export type DecisionType = 'fix_error' | 'optimize_content' | 'technical_improvement' | 'new_content' | 'indexation_action' | 'competitor_response' | 'workflow_adjustment' | 'configuration_change';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';
export type DecisionStatus = 'pending' | 'approved' | 'rejected' | 'executing' | 'completed' | 'failed';

export interface AIDecision {
  id: string;
  tenant_id: string;
  strategy_id?: string;
  decision_type: DecisionType;
  title: string;
  description?: string;
  context: Record<string, any>;
  reasoning: string;
  confidence: number;
  impact_score: number;
  urgency: UrgencyLevel;
  dependencies: string[];
  auto_executable: boolean;
  requires_approval: boolean;
  status: DecisionStatus;
  approved_by?: string;
  approved_at?: string;
  rejected_reason?: string;
  executed_at?: string;
  result: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// --- Recommendations ---
export type EffortLevel = 'low' | 'medium' | 'high';
export type RecommendationStatus = 'active' | 'accepted' | 'dismissed' | 'executing' | 'completed';

export interface AIRecommendation {
  id: string;
  tenant_id: string;
  category: string;
  title: string;
  description?: string;
  impact_score: number;
  confidence: number;
  effort_level: EffortLevel;
  affected_module?: string;
  affected_resource_id?: string;
  data_evidence: Record<string, any>;
  suggested_actions: string[];
  status: RecommendationStatus;
  accepted_by?: string;
  accepted_at?: string;
  dismissed_reason?: string;
  created_at: string;
  updated_at: string;
}

// --- Memory ---
export type MemoryOutcome = 'positive' | 'negative' | 'neutral' | 'mixed';

export interface AIMemory {
  id: string;
  tenant_id: string;
  context_type: string;
  context_key?: string;
  action_taken: string;
  action_result?: string;
  outcome?: MemoryOutcome;
  confidence_before?: number;
  confidence_after?: number;
  lessons_learned: string[];
  metadata: Record<string, any>;
  created_at: string;
}

// --- Learning ---
export interface AILearning {
  id: string;
  tenant_id: string;
  pattern_type: string;
  pattern_key: string;
  pattern_description?: string;
  occurrences: number;
  success_rate: number;
  avg_impact: number;
  confidence: number;
  last_seen_at: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// --- Briefings ---
export type BriefingPeriod = 'daily' | 'weekly' | 'monthly';
export type BriefingChannel = 'email' | 'dashboard' | 'both';

export interface BriefingHighlight {
  icon: string;
  text: string;
  metric_change?: number;
  module?: string;
}

export interface BriefingAlert {
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
}

export interface BriefingRecommendation {
  title: string;
  impact: string;
  effort: string;
}

export interface AIBriefing {
  id: string;
  tenant_id: string;
  title: string;
  summary: string;
  highlights: BriefingHighlight[];
  alerts: BriefingAlert[];
  recommendations: BriefingRecommendation[];
  metrics_summary: Record<string, any>;
  goals_progress: { goal_id: string; title: string; progress_pct: number }[];
  period: BriefingPeriod;
  date: string;
  sent_via?: BriefingChannel;
  sent_at?: string;
  created_at: string;
}

// --- Workflows ---
export type WorkflowTrigger = 'schedule' | 'event' | 'manual' | 'threshold' | 'webhook';
export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'archived';
export type WorkflowCreator = 'ai' | 'user' | 'imported';

export interface WorkflowStep {
  order: number;
  name: string;
  type: 'action' | 'condition' | 'notification' | 'delay' | 'branch';
  module: string;
  action: string;
  params: Record<string, any>;
  on_success: 'next' | 'skip' | 'branch';
  on_failure: 'stop' | 'retry' | 'skip' | 'notify';
}

export interface AIWorkflow {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  trigger_event: string;
  steps: WorkflowStep[];
  conditions: Record<string, any>;
  status: WorkflowStatus;
  auto_execute: boolean;
  requires_approval: boolean;
  execution_count: number;
  success_rate: number;
  avg_duration_ms: number;
  created_by: WorkflowCreator;
  created_at: string;
  updated_at: string;
}

// --- Simulations ---
export type ScenarioType = 'content_growth' | 'indexation_forecast' | 'error_reduction' | 'traffic_projection' | 'revenue_model' | 'custom';

export interface AISimulation {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  scenario_type: ScenarioType;
  input_params: Record<string, any>;
  assumptions: string[];
  predicted_outcomes: Record<string, any>;
  confidence_level: number;
  time_horizon_days: number;
  status: 'running' | 'completed' | 'failed';
  execution_time_ms?: number;
  created_at: string;
}

// --- Governance ---
export type PolicyType = 'auto_approve' | 'require_approval' | 'forbidden' | 'rate_limit' | 'scope_limit';

export interface AIGovernancePolicy {
  id: string;
  tenant_id: string;
  policy_type: PolicyType;
  module?: string;
  action?: string;
  max_confidence?: number;
  max_impact?: number;
  rate_limit_per_hour?: number;
  rate_limit_per_day?: number;
  scope_restrictions: Record<string, any>;
  is_active: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

// --- Audit Log ---
export interface AIAuditEntry {
  id: string;
  tenant_id: string;
  event_type: string;
  entity_type: string;
  entity_id?: string;
  action: string;
  actor: 'ai' | 'user' | 'system';
  details: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

// --- Mission Control Dashboard ---
export interface MissionControlDashboard {
  tenant_id: string;
  generated_at: string;
  mission_today: string;
  priorities: AIDecision[];
  active_strategies: AIStrategy[];
  goals_progress: AIGoal[];
  recent_recommendations: AIRecommendation[];
  alerts_summary: {
    critical: number;
    warning: number;
    info: number;
  };
  metrics_snapshot: Record<string, any>;
  automation_savings: {
    time_saved_hours: number;
    tasks_automated: number;
    cost_saved_usd: number;
  };
  risk_areas: { module: string; severity: string; description: string }[];
  opportunities: { title: string; impact: number; effort: string }[];
}

// --- Scenario Simulation Input ---
export interface SimulationInput {
  scenario_type: ScenarioType;
  name: string;
  description?: string;
  input_params: Record<string, any>;
  assumptions?: string[];
  time_horizon_days?: number;
}

// --- Strategy Generation Input ---
export interface StrategyGenerationInput {
  tenant_id: string;
  goal_id?: string;
  title?: string;
  description?: string;
  context?: Record<string, any>;
  constraints?: string[];
  max_steps?: number;
}
