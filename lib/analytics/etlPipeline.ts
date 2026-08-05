import { createClient } from '@/lib/supabase/server';
import type { ETLPipelineRun, ETLError } from '@/types/analytics';

export class ETLPipeline {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient();
  }

  async runPipeline(params: {
    pipelineName: string;
    sourceModule: string;
    extractFn: () => Promise<any[]>;
    transformFn: (data: any[]) => Promise<any[]>;
    loadFn: (data: any[]) => Promise<{ loaded: number; errors: ETLError[] }>;
  }): Promise<ETLPipelineRun> {
    const runId = crypto.randomUUID();
    const startedAt = new Date().toISOString();

    const { data: run, error: insertError } = await this.supabase
      .from('etl_pipeline_runs')
      .insert({
        id: runId,
        pipeline_name: params.pipelineName,
        source_module: params.sourceModule,
        status: 'running',
        started_at: startedAt,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    let recordsExtracted = 0;
    let recordsTransformed = 0;
    let recordsLoaded = 0;
    let recordsFailed = 0;
    const errors: ETLError[] = [];

    try {
      // Extract
      const rawData = await params.extractFn();
      recordsExtracted = rawData.length;

      // Transform
      const transformedData = await params.transformFn(rawData);
      recordsTransformed = transformedData.length;

      // Load
      const loadResult = await params.loadFn(transformedData);
      recordsLoaded = loadResult.loaded;
      recordsFailed = loadResult.errors.length;
      errors.push(...loadResult.errors);

      const completedAt = new Date().toISOString();
      const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();

      await this.supabase
        .from('etl_pipeline_runs')
        .update({
          status: recordsFailed > 0 ? 'partial' : 'completed',
          records_extracted: recordsExtracted,
          records_transformed: recordsTransformed,
          records_loaded: recordsLoaded,
          records_failed: recordsFailed,
          errors,
          completed_at: completedAt,
          duration_ms: durationMs,
        })
        .eq('id', runId);

      return { ...run, status: recordsFailed > 0 ? 'partial' : 'completed', records_extracted: recordsExtracted, records_transformed: recordsTransformed, records_loaded: recordsLoaded, records_failed: recordsFailed, errors, completed_at: completedAt, duration_ms: durationMs } as ETLPipelineRun;
    } catch (error: any) {
      const completedAt = new Date().toISOString();
      const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();

      await this.supabase
        .from('etl_pipeline_runs')
        .update({
          status: 'failed',
          records_extracted: recordsExtracted,
          records_transformed: recordsTransformed,
          records_loaded: recordsLoaded,
          records_failed: recordsExtracted - recordsLoaded,
          errors: [...errors, { message: error.message || 'Pipeline failed', timestamp: new Date().toISOString() }],
          completed_at: completedAt,
          duration_ms: durationMs,
        })
        .eq('id', runId);

      throw error;
    }
  }

  async getRecentRuns(limit: number = 20): Promise<ETLPipelineRun[]> {
    const { data, error } = await this.supabase
      .from('etl_pipeline_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as ETLPipelineRun[];
  }

  async getRunStats(pipelineName: string): Promise<{
    total_runs: number;
    success_rate: number;
    avg_duration_ms: number;
    total_records_processed: number;
  }> {
    const { data, error } = await this.supabase
      .from('etl_pipeline_runs')
      .select('*')
      .eq('pipeline_name', pipelineName)
      .order('started_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const runs = data || [];
    const successful = runs.filter((r: any) => r.status === 'completed' || r.status === 'partial');

    return {
      total_runs: runs.length,
      success_rate: runs.length > 0 ? Math.round((successful.length / runs.length) * 100) : 0,
      avg_duration_ms: successful.length > 0
        ? Math.round(successful.reduce((sum: number, r: any) => sum + (r.duration_ms || 0), 0) / successful.length)
        : 0,
      total_records_processed: successful.reduce((sum: number, r: any) => sum + (r.records_loaded || 0), 0),
    };
  }
}