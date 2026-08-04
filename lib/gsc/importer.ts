import { GscClient } from './client';
import {
  PerformanceMilestone,
  SearchPerformance,
  KeywordPerformance,
  MilestoneType,
} from '@/types/gsc';

export class GscImporter {
  constructor(private client: GscClient, private supabase: any) {}

  async importSearchPerformance(
    publicationId: string,
    siteId: string,
    userId: string,
    url: string,
    startDate: string,
    endDate: string
  ): Promise<SearchPerformance[]> {
    const data = await this.client.searchAnalytics(startDate, endDate, ['page']);

    const performanceRecords: SearchPerformance[] = [];

    if (data.rows) {
      for (const row of data.rows) {
        const page = row.keys?.[0];

        // Only process if it's our URL
        if (page && page === url) {
          // Create daily records from aggregated data
          const daily = this.generateDailyMetrics(row, startDate, endDate);

          for (const day of daily) {
            const record: any = {
              publication_id: publicationId,
              site_id: siteId,
              user_id: userId,
              date: day.date,
              impressions: Math.round(row.impressions / daily.length),
              clicks: Math.round(row.clicks / daily.length),
              ctr: row.ctr,
              avg_position: row.position,
            };

            const { error } = await this.supabase
              .from('search_performance')
              .upsert(record, { onConflict: 'publication_id,date' });

            if (!error) {
              performanceRecords.push(record);
            }
          }
        }
      }
    }

    return performanceRecords;
  }

  async importKeywordPerformance(
    publicationId: string,
    siteId: string,
    userId: string,
    url: string,
    startDate: string,
    endDate: string
  ): Promise<KeywordPerformance[]> {
    const data = await this.client.searchAnalytics(
      startDate,
      endDate,
      ['query', 'page']
    );

    const keywordRecords: KeywordPerformance[] = [];

    if (data.rows) {
      for (const row of data.rows) {
        const [query, page] = row.keys || [];

        // Only process if it's our URL
        if (page === url && query) {
          const record: any = {
            publication_id: publicationId,
            site_id: siteId,
            user_id: userId,
            keyword: query,
            date: new Date().toISOString().split('T')[0],
            impressions: row.impressions,
            clicks: row.clicks,
            ctr: row.ctr,
            position: row.position,
          };

          const { error } = await this.supabase
            .from('keyword_performance')
            .upsert(record, { onConflict: 'publication_id,keyword,date' });

          if (!error) {
            keywordRecords.push(record);
          }
        }
      }
    }

    return keywordRecords;
  }

  async detectMilestones(
    publicationId: string,
    siteId: string,
    userId: string,
    url: string
  ): Promise<PerformanceMilestone[]> {
    const milestones: PerformanceMilestone[] = [];

    // Get current performance
    const { data: currentData } = await this.supabase
      .from('search_performance')
      .select('*')
      .eq('publication_id', publicationId)
      .order('date', { ascending: false })
      .limit(1);

    if (!currentData || currentData.length === 0) return milestones;

    const current = currentData[0];

    // Get previous performance (7 days ago)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: previousData } = await this.supabase
      .from('search_performance')
      .select('*')
      .eq('publication_id', publicationId)
      .lte('date', sevenDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false })
      .limit(1);

    if (!previousData || previousData.length === 0) return milestones;

    const previous = previousData[0];

    // Detect milestones
    if (current.avg_position && previous.avg_position) {
      // Entered Top 10
      if (previous.avg_position > 10 && current.avg_position <= 10) {
        milestones.push(
          this.createMilestone(
            publicationId,
            siteId,
            userId,
            'entered_top_10',
            previous.avg_position,
            current.avg_position
          )
        );
      }

      // Exited Top 10
      if (previous.avg_position <= 10 && current.avg_position > 10) {
        milestones.push(
          this.createMilestone(
            publicationId,
            siteId,
            userId,
            'exited_top_10',
            previous.avg_position,
            current.avg_position
          )
        );
      }

      // Reached Position 1
      if (current.avg_position === 1) {
        milestones.push(
          this.createMilestone(
            publicationId,
            siteId,
            userId,
            'reached_position_1',
            previous.avg_position,
            current.avg_position
          )
        );
      }
    }

    // CTR changes
    if (current.ctr && previous.ctr) {
      const ctrChange = ((current.ctr - previous.ctr) / previous.ctr) * 100;

      if (ctrChange > 50) {
        milestones.push(
          this.createMilestone(
            publicationId,
            siteId,
            userId,
            'ctr_increased',
            previous.ctr,
            current.ctr
          )
        );
      } else if (ctrChange < -50) {
        milestones.push(
          this.createMilestone(
            publicationId,
            siteId,
            userId,
            'ctr_decreased',
            previous.ctr,
            current.ctr
          )
        );
      }
    }

    // Impressions spikes
    if (current.impressions && previous.impressions) {
      const impressionChange =
        ((current.impressions - previous.impressions) / previous.impressions) *
        100;

      if (impressionChange > 100) {
        milestones.push(
          this.createMilestone(
            publicationId,
            siteId,
            userId,
            'impressions_spike',
            previous.impressions,
            current.impressions
          )
        );
      } else if (impressionChange < -50) {
        milestones.push(
          this.createMilestone(
            publicationId,
            siteId,
            userId,
            'impressions_drop',
            previous.impressions,
            current.impressions
          )
        );
      }
    }

    // Save milestones
    for (const milestone of milestones) {
      await this.supabase.from('performance_milestones').insert(milestone);
    }

    return milestones;
  }

  private createMilestone(
    publicationId: string,
    siteId: string,
    userId: string,
    type: MilestoneType,
    previousValue: number,
    newValue: number
  ): PerformanceMilestone {
    return {
      id: `${publicationId}-${Date.now()}`,
      publication_id: publicationId,
      site_id: siteId,
      user_id: userId,
      milestone_type: type,
      milestone_date: new Date().toISOString(),
      previous_value: previousValue,
      new_value: newValue,
      created_at: new Date().toISOString(),
    };
  }

  private generateDailyMetrics(
    row: any,
    startDate: string,
    endDate: string
  ): Array<{ date: string }> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push({ date: d.toISOString().split('T')[0] });
    }

    return days;
  }
}
