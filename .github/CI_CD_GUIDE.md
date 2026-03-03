# PuraEstate CI/CD Pipeline Guide

## Overview

Complete CI/CD pipeline for PuraEstate production deployment with:
- Automated testing and linting
- Continuous integration checks
- Automated Google Play Store deployment
- Rollback capability
- Slack notifications
- Production monitoring

## Architecture

```
Git Push → Lint/Test/Build → Quality Checks → Deploy → Monitor
    ↓           ↓              ↓               ↓        ↓
  Branch    GitHub Actions  Status Checks  Google Play  Sentry
 Protection                 Required        Store      Firebase
```

## Workflow Files

### 1. Lint Workflow (`.github/workflows/lint.yml`)
**Triggers**: Push to main/develop/staging, Pull requests
**Runs**: ESLint, TypeScript compiler, Prettier check
**Time**: ~3 minutes
**Required**: YES (status check required on PRs)

### 2. Test Workflow (`.github/workflows/test.yml`)
**Triggers**: Push to main/develop/staging, Pull requests
**Runs**: Jest unit tests, coverage reports, codecov upload
**Time**: ~5 minutes
**Required**: YES (status check required on PRs)

### 3. Build Workflow (`.github/workflows/build.yml`)
**Triggers**: Push to main/develop/staging, Pull requests
**Runs**: Expo EAS build (Android & iOS)
**Time**: ~15-30 minutes
**Required**: YES (status check required)
**Profiles**:
- `development` - Development client
- `staging` - Staging APK/IPA
- `production` - Production AAB/IPA

### 4. Deploy Workflow (`.github/workflows/deploy.yml`)
**Triggers**:
- Push to main branch (staged rollout)
- Version tag (full release)
- Manual workflow dispatch
**Runs**: Build, submit to Google Play Store
**Time**: ~20-40 minutes
**Deployment Modes**:
- Staged rollout (10%) - Automatic on main push
- Full release - Manual via tag or workflow_dispatch

### 5. E2E Tests Workflow (`.github/workflows/e2e-tests.yml`)
**Triggers**:
- Push to main/develop/staging
- Pull requests
- Daily schedule (2 AM UTC)
**Runs**: Detox end-to-end tests on macOS
**Time**: ~15-25 minutes
**Required**: NO (informational)

### 6. Security Scan Workflow (`.github/workflows/security-scan.yml`)
**Triggers**:
- Push to main/develop/staging
- Pull requests
- Weekly schedule (Sunday 3 AM UTC)
**Runs**: npm audit, SNYK, Trivy, secret scanning
**Time**: ~10 minutes
**Required**: YES (for main branch)

### 7. Monitoring Workflow (`.github/workflows/monitoring.yml`)
**Triggers**: Every 6 hours (cron schedule)
**Runs**: Health checks on Sentry, Firebase, App Store
**Time**: ~5 minutes
**Required**: NO (informational)

## Branch Strategy

### Main Branch (`main`)
- Production-ready code
- Protected: Yes
- Required reviews: 2
- Required status checks: All
- Auto-deploy: Staged rollout (10%)
- Full release: Via version tag

### Staging Branch (`staging`)
- Pre-production testing
- Protected: Yes
- Required reviews: 1
- Required status checks: Lint, Test, Build
- Auto-deploy: Internal distribution
- Manual promotion to production

### Development Branch (`develop`)
- Feature integration
- Not protected
- No auto-deploy
- Manual build for testing

### Feature Branches
- Pattern: `feature/description`, `bugfix/description`
- Create from: `develop` or `staging`
- Merge to: `develop` first, then promote

## Deployment Process

### Development/Staging Deployments

1. **Push code** to staging branch
2. **Automated checks** run (lint, test, build)
3. **Build artifacts** generated
4. **Internal distribution** (if enabled)
5. **Slack notification** sent

### Production Deployment - Staged Rollout

1. **Push code** to main branch
2. **All checks** run (lint, test, build, security, e2e)
3. **Build** created for production
4. **10% staged rollout** deployed to Google Play
5. **Monitor metrics** for 24-48 hours
6. **Increase rollout** gradually (25% → 50% → 100%)
7. **Slack notifications** at each stage

### Production Deployment - Full Release

1. **Create release** locally:
   ```bash
   ./scripts/release.sh patch
   ```
2. **Script updates** version, creates tag, pushes to GitHub
3. **GitHub Actions** triggered on tag
4. **Build & test** runs
5. **Full release** deployed to Google Play
6. **GitHub Release** created with changelog
7. **Slack notification** confirms deployment

## Local Development Setup

### Prerequisites
- Node.js 18.x or 20.x
- npm 9.x or higher
- EAS CLI: `npm install -g eas-cli`
- Expo account: https://expo.dev

### First-time Setup

```bash
# Clone repository
git clone https://github.com/puraestate/puraestate-app.git
cd puraestate-app

# Install dependencies
npm ci

# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Create environment files
cp .env.example .env.development
cp .env.example .env.staging
cp .env.example .env.production

# Edit environment files with actual values
nano .env.development

# Verify setup
npm run lint
npm run test
```

### Building Locally

**Development build**:
```bash
./scripts/build.sh dev
```

**Staging build**:
```bash
./scripts/build.sh staging
```

**Production build**:
```bash
./scripts/build.sh production
```

### Database Migrations

```bash
# Run migrations for staging
./scripts/migrate-db.sh --env=staging --dry-run

# Run migrations for production
./scripts/migrate-db.sh --env=production --confirm
```

### Release Process

```bash
# Create patch release
./scripts/release.sh patch

# Create minor release
./scripts/release.sh minor

# Create major release
./scripts/release.sh major

# Dry run (no changes)
./scripts/release.sh patch --dry-run
```

### Rollback Process

```bash
# List available versions
./scripts/rollback.sh

# Rollback to specific version
./scripts/rollback.sh --version=v1.0.0 --confirm

# Dry run rollback
./scripts/rollback.sh --version=v1.0.0
```

## Status Checks Required

These must pass before merging to main:

- ✅ Lint - Code quality checks
- ✅ Test - Unit test suite
- ✅ Build - Expo build succeeds
- ✅ Security Scan - No vulnerabilities
- ✅ E2E Tests - Integration tests

Pull request example:

```
Main → develop → feature/new-feature
          ↓
      Create PR
          ↓
    GitHub Actions:
    - Lint ✅
    - Test ✅ (85% coverage)
    - Build ✅
    - Security ✅
    - E2E ✅
          ↓
    Needs 2 reviews
          ↓
    Ready to merge
```

## Deployment Metrics

Monitor these after deployment:

- **Crash Rate**: < 0.1%
- **Session Duration**: > 2 minutes
- **Error Rate**: < 0.5%
- **Performance**: Load time < 2s
- **User Count**: Monitor growth
- **Feature Usage**: Track analytics

View in:
- Sentry: Error tracking
- Firebase: Analytics
- Google Play Console: User metrics
- Slack: Deployment notifications

## Troubleshooting

### Workflow Fails

1. **Check logs**: Click workflow run → see full logs
2. **Common issues**:
   - Lint errors: `npm run lint -- --fix`
   - Test failures: `npm run test` locally
   - Build errors: `eas build --platform android/ios --profile staging`
   - Security issues: Review SNYK findings

### Deployment Blocked

Reason: Status check required
1. Fix lint/test/build issues
2. Push fix commit
3. Checks re-run automatically
4. Once passing, can merge

Reason: Review required
1. Request reviews from team members
2. Address review comments
3. Re-request reviews
4. Once approved, can merge

### Rollback Needed

1. Run rollback script:
   ```bash
   ./scripts/rollback.sh --version=v1.0.0 --confirm
   ```
2. Automatic deployment starts
3. Monitor Sentry for crash fixes
4. Slack notifies team

### Secrets Not Working

1. Verify secret exists in GitHub Settings
2. Check secret name matches exactly (case-sensitive)
3. Confirm secret is in correct scope (repo vs environment)
4. Try re-entering secret value
5. Check GitHub Actions documentation

## Best Practices

### Code Quality
- Keep lint score at 100%
- Maintain test coverage > 80%
- No TypeScript errors
- Use ESLint auto-fix: `npm run lint -- --fix`

### Commits
- Write descriptive messages
- Reference issues: `Fixes #123`
- One feature per commit
- Keep commits small and focused

### Pull Requests
- Describe changes clearly
- Link to related issues
- Ensure all checks pass
- Respond to review comments
- Keep reviews focused

### Releases
- Use semantic versioning (X.Y.Z)
- Test in staging first
- Document breaking changes
- Monitor for issues after deployment
- Prepare rollback plan

### Monitoring
- Check Sentry daily
- Monitor Firebase Analytics
- Review deployment metrics
- Set up Slack alerts
- Weekly team reviews

## Performance Benchmarks

Target metrics for workflows:

| Workflow | Time | Success Rate |
|----------|------|--------------|
| Lint | 3 min | 99% |
| Test | 5 min | 98% |
| Build | 20-30 min | 95% |
| Deploy | 30-40 min | 99% |
| E2E Tests | 20 min | 90% |
| Security | 10 min | 100% |

## Monitoring & Alerts

Set up Slack alerts for:
- Build failures
- Test failures
- Deployment errors
- Security issues
- Performance degradation

Configure in:
- `.github/workflows/` - Slack notifications
- GitHub Settings → Notifications
- Sentry → Alerts
- Firebase → Alerts

## Next Steps

1. **Setup**: Follow SECRETS_SETUP.md
2. **Configure**: Update branch protection rules
3. **Test**: Run local build and tests
4. **Deploy**: Create staging release
5. **Monitor**: Watch Sentry and Firebase
6. **Optimize**: Track metrics and improve

## Support

For issues:
1. Check workflow logs on GitHub Actions
2. Review error messages in Sentry
3. Check Slack notifications
4. Review documentation
5. Contact DevOps team

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Expo EAS Documentation](https://docs.expo.dev/eas/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [Sentry Documentation](https://docs.sentry.io/)
- [Firebase Documentation](https://firebase.google.com/docs)
