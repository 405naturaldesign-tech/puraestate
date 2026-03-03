#!/bin/bash

#############################################################################
# PuraEstate Rollback Script
# Usage: ./scripts/rollback.sh [--version=X.Y.Z] [--confirm]
#############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
ROLLBACK_LOG="rollback-logs/rollback-$(date +%Y%m%d-%H%M%S).log"
TARGET_VERSION=""
AUTO_CONFIRM=false

# Ensure rollback-logs directory exists
mkdir -p rollback-logs

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$ROLLBACK_LOG"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$ROLLBACK_LOG"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$ROLLBACK_LOG"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$ROLLBACK_LOG"
}

info() {
    echo -e "${PURPLE}[INFO]${NC} $1" | tee -a "$ROLLBACK_LOG"
}

# Parse arguments
for arg in "$@"; do
    case $arg in
        --version=*)
            TARGET_VERSION="${arg#*=}"
            ;;
        --confirm)
            AUTO_CONFIRM=true
            ;;
        *)
            warning "Unknown argument: $arg"
            ;;
    esac
done

log "Starting rollback process"

# Check if git is installed
if ! command -v git &> /dev/null; then
    error "git is not installed"
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    error "Not in a git repository"
fi

# Get list of recent releases
log "Fetching release history..."
RELEASES=$(git tag -l 'v*' --sort=-version:refname | head -20)

if [ -z "$RELEASES" ]; then
    error "No releases found in repository"
fi

info "Recent releases:"
COUNT=1
while IFS= read -r RELEASE; do
    echo "  $COUNT. $RELEASE"
    COUNT=$((COUNT + 1))
done <<< "$RELEASES"

# If no version specified, ask user
if [ -z "$TARGET_VERSION" ]; then
    info ""
    read -p "Enter version to rollback to (e.g., v1.0.0) or press Enter to cancel: " TARGET_VERSION

    if [ -z "$TARGET_VERSION" ]; then
        log "Rollback cancelled"
        exit 0
    fi
fi

# Validate version format
if ! [[ "$TARGET_VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    error "Invalid version format. Must be v#.#.#"
fi

# Check if version exists
if ! git rev-parse "$TARGET_VERSION" > /dev/null 2>&1; then
    error "Version $TARGET_VERSION does not exist"
fi

# Get version details
CURRENT_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "unknown")
CURRENT_TAG="v$CURRENT_VERSION"

log "Current version: $CURRENT_TAG"
log "Rolling back to: $TARGET_VERSION"

# Get release notes
RELEASE_INFO=$(git show "$TARGET_VERSION" --no-patch --format="%ai%n%s%n%b" 2>/dev/null || echo "")

info "Release information:"
echo "$RELEASE_INFO" | tee -a "$ROLLBACK_LOG"

# Show confirmation
warning "This will rollback the application to version: $TARGET_VERSION"
warning "Current production version is: $CURRENT_TAG"

if [ "$AUTO_CONFIRM" != "true" ]; then
    read -p "Are you sure you want to proceed? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Rollback cancelled by user"
        exit 0
    fi
fi

# Check Git status
if [ -n "$(git status --porcelain)" ]; then
    error "Working directory is not clean. Commit or stash changes before rolling back."
fi

log "Checking out version: $TARGET_VERSION"
git checkout "$TARGET_VERSION" || error "Failed to checkout $TARGET_VERSION"

# Update package.json version
VERSION_NUM="${TARGET_VERSION#v}"
log "Updating package.json to version: $VERSION_NUM"

# Use npm version to update package.json
npm version "$VERSION_NUM" --no-git-tag-version || error "Failed to update package.json"

# Create rollback commit
log "Creating rollback commit..."
git add package.json
git commit -m "chore: rollback to $TARGET_VERSION" || error "Failed to create rollback commit"

log "Creating rollback tag..."
ROLLBACK_TAG="$TARGET_VERSION-rollback-$(date +%Y%m%d-%H%M%S)"
git tag -a "$ROLLBACK_TAG" -m "Rollback to $TARGET_VERSION" || error "Failed to create rollback tag"

# Push to GitHub
log "Pushing rollback to GitHub..."
git push origin HEAD:main || error "Failed to push rollback"
git push origin "$ROLLBACK_TAG" || error "Failed to push rollback tag"

success "Rollback to $TARGET_VERSION completed successfully!"
log "GitHub Actions will now automatically rebuild and redeploy to Google Play Store"
log "Monitor the deployment at: https://github.com/puraestate/puraestate-app/actions"

info "Rollback details:"
info "  - Previous version: $CURRENT_TAG"
info "  - Rolled back to: $TARGET_VERSION"
info "  - Rollback tag: $ROLLBACK_TAG"
info "  - Check status: https://github.com/puraestate/puraestate-app/actions"

success "Full rollback log saved to: $ROLLBACK_LOG"

exit 0
