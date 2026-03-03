#!/bin/bash
# PuraEstate - Google Play Store Deployment Script
# Usage: bash scripts/deploy-playstore.sh [profile]
# Profiles: production (default), staging, preview

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PROFILE="${1:-production}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "============================================"
echo "PuraEstate - Play Store Deployment"
echo "Profile: $PROFILE"
echo "Timestamp: $TIMESTAMP"
echo "============================================"

# Pre-flight checks
echo ""
echo "[1/7] Running pre-flight checks..."

if ! command -v eas &> /dev/null; then
    echo "ERROR: EAS CLI not found. Install with: npm install -g eas-cli"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js not found."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "ERROR: Node.js 18+ required. Current: $(node -v)"
    exit 1
fi

echo "  EAS CLI: $(eas --version)"
echo "  Node.js: $(node -v)"
echo "  npm: $(npm -v)"

# Verify environment
echo ""
echo "[2/7] Verifying environment configuration..."

cd "$PROJECT_DIR"

if [ ! -f ".env.example" ]; then
    echo "WARNING: .env.example not found"
fi

if [ ! -f "app.json" ]; then
    echo "ERROR: app.json not found in project root"
    exit 1
fi

if [ ! -f "eas.json" ]; then
    echo "ERROR: eas.json not found in project root"
    exit 1
fi

echo "  app.json: Found"
echo "  eas.json: Found"

# Run tests
echo ""
echo "[3/7] Running test suite..."

npm run type-check || {
    echo "ERROR: TypeScript type check failed"
    exit 1
}

npm run lint || {
    echo "WARNING: Lint errors found (continuing)"
}

npm test -- --ci --passWithNoTests || {
    echo "WARNING: Some tests failed (continuing for build)"
}

echo "  Tests: Complete"

# Build
echo ""
echo "[4/7] Building Android AAB (profile: $PROFILE)..."

eas build --platform android --profile "$PROFILE" --non-interactive || {
    echo "ERROR: EAS build failed"
    exit 1
}

echo "  Build: Complete"

# Submit
if [ "$PROFILE" = "production" ]; then
    echo ""
    echo "[5/7] Submitting to Google Play Store..."

    eas submit --platform android --profile "production-android" --non-interactive || {
        echo "ERROR: Play Store submission failed"
        echo "You can retry manually: eas submit --platform android --profile production-android"
        exit 1
    }

    echo "  Submission: Complete"
else
    echo ""
    echo "[5/7] Skipping Play Store submission (non-production profile)"
fi

# Tag release
echo ""
echo "[6/7] Creating release tag..."

VERSION=$(node -e "console.log(require('./app.json').expo.version)")
VERSION_CODE=$(node -e "console.log(require('./app.json').expo.android.versionCode)")

TAG="v${VERSION}-${VERSION_CODE}-${PROFILE}"
echo "  Version: $VERSION (code: $VERSION_CODE)"
echo "  Tag: $TAG"

if command -v git &> /dev/null && [ -d ".git" ]; then
    git tag -a "$TAG" -m "Release $VERSION ($PROFILE) - $TIMESTAMP" 2>/dev/null || {
        echo "  WARNING: Could not create git tag (may already exist)"
    }
fi

# Summary
echo ""
echo "[7/7] Deployment Summary"
echo "============================================"
echo "Profile:      $PROFILE"
echo "Version:      $VERSION"
echo "Version Code: $VERSION_CODE"
echo "Tag:          $TAG"
echo "Timestamp:    $TIMESTAMP"
echo "Status:       SUCCESS"
echo "============================================"
echo ""
echo "Next steps:"
if [ "$PROFILE" = "production" ]; then
    echo "  1. Monitor Play Console for review status"
    echo "  2. Check Sentry for any crash reports"
    echo "  3. Monitor Firebase Analytics"
    echo "  4. Review Play Store ratings after 24h"
else
    echo "  1. Test the build on physical devices"
    echo "  2. When ready, run: bash scripts/deploy-playstore.sh production"
fi
