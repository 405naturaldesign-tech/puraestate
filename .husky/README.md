# PuraEstate Pre-Commit Hooks

This directory contains Git hooks managed by Husky. These hooks enforce code quality standards and prevent common issues from being committed.

## What are Git Hooks?

Git hooks are scripts that run automatically before or after git events like commit, push, etc. They help maintain code quality by running checks before code is committed to the repository.

## Available Hooks

### 1. Pre-Commit Hook (`.husky/pre-commit`)

Runs automatically before every `git commit`. Performs the following checks:

- **Console Statements Check**: Detects `console.log()` statements (warnings allowed for console.warn/error)
- **Secrets Detection**: Identifies potential hardcoded API keys and credentials
- **TODO/FIXME Validation**: Checks that TODO/FIXME comments reference issue numbers
- **Large Files Check**: Warns if files exceed 1MB
- **ESLint Validation**: Enforces code style (fails on errors, not warnings)
- **Prettier Formatting**: Checks code formatting and auto-fixes
- **TypeScript Type Check**: Verifies TypeScript compilation with `tsc --noEmit`
- **Conventional Commits**: Validates commit message format

### 2. Pre-Push Hook (`.husky/pre-push`)

Runs automatically before every `git push`. Performs:

- **Full Test Suite**: Runs `npm run test:ci` (complete test coverage)
- **Security Audit**: Runs `npm audit` to check for vulnerabilities
  - Fails on high/critical severity
  - Warns on moderate severity

### 3. Commit Message Hook (`.husky/commit-msg`)

Runs after commit message is written, before commit is finalized:

- **Conventional Commit Format**: Enforces format: `type(scope): description`
- **Subject Length**: Validates subject line is ≤72 characters
- **No Trailing Periods**: Ensures subject doesn't end with period
- **Body Structure**: Validates proper blank line between subject and body
- **Body Line Length**: Warns if body lines exceed 100 characters

## Setup Instructions

### For First-Time Setup

1. Install dependencies including Husky:
   ```bash
   npm install
   ```

2. Initialize Husky (automatic on install, but can be manual):
   ```bash
   npx husky install
   ```

3. Verify hooks are installed:
   ```bash
   ls -la .husky/
   ```
   You should see: `pre-commit`, `pre-push`, `commit-msg`

### For Existing Team Members

When cloning the repository:

1. Install dependencies:
   ```bash
   npm install
   ```
   This automatically runs `husky install` (via postinstall script)

2. Verify hooks are installed:
   ```bash
   npx husky install
   ```

3. Test a hook:
   ```bash
   npm run pre-commit
   ```

## Conventional Commit Format

All commits must follow conventional commits specification:

```
<type>(<optional-scope>): <description>

<optional-body>

<optional-footer>
```

### Valid Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes
- **test**: Adding or updating tests
- **refactor**: Code refactoring without feature change
- **style**: Code style changes (no functional change)
- **chore**: Dependency updates or build system changes
- **ci**: CI/CD configuration changes
- **perf**: Performance improvements

### Examples

```
feat(auth): add two-factor authentication

fix: prevent race condition in scheduler

docs(readme): update installation instructions

refactor(api): simplify request handling

style: format code with prettier

chore: update dependencies
```

## Bypassing Hooks (Use with Caution!)

### Skip Pre-Commit Hook Only
```bash
git commit --no-verify
# OR
npm run pre-commit:skip
```

### Skip All Hooks
```bash
HUSKY=0 git commit -m "message"
# OR
HUSKY=0 git push
```

**Important**: Only bypass hooks when absolutely necessary. These checks exist to maintain code quality!

## Running Checks Manually

### Run all pre-commit validations:
```bash
npm run pre-commit
```

### Run specific checks:
```bash
# ESLint only
npm run lint

# Prettier formatting only
npm run format

# TypeScript type check
npm run type-check

# Tests
npm run test

# Security audit
npm audit
```

## Common Issues and Solutions

### Issue: "npm: command not found" in hooks

**Solution**: Ensure Node.js is in your PATH. On macOS, you might need:
```bash
eval "$(brew shellenv)"
```

### Issue: Hooks not running

**Solution**: Ensure they're installed and executable:
```bash
npx husky install
ls -la .husky/
# Should show: pre-commit*, pre-push*, commit-msg*
```

### Issue: ESLint or Prettier fails in hook but works locally

**Solution**: Clear node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Tests failing in pre-push hook

**Solution**: Run tests locally first:
```bash
npm run test:ci
# Fix failing tests before pushing
```

## Customizing Hooks

To modify hook behavior, edit the relevant files:

- **Pre-commit logic**: `.husky/pre-commit`
- **Pre-push logic**: `.husky/pre-push`
- **Commit message validation**: `.husky/commit-msg`
- **Additional validations**: `scripts/pre-commit-check.sh`

Changes to hooks should be committed to the repository so all team members use the same validation rules.

## Integration with IDEs

### Visual Studio Code

Install the ESLint extension and Prettier extension for real-time feedback:
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

### WebStorm / IntelliJ IDEA

1. Go to Settings > Languages & Frameworks > JavaScript > Code Quality Tools > ESLint
2. Enable ESLint
3. Go to Settings > Languages & Frameworks > JavaScript > Prettier
4. Enable Prettier as formatter

### Other IDEs

Configure your IDE to:
1. Run ESLint on file save with --fix flag
2. Run Prettier on file save
3. Show TypeScript errors in real-time

This will give you instant feedback matching the hook validation.

## Monitoring Hooks Effectiveness

Over time, monitor which checks catch the most issues:
1. Check git logs for bypassed hooks: `git log --grep=--no-verify`
2. Collect metrics on most common ESLint/Prettier errors
3. Update `.eslintrc.json` or `.prettierrc.json` if needed

## Disabling Specific Hooks

If a hook becomes problematic, you can comment it out in the relevant file:

```bash
# Example: disable ESLint in pre-commit temporarily
# echo "🔎 Running ESLint..."
# if npm run lint --fix ... (commented out)
```

**Note**: Coordinate with team before disabling hooks to understand why.

## Additional Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Husky Documentation](https://typicode.github.io/husky/)
- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)
- [Git Hooks Guide](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)
