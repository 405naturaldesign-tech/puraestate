#!/bin/bash

#############################################################################
# PuraEstate Local Build Script
# Usage: ./scripts/build.sh [dev|staging|production]
#############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROFILE="${1:-staging}"
BUILD_LOG="build-logs/build-$(date +%Y%m%d-%H%M%S).log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Ensure build-logs directory exists
mkdir -p build-logs

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$BUILD_LOG"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$BUILD_LOG"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$BUILD_LOG"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$BUILD_LOG"
}

# Validate profile
if [[ ! "$PROFILE" =~ ^(dev|staging|production)$ ]]; then
    error "Invalid profile: $PROFILE. Must be 'dev', 'staging', or 'production'"
fi

log "Starting PuraEstate build for profile: $PROFILE"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    error "Node.js is not installed"
fi

log "Node version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    error "npm is not installed"
fi

log "npm version: $(npm --version)"

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    warning "EAS CLI not found. Installing..."
    npm install -g eas-cli
fi

log "EAS CLI version: $(eas --version)"

# Load environment variables
if [ -f ".env.${PROFILE}" ]; then
    log "Loading environment file: .env.${PROFILE}"
    export $(cat ".env.${PROFILE}" | grep -v '^#' | xargs)
else
    warning "Environment file .env.${PROFILE} not found. Using defaults."
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    log "Installing dependencies..."
    npm ci || error "Failed to install dependencies"
    success "Dependencies installed"
else
    log "Dependencies already installed, skipping npm ci"
fi

# Run linting
log "Running linting checks..."
npm run lint || warning "Linting found issues (non-fatal)"

# Run tests for dev profile
if [ "$PROFILE" == "dev" ]; then
    log "Running tests for development profile..."
    npm run test -- --passWithNoTests || warning "Tests had issues"
fi

# Build TypeScript
log "Building TypeScript..."
npm run build || error "TypeScript build failed"

# Build with EAS
log "Building with EAS for profile: $PROFILE"

case "$PROFILE" in
    dev)
        log "Building development client..."
        eas build --platform all --profile development --local
        ;;
    staging)
        log "Building staging APK..."
        eas build --platform android --profile staging --local
        log "Building staging iOS..."
        eas build --platform ios --profile staging --local
        ;;
    production)
        log "Building production AAB and IPA..."
        eas build --platform android --profile production --local
        eas build --platform ios --profile production --local
        ;;
esac

success "Build completed for profile: $PROFILE"
log "Build artifacts available in dist/ directory"
log "Full build log saved to: $BUILD_LOG"

exit 0
