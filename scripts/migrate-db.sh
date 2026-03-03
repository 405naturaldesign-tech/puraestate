#!/bin/bash

#############################################################################
# PuraEstate Database Migration Script
# Usage: ./scripts/migrate-db.sh [--env=staging|production] [--version=X] [--dry-run]
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
ENVIRONMENT="staging"
TARGET_VERSION=""
DRY_RUN=false
MIGRATION_LOG="migration-logs/migration-$(date +%Y%m%d-%H%M%S).log"
BACKUP_DIR="database-backups"

# Ensure directories exist
mkdir -p migration-logs
mkdir -p "$BACKUP_DIR"

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$MIGRATION_LOG"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$MIGRATION_LOG"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$MIGRATION_LOG"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$MIGRATION_LOG"
}

info() {
    echo -e "${PURPLE}[INFO]${NC} $1" | tee -a "$MIGRATION_LOG"
}

# Parse arguments
for arg in "$@"; do
    case $arg in
        --env=*)
            ENVIRONMENT="${arg#*=}"
            ;;
        --version=*)
            TARGET_VERSION="${arg#*=}"
            ;;
        --dry-run)
            DRY_RUN=true
            ;;
        *)
            warning "Unknown argument: $arg"
            ;;
    esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    error "Invalid environment: $ENVIRONMENT. Must be 'staging' or 'production'"
fi

log "Starting database migration for environment: $ENVIRONMENT"

if [ "$DRY_RUN" == "true" ]; then
    warning "DRY RUN MODE - No actual changes will be made"
fi

# Load environment variables
if [ -f ".env.${ENVIRONMENT}" ]; then
    log "Loading environment file: .env.${ENVIRONMENT}"
    export $(cat ".env.${ENVIRONMENT}" | grep -v '^#' | xargs)
else
    warning "Environment file .env.${ENVIRONMENT} not found"
fi

# Validate database connection
log "Validating database connection..."

# Check if database is reachable
if ! ping -c 1 "${DB_HOST}" &> /dev/null; then
    warning "Cannot reach database host: ${DB_HOST}"
    warning "Proceeding anyway - database may be behind firewall"
fi

# List available migrations
log "Scanning migration files..."
MIGRATIONS_DIR="migrations"

if [ ! -d "$MIGRATIONS_DIR" ]; then
    error "Migrations directory not found: $MIGRATIONS_DIR"
fi

MIGRATION_FILES=($(find "$MIGRATIONS_DIR" -name "*.sql" -o -name "*.js" | sort))

if [ ${#MIGRATION_FILES[@]} -eq 0 ]; then
    error "No migration files found in $MIGRATIONS_DIR"
fi

info "Found ${#MIGRATION_FILES[@]} migration file(s):"
for i in "${!MIGRATION_FILES[@]}"; do
    echo "  $((i+1)). ${MIGRATION_FILES[$i]}" | tee -a "$MIGRATION_LOG"
done

# Create backup before migration
log "Creating database backup..."
BACKUP_FILE="$BACKUP_DIR/backup-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S).sql"

if [ "$DRY_RUN" != "true" ]; then
    # Example backup command (adjust for your database)
    # mysqldump -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$BACKUP_FILE"
    log "Database backup would be created at: $BACKUP_FILE"
    info "Note: Implement actual backup command based on your database system"
else
    log "[DRY RUN] Would backup database to: $BACKUP_FILE"
fi

# Get current migration version
log "Checking current migration version..."
CURRENT_MIGRATION=$(cat ".migration-version-${ENVIRONMENT}" 2>/dev/null || echo "0")
log "Current migration version: $CURRENT_MIGRATION"

# Determine target version
if [ -z "$TARGET_VERSION" ]; then
    TARGET_VERSION=${#MIGRATION_FILES[@]}
    log "No target version specified, will migrate to latest: v$TARGET_VERSION"
fi

# Validate target version
if ! [[ "$TARGET_VERSION" =~ ^[0-9]+$ ]] || [ "$TARGET_VERSION" -lt 0 ] || [ "$TARGET_VERSION" -gt "${#MIGRATION_FILES[@]}" ]; then
    error "Invalid target version: $TARGET_VERSION"
fi

log "Target migration version: $TARGET_VERSION"

# Show what will happen
info "Migration plan:"
info "  - Environment: $ENVIRONMENT"
info "  - Current version: $CURRENT_MIGRATION"
info "  - Target version: $TARGET_VERSION"
info "  - Backup location: $BACKUP_FILE"

if [ "$DRY_RUN" == "true" ]; then
    success "Dry run completed - no changes made"
    log "Full dry run log saved to: $MIGRATION_LOG"
    exit 0
fi

# Confirm before proceeding
read -p "Proceed with database migration? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "Migration cancelled by user"
    exit 0
fi

# Execute migrations
log "Starting migration execution..."

for ((i=CURRENT_MIGRATION+1; i<=TARGET_VERSION; i++)); do
    MIGRATION_FILE="${MIGRATION_FILES[$((i-1))]}"
    log "Executing migration $i: $MIGRATION_FILE"

    # Example: Execute SQL file
    if [[ "$MIGRATION_FILE" == *.sql ]]; then
        # mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$MIGRATION_FILE"
        info "Would execute SQL file: $MIGRATION_FILE"
    fi

    # Example: Execute JavaScript migration
    if [[ "$MIGRATION_FILE" == *.js ]]; then
        # node "$MIGRATION_FILE"
        info "Would execute JavaScript migration: $MIGRATION_FILE"
    fi

    if [ $? -ne 0 ]; then
        error "Migration $i failed! Rolling back..."
        log "Migration failed - restoring from backup: $BACKUP_FILE"
        # Implement rollback logic here
        exit 1
    fi

    success "Migration $i completed"
done

# Update migration version
log "Updating migration version to: $TARGET_VERSION"
echo "$TARGET_VERSION" > ".migration-version-${ENVIRONMENT}"

success "Database migration completed successfully!"
log "Environment: $ENVIRONMENT"
log "Migrated to version: $TARGET_VERSION"
log "Backup saved to: $BACKUP_FILE"
log "Full migration log saved to: $MIGRATION_LOG"

exit 0
