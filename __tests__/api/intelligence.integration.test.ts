import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Integration tests for Intelligence API endpoints
 *
 * These tests verify that the API endpoints return proper responses
 * and handle edge cases correctly.
 *
 * Run with: npm run test:integration
 */

describe('Intelligence API Endpoints', () => {
  const baseUrl = process.env.TEST_API_URL || 'http://localhost:3000';

  describe('POST /api/intelligence/generate', () => {
    it('should generate insights and recommendations', async () => {
      const response = await fetch(`${baseUrl}/api/intelligence/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publication_id: 'pub-1' }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.insights_count).toBeGreaterThanOrEqual(0);
      expect(data.recommendations_count).toBeGreaterThanOrEqual(0);
      expect(data.health_scores).toBeDefined();
    });

    it('should return error for missing publication_id', async () => {
      const response = await fetch(`${baseUrl}/api/intelligence/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should generate insights with proper structure', async () => {
      const response = await fetch(`${baseUrl}/api/intelligence/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publication_id: 'pub-1' }),
      });

      const data = await response.json();
      if (data.insights && data.insights.length > 0) {
        const insight = data.insights[0];
        expect(insight).toHaveProperty('publication_id');
        expect(insight).toHaveProperty('type');
        expect(insight).toHaveProperty('priority');
        expect(insight).toHaveProperty('title');
        expect(insight).toHaveProperty('estimated_impact');
        expect(insight).toHaveProperty('estimated_effort');
      }
    });

    it('should generate health scores with all metrics', async () => {
      const response = await fetch(`${baseUrl}/api/intelligence/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publication_id: 'pub-1' }),
      });

      const data = await response.json();
      expect(data.health_scores).toHaveProperty('overall_health');
      expect(data.health_scores).toHaveProperty('growth_potential');
      expect(data.health_scores).toHaveProperty('index_velocity');
      expect(data.health_scores).toHaveProperty('content_freshness');

      // Scores should be 0-100
      Object.values(data.health_scores).forEach((score: any) => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('GET /api/intelligence/insights', () => {
    it('should return insights for a publication', async () => {
      const response = await fetch(
        `${baseUrl}/api/intelligence/insights?publication_id=pub-1`
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should return error without publication_id', async () => {
      const response = await fetch(`${baseUrl}/api/intelligence/insights`);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should filter insights by priority', async () => {
      const response = await fetch(
        `${baseUrl}/api/intelligence/insights?publication_id=pub-1&priority=CRITICAL`
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      if (data.data.length > 0) {
        expect(data.data.every((i: any) => i.priority === 'CRITICAL')).toBe(true);
      }
    });

    it('should return only open insights by default', async () => {
      const response = await fetch(
        `${baseUrl}/api/intelligence/insights?publication_id=pub-1`
      );

      const data = await response.json();
      if (data.data.length > 0) {
        expect(data.data.every((i: any) => i.status === 'open')).toBe(true);
      }
    });
  });

  describe('GET /api/intelligence/recommendations', () => {
    it('should return recommendations for a publication', async () => {
      const response = await fetch(
        `${baseUrl}/api/intelligence/recommendations?publication_id=pub-1`
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should return error without publication_id', async () => {
      const response = await fetch(`${baseUrl}/api/intelligence/recommendations`);

      expect(response.status).toBe(400);
    });

    it('should sort recommendations by ROI score', async () => {
      const response = await fetch(
        `${baseUrl}/api/intelligence/recommendations?publication_id=pub-1`
      );

      const data = await response.json();
      if (data.data.length > 1) {
        for (let i = 0; i < data.data.length - 1; i++) {
          expect(data.data[i].score).toBeGreaterThanOrEqual(data.data[i + 1].score);
        }
      }
    });

    it('should include action items in recommendations', async () => {
      const response = await fetch(
        `${baseUrl}/api/intelligence/recommendations?publication_id=pub-1`
      );

      const data = await response.json();
      if (data.data.length > 0) {
        const rec = data.data[0];
        expect(Array.isArray(rec.action_items)).toBe(true);
      }
    });
  });

  describe('GET /api/intelligence/reports', () => {
    it('should generate daily report', async () => {
      const response = await fetch(
        `${baseUrl}/api/intelligence/reports?publication_id=pub-1&period=daily`
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.report).toBeDefined();
      expect(data.report.type).toBe('daily');
    });

    it('should generate weekly report', async () => {
      const response = await fetch(
        `${baseUrl}/api/intelligence/reports?publication_id=pub-1&period=weekly`
      );

      const data = await response.json();
      expect(data.report.type).toBe('weekly');
    });

    it('should generate monthly report', async () => {
      const response = await fetch(
        `${baseUrl}/api/intelligence/reports?publication_id=pub-1&period=monthly`
      );

      const data = await response.json();
      expect(data.report.type).toBe('monthly');
    });

    it('should include health scores in report', async () => {
      const response = await fetch(
        `${baseUrl}/api/intelligence/reports?publication_id=pub-1`
      );

      const data = await response.json();
      expect(data.report.health_scores).toBeDefined();
      expect(data.report.health_scores).toHaveProperty('overall_health');
    });

    it('should include summary in report', async () => {
      const response = await fetch(
        `${baseUrl}/api/intelligence/reports?publication_id=pub-1`
      );

      const data = await response.json();
      expect(data.report.summary).toBeDefined();
      expect(typeof data.report.summary).toBe('string');
    });
  });

  describe('POST /api/intelligence/actions/[id]/complete', () => {
    it('should mark action as completed', async () => {
      // First, create an action (if not already exists)
      const response = await fetch(
        `${baseUrl}/api/intelligence/actions/action-1/complete`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: 'Completed successfully' }),
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should accept optional notes', async () => {
      const response = await fetch(
        `${baseUrl}/api/intelligence/actions/action-1/complete`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: 'Test notes' }),
        }
      );

      expect(response.status).toBe(200);
    });

    it('should work without notes', async () => {
      const response = await fetch(
        `${baseUrl}/api/intelligence/actions/action-1/complete`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }
      );

      expect(response.status).toBe(200);
    });
  });
});

describe('Intelligence API Error Handling', () => {
  const baseUrl = process.env.TEST_API_URL || 'http://localhost:3000';

  it('should handle non-existent endpoints', async () => {
    const response = await fetch(`${baseUrl}/api/intelligence/invalid`);
    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it('should handle malformed JSON', async () => {
    const response = await fetch(`${baseUrl}/api/intelligence/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json',
    });

    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it('should handle missing required parameters', async () => {
    const response = await fetch(
      `${baseUrl}/api/intelligence/insights?status=open`
    );

    expect(response.status).toBe(400);
  });
});
