#!/bin/bash

#############################################################################
# PuraEstate Release Script
# Usage: ./scripts/release.sh [major|minor|patch] [--dry-run]
#############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BUMP_TYPE="${1:-patch}"
DRY_RUN="${2:---dry-run}"
RELEASE_LOG="release-logs/release-$(date +%Y%m%d-%H%M%S).log"

# Ensure release-logs directory exists
mkdir -p release-logs

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$RELEASE_LOG"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$RELEASE_LOG"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$RELEASE_LOG"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$RELEASE_LOG"
}

# Validate bump type
if [[ ! "$BUMP_TYPE" =~ ^(major|minor|patch)$ ]]; then
    error "Invalid bump type: $BUMP_TYPE. Must be 'major', 'minor', or 'patch'"
fi

log "Starting release process with bump type: $BUMP_TYPE"

# Check if git is installed
if ! command -v git &> /dev/null; then
    error "git is not installed"
fi

# Check git status
if [ -n "$(git status --porcelain)" ]; then
    error "Working directory is not clean. Please commit or stash changes."
fi

log "Verifying we're on main branch..."
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    error "Must be on 'main' branch to release. Currently on: $CURRENT_BRANCH"
fi

# Fetch latest changes
log "Fetching latest changes from remote..."
git fetch origin main || warning "Failed to fetch from origin"

# Check if we're up to date
if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
    warning "Local branch is behind origin/main. Consider pulling latest changes."
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
log "Current version: $CURRENT_VERSION"

# Parse version
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# Calculate new version
case "$BUMP_TYPE" in
    major)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    patch)
        PATCH=$((PATCH + 1))
        ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"
log "New version: $NEW_VERSION"

# Show what will happen
log "Changes to be made:"
log "  - Update package.json version to: $NEW_VERSION"
log "  - Create git tag: v$NEW_VERSION"
log "  - Generate changelog"
log "  - Push to GitHub (triggers CI/CD deployment)"

if [ "$DRY_RUN" == "--dry-run" ]; then
    log "DRY RUN MODE - No changes will be made"
    success "Dry run completed successfully"
    exit 0
fi

# Confirm before proceeding
read -p "Proceed with release v$NEW_VERSION? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "Release cancelled by user"
    exit 0
fi

# Update package.json
log "Updating package.json..."
npm version "$NEW_VERSION" --no-git-tag-version || error "Failed to update package.json"

# Run tests before release
log "Running tests before release..."
npm run test -- --passWithNoTests || error "Tests failed - aborting release"

# Build to ensure everything compiles
log "Building application..."
npm run build || error "Build failed - aborting release"

# Generate changelog
log "Generating changelog..."
CHANGELOG_FILE="CHANGELOG.md"

# Create changelog entry
CHANGELOG_ENTRY=$(cat <<EOF
## [${NEW_VERSION}] - $(date +%Y-%m-%d)

### Added
- New features

### Changed
- Updates and improvements

### Fixed
- Bug fixes

### Security
- Security improvements

---

EOF
)

if [ -f "$CHANGELOG_FILE" ]; then
    # Prepend to existing changelog
    echo "$CHANGELOG_ENTRY" | cat - "$CHANGELOG_FILE" > "$CHANGELOG_FILE.tmp" && mv "$CHANGELOG_FILE.tmp" "$CHANGELOG_FILE"
else
    # Create new changelog
    echo "$CHANGELOG_ENTRY" > "$CHANGELOG_FILE"
fi

log "Changelog updated: $CHANGELOG_FILE"

# Commit changes
log "Committing version bump..."
git add package.json "$CHANGELOG_FILE" || error "Failed to stage files"
git commit -m "chore: release v$NEW_VERSION" || error "Failed to commit version bump"

# Create git tag
log "Creating git tag: v$NEW_VERSION"
git tag -a "v$NEW_VERSION" -m "Release version $NEW_VERSION" || error "Failed to create git tag"

# Push to GitHub
log "Pushing to GitHub..."
git push origin main || error "Failed to push main branch"
git push origin "v$NEW_VERSION" || error "Failed to push tag"

success "Release v$NEW_VERSION completed successfully!"
log "GitHub Actions will now automatically build and deploy to Google Play Store"
log "Monitor the deployment at: https://github.com/puraestate/puraestate-app/actions"

success "Full release log saved to: $RELEASE_LOG"

exit 0
