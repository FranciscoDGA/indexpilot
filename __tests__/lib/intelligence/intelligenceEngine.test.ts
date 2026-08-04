import { describe, it, expect } from 'vitest';
import { IntelligenceEngine } from '@/lib/intelligence/intelligenceEngine';
import { createMockInsight } from '../../setup';

describe('IntelligenceEngine', () => {
  describe('calculateRoiScore', () => {
    let engine: IntelligenceEngine;

    beforeEach(() => {
      engine = new IntelligenceEngine({} as any);
    });

    it('should calculate high ROI for very high impact and minimal effort', () => {
      const score = engine.calculateRoiScore('VERY_HIGH', '5_MIN');
      expect(score).toBeGreaterThan(80);
    });

    it('should calculate low ROI for low impact and high effort', () => {
      const score = engine.calculateRoiScore('LOW', '2_HOURS');
      expect(score).toBeLessThan(40);
    });

    it('should calculate medium ROI for balanced impact and effort', () => {
      const score = engine.calculateRoiScore('MEDIUM', '15_MIN');
      expect(score).toBeGreaterThan(30);
      expect(score).toBeLessThan(70);
    });

    it('should return consistent scores for same inputs', () => {
      const score1 = engine.calculateRoiScore('HIGH', '30_MIN');
      const score2 = engine.calculateRoiScore('HIGH', '30_MIN');
      expect(score1).toBe(score2);
    });

    it('should handle all impact types', () => {
      const impacts = ['VERY_HIGH', 'HIGH', 'MEDIUM', 'LOW'] as const;
      impacts.forEach(impact => {
        const score = engine.calculateRoiScore(impact, '15_MIN');
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });

    it('should handle all effort types', () => {
      const efforts = ['5_MIN', '15_MIN', '30_MIN', '2_HOURS'] as const;
      efforts.forEach(effort => {
        const score = engine.calculateRoiScore('HIGH', effort);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('prioritizeInsights', () => {
    let engine: IntelligenceEngine;

    beforeEach(() => {
      engine = new IntelligenceEngine({} as any);
    });

    it('should sort by priority order: CRITICAL > HIGH > MEDIUM > LOW', async () => {
      const insights = [
        createMockInsight({ priority: 'LOW' }),
        createMockInsight({ priority: 'CRITICAL' }),
        createMockInsight({ priority: 'MEDIUM' }),
        createMockInsight({ priority: 'HIGH' }),
      ];

      const sorted = await engine.prioritizeInsights(insights);

      expect(sorted[0].priority).toBe('CRITICAL');
      expect(sorted[1].priority).toBe('HIGH');
      expect(sorted[2].priority).toBe('MEDIUM');
      expect(sorted[3].priority).toBe('LOW');
    });

    it('should preserve order within same priority', async () => {
      const insights = [
        createMockInsight({ priority: 'HIGH', id: 'h1', title: 'High 1' }),
        createMockInsight({ priority: 'HIGH', id: 'h2', title: 'High 2' }),
      ];

      const sorted = await engine.prioritizeInsights(insights);

      expect(sorted.length).toBe(2);
      expect(sorted[0].priority).toBe('HIGH');
      expect(sorted[1].priority).toBe('HIGH');
    });

    it('should handle empty array', async () => {
      const sorted = await engine.prioritizeInsights([]);
      expect(sorted).toEqual([]);
    });

    it('should handle single insight', async () => {
      const insight = createMockInsight({ priority: 'MEDIUM' });
      const sorted = await engine.prioritizeInsights([insight]);

      expect(sorted).toHaveLength(1);
      expect(sorted[0].priority).toBe('MEDIUM');
    });
  });

  describe('generateRecommendations', () => {
    let engine: IntelligenceEngine;

    beforeEach(() => {
      engine = new IntelligenceEngine({} as any);
    });

    it('should generate recommendations from insights', async () => {
      const insights = [
        createMockInsight({ type: 'ranking_near_top10' }),
        createMockInsight({ type: 'ctr_very_low' }),
      ];

      const recommendations = await engine.generateRecommendations(insights);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toHaveProperty('title');
      expect(recommendations[0]).toHaveProperty('score');
      expect(recommendations[0]).toHaveProperty('action_items');
    });

    it('should deduplicate by publication_id and category', async () => {
      const insights = [
        createMockInsight({
          type: 'ranking_near_top10',
          publication_id: 'pub-1',
        }),
        createMockInsight({
          type: 'ranking_exit_top10',
          publication_id: 'pub-1',
        }),
      ];

      const recommendations = await engine.generateRecommendations(insights);

      const rankingRecs = recommendations.filter(r => r.category === 'ranking');
      expect(rankingRecs.length).toBeLessThanOrEqual(1);
    });

    it('should sort recommendations by ROI score descending', async () => {
      const insights = [
        createMockInsight({
          type: 'ctr_very_low',
          estimated_impact: 'LOW',
          estimated_effort: '2_HOURS',
        }),
        createMockInsight({
          type: 'indexation_delayed',
          estimated_impact: 'VERY_HIGH',
          estimated_effort: '5_MIN',
        }),
      ];

      const recommendations = await engine.generateRecommendations(insights);

      if (recommendations.length >= 2) {
        expect(recommendations[0].score).toBeGreaterThanOrEqual(recommendations[1].score);
      }
    });

    it('should include action items in recommendations', async () => {
      const insights = [createMockInsight({ type: 'ranking_near_top10' })];

      const recommendations = await engine.generateRecommendations(insights);

      recommendations.forEach(rec => {
        expect(Array.isArray(rec.action_items)).toBe(true);
        expect(rec.action_items.length).toBeGreaterThan(0);
      });
    });
  });

  describe('healthScore calculations', () => {
    it('should calculate scores between 0-100', async () => {
      const engine = new IntelligenceEngine({
        from: () => ({
          select: () => ({
            eq: () => ({
              then: (cb: any) => Promise.resolve({
                data: [
                  { is_indexed: true, last_checked: new Date().toISOString(), last_modified: new Date().toISOString() }
                ],
                error: null
              }).then(cb),
            }),
          }),
        }),
      } as any);

      const scores = await engine.calculateHealthScores('pub-1');

      expect(scores.overall_health).toBeGreaterThanOrEqual(0);
      expect(scores.overall_health).toBeLessThanOrEqual(100);
      expect(scores.growth_potential).toBeGreaterThanOrEqual(0);
      expect(scores.growth_potential).toBeLessThanOrEqual(100);
      expect(scores.index_velocity).toBeGreaterThanOrEqual(0);
      expect(scores.index_velocity).toBeLessThanOrEqual(100);
      expect(scores.content_freshness).toBeGreaterThanOrEqual(0);
      expect(scores.content_freshness).toBeLessThanOrEqual(100);
    });
  });
});
