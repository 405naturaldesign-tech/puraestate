# GitHub Actions Workflows

This directory contains all CI/CD workflows for PuraEstate production deployment.

## Workflows Overview

### 1. lint.yml
- **Purpose**: Code quality and TypeScript checking
- **Triggers**: Push and pull requests to main/develop/staging
- **Checks**: ESLint, TypeScript compiler, Prettier formatting
- **Status Check**: REQUIRED for merging
- **Duration**: ~3 minutes

### 2. test.yml
- **Purpose**: Unit testing and code coverage
- **Triggers**: Push and pull requests to main/develop/staging
- **Tests**: Jest with coverage threshold (70%)
- **Status Check**: REQUIRED for merging
- **Duration**: ~5 minutes
- **Coverage Upload**: codecov integration

### 3. build.yml
- **Purpose**: Build application with Expo EAS
- **Triggers**: Push and pull requests
- **Platforms**: Android & iOS
- **Profiles**:
  - development: Development client
  - staging: Staging builds (APK/IPA)
  - production: Production builds (AAB/IPA)
- **Status Check**: REQUIRED for merging
- **Duration**: ~20-30 minutes

### 4. deploy.yml
- **Purpose**: Deploy to Google Play Store
- **Triggers**:
  - Push to main branch (staged rollout)
  - Version tags (v*.*.*)
  - Manual workflow dispatch
- **Deployment Modes**:
  - Internal testing
  - Staged rollout (10%)
  - Full release
- **Duration**: ~30-40 minutes
- **Includes**: Automatic rollback on failure

### 5. e2e-tests.yml
- **Purpose**: End-to-end integration testing
- **Triggers**: Push/PR to main/develop/staging, daily schedule
- **Tool**: Detox on macOS
- **Duration**: ~20 minutes
- **Status**: Informational (not required)

### 6. security-scan.yml
- **Purpose**: Security vulnerability scanning
- **Triggers**: Push/PR, weekly schedule
- **Checks**:
  - npm audit
  - SNYK vulnerability scan
  - Trivy container scanning
  - Secret detection
- **Status Check**: REQUIRED for main branch
- **Duration**: ~10 minutes

### 7. monitoring.yml
- **Purpose**: System health checks
- **Triggers**: Every 6 hours
- **Checks**:
  - Sentry health
  - Firebase status
  - Google Play connectivity
  - API endpoint monitoring
- **Duration**: ~5 minutes

## Running Workflows Locally

### Test Workflow Locally

```bash
# Install act (GitHub Actions local runner)
brew install act  # or: curl https://raw.githubusercontent.com/nektos/act/master/install.sh | bash

# Run specific workflow
act -j lint
act -j test
act -j build

# Run all workflows for push event
act push

# Run workflow with secrets
act -s EXPO_TOKEN=your_token
```

## Workflow Secrets Required

See `.github/SECRETS_SETUP.md` for complete list.

## Branch Rules

### Main Branch
- Requires all status checks to pass
- Requires 2 code reviews
- Auto-deploy on merge (staged rollout)

### Staging Branch
- Requires lint, test, build, security checks
- Requires 1 code review
- Auto-deploy to internal testing

### Develop Branch
- No auto-deploy
- Fewer restrictions for fast iteration

## Monitoring Workflow Execution

1. **GitHub Actions Tab**
   - Click Actions in repository
   - View all workflow runs
   - Click workflow to see steps

2. **Pull Request Status Checks**
   - Status checks shown on PR
   - Details link to full logs
   - Required checks marked

3. **Deployment Progress**
   - Slack notifications on completion
   - Sentry shows new errors post-deployment
   - Google Play Console shows release status

## Troubleshooting

### Workflow Fails

1. Click failing step
2. Expand step logs
3. Look for error messages
4. Common issues:
   - Lint errors: Run `npm run lint -- --fix`
   - Test failures: Run `npm run test` locally
   - Build errors: Run local build
   - Secret not found: Check GitHub secrets

### Retry Failed Workflow

1. Go to failed workflow run
2. Click "Re-run failed jobs"
3. Checks run again
4. If secrets expired, rotate and retry

### Disable/Enable Workflows

Workflows can be disabled/enabled in Actions tab:
1. Click workflow name
2. Click "..." menu
3. Select "Disable/Enable workflow"

## Performance Optimization

Monitor workflow times in Actions tab:

- Target lint time: < 5 minutes
- Target test time: < 10 minutes
- Target build time: < 30 minutes
- Target deploy time: < 45 minutes

Optimization strategies:
- Cache dependencies: `actions/setup-node@v4` with cache
- Parallel jobs: Use `strategy.matrix`
- Conditional steps: Use `if:` conditions
- Upload artifacts: For debugging

## Security Best Practices

1. **Secrets Management**
   - Use GitHub Secrets for sensitive data
   - Never hardcode credentials
   - Rotate secrets every 90 days
   - Monitor secret usage

2. **Workflow Security**
   - Pin action versions: `@v4` not `@master`
   - Review action permissions
   - Limit workflow access
   - Monitor workflow logs

3. **Deployment Security**
   - Require reviews before deploy
   - Test in staging first
   - Monitor production metrics
   - Prepare rollback plan

## Workflow Dependencies

```
push to main
    ↓
lint.yml (start)
test.yml (start)
build.yml (start)
    ↓ (all must pass)
security-scan.yml (on main only)
    ↓ (if all pass)
deploy.yml (only on main/tags)
    ↓
monitoring.yml (scheduled, runs independently)
```

## File Structure

```
.github/
├── workflows/
│   ├── lint.yml              # Code quality checks
│   ├── test.yml              # Unit tests
│   ├── build.yml             # Expo EAS builds
│   ├── deploy.yml            # Google Play deployment
│   ├── e2e-tests.yml         # End-to-end tests
│   ├── security-scan.yml     # Security scanning
│   ├── monitoring.yml        # Health checks
│   └── README.md             # This file
├── BRANCH_PROTECTION.md      # Branch rules
├── SECRETS_SETUP.md          # Secret configuration
└── CI_CD_GUIDE.md            # Complete guide
```

## Maintenance

### Weekly
- Review workflow failures
- Check performance metrics
- Verify all checks passing

### Monthly
- Update action versions
- Review and rotate secrets
- Analyze metrics trends

### Quarterly
- Security audit
- Dependency updates
- Performance optimization

## Emergency Procedures

### Production Emergency

1. **If critical issue in production**:
   ```bash
   ./scripts/rollback.sh --version=v1.0.0 --confirm
   ```

2. **If deployment is stuck**:
   - Cancel workflow in GitHub Actions
   - Investigate in logs
   - Fix issue
   - Restart workflow

3. **If secrets leaked**:
   - Immediately rotate secret
   - Check GitHub Actions logs for exposure
   - Alert team immediately
   - Document incident

## Contact & Support

- **Questions**: Check CI_CD_GUIDE.md
- **Issues**: Create GitHub issue with workflow logs
- **Security**: Report to security team
- **Emergency**: Page on-call DevOps engineer

## Additional Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Available Actions](https://github.com/actions)
- [Act - Local Runner](https://github.com/nektos/act)
