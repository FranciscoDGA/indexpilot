// ============================================================================
// SPRINT 15: CONTENT INTELLIGENCE & SEMANTIC SEO TYPES
// ============================================================================

// --- Content Profiles ---
export type SearchIntent = 'informational' | 'navigational' | 'commercial' | 'transacional' | 'local';

export interface ContentProfile {
  id: string;
  workspace_id: string;
  url: string;
  title?: string;
  semantic_score: number;
  depth_score: number;
  freshness_score: number;
  intent: SearchIntent;
  word_count: number;
  headings_count: number;
  entities_count: number;
  topics_count: number;
  has_faq: boolean;
  has_howto: boolean;
  internal_links: number;
  external_links: number;
  images_count: number;
  last_analyzed_at: string;
  created_at: string;
  updated_at: string;
}

// --- Entities ---
export type EntityType = 'person' | 'organization' | 'location' | 'product' | 'concept' | 'technology' | 'brand' | 'event' | 'other';

export interface Entity {
  id: string;
  workspace_id: string;
  name: string;
  type: EntityType;
  confidence: number;
  occurrences: number;
  created_at: string;
}

export interface ContentEntity {
  id: string;
  content_id: string;
  entity_id: string;
  relevance: number;
  frequency: number;
  created_at: string;
}

// --- Topic Clusters ---
export type ClusterStatus = 'active' | 'needs_work' | 'incomplete';
export type ClusterRole = 'pillar' | 'satellite' | 'supporting';

export interface TopicCluster {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  pillar_url?: string;
  pages_count: number;
  avg_score: number;
  coverage_percentage: number;
  status: ClusterStatus;
  created_at: string;
  updated_at: string;
}

export interface ClusterPage {
  id: string;
  cluster_id: string;
  content_id: string;
  role: ClusterRole;
  relevance_score: number;
  internal_links_to_pillar: number;
  created_at: string;
}

// --- Semantic Gaps ---
export type SemanticGapPriority = 'high' | 'medium' | 'low';
export type SemanticGapStatus = 'identified' | 'in_progress' | 'completed' | 'ignored';

export interface SemanticGap {
  id: string;
  workspace_id: string;
  topic: string;
  description?: string;
  related_cluster_id?: string;
  priority: SemanticGapPriority;
  status: SemanticGapStatus;
  suggested_angle?: string;
  estimated_impact?: string;
  created_at: string;
  updated_at: string;
}

// --- Cannibalizations ---
export type CannibalizationSeverity = 'low' | 'medium' | 'high';
export type CannibalizationStatus = 'detected' | 'reviewing' | 'resolved' | 'ignored';

export interface Cannibalization {
  id: string;
  workspace_id: string;
  url_a: string;
  url_b: string;
  keyword?: string;
  overlap_score: number;
  severity: CannibalizationSeverity;
  status: CannibalizationStatus;
  recommendation?: string;
  detected_at: string;
  resolved_at?: string;
  created_at: string;
}

// --- Content Topics ---
export interface ContentTopic {
  id: string;
  content_id: string;
  topic: string;
  relevance: number;
  is_primary: boolean;
  created_at: string;
}

// --- Editorial Plans ---
export type EditorialPlanStatus = 'draft' | 'active' | 'completed' | 'archived';

export interface EditorialPlan {
  id: string;
  workspace_id: string;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  items: EditorialPlanItem[];
  status: EditorialPlanStatus;
  created_at: string;
  updated_at: string;
}

export interface EditorialPlanItem {
  id: string;
  week: number;
  action: 'update' | 'create' | 'optimize' | 'audit';
  title: string;
  description: string;
  target_url?: string;
  priority: SemanticGapPriority;
  status: 'pending' | 'in_progress' | 'completed';
}

// --- Semantic Analysis Results ---
export interface SemanticAnalysis {
  content_id: string;
  url: string;
  semantic_score: number;
  depth_score: number;
  freshness_score: number;
  intent: SearchIntent;
  entities: EntityAnalysis[];
  topics: TopicAnalysis[];
  suggestions: string[];
}

export interface EntityAnalysis {
  name: string;
  type: EntityType;
  relevance: number;
  frequency: number;
  is_missing?: boolean;
}

export interface TopicAnalysis {
  topic: string;
  relevance: number;
  is_primary: boolean;
  coverage: 'full' | 'partial' | 'missing';
}

// --- Content Health ---
export interface ContentHealth {
  total_content: number;
  avg_semantic_score: number;
  avg_depth_score: number;
  avg_freshness_score: number;
  content_by_intent: Record<SearchIntent, number>;
  top_entities: Entity[];
  clusters_count: number;
  cannibalizations_count: number;
  gaps_count: number;
}

// --- AI Content Advisor Response ---
export interface ContentAdvisorResponse {
  question: string;
  answer: string;
  supporting_data: Record<string, any>;
  recommendations: string[];
  action_items: ActionItem[];
  confidence: number;
}

export interface ActionItem {
  type: 'update' | 'create' | 'fix' | 'optimize';
  title: string;
  description: string;
  priority: SemanticGapPriority;
  target_url?: string;
  estimated_impact: string;
}

// --- Cluster Map ---
export interface ClusterMap {
  clusters: ClusterMapItem[];
  total_pages: number;
  avg_score: number;
  coverage: number;
}

export interface ClusterMapItem {
  id: string;
  name: string;
  pages_count: number;
  pillar_url?: string;
  score: number;
  status: ClusterStatus;
  relationships: ClusterRelationship[];
}

export interface ClusterRelationship {
  from: string;
  to: string;
  type: 'links_to' | 'related' | 'cannibalizes';
  strength: number;
}