#!/bin/bash

# PuraEstate Pre-Commit Validation Script
# This script runs comprehensive checks on staged files before committing
# Can be run manually with: npm run pre-commit

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FAILED=false
WARNINGS=0

# Helper functions
log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
  ((WARNINGS++))
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
  FAILED=true
}

print_section() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Get staged files
get_staged_files() {
  if git rev-parse --git-dir > /dev/null 2>&1; then
    git diff --cached --name-only --diff-filter=ACM 2>/dev/null || echo ""
  else
    echo ""
  fi
}

print_section "🔍 PuraEstate Pre-Commit Validation"

# 1. Check for console.log statements
print_section "1️⃣  Console Statements Check"
STAGED_FILES=$(get_staged_files)
if [ -n "$STAGED_FILES" ]; then
  CONSOLE_LOGS=$(echo "$STAGED_FILES" | grep -E '\.(ts|tsx|js|jsx)$' | xargs grep -l "console\.log\s*(" 2>/dev/null || echo "")
  if [ -n "$CONSOLE_LOGS" ]; then
    log_warning "Found console.log statements in:"
    echo "$CONSOLE_LOGS" | while read -r file; do
      echo "  - $file"
    done
    log_info "Note: console.warn and console.error are allowed"
  else
    log_success "No console.log statements found"
  fi
else
  log_info "No TypeScript/JavaScript files to check"
fi

# 2. Check for hardcoded secrets/API keys
print_section "2️⃣  Secrets & Credentials Check"
SECRETS_FOUND=false
if [ -n "$STAGED_FILES" ]; then
  # Check for common secret patterns
  SECRET_PATTERNS=(
    "api_key\s*[:=]"
    "apiKey\s*[:=]"
    "API_KEY\s*[:=]"
    "password\s*[:=]"
    "secret\s*[:=]"
    "PRIVATE_KEY"
    "BEGIN.*PRIVATE.*KEY"
    "aws_secret"
    "AWS_SECRET"
  )

  for pattern in "${SECRET_PATTERNS[@]}"; do
    if echo "$STAGED_FILES" | xargs grep -i -E "$pattern" 2>/dev/null | grep -v ".env" | grep -v "example\|demo\|test\|mock" | grep -q .; then
      log_warning "Potential hardcoded secret detected with pattern: $pattern"
      SECRETS_FOUND=true
    fi
  done

  if [ "$SECRETS_FOUND" = false ]; then
    log_success "No hardcoded secrets detected"
  fi
else
  log_info "No files to check for secrets"
fi

# 3. Check for TODO/FIXME without issue numbers
print_section "3️⃣  TODO/FIXME Comments Check"
if [ -n "$STAGED_FILES" ]; then
  TODO_PATTERN='\b(TODO|FIXME)\b'
  ISSUE_REF='\[?#[0-9]+\]?'

  TODOS=$(echo "$STAGED_FILES" | grep -E '\.(ts|tsx|js|jsx|md)$' | xargs grep -n "$TODO_PATTERN" 2>/dev/null || echo "")

  if [ -n "$TODOS" ]; then
    TODO_WITHOUT_ISSUE=$(echo "$TODOS" | grep -v "$ISSUE_REF" | grep -v "<!--" | head -10)
    if [ -n "$TODO_WITHOUT_ISSUE" ]; then
      log_warning "Found TODO/FIXME comments without issue numbers:"
      echo "$TODO_WITHOUT_ISSUE" | while read -r line; do
        echo "  - $line"
      done
    else
      log_success "All TODO/FIXME comments have issue references"
    fi
  else
    log_success "No TODO/FIXME comments found"
  fi
else
  log_info "No files to check for TODO/FIXME"
fi

# 4. Check for large files (> 1MB)
print_section "4️⃣  Large Files Check"
LARGE_FILES=""
if [ -n "$STAGED_FILES" ]; then
  echo "$STAGED_FILES" | while IFS= read -r file; do
    if [ -f "$file" ]; then
      SIZE=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
      if [ "$SIZE" -gt 1048576 ]; then
        echo "  - $file: $((SIZE / 1048576))MB"
      fi
    fi
  done | tee /tmp/large_files.txt

  if [ -s /tmp/large_files.txt ]; then
    log_warning "Large files detected (> 1MB):"
    cat /tmp/large_files.txt
    log_info "Consider splitting large files or using LFS"
  else
    log_success "No files larger than 1MB"
  fi
  rm -f /tmp/large_files.txt
else
  log_info "No files to check"
fi

# 5. Check for import sorting issues
print_section "5️⃣  Import Sorting Check"
if [ -n "$STAGED_FILES" ]; then
  UNSORTED_IMPORTS=$(echo "$STAGED_FILES" | grep -E '\.(ts|tsx|js|jsx)$' | xargs grep -n "^import" 2>/dev/null | head -20 || echo "")
  if [ -n "$UNSORTED_IMPORTS" ]; then
    log_info "Import statements found (verify they follow this order):"
    log_info "  1. External packages (react, node modules)"
    log_info "  2. Internal absolute imports"
    log_info "  3. Relative imports"
    log_success "Please verify imports are properly sorted"
  else
    log_success "No import statements to check"
  fi
else
  log_info "No files to check for imports"
fi

# 6. Check file encoding
print_section "6️⃣  File Encoding Check"
if [ -n "$STAGED_FILES" ]; then
  echo "$STAGED_FILES" | while IFS= read -r file; do
    if [ -f "$file" ]; then
      ENCODING=$(file -b --mime-encoding "$file" 2>/dev/null)
      if [ "$ENCODING" != "utf-8" ] && [ "$ENCODING" != "binary" ]; then
        log_warning "File $file has encoding: $ENCODING (expected utf-8)"
      fi
    fi
  done
  log_success "File encoding check completed"
else
  log_info "No files to check"
fi

# 7. Check for merge conflicts
print_section "7️⃣  Merge Conflicts Check"
if [ -n "$STAGED_FILES" ]; then
  CONFLICTS=$(echo "$STAGED_FILES" | xargs grep -l "<<<<<<< HEAD\|>>>>>>>" 2>/dev/null || echo "")
  if [ -n "$CONFLICTS" ]; then
    log_error "Merge conflict markers found in:"
    echo "$CONFLICTS" | while read -r file; do
      echo "  - $file"
    done
  else
    log_success "No merge conflict markers found"
  fi
else
  log_info "No files to check"
fi

# Summary
print_section "📊 Pre-Commit Validation Summary"
echo ""

if [ "$FAILED" = true ]; then
  log_error "Pre-commit validation failed"
  echo ""
  echo "To bypass these checks (not recommended):"
  echo "  git commit --no-verify"
  echo "  OR"
  echo "  npm run pre-commit:skip"
  exit 1
else
  if [ $WARNINGS -eq 0 ]; then
    log_success "All checks passed! Ready to commit."
  else
    log_warning "Validation completed with $WARNINGS warning(s). Review above."
  fi
  exit 0
fi
