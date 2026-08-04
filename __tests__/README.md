# IndexPilot Test Suite

Comprehensive testing strategy covering Unit, Integration, and E2E tests.

## Test Structure

```
__tests__/
├── setup.ts                    # Test utilities and mock factories
├── lib/intelligence/
│   ├── intelligenceEngine.test.ts   # Unit tests for scoring & orchestration
│   └── detectors.test.ts            # Unit tests for all 5 detectors
├── api/
│   └── intelligence.integration.test.ts  # API endpoint integration tests
├── e2e/
│   └── intelligence.e2e.ts     # End-to-end user flow tests
└── README.md                   # This file
```

## Running Tests

### Unit Tests (Vitest)

```bash
# Run all unit tests
npm run test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm run test lib/intelligence/intelligenceEngine.test.ts
```

### Integration Tests

```bash
# Run integration tests only
npm run test:integration

# Tests require the app to be running:
npm run dev  # in one terminal
npm run test:integration  # in another terminal
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run in headed mode (see the browser)
npm run test:e2e -- --headed

# Run specific test file
npm run test:e2e intelligence.e2e.ts

# Show test report
npm run test:e2e:report

# Debug mode (interactive)
npm run test:e2e -- --debug
```

### All Tests

```bash
# Run all tests (unit + integration + e2e)
npm run test:all

# Run with coverage report
npm run test:all:coverage
```

## Test Coverage

### Unit Tests

**IntelligenceEngine** (`intelligenceEngine.test.ts`)
- ✅ ROI score calculation (high/medium/low impact)
- ✅ Insight prioritization (CRITICAL > HIGH > MEDIUM > LOW)
- ✅ Recommendation generation and deduplication
- ✅ Health score calculations (0-100 bounds)

**Detectors** (`detectors.test.ts`)
- ✅ RankingDetector: Near top-10, top-3 entries, ranking decline
- ✅ CtrDetector: Low CTR, CTR decline, high impression/low CTR
- ✅ IndexationDetector: Never indexed, lost indexation, slow/fast indexation
- ✅ CrawlDetector: Stopped crawl, increased crawl, HTTP errors
- ✅ ContentDetector: Outdated content, orphan pages, missing schema/images

### Integration Tests

**API Endpoints** (`intelligence.integration.test.ts`)
- ✅ POST /api/intelligence/generate
- ✅ GET /api/intelligence/insights (with filters)
- ✅ GET /api/intelligence/recommendations (sorted by ROI)
- ✅ GET /api/intelligence/reports (daily/weekly/monthly)
- ✅ POST /api/intelligence/actions/[id]/complete
- ✅ Error handling and edge cases

### E2E Tests

**User Flows** (`intelligence.e2e.ts`)
- ✅ Load Intelligence Center page
- ✅ View health score gauge
- ✅ Filter insights by priority
- ✅ View recommendations with action items
- ✅ Load Opportunities page
- ✅ Filter opportunities by effort/category
- ✅ Sort recommendations by ROI
- ✅ Load Alerts page
- ✅ Toggle resolved/unresolved alerts
- ✅ Generate reports for different periods
- ✅ Navigate between intelligence pages

## Mock Data

The test suite uses comprehensive mock data factories in `setup.ts`:

```typescript
// Create test data easily
const insight = createMockInsight({ priority: 'HIGH' });
const keyword = createMockKeywordPerformance({ position: 12 });
const url = createMockUrl({ is_indexed: true });
```

## Key Testing Patterns

### Unit Testing with Vitest

```typescript
import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
  it('should do something', () => {
    const result = calculateSomething();
    expect(result).toBe(expectedValue);
  });
});
```

### Integration Testing with Mock Supabase

```typescript
const mockSupabase = mockClient([mockData]);
const service = new Service(mockSupabase);
const result = await service.method();
expect(result).toHaveProperty('expectedProp');
```

### E2E Testing with Playwright

```typescript
test('should navigate and interact', async ({ page }) => {
  await page.goto('/intelligence');
  await page.click('button:has-text("Filter")');
  await expect(page.locator('.alert')).toBeVisible();
});
```

## Performance Benchmarks

Current test performance (target < 5s total):

| Test Type | Count | Time | Target |
|-----------|-------|------|--------|
| Unit Tests | 40+ | 1-2s | < 2s |
| Integration | 15+ | 2-3s | < 3s |
| E2E Tests | 20+ | 15-20s | < 20s |
| **Total** | **75+** | **~25s** | **< 25s** |

## CI/CD Integration

Tests run automatically on:
- Pre-commit (husky)
- Push to branch (GitHub Actions)
- PR creation/update

Required status checks:
- ✅ Unit tests pass
- ✅ Type checks pass
- ✅ Build succeeds

## Debugging Tests

### View test traces
```bash
npx playwright show-trace trace.zip
```

### Debug single test
```bash
npx playwright test intelligence.e2e.ts --debug
```

### Generate coverage report
```bash
npm run test:coverage
open coverage/index.html
```

### Run with verbose output
```bash
npm run test -- --reporter=verbose
```

## Adding New Tests

1. **Unit Test**: Create `.test.ts` file in same dir as code
2. **Integration Test**: Add to `__tests__/api/` with API endpoint tests
3. **E2E Test**: Add scenario to `__tests__/e2e/intelligence.e2e.ts`

Always use mock factories from `setup.ts` for consistency.

## Dependencies

Install test dependencies:

```bash
# Unit testing
npm install -D vitest @vitest/ui @vitest/coverage-v8

# E2E testing
npm install -D @playwright/test

# Type support
npm install -D @types/vitest @vitest/expect
```

## Troubleshooting

**Tests timeout in CI**
- Increase `timeout` in vitest.config.ts or playwright.config.ts
- Check if app is actually running before E2E tests

**Mock data doesn't match types**
- Verify overrides in mock factories match interface
- Use `createMockX()` instead of manual objects

**E2E tests fail intermittently**
- Add `page.waitForNavigation()` after clicks
- Check for dynamic content loading delays
- Use `waitForSelector()` instead of direct clicks

## Test Coverage Goals

- Unit Tests: **90%+** coverage
- Integration: **100%** of API endpoints
- E2E: **100%** of critical user flows
- Overall: **>85%** code coverage
