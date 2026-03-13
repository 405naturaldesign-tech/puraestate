# PuraEstate Git Hooks - File Index

## Quick Navigation

### For Developers Starting Out
1. **Read First**: [`../HOOKS_SETUP.md`](../HOOKS_SETUP.md) - Setup and usage guide
2. **Keep Handy**: [`QUICK_REFERENCE.txt`](QUICK_REFERENCE.txt) - Commands and examples
3. **When Stuck**: [`README.md`](README.md) - Detailed documentation

### For Technical Leads
1. **Overview**: [`../PRE_COMMIT_HOOKS_SUMMARY.md`](../PRE_COMMIT_HOOKS_SUMMARY.md) - Full implementation details
2. **Installation**: [`../HOOKS_INSTALLATION_MANIFEST.txt`](../HOOKS_INSTALLATION_MANIFEST.txt) - File manifest
3. **Configuration**: [`../.commitlintrc.json`](.commitlintrc.json) - Commit validation rules

### For IDE Configuration
See `README.md` IDE Configuration section:
- VS Code: ESLint and Prettier extensions
- WebStorm: Built-in ESLint and Prettier support
- Vim/Neovim: Coc or LSP configuration

## Hook Files

| File | Purpose | When It Runs | What It Does |
|------|---------|--------------|--------------|
| `pre-commit` | Code quality | Before `git commit` | ESLint, Prettier, TypeScript, secrets |
| `pre-push` | Quality gate | Before `git push` | Tests, security audit |
| `commit-msg` | Message validation | During `git commit` | Format, length, structure |
| `_/husky.sh` | System helper | Automatically | Powers the hook system |

## Configuration Files

| File | Purpose | Location |
|------|---------|----------|
| `.commitlintrc.json` | Conventional commit rules | Project root |
| `package.json` | npm scripts and lint-staged | Project root |
| `.eslintrc.json` | ESLint rules | Project root |
| `.prettierrc.json` | Prettier formatting | Project root |

## Documentation Files

| File | For Whom | Content |
|------|----------|---------|
| `QUICK_REFERENCE.txt` | All developers | Quick commands, examples |
| `README.md` | Developers | Detailed documentation |
| `../HOOKS_SETUP.md` | New developers | Setup and usage guide |
| `../PRE_COMMIT_HOOKS_SUMMARY.md` | Leads | Technical details |
| `../HOOKS_INSTALLATION_MANIFEST.txt` | Maintainers | Installation reference |

## Helper Scripts

| File | Purpose | Run With |
|------|---------|----------|
| `../scripts/pre-commit-check.sh` | Extended validation | `npm run pre-commit` |

## Common Tasks

### Setting Up Hooks
```bash
npm install              # Auto-installs hooks
npx husky install        # Manual install if needed
```

### Testing Hooks
```bash
npm run pre-commit       # Test pre-commit validations
npm run test:ci          # Test pre-push validations
npm run lint             # Test linting
```

### Making a Commit
```bash
git add .
git commit -m "feat(feature): description"  # Hooks run automatically
```

### Bypassing Hooks (Emergency Only)
```bash
git commit --no-verify        # Skip pre-commit
HUSKY=0 git push              # Skip all hooks
npm run pre-commit:skip       # Equivalent to --no-verify
```

## Conventional Commit Types

Valid types for all commits:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `test` - Tests
- `refactor` - Code refactoring
- `style` - Code style
- `chore` - Dependencies/build
- `ci` - CI/CD changes
- `perf` - Performance

Example: `feat(auth): add two-factor authentication`

## Troubleshooting Quick Links

- **Hooks not running?** → See QUICK_REFERENCE.txt troubleshooting
- **ESLint/Prettier errors?** → See README.md debugging section
- **Commit message rejected?** → See QUICK_REFERENCE.txt format examples
- **Tests failing in hook?** → See HOOKS_SETUP.md "If Tests Fail" section

## File Sizes & Locations

```
/home/thegoodideallc/puraestate/
├── .husky/
│   ├── pre-commit              (3.8 KB) - Main pre-commit hook
│   ├── pre-push                (1.2 KB) - Main pre-push hook
│   ├── commit-msg              (2.7 KB) - Message validation
│   ├── _/
│   │   └── husky.sh            (0.4 KB) - System helper
│   ├── README.md               (8.2 KB) - Detailed docs
│   ├── QUICK_REFERENCE.txt     (9.9 KB) - Quick ref
│   └── INDEX.md                (This file)
├── .commitlintrc.json          (0.7 KB) - Commit rules
├── package.json                (Updated with scripts)
├── scripts/
│   └── pre-commit-check.sh     (6.4 KB) - Extended checks
├── HOOKS_SETUP.md              (7.3 KB) - Setup guide
├── PRE_COMMIT_HOOKS_SUMMARY.md (12.5 KB) - Tech details
└── HOOKS_INSTALLATION_MANIFEST.txt (16.4 KB) - Installation ref
```

## Getting Help

1. **Quick question?** → QUICK_REFERENCE.txt
2. **How do I...?** → HOOKS_SETUP.md
3. **Why does...?** → README.md
4. **Technical details?** → PRE_COMMIT_HOOKS_SUMMARY.md
5. **What got installed?** → HOOKS_INSTALLATION_MANIFEST.txt

## Key Commands

```bash
npm run pre-commit          # Test pre-commit checks
npm run lint                # ESLint only
npm run format              # Prettier formatting
npm run type-check          # TypeScript check
npm run test:ci             # Full test suite
npm run pre-commit:skip     # Skip hooks (emergency)
```

## Last Updated
March 12-13, 2026

## Maintained By
PuraEstate Development Team
