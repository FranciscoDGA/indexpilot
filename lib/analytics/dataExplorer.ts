import { createClient } from '@/lib/supabase/server';
import type { DataExplorerQuery, DataExplorerColumn, VisualizationType, AnalyticsQuery, AnalyticsQueryResult } from '@/types/analytics';

export class DataExplorer {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient();
  }

  async saveQuery(params: {
    tenantId: string;
    userId: string;
    name: string;
    description?: string;
    queryConfig: Record<string, any>;
    columns: DataExplorerColumn[];
    filters?: Record<string, any>;
    sortConfig?: Record<string, any>;
    visualizationType?: VisualizationType;
  }): Promise<DataExplorerQuery> {
    const { data, error } = await this.supabase
      .from('data_explorer_queries')
      .insert({
        tenant_id: params.tenantId,
        user_id: params.userId,
        name: params.name,
        description: params.description,
        query_config: params.queryConfig,
        columns: params.columns,
        filters: params.filters || {},
        sort_config: params.sortConfig || {},
        visualization_type: params.visualizationType || 'table',
      })
      .select()
      .single();

    if (error) throw error;
    return data as DataExplorerQuery;
  }

  async getQueries(tenantId: string, userId: string): Promise<DataExplorerQuery[]> {
    const { data, error } = await this.supabase
      .from('data_explorer_queries')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []) as DataExplorerQuery[];
  }

  async updateQuery(queryId: string, updates: Partial<DataExplorerQuery>): Promise<DataExplorerQuery> {
    const { data, error } = await this.supabase
      .from('data_explorer_queries')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', queryId)
      .select()
      .single();

    if (error) throw error;
    return data as DataExplorerQuery;
  }

  async deleteQuery(queryId: string): Promise<void> {
    const { error } = await this.supabase
      .from('data_explorer_queries')
      .delete()
      .eq('id', queryId);

    if (error) throw error;
  }

  async toggleStar(queryId: string): Promise<DataExplorerQuery> {
    const { data: current } = await this.supabase
      .from('data_explorer_queries')
      .select('is_starred')
      .eq('id', queryId)
      .single();

    const { data, error } = await this.supabase
      .from('data_explorer_queries')
      .update({ is_starred: !(current as any)?.is_starred })
      .eq('id', queryId)
      .select()
      .single();

    if (error) throw error;
    return data as DataExplorerQuery;
  }

  async executeQuery(query: AnalyticsQuery): Promise<AnalyticsQueryResult> {
    const startTime = Date.now();

    const tableMap: Record<string, string> = {
      seo: 'fact_seo',
      crawl: 'fact_crawls',
      content: 'fact_content',
      competitor: 'fact_competitors',
      ai: 'fact_ai_usage',
      billing: 'fact_billing',
      monitoring: 'fact_monitoring',
      automation: 'fact_automations',
    };

    const table = tableMap[query.module];
    if (!table) throw new Error(`Unknown module: ${query.module}`);

    let dbQuery = this.supabase
      .from(table)
      .select('*')
      .gte('created_at', query.date_range.start)
      .lte('created_at', query.date_range.end);

    if (query.tenant_id) dbQuery = dbQuery.eq('tenant_id', query.tenant_id);
    if (query.site_ids && query.site_ids.length > 0) dbQuery = dbQuery.in('site_id', query.site_ids);

    if (query.limit) dbQuery = dbQuery.limit(query.limit);
    if (query.offset) dbQuery = dbQuery.range(query.offset, query.offset + (query.limit || 100) - 1);

    const { data, error, count } = await dbQuery;

    if (error) throw error;

    let results = (data || []) as Record<string, any>[];

    // Apply in-memory filters if specified
    if (query.filters) {
      for (const [key, value] of Object.entries(query.filters)) {
        if (value !== undefined && value !== null) {
          results = results.filter(r => r[key] === value);
        }
      }
    }

    // Apply grouping/aggregation if specified
    if (query.group_by && query.group_by.length > 0 && query.metrics) {
      results = this.aggregateResults(results, query.group_by, query.metrics);
    }

    const queryTimeMs = Date.now() - startTime;

    return {
      data: results,
      total: results.length,
      query_time_ms: queryTimeMs,
      cached: false,
    };
  }

  async getAvailableColumns(module: string): Promise<DataExplorerColumn[]> {
    const columnDefs: Record<string, DataExplorerColumn[]> = {
      seo: [
        { key: 'date_id', label: 'Date', type: 'date', visible: true },
        { key: 'site_id', label: 'Site', type: 'string', visible: true },
        { key: 'seo_score', label: 'SEO Score', type: 'number', aggregate: 'avg', visible: true },
        { key: 'indexed_urls', label: 'Indexed URLs', type: 'number', aggregate: 'sum', visible: true },
        { key: 'total_urls', label: 'Total URLs', type: 'number', aggregate: 'sum', visible: true },
        { key: 'indexation_rate', label: 'Indexation Rate', type: 'number', aggregate: 'avg', visible: true },
        { key: 'crawl_errors', label: 'Crawl Errors', type: 'number', aggregate: 'sum', visible: true },
        { key: 'organic_traffic', label: 'Organic Traffic', type: 'number', aggregate: 'sum', visible: true },
        { key: 'backlinks_count', label: 'Backlinks', type: 'number', aggregate: 'sum', visible: false },
      ],
      crawl: [
        { key: 'date_id', label: 'Date', type: 'date', visible: true },
        { key: 'site_id', label: 'Site', type: 'string', visible: true },
        { key: 'pages_crawled', label: 'Pages Crawled', type: 'number', aggregate: 'sum', visible: true },
        { key: 'crawl_duration_ms', label: 'Duration (ms)', type: 'number', aggregate: 'avg', visible: true },
        { key: 'orphan_pages', label: 'Orphan Pages', type: 'number', aggregate: 'sum', visible: true },
        { key: 'internal_links', label: 'Internal Links', type: 'number', aggregate: 'sum', visible: false },
      ],
      content: [
        { key: 'date_id', label: 'Date', type: 'date', visible: true },
        { key: 'site_id', label: 'Site', type: 'string', visible: true },
        { key: 'total_articles', label: 'Total Articles', type: 'number', aggregate: 'sum', visible: true },
        { key: 'new_articles', label: 'New Articles', type: 'number', aggregate: 'sum', visible: true },
        { key: 'avg_content_quality', label: 'Avg Quality', type: 'number', aggregate: 'avg', visible: true },
        { key: 'topic_clusters', label: 'Topic Clusters', type: 'number', aggregate: 'sum', visible: false },
      ],
      billing: [
        { key: 'date_id', label: 'Date', type: 'date', visible: true },
        { key: 'tenant_id', label: 'Tenant', type: 'string', visible: true },
        { key: 'mrr', label: 'MRR', type: 'number', aggregate: 'sum', visible: true },
        { key: 'arr', label: 'ARR', type: 'number', aggregate: 'sum', visible: true },
        { key: 'active_subscriptions', label: 'Active Subs', type: 'number', aggregate: 'sum', visible: true },
        { key: 'churn_rate', label: 'Churn Rate', type: 'number', aggregate: 'avg', visible: true },
      ],
      monitoring: [
        { key: 'date_id', label: 'Date', type: 'date', visible: true },
        { key: 'site_id', label: 'Site', type: 'string', visible: true },
        { key: 'uptime_pct', label: 'Uptime %', type: 'number', aggregate: 'avg', visible: true },
        { key: 'avg_response_time_ms', label: 'Avg Response (ms)', type: 'number', aggregate: 'avg', visible: true },
        { key: 'incidents_count', label: 'Incidents', type: 'number', aggregate: 'sum', visible: true },
      ],
      ai: [
        { key: 'date_id', label: 'Date', type: 'date', visible: true },
        { key: 'tenant_id', label: 'Tenant', type: 'string', visible: true },
        { key: 'queries_total', label: 'Total Queries', type: 'number', aggregate: 'sum', visible: true },
        { key: 'acceptance_rate', label: 'Acceptance Rate', type: 'number', aggregate: 'avg', visible: true },
        { key: 'time_saved_minutes', label: 'Time Saved (min)', type: 'number', aggregate: 'sum', visible: true },
        { key: 'cost_usd', label: 'Cost (USD)', type: 'number', aggregate: 'sum', visible: false },
      ],
      competitor: [
        { key: 'date_id', label: 'Date', type: 'date', visible: true },
        { key: 'site_id', label: 'Site', type: 'string', visible: true },
        { key: 'competitor_name', label: 'Competitor', type: 'string', visible: true },
        { key: 'competitor_pages', label: 'Pages', type: 'number', aggregate: 'sum', visible: true },
        { key: 'page_growth_pct', label: 'Growth %', type: 'number', aggregate: 'avg', visible: true },
        { key: 'market_share_pct', label: 'Market Share', type: 'number', aggregate: 'avg', visible: true },
      ],
      automation: [
        { key: 'date_id', label: 'Date', type: 'date', visible: true },
        { key: 'tenant_id', label: 'Tenant', type: 'string', visible: true },
        { key: 'workflows_executed', label: 'Workflows Run', type: 'number', aggregate: 'sum', visible: true },
        { key: 'tasks_automated', label: 'Tasks Automated', type: 'number', aggregate: 'sum', visible: true },
        { key: 'time_saved_hours', label: 'Time Saved (hrs)', type: 'number', aggregate: 'sum', visible: true },
        { key: 'error_rate', label: 'Error Rate', type: 'number', aggregate: 'avg', visible: false },
      ],
    };

    return columnDefs[module] || [];
  }

  private aggregateResults(data: Record<string, any>[], groupBy: string[], metrics: string[]): Record<string, any>[] {
    const groups = new Map<string, Record<string, any>>();

    for (const row of data) {
      const key = groupBy.map(g => row[g]).join('|');
      if (!groups.has(key)) {
        groups.set(key, {});
        for (const g of groupBy) {
          groups.get(key)![g] = row[g];
        }
        for (const m of metrics) {
          groups.get(key)![m] = 0;
          groups.get(key)![`${m}_count`] = 0;
        }
      }

      const group = groups.get(key)!;
      for (const m of metrics) {
        group[m] = (group[m] || 0) + (row[m] || 0);
        group[`${m}_count`] = (group[`${m}_count`] || 0) + 1;
      }
    }

    return Array.from(groups.values()).map(g => {
      for (const m of metrics) {
        if (g[`${m}_count`] > 0) {
          g[m] = Math.round((g[m] / g[`${m}_count`]) * 100) / 100;
        }
        delete g[`${m}_count`];
      }
      return g;
    });
  }
}