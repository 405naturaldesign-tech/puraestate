# PuraEstate Git Hooks Setup Guide

## Quick Start

PuraEstate uses Git hooks to enforce code quality standards. All developers must set these up locally.

### Step 1: Install Dependencies

```bash
npm install
```

This automatically installs and initializes Husky hooks via the `postinstall` script.

### Step 2: Verify Hooks Installation

```bash
ls -la .husky/
```

You should see these files:
- `.husky/pre-commit` - Runs before committing
- `.husky/pre-push` - Runs before pushing
- `.husky/commit-msg` - Validates commit messages

### Step 3: Test a Hook

```bash
# Run the manual pre-commit check
npm run pre-commit
```

You should see output with various checks passing.

## What Hooks Do

### When You Commit (`git commit`)

The `pre-commit` hook automatically:

1. Scans for `console.log()` statements (warn only)
2. Checks for hardcoded secrets/API keys
3. Validates TODO/FIXME comments reference issues
4. Warns about files > 1MB
5. Runs ESLint (fails on errors)
6. Runs Prettier (auto-fixes formatting)
7. Runs TypeScript compiler (fails on type errors)
8. Validates conventional commit format

**Result**: If any check fails, commit is blocked. Fix and try again.

### When You Push (`git push`)

The `pre-push` hook runs:

1. Full test suite (`npm run test:ci`)
2. Security audit (`npm audit`)

**Result**: If tests fail or critical vulnerabilities exist, push is blocked.

### When You Write Commit Message

The `commit-msg` hook validates:

1. Follows conventional commit format
2. Subject ≤ 72 characters
3. No trailing period on subject
4. Proper spacing between subject and body

**Result**: If invalid, commit message editor opens for corrections.

## Conventional Commit Format

All commits must follow this format:

```
<type>(<scope>): <description>
```

### Examples

```
feat(auth): add password reset functionality

fix: prevent race condition in data sync

docs(api): update endpoint documentation

test(calculator): add edge case tests

refactor(core): simplify state management

style: reformat code with prettier

chore: upgrade dependencies
```

### Valid Types

| Type | Purpose | Example |
|------|---------|---------|
| feat | New feature | `feat(maps): add location clustering` |
| fix | Bug fix | `fix(auth): resolve token expiration` |
| docs | Documentation | `docs(readme): update setup instructions` |
| test | Tests | `test(api): add error handling tests` |
| refactor | Code restructuring | `refactor(core): extract common logic` |
| style | Code formatting | `style: remove unused imports` |
| chore | Dependencies/build | `chore: update react to v18` |
| ci | CI/CD changes | `ci: add GitHub Actions workflow` |
| perf | Performance | `perf(core): optimize bundle size` |

## Common Workflows

### Making a Commit

```bash
# 1. Make changes
# 2. Stage changes
git add .

# 3. Commit - hooks run automatically
git commit -m "feat(feature): add new feature"

# If pre-commit hook fails:
# - Fix the issues shown
# - Stage changes again
# - Retry commit

# 4. Push - pre-push hook runs
git push origin branch-name
```

### If You Need to Fix Formatting

If ESLint or Prettier fails:

```bash
# Option 1: Let the hook fix it
# Just re-run git commit (files were auto-fixed)
git add .
git commit -m "feat: description"

# Option 2: Fix manually
npm run lint:fix
npm run format
git add .
git commit -m "feat: description"
```

### If Tests Fail on Push

```bash
# Fix the failing tests
npm run test:watch

# Once tests pass
git push origin branch-name
```

## Emergency: Bypass Hooks

**Only use when absolutely necessary!**

```bash
# Skip pre-commit hook only
git commit --no-verify -m "feat: message"

# Skip all hooks
HUSKY=0 git push

# Using npm script
npm run pre-commit:skip
```

After bypassing, understand why hooks failed and fix the issues.

## IDE Configuration

### VS Code

Install extensions:
1. [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
2. [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

Add to `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "eslint.format.enable": true,
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### WebStorm / IntelliJ IDEA

1. Go to Settings > Languages & Frameworks > JavaScript > Code Quality Tools > ESLint
   - Check "Enable"
   - Set "Node interpreter"
2. Go to Settings > Languages & Frameworks > JavaScript > Prettier
   - Check "Enable"
   - Select Prettier package

### Vim / Neovim

Set up with Coc or LSP to run ESLint and Prettier on save.

## Troubleshooting

### "Hooks not running"

```bash
# Reinstall hooks
npx husky install

# Verify they're executable
ls -la .husky/
```

### "npm command not found in hook"

The hook runs in a shell without your full PATH. Hooks use explicit paths:

```bash
# Should work in .husky/pre-commit:
/usr/bin/env npm run lint

# Instead of just:
# npm run lint
```

### "ESLint fails in hook but passes locally"

```bash
# Clear and reinstall everything
rm -rf node_modules package-lock.json
npm install
```

### "Tests pass locally but fail on push"

The `test:ci` script in the hook is stricter:

```bash
# Test exactly what the hook runs
npm run test:ci

# Fix any differences, then push
```

## Manual Pre-Commit Checks

To manually run all pre-commit validations:

```bash
npm run pre-commit
```

This runs the same checks as the automatic hook, useful for:
- Checking before creating a PR
- Running before submitting work
- Debugging why a hook failed

## Getting Help

### Common Error Messages

**"❌ ESLint check failed"**
- Run `npm run lint:fix` to auto-fix
- Review `.eslintrc.json` for rules

**"❌ TypeScript type check failed"**
- Run `npm run type-check` to see errors
- Fix type issues in your code

**"❌ Commit message does not follow conventional commits"**
- Use format: `type(scope): description`
- See examples above

**"❌ Pre-push checks failed"**
- Run `npm run test:ci` to debug
- Ensure all tests pass

### Getting Support

1. Check `.husky/README.md` for detailed hook documentation
2. Ask in the team Slack/Discord
3. Check PuraEstate wiki or docs
4. Review existing commits for examples: `git log --oneline`

## Best Practices

1. **Commit often**: Smaller commits are easier to review
2. **Clear commit messages**: Explain "why" not just "what"
3. **Fix issues early**: Don't bypass hooks to hide problems
4. **Keep tests updated**: If you add features, add tests
5. **Run checks locally first**: `npm run lint:fix && npm run test`

## Disabling Hooks (Team Decision)

If a hook becomes problematic for your team:

1. Create an issue explaining the problem
2. Discuss with the team
3. Update the hook files in `.husky/` or `scripts/pre-commit-check.sh`
4. Commit changes so everyone gets the update

Never just disable hooks locally without team discussion.

## Further Reading

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Husky Docs](https://typicode.github.io/husky/)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Options](https://prettier.io/docs/en/options.html)
- [Git Hooks](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)

---

**Last Updated**: March 2026
**Maintained By**: PuraEstate Development Team
