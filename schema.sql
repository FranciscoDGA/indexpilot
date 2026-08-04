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
-- TRIGGERS FOR SPRINT 07 TABLES
-- ============================================

CREATE TRIGGER update_search_performance_updated_at
    BEFORE UPDATE ON search_performance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
