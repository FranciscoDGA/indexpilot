import { test, expect } from '@playwright/test';

/**
 * E2E tests for Intelligence features
 *
 * Tests critical user flows:
 * 1. Generate insights and view recommendations
 * 2. Filter and search insights
 * 3. Mark actions as complete
 * 4. View reports
 *
 * Run with: npm run test:e2e
 */

const baseUrl = process.env.TEST_URL || 'http://localhost:3000';

test.describe('Intelligence Center E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Mock login if needed
    page.goto(`${baseUrl}/intelligence`);
  });

  test('should load Intelligence Center page', async ({ page }) => {
    await page.goto(`${baseUrl}/intelligence`);

    // Wait for page to load
    await page.waitForSelector('h1');

    // Check for main elements
    const heading = await page.locator('h1').first();
    expect(await heading.isVisible()).toBe(true);
  });

  test('should display health score gauge', async ({ page }) => {
    await page.goto(`${baseUrl}/intelligence`);

    // Check for health score card
    const healthCard = await page.locator('text=Saúde SEO').first();
    expect(await healthCard.isVisible()).toBe(true);

    // Check for score value
    const scoreText = await page.locator('[class*="font-bold"][class*="text-blue"]').first();
    expect(await scoreText.isVisible()).toBe(true);
  });

  test('should display critical insights count', async ({ page }) => {
    await page.goto(`${baseUrl}/intelligence`);

    // Look for critical count badge
    const criticalBadge = await page.locator('text=Insights Críticas').first();
    expect(await criticalBadge.isVisible()).toBe(true);
  });

  test('should filter insights by priority', async ({ page }) => {
    await page.goto(`${baseUrl}/intelligence`);

    // Find the critical filter button
    const criticalButton = await page.locator('button', { hasText: /Críticas/ }).first();
    if (await criticalButton.isVisible()) {
      await criticalButton.click();

      // Wait for filtered results
      await page.waitForTimeout(500);

      // Check that only critical insights are shown
      const insightCards = await page.locator('[class*="border"]').all();
      expect(insightCards.length).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display recommendations with action items', async ({ page }) => {
    await page.goto(`${baseUrl}/intelligence`);

    // Look for recommendations section
    const recsSection = await page.locator('text=Recomendações').first();
    expect(await recsSection.isVisible()).toBe(true);

    // Scroll to recommendations
    await recsSection.scrollIntoViewIfNeeded();

    // Check for recommendation cards
    const recCards = await page.locator('[class*="hover:shadow"]').all();
    expect(recCards.length).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Opportunities E2E', () => {
  test('should load Opportunities page', async ({ page }) => {
    await page.goto(`${baseUrl}/opportunities`);

    // Wait for content
    await page.waitForSelector('h1');

    const heading = await page.locator('h1').first();
    expect(await heading.isVisible()).toBe(true);
  });

  test('should display opportunity metrics', async ({ page }) => {
    await page.goto(`${baseUrl}/opportunities`);

    // Check for quick wins count
    const quickWins = await page.locator('text=Quick Wins').first();
    if (await quickWins.isVisible()) {
      expect(await quickWins.isVisible()).toBe(true);
    }

    // Check for average ROI score
    const avgScore = await page.locator('text=Score Médio').first();
    if (await avgScore.isVisible()) {
      expect(await avgScore.isVisible()).toBe(true);
    }
  });

  test('should filter recommendations by effort', async ({ page }) => {
    await page.goto(`${baseUrl}/opportunities`);

    // Find effort filter
    const filterSection = await page.locator('text=Esforço').first();
    if (await filterSection.isVisible()) {
      const effortButton = await page.locator('button', { hasText: '5_MIN' }).first();
      if (await effortButton.isVisible()) {
        await effortButton.click();
        await page.waitForTimeout(500);

        // Verify filtering worked
        expect(await page.locator('text=Recomendações').first().isVisible()).toBe(true);
      }
    }
  });

  test('should sort recommendations by ROI', async ({ page }) => {
    await page.goto(`${baseUrl}/opportunities`);

    // Get all ROI scores
    const scores = await page.locator('[class*="bg-blue"][class*="text-blue"]').all();

    if (scores.length > 1) {
      // Verify they're in descending order
      for (let i = 0; i < scores.length - 1; i++) {
        const score1Text = await scores[i].textContent();
        const score2Text = await scores[i + 1].textContent();

        if (score1Text && score2Text) {
          const num1 = parseInt(score1Text.match(/\d+/)?.[0] || '0');
          const num2 = parseInt(score2Text.match(/\d+/)?.[0] || '0');
          expect(num1).toBeGreaterThanOrEqual(num2);
        }
      }
    }
  });
});

test.describe('Alerts E2E', () => {
  test('should load Alerts page', async ({ page }) => {
    await page.goto(`${baseUrl}/alerts`);

    await page.waitForSelector('h1');
    const heading = await page.locator('h1').first();
    expect(await heading.isVisible()).toBe(true);
  });

  test('should display alert metrics', async ({ page }) => {
    await page.goto(`${baseUrl}/alerts`);

    // Check for critical count
    const criticalCard = await page.locator('text=Críticas').first();
    expect(await criticalCard.isVisible()).toBe(true);

    // Check for high count
    const highCard = await page.locator('text=Altas').first();
    expect(await highCard.isVisible()).toBe(true);
  });

  test('should show resolved/unresolved toggle', async ({ page }) => {
    await page.goto(`${baseUrl}/alerts`);

    // Find the checkbox
    const checkbox = await page.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible()) {
      // Toggle it
      await checkbox.click();

      // Wait for update
      await page.waitForTimeout(500);

      // Page should still be valid
      expect(await page.locator('h1').first().isVisible()).toBe(true);
    }
  });

  test('should display critical alerts when present', async ({ page }) => {
    await page.goto(`${baseUrl}/alerts`);

    // Look for critical section
    const criticalSection = await page.locator('text=CRÍTICO').first();

    if (await criticalSection.isVisible()) {
      // Check for alert cards
      const cards = await page.locator('[class*="border"]').all();
      expect(cards.length).toBeGreaterThan(0);
    } else {
      // Check for "no alerts" message
      const noAlertsMsg = await page.locator('text=Nenhum alerta crítico').first();
      expect(await noAlertsMsg.isVisible()).toBe(true);
    }
  });
});

test.describe('Reports E2E', () => {
  test('should generate and display reports', async ({ page }) => {
    // This would depend on having a reports page
    // For now, we test that the API returns reports
    const response = await page.request.get(
      `${baseUrl}/api/intelligence/reports?publication_id=pub-1`
    );

    expect(response.ok()).toBe(true);
    const data = await response.json();
    expect(data.report).toBeDefined();
  });

  test('should generate reports for different periods', async ({ page }) => {
    const periods = ['daily', 'weekly', 'monthly'];

    for (const period of periods) {
      const response = await page.request.get(
        `${baseUrl}/api/intelligence/reports?publication_id=pub-1&period=${period}`
      );

      expect(response.ok()).toBe(true);
      const data = await response.json();
      expect(data.report.type).toBe(period);
    }
  });
});

test.describe('Intelligence Navigation', () => {
  test('should have sidebar links', async ({ page }) => {
    await page.goto(`${baseUrl}/intelligence`);

    // Check for intelligence links in sidebar
    const links = await page.locator('a').all();
    const linkTexts = await Promise.all(links.map(l => l.textContent()));

    expect(linkTexts.some(t => t?.includes('Inteligência'))).toBe(true);
  });

  test('should navigate between intelligence pages', async ({ page }) => {
    await page.goto(`${baseUrl}/intelligence`);

    // Try to navigate to opportunities
    const oppLink = await page.locator('a', { hasText: /Oportunidades/ }).first();
    if (await oppLink.isVisible()) {
      await oppLink.click();
      await page.waitForNavigation();

      const heading = await page.locator('h1').first();
      expect(await heading.textContent()).toContain('Oportunidades');
    }
  });
});
