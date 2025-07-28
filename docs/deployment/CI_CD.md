# CI/CD Pipeline Documentation

## Overview

This project uses GitHub Actions for continuous integration and deployment. The pipeline includes:

1. **CI Pipeline**: Runs on every push and pull request
2. **Deploy Pipeline**: Deploys to production on merge to main
3. **Database Management**: Manual workflows for database operations
4. **Dependency Updates**: Automated via Dependabot

## Workflows

### 1. Continuous Integration (ci.yml)

Runs on: Push to main/develop, Pull requests

**Jobs:**
- **Lint and Type Check**: Ensures code quality
- **Test**: Runs tests with PostgreSQL
- **Build**: Verifies production build
- **Docker Build**: Tests Docker image creation
- **Security Scan**: Scans for vulnerabilities

### 2. Deployment (deploy.yml)

Runs on: Push to main branch

**Jobs:**
- **Deploy to Vercel**: Automatic production deployment
- **Deploy Docker**: Manual Docker Hub deployment

### 3. Database Management (database.yml)

Manual trigger for database operations

**Actions:**
- Migrate: Apply pending migrations
- Seed: Populate with sample data
- Reset: Clear and rebuild (non-production only)

## Setup Guide

### 1. GitHub Secrets Configuration

Add these secrets to your GitHub repository:

```yaml
# Vercel Deployment
VERCEL_TOKEN: "your-vercel-token"
VERCEL_ORG_ID: "your-vercel-org-id"
VERCEL_PROJECT_ID: "your-vercel-project-id"

# Docker Hub (optional)
DOCKER_USERNAME: "your-docker-username"
DOCKER_PASSWORD: "your-docker-password"

# Database URLs (per environment)
DATABASE_URL: "postgresql://..."

# Deployment Server (optional)
DEPLOY_HOST: "server.example.com"
DEPLOY_USER: "deploy"
DEPLOY_KEY: "ssh-private-key"
```

### 2. Vercel Setup

1. Install Vercel CLI locally:
   ```bash
   npm i -g vercel
   ```

2. Link your project:
   ```bash
   vercel link
   ```

3. Get your tokens:
   ```bash
   # Get token from: https://vercel.com/account/tokens
   # Get org and project IDs from .vercel/project.json
   ```

### 3. Environment Configuration

Create environments in GitHub:

1. Go to Settings → Environments
2. Create `production` and `staging`
3. Add protection rules:
   - Required reviewers
   - Deployment branches
   - Wait timer

## Local Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push branch
git push origin feature/new-feature
```

### 2. Pull Request
1. Open PR on GitHub
2. CI pipeline runs automatically
3. Fix any issues
4. Request review
5. Merge when approved

### 3. Deployment
- Merge to `main` → Automatic production deployment
- Merge to `develop` → CI only (manual deployment)

## Pipeline Stages

### Stage 1: Code Quality
```yaml
- Linting (ESLint)
- Type checking (TypeScript)
- Code formatting check
```

### Stage 2: Testing
```yaml
- Unit tests
- Integration tests
- E2E tests (if configured)
```

### Stage 3: Build
```yaml
- Next.js production build
- Bundle size analysis
- Docker image build
```

### Stage 4: Security
```yaml
- Dependency vulnerability scan
- Code security analysis
- Docker image scan
```

### Stage 5: Deploy
```yaml
- Vercel deployment
- Database migrations
- Cache invalidation
```

## Monitoring and Rollback

### Health Checks
- Vercel: Built-in monitoring
- Custom: `/api/health` endpoint
- Uptime monitoring integration

### Rollback Procedures
1. **Vercel Rollback**:
   ```bash
   vercel rollback
   ```

2. **Database Rollback**:
   ```bash
   npx prisma migrate resolve --rolled-back
   ```

3. **Docker Rollback**:
   ```bash
   docker-compose down
   docker-compose up -d --force-recreate
   ```

## Best Practices

### 1. Branch Protection
- Require PR reviews
- Require status checks
- Require up-to-date branches
- Include administrators

### 2. Commit Messages
Follow conventional commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation
- `chore:` Maintenance
- `test:` Testing
- `refactor:` Code refactoring

### 3. PR Guidelines
- Clear description
- Link related issues
- Screenshots for UI changes
- Test coverage report

### 4. Security
- Never commit secrets
- Use GitHub Secrets
- Rotate tokens regularly
- Review dependencies

## Troubleshooting

### CI Failures

**Lint errors:**
```bash
npm run lint -- --fix
```

**Type errors:**
```bash
npm run type-check
```

**Test failures:**
```bash
npm test -- --watch
```

### Deployment Issues

**Vercel deployment failed:**
1. Check build logs
2. Verify environment variables
3. Check Vercel status page

**Database migration failed:**
1. Check connection string
2. Verify migration files
3. Run locally first

## Performance Optimization

### 1. Cache Strategy
- npm dependencies cached
- Docker layers cached
- Build artifacts cached

### 2. Parallel Jobs
- Tests run in parallel
- Independent jobs run concurrently

### 3. Conditional Workflows
- Skip unchanged paths
- Run heavy tests only on main

## Costs and Limits

### GitHub Actions
- 2,000 minutes/month (free)
- 500MB artifact storage
- 10 concurrent jobs

### Vercel
- 100GB bandwidth (free)
- 100 deployments/day
- Preview deployments included

### Recommendations
1. Use branch protection
2. Enable caching
3. Optimize Docker builds
4. Monitor usage metrics
5. Set up alerts

## Future Improvements

1. **Add E2E Tests**: Playwright or Cypress
2. **Performance Testing**: Lighthouse CI
3. **Multi-environment**: Staging deployment
4. **Notifications**: Slack/Discord integration
5. **Monitoring**: Sentry integration