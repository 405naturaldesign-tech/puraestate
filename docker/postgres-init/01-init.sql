-- =============================================================================
-- PuraEstate – PostgreSQL Initialization Script
-- =============================================================================
-- This script runs ONCE when the postgres container is first created.
-- Subsequent startups skip this file.
--
-- Executed as the POSTGRES_USER (superuser) inside the POSTGRES_DB database.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";         -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pg_trgm";           -- Trigram similarity search
CREATE EXTENSION IF NOT EXISTS "unaccent";          -- Accent-insensitive search
CREATE EXTENSION IF NOT EXISTS "btree_gin";         -- GIN index support for B-tree ops
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- Query performance stats

-- ---------------------------------------------------------------------------
-- Schemas
-- ---------------------------------------------------------------------------
-- All application tables live in the public schema (SQLAlchemy default).
-- A separate schema for n8n if it shares the same PostgreSQL instance.
CREATE SCHEMA IF NOT EXISTS n8n AUTHORIZATION current_user;

-- ---------------------------------------------------------------------------
-- Roles & least-privilege access
-- ---------------------------------------------------------------------------
-- Application user (used by Flask and Celery)
-- Password is managed via POSTGRES_PASSWORD env var in docker-compose.
-- We only grant what is needed.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_roles WHERE rolname = 'puraestate_app'
    ) THEN
        -- The main POSTGRES_USER already has the same name; skip creation
        -- if they are the same. Adjust role name if you use a separate app user.
        NULL;
    END IF;
END
$$;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO current_user;
GRANT CREATE ON SCHEMA public TO current_user;

-- ---------------------------------------------------------------------------
-- Default privileges (for future tables created by Alembic)
-- ---------------------------------------------------------------------------
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO current_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO current_user;

-- ---------------------------------------------------------------------------
-- Text search configuration (Spanish + English for Costa Rica market)
-- ---------------------------------------------------------------------------
CREATE TEXT SEARCH CONFIGURATION IF NOT EXISTS puraestate_search (
    COPY = spanish
);

ALTER TEXT SEARCH CONFIGURATION puraestate_search
    ALTER MAPPING FOR hword, hword_part, word
    WITH unaccent, spanish_stem;

-- ---------------------------------------------------------------------------
-- Performance settings (per-database level overrides)
-- ---------------------------------------------------------------------------
ALTER DATABASE puraestate_prod SET default_text_search_config = 'pg_catalog.spanish';
ALTER DATABASE puraestate_prod SET timezone = 'America/Costa_Rica';
ALTER DATABASE puraestate_prod SET statement_timeout = '30s';
ALTER DATABASE puraestate_prod SET idle_in_transaction_session_timeout = '60s';
ALTER DATABASE puraestate_prod SET lock_timeout = '10s';

-- ---------------------------------------------------------------------------
-- Logging
-- ---------------------------------------------------------------------------
\echo 'PuraEstate database initialization complete.'
