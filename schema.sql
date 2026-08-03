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
