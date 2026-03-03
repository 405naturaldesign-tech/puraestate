# GitHub Branch Protection Rules

## Configuration for PuraEstate Production Deployment

### Main Branch Protection Rules

Configure these settings in GitHub repository settings:

1. **Require pull request reviews before merging**
   - Required number of reviewers: 2
   - Dismiss stale pull request approvals when new commits are pushed: YES
   - Require review from code owners: YES

2. **Require status checks to pass before merging**
   - Lint: REQUIRED
   - Test: REQUIRED
   - Build: REQUIRED
   - Security Scan: REQUIRED
   - E2E Tests: REQUIRED (when available)

3. **Require branches to be up to date before merging**
   - YES - Ensures all checks run on latest code

4. **Include administrators**
   - YES - Enforce rules for admins too

5. **Allow force pushes**
   - NO - Prevent force pushes to main

6. **Allow deletions**
   - NO - Prevent accidental deletion

### Staging Branch Protection Rules

1. **Require pull request reviews before merging**
   - Required number of reviewers: 1
   - Dismiss stale pull request approvals: YES
   - Require review from code owners: NO

2. **Require status checks to pass before merging**
   - Lint: REQUIRED
   - Test: REQUIRED
   - Build: REQUIRED
   - Security Scan: REQUIRED

3. **Require branches to be up to date before merging**
   - YES

4. **Include administrators**
   - YES

### Development Branch Protection Rules (Optional)

1. **Require pull request reviews before merging**
   - Required number of reviewers: 1

2. **Require status checks to pass before merging**
   - Lint: REQUIRED
   - Test: REQUIRED

## Required Status Checks

The following GitHub Actions workflows must complete successfully:

1. **Lint** - ESLint and TypeScript checks
2. **Test** - Jest unit tests with coverage
3. **Build** - Expo EAS build
4. **Security Scan** - npm audit, SNYK, and secret scanning
5. **E2E Tests** - End-to-end tests (when available)

## Code Review Requirements

- Minimum 2 reviewers for main branch
- Minimum 1 reviewer for staging branch
- At least one reviewer must be a code owner
- Automated bot approvals are not sufficient
- Reviews must be requested from specific users/teams

## Automated Deployments

### Main Branch
- Automatic deployment on merge (via GitHub Actions)
- Staged rollout (10%) first
- Full release on version tag

### Staging Branch
- Automatic build on merge
- Internal testing distribution
- Manual promotion to production

### Development Branch
- No automatic deployment
- Used for active feature development

## Pull Request Templates

Create `.github/pull_request_template.md`:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe testing performed:
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] E2E tests passed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] All tests passing

## Deployment Notes
Any special deployment considerations:
- Database migrations required: NO/YES
- Environment variables added: NO/YES
- Breaking changes: NO/YES
```

## CODEOWNERS File

Create `.github/CODEOWNERS`:

```
# Backend
/src/api/               @backend-team
/migrations/            @backend-team @database-admins
/src/services/          @backend-team

# Mobile App
/src/screens/           @mobile-team
/src/components/        @mobile-team
/src/hooks/             @mobile-team

# Infrastructure
/.github/workflows/     @devops-team
/eas.json              @devops-team
/scripts/              @devops-team

# Documentation
*.md                   @documentation-team

# All
README.md              @admin
```

## Enforce Branch Rules via Settings

1. Go to Settings → Branches
2. Add branch protection rule
3. Set branch name pattern to `main`
4. Enable all required settings
5. Repeat for `staging` and `develop` branches

## GitHub Secrets Required

Configure these in Settings → Secrets and variables → Actions:

### Build & Deployment
- `EXPO_TOKEN` - Expo access token
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` - Google Play service account
- `KEYSTORE_BASE64` - Android keystore (base64 encoded)
- `KEYSTORE_PASSWORD` - Keystore password
- `KEY_ALIAS` - Key alias
- `KEY_PASSWORD` - Key password

### Monitoring & Notifications
- `SENTRY_AUTH_TOKEN` - Sentry auth token
- `SLACK_WEBHOOK_URL` - Slack webhook for notifications

### API Access
- `SNYK_TOKEN` - SNYK security scanning
- `GITHUB_TOKEN` - GitHub access (auto-provided)

## Enforcement Policy

1. **No bypassing checks**: Required status checks must pass
2. **Review required**: PRs must be reviewed by team members
3. **Conversation resolution**: All comments must be resolved
4. **Auto-delete head branches**: Enabled
5. **Require signed commits**: Recommended for main branch

## Monitoring Compliance

Use GitHub's branch protection dashboard to:
- Monitor rule violations
- Review deployment history
- Track pull request metrics
- Analyze review times

## Incident Response

If a hotfix is needed and blocked by branch protection:

1. Create a hotfix branch: `hotfix/description`
2. Go through normal PR review process
3. Get required approvals
4. Merge to main
5. Automated tests and deployment will run
6. Create release tag for deployment

DO NOT:
- Force push to main
- Bypass status checks
- Bypass required reviews
- Disable branch protection
