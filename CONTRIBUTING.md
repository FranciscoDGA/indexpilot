# Contributing to IndexPilot

Thank you for your interest in contributing to IndexPilot! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Focus on the code, not the person
- Help others learn and grow

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Git

### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/indexpilot.git
   cd indexpilot
   ```

3. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

5. Setup environment:
   ```bash
   cp .env.example .env.local
   ```

6. Start development server:
   ```bash
   npm run dev
   ```

## Development Workflow

### Code Style

- Use TypeScript for all code
- Follow existing naming conventions
- Use meaningful variable and function names
- Keep functions small and focused

### Commit Messages

Format: `<type>(<scope>): <subject>`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Testing
- `chore`: Build, dependencies

Example:
```
feat(queue): add priority-based job processing

Implement intelligent queue that processes jobs based on priority score
calculated from content type and freshness.
```

### Pull Requests

1. Ensure all tests pass:
   ```bash
   npm run test
   npm run test:integration
   ```

2. Check types:
   ```bash
   npm run type-check
   ```

3. Format code:
   ```bash
   npm run format
   ```

4. Create PR with clear description:
   - What problem does it solve?
   - How does it solve it?
   - Any breaking changes?

## Code Organization

### Services
- Keep business logic in services under `lib/services/indexPilot/`
- Use dependency injection
- Make services stateless when possible

### API Endpoints
- Route handlers in `app/api/v1/*/route.ts`
- Always validate input
- Return consistent response format
- Include error handling

### Components
- UI components in `app/dashboard/`
- Keep components focused
- Use TailwindCSS for styling
- Make components reusable

## Database Changes

1. Create migration:
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```

2. Update Prisma schema in `prisma/schema.prisma`

3. Test migration:
   ```bash
   npm run test:db
   ```

## Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

## Documentation

- Update README.md for major changes
- Add comments for complex logic
- Document API changes in API.md
- Include examples for new features

## Feature Development

### Adding a New Provider

1. Create connector class extending `BaseConnector`:
   ```typescript
   // lib/connectors/newProviderConnector.ts
   export class NewProviderConnector extends BaseConnector {
     name = 'new_provider';
     // Implement abstract methods
   }
   ```

2. Add to connector registry in `lib/connectors/index.ts`

3. Add provider type to `types/indexPilot.ts`

4. Update dispatch logic in `dispatchEngine.ts`

5. Add integration tests

### Adding a New API Endpoint

1. Create route handler:
   ```typescript
   // app/api/v1/new-endpoint/route.ts
   export async function POST(request: NextRequest) {
     // Implementation
   }
   ```

2. Add types to `types/indexPilot.ts`

3. Document in `API.md`

4. Add integration tests

## Debugging

### Enable Debug Mode
```bash
DEBUG=* npm run dev
```

### Check Logs
```bash
npm run logs
```

### Database Inspection
```bash
npx prisma studio
```

## Performance Optimization

- Profile database queries
- Monitor queue performance
- Check API response times
- Identify memory leaks

## Reporting Issues

### Bug Report
Include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details
- Error logs

### Feature Request
Include:
- Problem statement
- Proposed solution
- Use cases
- Alternatives considered

## Review Process

- PRs require at least one approval
- All checks must pass
- Code must follow style guide
- Tests must be included

## Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Create release PR
4. Tag release: `git tag v1.0.0`
5. Push tags: `git push --tags`

## Questions?

- Check existing issues
- Review documentation
- Ask in discussions
- Contact maintainers

Thank you for contributing!
