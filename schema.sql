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
