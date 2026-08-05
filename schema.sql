-- ============================================
-- IndexPilot Database Schema
-- Sprint 01 + Sprint 02
-- ============================================

-- ============================================
-- EXTENSION SETUP
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS TABLE (Extended from Auth)
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    language VARCHAR(10) DEFAULT 'pt-BR',
    timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    theme VARCHAR(10) DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SITES TABLE (Sprint 01)
-- ============================================

CREATE TABLE IF NOT EXISTS sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, domain)
);

CREATE INDEX idx_sites_user_id ON sites(user_id);
CREATE INDEX idx_sites_user_status ON sites(user_id, status);
CREATE INDEX idx_sites_created_at ON sites(user_id, created_at DESC);

-- ============================================
-- API_KEYS TABLE (Sprint 01)
-- ============================================

CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    key_type VARCHAR(10) DEFAULT 'live' CHECK (key_type IN ('live', 'test')),
    last_used_at TIMESTAMP WITH TIME ZONE,
    last_used_ip VARCHAR(45),
    active BOOLEAN DEFAULT TRUE,
    publications_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_api_keys_site_id ON api_keys(site_id);
CREATE INDEX idx_api_keys_site_active ON api_keys(site_id, active);
CREATE INDEX idx_api_keys_created_at ON api_keys(site_id, created_at DESC);

-- ============================================
-- PUBLICATION_QUEUE TABLE (Sprint 02)
-- ============================================

CREATE TABLE IF NOT EXISTS publication_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    url VARCHAR(2000) NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'article' CHECK (type IN ('article', 'page', 'product', 'other')),
    status VARCHAR(20) DEFAULT 'RECEIVED' CHECK (status IN ('RECEIVED', 'PROCESSING', 'INDEXED', 'ERROR')),
    next_step VARCHAR(50),
    priority INTEGER DEFAULT 0,
    error_message TEXT,
    last_error_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(site_id, url)
);

CREATE INDEX idx_publication_queue_site_id ON publication_queue(site_id);
CREATE INDEX idx_publication_queue_status ON publication_queue(site_id, status);
CREATE INDEX idx_publication_queue_created_at ON publication_queue(site_id, created_at DESC);
CREATE INDEX idx_publication_queue_status_global ON publication_queue(status, created_at DESC);

-- ============================================
-- PUBLICATION_LOGS TABLE (Sprint 02)
-- ============================================

CREATE TABLE IF NOT EXISTS publication_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    publication_id UUID NOT NULL REFERENCES publication_queue(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    level VARCHAR(20) DEFAULT 'info' CHECK (level IN ('info', 'warning', 'error', 'success')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_publication_logs_publication_id ON publication_logs(publication_id, created_at DESC);

-- ============================================
-- PUBLICATION_EVENTS TABLE (Sprint 02)
-- ============================================

CREATE TABLE IF NOT EXISTS publication_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    publication_id UUID NOT NULL REFERENCES publication_queue(id) ON DELETE CASCADE,
    event VARCHAR(100) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_publication_events_publication_id ON publication_events(publication_id, created_at ASC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE publication_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE publication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE publication_events ENABLE ROW LEVEL SECURITY;

-- Users: Users can only access their own record
CREATE POLICY "Users can access own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- Sites: Users can only access their own sites
CREATE POLICY "Users can view own sites"
    ON sites FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sites"
    ON sites FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sites"
    ON sites FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sites"
    ON sites FOR DELETE
    USING (auth.uid() = user_id);

-- API Keys: Users can only access keys for their sites
CREATE POLICY "Users can view own api keys"
    ON api_keys FOR SELECT
    USING (
        site_id IN (
            SELECT id FROM sites WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own api keys"
    ON api_keys FOR INSERT
    WITH CHECK (
        site_id IN (
            SELECT id FROM sites WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own api keys"
    ON api_keys FOR UPDATE
    USING (
        site_id IN (
            SELECT id FROM sites WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own api keys"
    ON api_keys FOR DELETE
    USING (
        site_id IN (
            SELECT id FROM sites WHERE user_id = auth.uid()
        )
    );

-- Publication Queue: Users can only access publications for their sites
CREATE POLICY "Users can view own publications"
    ON publication_queue FOR SELECT
    USING (
        site_id IN (
            SELECT id FROM sites WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own publications"
    ON publication_queue FOR INSERT
    WITH CHECK (
        site_id IN (
            SELECT id FROM sites WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own publications"
    ON publication_queue FOR UPDATE
    USING (
        site_id IN (
            SELECT id FROM sites WHERE user_id = auth.uid()
        )
    );

-- Publication Logs: Users can only access logs for their publications
CREATE POLICY "Users can view own publication logs"
    ON publication_logs FOR SELECT
    USING (
        publication_id IN (
            SELECT id FROM publication_queue
            WHERE site_id IN (
                SELECT id FROM sites WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert own publication logs"
    ON publication_logs FOR INSERT
    WITH CHECK (
        publication_id IN (
            SELECT id FROM publication_queue
            WHERE site_id IN (
                SELECT id FROM sites WHERE user_id = auth.uid()
            )
        )
    );

-- Publication Events: Users can only access events for their publications
CREATE POLICY "Users can view own publication events"
    ON publication_events FOR SELECT
    USING (
        publication_id IN (
            SELECT id FROM publication_queue
            WHERE site_id IN (
                SELECT id FROM sites WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert own publication events"
    ON publication_events FOR INSERT
    WITH CHECK (
        publication_id IN (
            SELECT id FROM publication_queue
            WHERE site_id IN (
                SELECT id FROM sites WHERE user_id = auth.uid()
            )
        )
    );

-- ============================================
-- API Key Auth Policy (for /api/publish)
-- ============================================

-- Allow publishing without auth.uid() for API Key authentication
CREATE POLICY "Allow api key based publication"
    ON publication_queue FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow api key based publication logging"
    ON publication_logs FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow api key based publication events"
    ON publication_events FOR INSERT
    WITH CHECK (true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for users
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for sites
CREATE TRIGGER update_sites_updated_at
    BEFORE UPDATE ON sites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for api_keys
CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for publication_queue
CREATE TRIGGER update_publication_queue_updated_at
    BEFORE UPDATE ON publication_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEO_AUDITS TABLE (Sprint 05)
-- ============================================

CREATE TABLE IF NOT EXISTS seo_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    publication_id UUID NOT NULL REFERENCES publication_queue(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    url VARCHAR(2000) NOT NULL,
    title VARCHAR(255),
    description TEXT,

    score INTEGER NOT NULL DEFAULT 0,
    grade VARCHAR(2) NOT NULL DEFAULT 'D' CHECK (grade IN ('A+', 'A', 'B', 'C', 'D')),

    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scanning', 'completed', 'error')),
    error_message TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scanned_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_seo_audits_publication_id ON seo_audits(publication_id);
CREATE INDEX idx_seo_audits_site_id ON seo_audits(site_id);
CREATE INDEX idx_seo_audits_user_id ON seo_audits(user_id);
CREATE INDEX idx_seo_audits_score ON seo_audits(site_id, score DESC);
CREATE INDEX idx_seo_audits_created_at ON seo_audits(site_id, created_at DESC);

-- ============================================
-- SEO_CHECKS TABLE (Sprint 05)
-- ============================================

CREATE TABLE IF NOT EXISTS seo_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES seo_audits(id) ON DELETE CASCADE,

    check_name VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PASS', 'WARNING', 'ERROR', 'INFO')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),

    message TEXT NOT NULL,
    recommendation TEXT,

    details JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_seo_checks_audit_id ON seo_checks(audit_id);
CREATE INDEX idx_seo_checks_status ON seo_checks(audit_id, status);
CREATE INDEX idx_seo_checks_severity ON seo_checks(audit_id, severity);

-- ============================================
-- SEO_AUDIT_HISTORY TABLE (Sprint 05)
-- ============================================

CREATE TABLE IF NOT EXISTS seo_audit_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    publication_id UUID NOT NULL REFERENCES publication_queue(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    score_at_date TIMESTAMP WITH TIME ZONE NOT NULL,
    score INTEGER NOT NULL,
    grade VARCHAR(2) NOT NULL CHECK (grade IN ('A+', 'A', 'B', 'C', 'D')),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_seo_audit_history_publication ON seo_audit_history(publication_id, created_at DESC);
CREATE INDEX idx_seo_audit_history_site ON seo_audit_history(site_id, created_at DESC);
CREATE INDEX idx_seo_audit_history_date ON seo_audit_history(score_at_date DESC);

-- ============================================
-- ENABLE RLS FOR SEO TABLES
-- ============================================

ALTER TABLE seo_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_audit_history ENABLE ROW LEVEL SECURITY;

-- SEO Audits: Users can only access audits for their sites
CREATE POLICY "Users can view own seo audits"
    ON seo_audits FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own seo audits"
    ON seo_audits FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own seo audits"
    ON seo_audits FOR UPDATE
    USING (auth.uid() = user_id);

-- SEO Checks: Users can only access checks for their audits
CREATE POLICY "Users can view own seo checks"
    ON seo_checks FOR SELECT
    USING (
        audit_id IN (
            SELECT id FROM seo_audits WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own seo checks"
    ON seo_checks FOR INSERT
    WITH CHECK (
        audit_id IN (
            SELECT id FROM seo_audits WHERE user_id = auth.uid()
        )
    );

-- SEO Audit History: Users can only access history for their audits
CREATE POLICY "Users can view own seo audit history"
    ON seo_audit_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own seo audit history"
    ON seo_audit_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TRIGGER FOR SEO_AUDITS
-- ============================================

CREATE TRIGGER update_seo_audits_updated_at
    BEFORE UPDATE ON seo_audits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEARCH_PERFORMANCE TABLE (Sprint 07)
-- ============================================

CREATE TABLE IF NOT EXISTS search_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    publication_id UUID NOT NULL REFERENCES publication_queue(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    date DATE NOT NULL,

    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    ctr DECIMAL(5, 2) DEFAULT 0,
    avg_position DECIMAL(5, 2) DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(publication_id, date)
);

CREATE INDEX idx_search_performance_publication_id ON search_performance(publication_id);
CREATE INDEX idx_search_performance_site_id ON search_performance(site_id);
CREATE INDEX idx_search_performance_date ON search_performance(site_id, date DESC);
CREATE INDEX idx_search_performance_created_at ON search_performance(publication_id, created_at DESC);

-- ============================================
-- KEYWORD_PERFORMANCE TABLE (Sprint 07)
-- ============================================

CREATE TABLE IF NOT EXISTS keyword_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    publication_id UUID NOT NULL REFERENCES publication_queue(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    keyword VARCHAR(500) NOT NULL,
    date DATE NOT NULL,

    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    ctr DECIMAL(5, 2) DEFAULT 0,
    position DECIMAL(5, 2) DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(publication_id, keyword, date)
);

CREATE INDEX idx_keyword_performance_publication_id ON keyword_performance(publication_id);
CREATE INDEX idx_keyword_performance_site_id ON keyword_performance(site_id);
CREATE INDEX idx_keyword_performance_keyword ON keyword_performance(site_id, keyword);
CREATE INDEX idx_keyword_performance_date ON keyword_performance(site_id, date DESC);

-- ============================================
-- PERFORMANCE_MILESTONES TABLE (Sprint 07)
-- ============================================

CREATE TABLE IF NOT EXISTS performance_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    publication_id UUID NOT NULL REFERENCES publication_queue(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    milestone_type VARCHAR(50) NOT NULL,
    milestone_date TIMESTAMP WITH TIME ZONE NOT NULL,

    keyword VARCHAR(500),
    previous_value DECIMAL(10, 2),
    new_value DECIMAL(10, 2),

    metadata JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_performance_milestones_publication_id ON performance_milestones(publication_id);
CREATE INDEX idx_performance_milestones_site_id ON performance_milestones(site_id);
CREATE INDEX idx_performance_milestones_type ON performance_milestones(site_id, milestone_type);
CREATE INDEX idx_performance_milestones_date ON performance_milestones(milestone_date DESC);

-- ============================================
-- GSC_IMPORTS TABLE (Sprint 07)
-- ============================================

CREATE TABLE IF NOT EXISTS gsc_imports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    import_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'error')),

    start_date DATE,
    end_date DATE,

    records_imported INTEGER DEFAULT 0,
    error_message TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_gsc_imports_site_id ON gsc_imports(site_id);
CREATE INDEX idx_gsc_imports_status ON gsc_imports(site_id, status);
CREATE INDEX idx_gsc_imports_created_at ON gsc_imports(site_id, created_at DESC);

-- ============================================
-- SPRINT 06: SITE DISCOVERY & SYNCHRONIZATION
-- ============================================

CREATE TABLE IF NOT EXISTS urls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    publication_id UUID REFERENCES publication_queue(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    url VARCHAR(2000) NOT NULL,
    slug VARCHAR(500),

    title VARCHAR(255),
    description TEXT,
    last_modified TIMESTAMP WITH TIME ZONE,

    source VARCHAR(20) NOT NULL CHECK (source IN ('sitemap', 'crawl', 'gsc', 'manual')),
    discovered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    http_status INTEGER,
    is_redirect BOOLEAN DEFAULT FALSE,
    redirect_to VARCHAR(2000),

    is_indexable BOOLEAN DEFAULT TRUE,
    is_indexed BOOLEAN DEFAULT FALSE,
    is_orphaned BOOLEAN DEFAULT FALSE,

    last_checked TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'error')),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(site_id, url)
);

CREATE INDEX idx_urls_site_id ON urls(site_id);
CREATE INDEX idx_urls_user_id ON urls(user_id);
CREATE INDEX idx_urls_indexed ON urls(site_id, is_indexed);
CREATE INDEX idx_urls_orphaned ON urls(site_id, is_orphaned);
CREATE INDEX idx_urls_status ON urls(site_id, sync_status);
CREATE INDEX idx_urls_created_at ON urls(site_id, created_at DESC);
CREATE INDEX idx_urls_last_checked ON urls(site_id, last_checked DESC);

CREATE TABLE IF NOT EXISTS url_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url_id UUID NOT NULL REFERENCES urls(id) ON DELETE CASCADE,

    og_title VARCHAR(255),
    og_description TEXT,
    og_image VARCHAR(2000),

    twitter_title VARCHAR(255),
    twitter_description TEXT,
    twitter_image VARCHAR(2000),

    canonical VARCHAR(2000),
    robots_index BOOLEAN,
    robots_follow BOOLEAN,

    viewport VARCHAR(255),
    mobile_friendly BOOLEAN,

    word_count INTEGER,
    headings_count INTEGER,

    external_links_count INTEGER,
    internal_links_count INTEGER,

    schema_types TEXT[],

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_url_metadata_url_id ON url_metadata(url_id);

CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    sync_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',

    urls_found INTEGER DEFAULT 0,
    urls_new INTEGER DEFAULT 0,
    urls_removed INTEGER DEFAULT 0,
    urls_updated INTEGER DEFAULT 0,

    error_message TEXT,

    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sync_logs_site_id ON sync_logs(site_id);
CREATE INDEX idx_sync_logs_status ON sync_logs(site_id, status);
CREATE INDEX idx_sync_logs_created_at ON sync_logs(site_id, created_at DESC);

-- ============================================
-- ENABLE RLS FOR SPRINT 06 TABLES
-- ============================================

ALTER TABLE urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE url_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- URLs: Users can only access URLs for their sites
CREATE POLICY "Users can view own urls"
    ON urls FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own urls"
    ON urls FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own urls"
    ON urls FOR UPDATE
    USING (auth.uid() = user_id);

-- URL Metadata: Users can access metadata for their URLs
CREATE POLICY "Users can view own url metadata"
    ON url_metadata FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM urls
        WHERE urls.id = url_metadata.url_id
        AND urls.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert own url metadata"
    ON url_metadata FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM urls
        WHERE urls.id = url_metadata.url_id
        AND urls.user_id = auth.uid()
    ));

-- Sync Logs: Users can only access logs for their sites
CREATE POLICY "Users can view own sync logs"
    ON sync_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync logs"
    ON sync_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- ENABLE RLS FOR SPRINT 07 TABLES
-- ============================================

ALTER TABLE search_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsc_imports ENABLE ROW LEVEL SECURITY;

-- Search Performance: Users can only access data for their sites
CREATE POLICY "Users can view own search performance"
    ON search_performance FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search performance"
    ON search_performance FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own search performance"
    ON search_performance FOR UPDATE
    USING (auth.uid() = user_id);

-- Keyword Performance: Users can only access keywords for their publications
CREATE POLICY "Users can view own keyword performance"
    ON keyword_performance FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own keyword performance"
    ON keyword_performance FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Performance Milestones: Users can only access milestones for their sites
CREATE POLICY "Users can view own performance milestones"
    ON performance_milestones FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own performance milestones"
    ON performance_milestones FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- GSC Imports: Users can only access imports for their sites
CREATE POLICY "Users can view own gsc imports"
    ON gsc_imports FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gsc imports"
    ON gsc_imports FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gsc imports"
    ON gsc_imports FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================
-- SPRINT 08: SEO INTELLIGENCE & RECOMMENDATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    publication_id UUID NOT NULL REFERENCES publication_queue(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),

    title TEXT NOT NULL,
    description TEXT NOT NULL,
    recommendation TEXT NOT NULL,

    estimated_impact VARCHAR(20) CHECK (estimated_impact IN ('VERY_HIGH', 'HIGH', 'MEDIUM', 'LOW')),
    estimated_effort VARCHAR(20) CHECK (estimated_effort IN ('5_MIN', '15_MIN', '30_MIN', '2_HOURS')),

    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'dismissed')),

    metrics JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    dismissed_reason TEXT
);

CREATE INDEX idx_insights_publication_id ON insights(publication_id);
CREATE INDEX idx_insights_priority ON insights(priority);
CREATE INDEX idx_insights_type ON insights(type);
CREATE INDEX idx_insights_status ON insights(status);
CREATE INDEX idx_insights_user_id ON insights(user_id);

CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    publication_id UUID NOT NULL REFERENCES publication_queue(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    category VARCHAR(50) NOT NULL,

    title TEXT NOT NULL,
    description TEXT,

    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    estimated_impact VARCHAR(20) CHECK (estimated_impact IN ('VERY_HIGH', 'HIGH', 'MEDIUM', 'LOW')),
    estimated_effort VARCHAR(20) CHECK (estimated_effort IN ('5_MIN', '15_MIN', '30_MIN', '2_HOURS')),

    action_items TEXT[],

    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dismissed')),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_recommendations_publication_id ON recommendations(publication_id);
CREATE INDEX idx_recommendations_score ON recommendations(score DESC);
CREATE INDEX idx_recommendations_status ON recommendations(status);
CREATE INDEX idx_recommendations_user_id ON recommendations(user_id);

CREATE TABLE IF NOT EXISTS actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    publication_id UUID NOT NULL REFERENCES publication_queue(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    insight_id UUID REFERENCES insights(id) ON DELETE SET NULL,
    recommendation_id UUID REFERENCES recommendations(id) ON DELETE SET NULL,

    action TEXT NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

CREATE INDEX idx_actions_publication_id ON actions(publication_id);
CREATE INDEX idx_actions_status ON actions(status);
CREATE INDEX idx_actions_user_id ON actions(user_id);

-- ============================================
-- ENABLE RLS FOR SPRINT 08 TABLES
-- ============================================

ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own insights"
    ON insights FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights"
    ON insights FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insights"
    ON insights FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own recommendations"
    ON recommendations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recommendations"
    ON recommendations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations"
    ON recommendations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own actions"
    ON actions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own actions"
    ON actions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own actions"
    ON actions FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS FOR SPRINT 07 TABLES
-- ============================================

CREATE TRIGGER update_search_performance_updated_at
    BEFORE UPDATE ON search_performance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SPRINT 11: CMS CONNECTORS & AUTO SYNC PLATFORM
-- ============================================

-- ============================================
-- CONNECTORS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS connectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    type VARCHAR(30) NOT NULL CHECK (type IN ('cms', 'headless_cms', 'framework', 'ssg', 'ecommerce', 'custom')),
    provider VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error', 'syncing')),

    config JSONB DEFAULT '{}',
    credentials_encrypted TEXT,
    version VARCHAR(20) DEFAULT '1.0.0',

    last_sync_at TIMESTAMP WITH TIME ZONE,
    last_error TEXT,
    sync_count INTEGER DEFAULT 0,
    event_count INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(site_id, provider, name)
);

CREATE INDEX idx_connectors_site_id ON connectors(site_id);
CREATE INDEX idx_connectors_user_id ON connectors(user_id);
CREATE INDEX idx_connectors_status ON connectors(site_id, status);
CREATE INDEX idx_connectors_provider ON connectors(site_id, provider);

-- ============================================
-- CONNECTOR_EVENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS connector_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connector_id UUID NOT NULL REFERENCES connectors(id) ON DELETE CASCADE,

    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('publish', 'update', 'delete', 'draft', 'scheduled', 'restore', 'deploy', 'push')),
    payload JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),

    source_url VARCHAR(2000),
    content_hash VARCHAR(64),
    impact_level VARCHAR(20) CHECK (impact_level IN ('critical', 'high', 'medium', 'low')),

    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0
);

CREATE INDEX idx_connector_events_connector_id ON connector_events(connector_id);
CREATE INDEX idx_connector_events_status ON connector_events(status);
CREATE INDEX idx_connector_events_type ON connector_events(event_type);
CREATE INDEX idx_connector_events_received_at ON connector_events(received_at DESC);

-- ============================================
-- SYNC_JOBS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS sync_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connector_id UUID NOT NULL REFERENCES connectors(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    trigger_type VARCHAR(30) DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'webhook', 'polling', 'scheduled', 'deploy', 'git')),

    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finished_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,

    items_processed INTEGER DEFAULT 0,
    items_created INTEGER DEFAULT 0,
    items_updated INTEGER DEFAULT 0,
    items_removed INTEGER DEFAULT 0,
    items_failed INTEGER DEFAULT 0,

    error_message TEXT,
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sync_jobs_connector_id ON sync_jobs(connector_id);
CREATE INDEX idx_sync_jobs_site_id ON sync_jobs(site_id);
CREATE INDEX idx_sync_jobs_status ON sync_jobs(status);
CREATE INDEX idx_sync_jobs_created_at ON sync_jobs(created_at DESC);

-- ============================================
-- CONTENT_VERSIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS content_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url_id UUID NOT NULL REFERENCES urls(id) ON DELETE CASCADE,
    connector_id UUID REFERENCES connectors(id) ON DELETE SET NULL,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    version INTEGER NOT NULL DEFAULT 1,
    content_hash VARCHAR(64) NOT NULL,

    title VARCHAR(255),
    content_snapshot JSONB DEFAULT '{}',

    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_content_versions_url_id ON content_versions(url_id);
CREATE INDEX idx_content_versions_connector_id ON content_versions(connector_id);
CREATE INDEX idx_content_versions_hash ON content_versions(content_hash);

-- ============================================
-- ENABLE RLS FOR SPRINT 11 TABLES
-- ============================================

ALTER TABLE connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE connector_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;

-- Connectors: Users can only access their own connectors
CREATE POLICY "Users can view own connectors"
    ON connectors FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connectors"
    ON connectors FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connectors"
    ON connectors FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own connectors"
    ON connectors FOR DELETE
    USING (auth.uid() = user_id);

-- Connector Events: Users can access events for their connectors
CREATE POLICY "Users can view own connector events"
    ON connector_events FOR SELECT
    USING (
        connector_id IN (
            SELECT id FROM connectors WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own connector events"
    ON connector_events FOR INSERT
    WITH CHECK (
        connector_id IN (
            SELECT id FROM connectors WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own connector events"
    ON connector_events FOR UPDATE
    USING (
        connector_id IN (
            SELECT id FROM connectors WHERE user_id = auth.uid()
        )
    );

-- Sync Jobs: Users can only access their own sync jobs
CREATE POLICY "Users can view own sync jobs"
    ON sync_jobs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync jobs"
    ON sync_jobs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sync jobs"
    ON sync_jobs FOR UPDATE
    USING (auth.uid() = user_id);

-- Content Versions: Users can only access their own content versions
CREATE POLICY "Users can view own content versions"
    ON content_versions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own content versions"
    ON content_versions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TRIGGERS FOR SPRINT 11 TABLES
-- ============================================

CREATE TRIGGER update_connectors_updated_at
    BEFORE UPDATE ON connectors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SPRINT 12: DEVELOPER PLATFORM TABLES
-- ============================================

-- API Clients (OAuth apps / API key holders)
CREATE TABLE IF NOT EXISTS api_clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    client_id VARCHAR(255) UNIQUE NOT NULL,
    client_secret_hash VARCHAR(512),
    redirect_uri TEXT,
    scopes TEXT[] DEFAULT ARRAY['read'],
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked')),
    rate_limit_tier VARCHAR(20) DEFAULT 'free' CHECK (rate_limit_tier IN ('free', 'starter', 'pro', 'enterprise')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Tokens (access tokens for API clients)
CREATE TABLE IF NOT EXISTS api_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES api_clients(id) ON DELETE CASCADE,
    token_hash VARCHAR(512) NOT NULL,
    token_prefix VARCHAR(10) NOT NULL,
    scopes TEXT[] DEFAULT ARRAY['read'],
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Request Logs
CREATE TABLE IF NOT EXISTS api_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES api_clients(id) ON DELETE SET NULL,
    endpoint VARCHAR(512) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER,
    latency_ms INTEGER,
    request_size_bytes INTEGER,
    response_size_bytes INTEGER,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook Subscriptions
CREATE TABLE IF NOT EXISTS webhook_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    secret VARCHAR(255) NOT NULL,
    events TEXT[] NOT NULL DEFAULT ARRAY['url.created'],
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'failed')),
    failure_count INTEGER DEFAULT 0,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook Deliveries
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES webhook_subscriptions(id) ON DELETE CASCADE,
    event VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed', 'retrying')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 5,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    response_status INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event Bus Events
CREATE TABLE IF NOT EXISTS platform_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE
);

-- Developer Applications (OAuth)
CREATE TABLE IF NOT EXISTS developer_apps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    app_id VARCHAR(255) UNIQUE NOT NULL,
    app_secret_hash VARCHAR(512),
    redirect_uris TEXT[] NOT NULL,
    scopes TEXT[] NOT NULL DEFAULT ARRAY['read:sites'],
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OAuth Authorization Codes
CREATE TABLE IF NOT EXISTS oauth_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_id UUID NOT NULL REFERENCES developer_apps(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(255) UNIQUE NOT NULL,
    redirect_uri TEXT NOT NULL,
    scopes TEXT[] NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OAuth Tokens
CREATE TABLE IF NOT EXISTS oauth_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_id UUID NOT NULL REFERENCES developer_apps(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    access_token_hash VARCHAR(512) NOT NULL,
    refresh_token_hash VARCHAR(512),
    token_type VARCHAR(20) DEFAULT 'Bearer',
    scopes TEXT[] NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR SPRINT 12
-- ============================================

CREATE INDEX IF NOT EXISTS idx_api_clients_workspace ON api_clients(workspace_id);
CREATE INDEX IF NOT EXISTS idx_api_clients_client_id ON api_clients(client_id);
CREATE INDEX IF NOT EXISTS idx_api_tokens_client ON api_tokens(client_id);
CREATE INDEX IF NOT EXISTS idx_api_tokens_hash ON api_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_api_requests_client ON api_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_api_requests_created ON api_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_workspace ON webhook_subscriptions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_subscription ON webhook_deliveries(subscription_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_platform_events_workspace ON platform_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_platform_events_type ON platform_events(event_type);
CREATE INDEX IF NOT EXISTS idx_platform_events_published ON platform_events(published_at);
CREATE INDEX IF NOT EXISTS idx_developer_apps_workspace ON developer_apps(workspace_id);
CREATE INDEX IF NOT EXISTS idx_developer_apps_app_id ON developer_apps(app_id);
CREATE INDEX IF NOT EXISTS idx_oauth_codes_code ON oauth_codes(code);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_hash ON oauth_tokens(access_token_hash);

-- ============================================
-- RLS POLICIES FOR SPRINT 12
-- ============================================

-- API Clients
CREATE POLICY "Users can view own api clients"
    ON api_clients FOR SELECT
    USING (workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own api clients"
    ON api_clients FOR ALL
    USING (workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

-- API Tokens
CREATE POLICY "Users can view own api tokens"
    ON api_tokens FOR SELECT
    USING (client_id IN (
        SELECT id FROM api_clients WHERE workspace_id IN (
            SELECT id FROM sites WHERE user_id = auth.uid()
        )
    ));

-- Webhook Subscriptions
CREATE POLICY "Users can view own webhook subscriptions"
    ON webhook_subscriptions FOR SELECT
    USING (workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own webhook subscriptions"
    ON webhook_subscriptions FOR ALL
    USING (workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

-- Webhook Deliveries
CREATE POLICY "Users can view own webhook deliveries"
    ON webhook_deliveries FOR SELECT
    USING (subscription_id IN (
        SELECT id FROM webhook_subscriptions WHERE workspace_id IN (
            SELECT id FROM sites WHERE user_id = auth.uid()
        )
    ));

-- Platform Events
CREATE POLICY "Users can view own platform events"
    ON platform_events FOR SELECT
    USING (workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

-- Developer Apps
CREATE POLICY "Users can view own developer apps"
    ON developer_apps FOR SELECT
    USING (workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own developer apps"
    ON developer_apps FOR ALL
    USING (workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

-- ============================================
-- TRIGGERS FOR SPRINT 12
-- ============================================

CREATE TRIGGER update_api_clients_updated_at
    BEFORE UPDATE ON api_clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhook_subscriptions_updated_at
    BEFORE UPDATE ON webhook_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_developer_apps_updated_at
    BEFORE UPDATE ON developer_apps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SPRINT 13: REAL-TIME MONITORING TABLES
-- ============================================

-- Monitoring Events (core event log)
CREATE TABLE IF NOT EXISTS monitoring_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) DEFAULT 'low' CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
    source VARCHAR(100) NOT NULL,
    payload JSONB DEFAULT '{}',
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Change History (field-level tracking)
CREATE TABLE IF NOT EXISTS change_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    url TEXT,
    field VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    change_type VARCHAR(20) DEFAULT 'modified' CHECK (change_type IN ('added', 'modified', 'removed')),
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Incidents
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
    source VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Monitoring Rules
CREATE TABLE IF NOT EXISTS monitoring_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_type VARCHAR(100) NOT NULL,
    trigger_config JSONB DEFAULT '{}',
    action_type VARCHAR(100) NOT NULL,
    action_config JSONB DEFAULT '{}',
    enabled BOOLEAN DEFAULT TRUE,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('email', 'slack', 'discord', 'telegram', 'webhook', 'push')),
    minimum_severity VARCHAR(20) DEFAULT 'medium' CHECK (minimum_severity IN ('critical', 'high', 'medium', 'low')),
    enabled BOOLEAN DEFAULT TRUE,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Monitoring Snapshots (point-in-time site state)
CREATE TABLE IF NOT EXISTS monitoring_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    content_hash VARCHAR(64),
    title TEXT,
    meta_description TEXT,
    canonical TEXT,
    robots TEXT,
    h1 TEXT,
    schema_type TEXT,
    internal_links_count INTEGER,
    external_links_count INTEGER,
    images_count INTEGER,
    word_count INTEGER,
    snapshot JSONB DEFAULT '{}',
    captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR SPRINT 13
-- ============================================

CREATE INDEX IF NOT EXISTS idx_monitoring_events_site ON monitoring_events(site_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_events_type ON monitoring_events(event_type);
CREATE INDEX IF NOT EXISTS idx_monitoring_events_severity ON monitoring_events(severity);
CREATE INDEX IF NOT EXISTS idx_monitoring_events_detected ON monitoring_events(detected_at);
CREATE INDEX IF NOT EXISTS idx_change_history_site ON change_history(site_id);
CREATE INDEX IF NOT EXISTS idx_change_history_url ON change_history(url);
CREATE INDEX IF NOT EXISTS idx_change_history_detected ON change_history(detected_at);
CREATE INDEX IF NOT EXISTS idx_incidents_site ON incidents(site_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_monitoring_rules_workspace ON monitoring_rules(workspace_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_snapshots_site ON monitoring_snapshots(site_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_snapshots_url ON monitoring_snapshots(url);
CREATE INDEX IF NOT EXISTS idx_monitoring_snapshots_captured ON monitoring_snapshots(captured_at);

-- ============================================
-- RLS POLICIES FOR SPRINT 13
-- ============================================

-- Monitoring Events
CREATE POLICY "Users can view own monitoring events"
    ON monitoring_events FOR SELECT
    USING (site_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

-- Change History
CREATE POLICY "Users can view own change history"
    ON change_history FOR SELECT
    USING (site_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

-- Incidents
CREATE POLICY "Users can view own incidents"
    ON incidents FOR SELECT
    USING (site_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own incidents"
    ON incidents FOR ALL
    USING (site_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

-- Monitoring Rules
CREATE POLICY "Users can view own monitoring rules"
    ON monitoring_rules FOR SELECT
    USING (workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own monitoring rules"
    ON monitoring_rules FOR ALL
    USING (workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

-- Notification Preferences
CREATE POLICY "Users can view own notification preferences"
    ON notification_preferences FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage own notification preferences"
    ON notification_preferences FOR ALL
    USING (user_id = auth.uid());

-- Monitoring Snapshots
CREATE POLICY "Users can view own monitoring snapshots"
    ON monitoring_snapshots FOR SELECT
    USING (site_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

-- ============================================
-- TRIGGERS FOR SPRINT 13
-- ============================================

CREATE TRIGGER update_monitoring_rules_updated_at
    BEFORE UPDATE ON monitoring_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SPRINT 14: COMPETITOR INTELLIGENCE & SEO OBSERVATORY
-- ============================================

-- ============================================
-- COMPETITORS
-- ============================================

CREATE TABLE IF NOT EXISTS competitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'direct' CHECK (category IN ('direct', 'indirect', 'reference')),
    country VARCHAR(10),
    language VARCHAR(10),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
    notes TEXT,
    last_crawled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- COMPETITOR CRAWLS
-- ============================================

CREATE TABLE IF NOT EXISTS competitor_crawls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finished_at TIMESTAMP WITH TIME ZONE,
    pages_found INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    error_message TEXT,
    metadata JSONB DEFAULT '{}'
);

-- ============================================
-- COMPETITOR PAGES
-- ============================================

CREATE TABLE IF NOT EXISTS competitor_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    crawl_id UUID REFERENCES competitor_crawls(id) ON DELETE SET NULL,
    url TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'page' CHECK (type IN ('page', 'article', 'category', 'product', 'landing', 'tool', 'other')),
    depth INTEGER DEFAULT 0,
    title TEXT,
    meta_description TEXT,
    canonical TEXT,
    schema_type TEXT,
    internal_links_count INTEGER DEFAULT 0,
    external_links_count INTEGER DEFAULT 0,
    images_count INTEGER DEFAULT 0,
    word_count INTEGER DEFAULT 0,
    has_faq BOOLEAN DEFAULT FALSE,
    has_howto BOOLEAN DEFAULT FALSE,
    has_breadcrumb BOOLEAN DEFAULT FALSE,
    status_code INTEGER,
    response_time_ms INTEGER,
    content_hash VARCHAR(64),
    first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- COMPETITOR CATEGORIES (site structure)
-- ============================================

CREATE TABLE IF NOT EXISTS competitor_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    url TEXT,
    parent_id UUID REFERENCES competitor_categories(id) ON DELETE SET NULL,
    pages_count INTEGER DEFAULT 0,
    depth INTEGER DEFAULT 0,
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- BENCHMARKS
-- ============================================

CREATE TABLE IF NOT EXISTS benchmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    metric VARCHAR(100) NOT NULL,
    my_value JSONB,
    competitor_value JSONB,
    category VARCHAR(50) DEFAULT 'technical' CHECK (category IN ('technical', 'content', 'authority', 'structure')),
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CONTENT GAPS
-- ============================================

CREATE TABLE IF NOT EXISTS content_gaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    topic VARCHAR(255) NOT NULL,
    description TEXT,
    competitor_id UUID REFERENCES competitors(id) ON DELETE SET NULL,
    competitor_urls TEXT[],
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    status VARCHAR(20) DEFAULT 'identified' CHECK (status IN ('identified', 'in_progress', 'completed', 'ignored')),
    estimated_potential TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- COMPETITOR CHANGES (change history)
-- ============================================

CREATE TABLE IF NOT EXISTS competitor_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    change_type VARCHAR(50) NOT NULL CHECK (change_type IN ('new_page', 'removed_page', 'updated_page', 'new_category', 'removed_category', 'structure_change', 'sitemap_change', 'robots_change', 'schema_change')),
    url TEXT,
    old_value TEXT,
    new_value TEXT,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- COMPETITIVE OPPORTUNITIES
-- ============================================

CREATE TABLE IF NOT EXISTS competitive_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('content_gap', 'technical_improvement', 'structure_change', 'new_topic', 'schema_adoption')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    competitor_id UUID REFERENCES competitors(id) ON DELETE SET NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    impact VARCHAR(20) DEFAULT 'medium' CHECK (impact IN ('high', 'medium', 'low')),
    effort VARCHAR(20) DEFAULT 'medium' CHECK (effort IN ('high', 'medium', 'low')),
    status VARCHAR(20) DEFAULT 'identified' CHECK (status IN ('identified', 'in_progress', 'completed', 'dismissed')),
    supporting_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- MARKET TIMELINE
-- ============================================

CREATE TABLE IF NOT EXISTS market_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR SPRINT 14
-- ============================================

CREATE INDEX IF NOT EXISTS idx_competitors_workspace ON competitors(workspace_id);
CREATE INDEX IF NOT EXISTS idx_competitors_domain ON competitors(domain);
CREATE INDEX IF NOT EXISTS idx_competitor_crawls_competitor ON competitor_crawls(competitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_crawls_status ON competitor_crawls(status);
CREATE INDEX IF NOT EXISTS idx_competitor_pages_competitor ON competitor_pages(competitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_pages_url ON competitor_pages(url);
CREATE INDEX IF NOT EXISTS idx_competitor_pages_type ON competitor_pages(type);
CREATE INDEX IF NOT EXISTS idx_competitor_categories_competitor ON competitor_categories(competitor_id);
CREATE INDEX IF NOT EXISTS idx_benchmarks_workspace ON benchmarks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_benchmarks_competitor ON benchmarks(competitor_id);
CREATE INDEX IF NOT EXISTS idx_benchmarks_metric ON benchmarks(metric);
CREATE INDEX IF NOT EXISTS idx_content_gaps_workspace ON content_gaps(workspace_id);
CREATE INDEX IF NOT EXISTS idx_content_gaps_priority ON content_gaps(priority);
CREATE INDEX IF NOT EXISTS idx_competitor_changes_competitor ON competitor_changes(competitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_changes_type ON competitor_changes(change_type);
CREATE INDEX IF NOT EXISTS idx_competitor_changes_detected ON competitor_changes(detected_at);
CREATE INDEX IF NOT EXISTS idx_competitive_opportunities_workspace ON competitive_opportunities(workspace_id);
CREATE INDEX IF NOT EXISTS idx_competitive_opportunities_type ON competitive_opportunities(type);
CREATE INDEX IF NOT EXISTS idx_competitive_opportunities_priority ON competitive_opportunities(priority);
CREATE INDEX IF NOT EXISTS idx_market_timeline_workspace ON market_timeline(workspace_id);
CREATE INDEX IF NOT EXISTS idx_market_timeline_competitor ON market_timeline(competitor_id);

-- ============================================
-- RLS POLICIES FOR SPRINT 14
-- ============================================

-- Competitors
CREATE POLICY "Users can view own competitors"
    ON competitors FOR SELECT
    USING (workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own competitors"
    ON competitors FOR ALL
    USING (workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

-- Competitor Crawls
CREATE POLICY "Users can view own competitor crawls"
    ON competitor_crawls FOR SELECT
    USING (competitor_id IN (SELECT id FROM competitors WHERE workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid())));

-- Competitor Pages
CREATE POLICY "Users can view own competitor pages"
    ON competitor_pages FOR SELECT
    USING (competitor_id IN (SELECT id FROM competitors WHERE workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid())));

-- Competitor Categories
CREATE POLICY "Users can view own competitor categories"
    ON competitor_categories FOR SELECT
    USING (competitor_id IN (SELECT id FROM competitors WHERE workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid())));

-- Benchmarks
CREATE POLICY "Users can view own benchmarks"
    ON benchmarks FOR SELECT
    USING (workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own benchmarks"
    ON benchmarks FOR ALL
    USING (workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

-- Content Gaps
CREATE POLICY "Users can view own content gaps"
    ON content_gaps FOR SELECT
    USING (workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own content gaps"
    ON content_gaps FOR ALL
    USING (workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

-- Competitor Changes
CREATE POLICY "Users can view own competitor changes"
    ON competitor_changes FOR SELECT
    USING (competitor_id IN (SELECT id FROM competitors WHERE workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid())));

-- Competitive Opportunities
CREATE POLICY "Users can view own competitive opportunities"
    ON competitive_opportunities FOR SELECT
    USING (workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own competitive opportunities"
    ON competitive_opportunities FOR ALL
    USING (workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

-- Market Timeline
CREATE POLICY "Users can view own market timeline"
    ON market_timeline FOR SELECT
    USING (workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

-- ============================================
-- TRIGGERS FOR SPRINT 14
-- ============================================

CREATE TRIGGER update_competitors_updated_at
    BEFORE UPDATE ON competitors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_gaps_updated_at
    BEFORE UPDATE ON content_gaps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitive_opportunities_updated_at
    BEFORE UPDATE ON competitive_opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SPRINT 15: CONTENT INTELLIGENCE & SEMANTIC SEO
-- ============================================

-- ============================================
-- CONTENT PROFILES (semantic analysis results)
-- ============================================

CREATE TABLE IF NOT EXISTS content_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    semantic_score INTEGER DEFAULT 0 CHECK (semantic_score >= 0 AND semantic_score <= 100),
    depth_score INTEGER DEFAULT 0 CHECK (depth_score >= 0 AND depth_score <= 100),
    freshness_score INTEGER DEFAULT 0 CHECK (freshness_score >= 0 AND freshness_score <= 100),
    intent VARCHAR(50) DEFAULT 'informational' CHECK (intent IN ('informational', 'navigational', 'commercial', 'transacional', 'local')),
    word_count INTEGER DEFAULT 0,
    headings_count INTEGER DEFAULT 0,
    entities_count INTEGER DEFAULT 0,
    topics_count INTEGER DEFAULT 0,
    has_faq BOOLEAN DEFAULT FALSE,
    has_howto BOOLEAN DEFAULT FALSE,
    internal_links INTEGER DEFAULT 0,
    external_links INTEGER DEFAULT 0,
    images_count INTEGER DEFAULT 0,
    last_analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workspace_id, url)
);

-- ============================================
-- ENTITIES (recognized entities)
-- ============================================

CREATE TABLE IF NOT EXISTS entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('person', 'organization', 'location', 'product', 'concept', 'technology', 'brand', 'event', 'other')),
    confidence NUMERIC(3,2) DEFAULT 0.5,
    occurrences INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workspace_id, name, type)
);

-- ============================================
-- CONTENT-ENTITY RELATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS content_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES content_profiles(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    relevance NUMERIC(3,2) DEFAULT 0.5,
    frequency INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(content_id, entity_id)
);

-- ============================================
-- TOPIC CLUSTERS
-- ============================================

CREATE TABLE IF NOT EXISTS topic_clusters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    pillar_url TEXT,
    pages_count INTEGER DEFAULT 0,
    avg_score INTEGER DEFAULT 0,
    coverage_percentage INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'needs_work', 'incomplete')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CLUSTER PAGES
-- ============================================

CREATE TABLE IF NOT EXISTS cluster_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cluster_id UUID NOT NULL REFERENCES topic_clusters(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES content_profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'satellite' CHECK (role IN ('pillar', 'satellite', 'supporting')),
    relevance_score INTEGER DEFAULT 0,
    internal_links_to_pillar INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cluster_id, content_id)
);

-- ============================================
-- CONTENT GAPS (semantic gaps - different from competitor gaps)
-- ============================================

CREATE TABLE IF NOT EXISTS semantic_gaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    topic VARCHAR(255) NOT NULL,
    description TEXT,
    related_cluster_id UUID REFERENCES topic_clusters(id) ON DELETE SET NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    status VARCHAR(20) DEFAULT 'identified' CHECK (status IN ('identified', 'in_progress', 'completed', 'ignored')),
    suggested_angle TEXT,
    estimated_impact TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CANNIBALIZATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS cannibalizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    url_a TEXT NOT NULL,
    url_b TEXT NOT NULL,
    keyword VARCHAR(255),
    overlap_score NUMERIC(3,2) DEFAULT 0.0,
    severity VARCHAR(20) DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high')),
    status VARCHAR(20) DEFAULT 'detected' CHECK (status IN ('detected', 'reviewing', 'resolved', 'ignored')),
    recommendation TEXT,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CONTENT TOPICS (topics extracted from content)
-- ============================================

CREATE TABLE IF NOT EXISTS content_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES content_profiles(id) ON DELETE CASCADE,
    topic VARCHAR(255) NOT NULL,
    relevance NUMERIC(3,2) DEFAULT 0.5,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- EDITORIAL PLANS
-- ============================================

CREATE TABLE IF NOT EXISTS editorial_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    items JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR SPRINT 15
-- ============================================

CREATE INDEX IF NOT EXISTS idx_content_profiles_workspace ON content_profiles(workspace_id);
CREATE INDEX IF NOT EXISTS idx_content_profiles_url ON content_profiles(url);
CREATE INDEX IF NOT EXISTS idx_content_profiles_intent ON content_profiles(intent);
CREATE INDEX IF NOT EXISTS idx_content_profiles_semantic ON content_profiles(semantic_score);
CREATE INDEX IF NOT EXISTS idx_entities_workspace ON entities(workspace_id);
CREATE INDEX IF NOT EXISTS idx_entities_name ON entities(name);
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type);
CREATE INDEX IF NOT EXISTS idx_content_entities_content ON content_entities(content_id);
CREATE INDEX IF NOT EXISTS idx_content_entities_entity ON content_entities(entity_id);
CREATE INDEX IF NOT EXISTS idx_topic_clusters_workspace ON topic_clusters(workspace_id);
CREATE INDEX IF NOT EXISTS idx_cluster_pages_cluster ON cluster_pages(cluster_id);
CREATE INDEX IF NOT EXISTS idx_cluster_pages_content ON cluster_pages(content_id);
CREATE INDEX IF NOT EXISTS idx_semantic_gaps_workspace ON semantic_gaps(workspace_id);
CREATE INDEX IF NOT EXISTS idx_semantic_gaps_priority ON semantic_gaps(priority);
CREATE INDEX IF NOT EXISTS idx_cannibalizations_workspace ON cannibalizations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_cannibalizations_severity ON cannibalizations(severity);
CREATE INDEX IF NOT EXISTS idx_content_topics_content ON content_topics(content_id);
CREATE INDEX IF NOT EXISTS idx_content_topics_topic ON content_topics(topic);
CREATE INDEX IF NOT EXISTS idx_editorial_plans_workspace ON editorial_plans(workspace_id);

-- ============================================
-- RLS POLICIES FOR SPRINT 15
-- ============================================

-- Content Profiles
CREATE POLICY "Users can view own content profiles"
    ON content_profiles FOR SELECT
    USING (workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own content profiles"
    ON content_profiles FOR ALL
    USING (workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

-- Entities
CREATE POLICY "Users can view own entities"
    ON entities FOR SELECT
    USING (workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own entities"
    ON entities FOR ALL
    USING (workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

-- Content Entities
CREATE POLICY "Users can view own content entities"
    ON content_entities FOR SELECT
    USING (content_id IN (SELECT id FROM content_profiles WHERE workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid())));

CREATE POLICY "Users can manage own content entities"
    ON content_entities FOR ALL
    USING (content_id IN (SELECT id FROM content_profiles WHERE workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid())));

-- Topic Clusters
CREATE POLICY "Users can view own topic clusters"
    ON topic_clusters FOR SELECT
    USING (workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own topic clusters"
    ON topic_clusters FOR ALL
    USING (workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

-- Cluster Pages
CREATE POLICY "Users can view own cluster pages"
    ON cluster_pages FOR SELECT
    USING (cluster_id IN (SELECT id FROM topic_clusters WHERE workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid())));

CREATE POLICY "Users can manage own cluster pages"
    ON cluster_pages FOR ALL
    USING (cluster_id IN (SELECT id FROM topic_clusters WHERE workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid())));

-- Semantic Gaps
CREATE POLICY "Users can view own semantic gaps"
    ON semantic_gaps FOR SELECT
    USING (workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own semantic gaps"
    ON semantic_gaps FOR ALL
    USING (workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

-- Cannibalizations
CREATE POLICY "Users can view own cannibalizations"
    ON cannibalizations FOR SELECT
    USING (workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own cannibalizations"
    ON cannibalizations FOR ALL
    USING (workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

-- Content Topics
CREATE POLICY "Users can view own content topics"
    ON content_topics FOR SELECT
    USING (content_id IN (SELECT id FROM content_profiles WHERE workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid())));

CREATE POLICY "Users can manage own content topics"
    ON content_topics FOR ALL
    USING (content_id IN (SELECT id FROM content_profiles WHERE workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid())));

-- Editorial Plans
CREATE POLICY "Users can view own editorial plans"
    ON editorial_plans FOR SELECT
    USING (workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own editorial plans"
    ON editorial_plans FOR ALL
    USING (workspace_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

-- ============================================
-- TRIGGERS FOR SPRINT 15
-- ============================================

CREATE TRIGGER update_content_profiles_updated_at
    BEFORE UPDATE ON content_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topic_clusters_updated_at
    BEFORE UPDATE ON topic_clusters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_semantic_gaps_updated_at
    BEFORE UPDATE ON semantic_gaps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_editorial_plans_updated_at
    BEFORE UPDATE ON editorial_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SPRINT 16: ENTERPRISE SECURITY, MULTI-TENANCY & WHITE LABEL
-- ============================================

-- ============================================
-- TENANTS (multi-tenant root)
-- ============================================

CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise', 'custom')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled', 'trial')),
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}',
    limits JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- WORKSPACES (tenant workspaces)
-- ============================================

CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, slug)
);

-- ============================================
-- ROLES (RBAC)
-- ============================================

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- ============================================
-- USER ROLES (role assignments)
-- ============================================

CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, role_id, workspace_id)
);

-- ============================================
-- AUDIT LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TENANT SETTINGS (branding, limits, features)
-- ============================================

CREATE TABLE IF NOT EXISTS tenant_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('branding', 'limits', 'security', 'features', 'notifications', 'integrations')),
    key VARCHAR(100) NOT NULL,
    value JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, category, key)
);

-- ============================================
-- SECRETS MANAGER
-- ============================================

CREATE TABLE IF NOT EXISTS secrets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    encrypted_value TEXT NOT NULL,
    description TEXT,
    last_rotated_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- ============================================
-- FEATURE FLAGS
-- ============================================

CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT FALSE,
    rollout_percentage INTEGER DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    target_plans TEXT[] DEFAULT '{}',
    target_tenants UUID[] DEFAULT '{}',
    target_users UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- WHITE LABEL CONFIGURATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS white_label_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    platform_name VARCHAR(255) DEFAULT 'IndexPilot',
    logo_url TEXT,
    favicon_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#3B82F6',
    secondary_color VARCHAR(7) DEFAULT '#10B981',
    accent_color VARCHAR(7) DEFAULT '#F59E0B',
    login_background_url TEXT,
    email_template_id VARCHAR(100),
    custom_domain VARCHAR(255),
    ssl_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id)
);

-- ============================================
-- DOMAIN MAPPINGS
-- ============================================

CREATE TABLE IF NOT EXISTS domain_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL,
    ssl_status VARCHAR(20) DEFAULT 'pending' CHECK (ssl_status IN ('pending', 'active', 'expired', 'failed')),
    ssl_expires_at TIMESTAMP WITH TIME ZONE,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(domain)
);

-- ============================================
-- SECURITY SESSIONS
-- ============================================

CREATE TABLE IF NOT EXISTS security_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB DEFAULT '{}',
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SECURITY ALERTS
-- ============================================

CREATE TABLE IF NOT EXISTS security_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('login_suspicious', 'password_changed', 'mfa_disabled', 'api_key_exposed', 'session_hijack', 'brute_force')),
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    details JSONB DEFAULT '{}',
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- COMPLIANCE EXPORTS
-- ============================================

CREATE TABLE IF NOT EXISTS compliance_exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    export_type VARCHAR(50) NOT NULL CHECK (export_type IN ('data_deletion', 'data_export', 'audit_trail', 'consent_report')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    file_url TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- INDEXES FOR SPRINT 16
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_plan ON tenants(plan);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_workspaces_tenant ON workspaces(tenant_id);
CREATE INDEX IF NOT EXISTS idx_roles_tenant ON roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_workspace ON user_roles(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_tenant_settings_tenant ON tenant_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_settings_category ON tenant_settings(category);
CREATE INDEX IF NOT EXISTS idx_secrets_tenant ON secrets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_feature_flags_tenant ON feature_flags(tenant_id);
CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON feature_flags(name);
CREATE INDEX IF NOT EXISTS idx_white_label_configs_tenant ON white_label_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_domain_mappings_domain ON domain_mappings(domain);
CREATE INDEX IF NOT EXISTS idx_domain_mappings_tenant ON domain_mappings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_sessions_user ON security_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_security_sessions_tenant ON security_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_tenant ON security_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_type ON security_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_compliance_exports_tenant ON compliance_exports(tenant_id);

-- ============================================
-- RLS POLICIES FOR SPRINT 16
-- ============================================

-- Tenants
CREATE POLICY "Users can view own tenant"
    ON tenants FOR SELECT
    USING (id IN (SELECT tenant_id FROM user_roles WHERE user_id = auth.uid()));

-- Workspaces
CREATE POLICY "Users can view own workspaces"
    ON workspaces FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM user_roles WHERE user_id = auth.uid()));

-- Roles
CREATE POLICY "Users can view own roles"
    ON roles FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM user_roles WHERE user_id = auth.uid()));

-- User Roles
CREATE POLICY "Users can view own user roles"
    ON user_roles FOR SELECT
    USING (user_id = auth.uid());

-- Audit Logs
CREATE POLICY "Users can view own tenant audit logs"
    ON audit_logs FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM user_roles WHERE user_id = auth.uid()));

-- Tenant Settings
CREATE POLICY "Users can view own tenant settings"
    ON tenant_settings FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM user_roles WHERE user_id = auth.uid()));

-- Secrets
CREATE POLICY "Users can view own tenant secrets"
    ON secrets FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM user_roles WHERE user_id = auth.uid()));

-- Feature Flags
CREATE POLICY "Users can view own tenant feature flags"
    ON feature_flags FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM user_roles WHERE user_id = auth.uid()));

-- White Label Configs
CREATE POLICY "Users can view own white label config"
    ON white_label_configs FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM user_roles WHERE user_id = auth.uid()));

-- Domain Mappings
CREATE POLICY "Users can view own domain mappings"
    ON domain_mappings FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM user_roles WHERE user_id = auth.uid()));

-- Security Sessions
CREATE POLICY "Users can view own security sessions"
    ON security_sessions FOR SELECT
    USING (user_id = auth.uid());

-- Security Alerts
CREATE POLICY "Users can view own security alerts"
    ON security_alerts FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM user_roles WHERE user_id = auth.uid()));

-- Compliance Exports
CREATE POLICY "Users can view own compliance exports"
    ON compliance_exports FOR SELECT
    USING (user_id = auth.uid());

-- ============================================
-- TRIGGERS FOR SPRINT 16
-- ============================================

CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at
    BEFORE UPDATE ON workspaces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_settings_updated_at
    BEFORE UPDATE ON tenant_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_secrets_updated_at
    BEFORE UPDATE ON secrets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at
    BEFORE UPDATE ON feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_white_label_configs_updated_at
    BEFORE UPDATE ON white_label_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
