-- ============================================================
-- PuraEstate Database Schema
-- Required tables for all n8n workflows
-- Run this on your PostgreSQL puraestate database
-- ============================================================

-- Core properties table
CREATE TABLE IF NOT EXISTS properties (
    id                  SERIAL PRIMARY KEY,
    listing_id          VARCHAR(255) UNIQUE NOT NULL,
    title               VARCHAR(500) NOT NULL,
    price               NUMERIC(15, 2) DEFAULT 0,
    price_currency      VARCHAR(10) DEFAULT 'ZAR',
    bedrooms            INTEGER DEFAULT 0,
    bathrooms           INTEGER DEFAULT 0,
    property_type       VARCHAR(50) DEFAULT 'unknown',
    suburb              VARCHAR(100),
    city                VARCHAR(100),
    province            VARCHAR(100),
    size_sqm            NUMERIC(10, 2) DEFAULT 0,
    url                 TEXT,
    source              VARCHAR(50),
    description         TEXT,
    agent_name          VARCHAR(100),
    agent_phone         VARCHAR(20),
    agent_email         VARCHAR(100),
    images              JSONB DEFAULT '[]',
    features            JSONB DEFAULT '{}',
    latitude            NUMERIC(10, 8),
    longitude           NUMERIC(11, 8),
    scraped_at          TIMESTAMPTZ,
    status              VARCHAR(20) DEFAULT 'active',
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_properties_province ON properties(province);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_created ON properties(created_at);
CREATE INDEX IF NOT EXISTS idx_properties_source ON properties(source);

-- Price history tracking
CREATE TABLE IF NOT EXISTS price_history (
    id              SERIAL PRIMARY KEY,
    property_id     INTEGER REFERENCES properties(id) ON DELETE CASCADE,
    price           NUMERIC(15, 2) NOT NULL,
    recorded_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_property ON price_history(property_id);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON price_history(recorded_at);

-- Trigger to record price history when price changes
CREATE OR REPLACE FUNCTION record_price_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.price IS DISTINCT FROM NEW.price THEN
        INSERT INTO price_history (property_id, price, recorded_at)
        VALUES (OLD.id, OLD.price, NOW());
    END IF;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_price_history ON properties;
CREATE TRIGGER trg_price_history
    BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION record_price_change();

-- Facebook group raw posts (for posts without clear price)
CREATE TABLE IF NOT EXISTS fb_group_raw_posts (
    id              SERIAL PRIMARY KEY,
    post_id         VARCHAR(255) UNIQUE NOT NULL,
    group_name      VARCHAR(255),
    author_name     VARCHAR(100),
    post_text       TEXT,
    post_url        TEXT,
    post_date       TIMESTAMPTZ,
    images          JSONB DEFAULT '[]',
    scraped_at      TIMESTAMPTZ DEFAULT NOW(),
    has_valid_price BOOLEAN DEFAULT false,
    reviewed        BOOLEAN DEFAULT false
);

-- Saved searches for alert subscriptions
CREATE TABLE IF NOT EXISTS saved_searches (
    id                      SERIAL PRIMARY KEY,
    user_email              VARCHAR(255) NOT NULL,
    user_name               VARCHAR(100),
    user_phone              VARCHAR(20),
    search_name             VARCHAR(100),
    min_price               NUMERIC(15, 2),
    max_price               NUMERIC(15, 2),
    min_bedrooms            INTEGER,
    max_bedrooms            INTEGER,
    province_filter         VARCHAR(100),
    city_filter             VARCHAR(100),
    property_type_filter    VARCHAR(50),
    notify_new_listings     BOOLEAN DEFAULT true,
    notify_price_drops      BOOLEAN DEFAULT true,
    notify_email            BOOLEAN DEFAULT true,
    notify_sms              BOOLEAN DEFAULT false,
    notify_whatsapp         BOOLEAN DEFAULT false,
    active                  BOOLEAN DEFAULT true,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    last_notified_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_email ON saved_searches(user_email);
CREATE INDEX IF NOT EXISTS idx_saved_searches_active ON saved_searches(active);

-- Email subscribers for campaigns
CREATE TABLE IF NOT EXISTS email_subscribers (
    id                          SERIAL PRIMARY KEY,
    email                       VARCHAR(255) UNIQUE NOT NULL,
    first_name                  VARCHAR(50),
    last_name                   VARCHAR(50),
    province_preference         VARCHAR(100),
    max_budget                  NUMERIC(15, 2),
    min_bedrooms                INTEGER,
    property_type_preference    VARCHAR(50),
    active                      BOOLEAN DEFAULT true,
    subscribed_at               TIMESTAMPTZ DEFAULT NOW(),
    unsubscribed_at             TIMESTAMPTZ,
    last_email_sent             TIMESTAMPTZ,
    emails_sent_count           INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_email_subscribers_active ON email_subscribers(active);

-- Leads / CRM
CREATE TABLE IF NOT EXISTS leads (
    id                  SERIAL PRIMARY KEY,
    first_name          VARCHAR(50) NOT NULL,
    last_name           VARCHAR(50),
    email               VARCHAR(255) NOT NULL,
    phone               VARCHAR(20),
    message             TEXT,
    property_id         VARCHAR(255),
    property_url        TEXT,
    property_title      VARCHAR(500),
    budget              NUMERIC(15, 2) DEFAULT 0,
    bedrooms            INTEGER DEFAULT 0,
    province            VARCHAR(100),
    city                VARCHAR(100),
    property_type       VARCHAR(50),
    timeline            VARCHAR(50),
    financing_type      VARCHAR(50),
    viewing_requested   BOOLEAN DEFAULT false,
    lead_score          INTEGER DEFAULT 0,
    lead_tier           VARCHAR(10) DEFAULT 'cold',
    score_breakdown     JSONB DEFAULT '{}',
    score_updated_at    TIMESTAMPTZ,
    source              VARCHAR(50),
    utm_medium          VARCHAR(50),
    utm_campaign        VARCHAR(100),
    ip_address          VARCHAR(45),
    agent_id            INTEGER,
    status              VARCHAR(20) DEFAULT 'new',
    submitted_at        TIMESTAMPTZ DEFAULT NOW(),
    assigned_at         TIMESTAMPTZ,
    last_contact_at     TIMESTAMPTZ,
    converted_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_agent ON leads(agent_id);
CREATE INDEX IF NOT EXISTS idx_leads_tier ON leads(lead_tier);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(lead_score);

-- Lead interaction tracking (for behavioral scoring)
CREATE TABLE IF NOT EXISTS lead_interactions (
    id                  SERIAL PRIMARY KEY,
    lead_id             INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    interaction_type    VARCHAR(50) NOT NULL,
    property_id         VARCHAR(255),
    details             JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_interactions_lead ON lead_interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_type ON lead_interactions(interaction_type);

-- Follow-up reminders
CREATE TABLE IF NOT EXISTS follow_up_reminders (
    id          SERIAL PRIMARY KEY,
    lead_id     INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    agent_id    INTEGER,
    reminder_type VARCHAR(50),
    due_date    DATE NOT NULL,
    note        TEXT,
    completed   BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    notified_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reminders_lead ON follow_up_reminders(lead_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due ON follow_up_reminders(due_date);
CREATE INDEX IF NOT EXISTS idx_reminders_completed ON follow_up_reminders(completed);

-- Agents
CREATE TABLE IF NOT EXISTS agents (
    id                          SERIAL PRIMARY KEY,
    name                        VARCHAR(100) NOT NULL,
    email                       VARCHAR(255) UNIQUE NOT NULL,
    phone                       VARCHAR(20),
    province_focus              VARCHAR(100),
    target_conversions_monthly  INTEGER DEFAULT 5,
    active                      BOOLEAN DEFAULT true,
    created_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- CRM sync log (track what's been pushed to Pipedrive etc.)
CREATE TABLE IF NOT EXISTS crm_sync_log (
    id              SERIAL PRIMARY KEY,
    property_id     INTEGER REFERENCES properties(id) ON DELETE CASCADE,
    crm             VARCHAR(50) NOT NULL,
    crm_record_id   VARCHAR(100),
    synced_at       TIMESTAMPTZ DEFAULT NOW(),
    status          VARCHAR(20) DEFAULT 'synced',
    UNIQUE(property_id, crm)
);

-- Notification log
CREATE TABLE IF NOT EXISTS notification_log (
    id                  SERIAL PRIMARY KEY,
    search_id           INTEGER,
    user_email          VARCHAR(255),
    notification_type   VARCHAR(50),
    matches_count       INTEGER DEFAULT 0,
    sent_at             TIMESTAMPTZ DEFAULT NOW()
);

-- Backup log
CREATE TABLE IF NOT EXISTS backup_log (
    id          SERIAL PRIMARY KEY,
    backup_type VARCHAR(50) NOT NULL,
    filename    VARCHAR(255),
    s3_key      TEXT,
    s3_bucket   VARCHAR(100),
    file_size   VARCHAR(20),
    status      VARCHAR(20),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Health checks log
CREATE TABLE IF NOT EXISTS health_checks (
    id              SERIAL PRIMARY KEY,
    service_name    VARCHAR(100) NOT NULL,
    service_url     TEXT,
    is_up           BOOLEAN NOT NULL,
    status_code     INTEGER,
    response_time   VARCHAR(50),
    error_message   TEXT,
    checked_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_checks_service ON health_checks(service_name);
CREATE INDEX IF NOT EXISTS idx_health_checks_time ON health_checks(checked_at);

-- Insert default admin agent
INSERT INTO agents (name, email, phone, province_focus, active)
VALUES ('Admin Agent', 'admin@puraestate.co.za', '+27000000000', null, true)
ON CONFLICT (email) DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO puraestate_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO puraestate_user;
