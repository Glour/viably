-- Viably Database Schema
-- PostgreSQL 15+
-- Created: February 4, 2026

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Authentication
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Profile
    full_name VARCHAR(255),
    avatar_url TEXT,
    
    -- Plan & Credits
    plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'business')),
    credits INTEGER DEFAULT 5 CHECK (credits >= 0),
    
    -- Referrals
    referral_code VARCHAR(8) UNIQUE NOT NULL,
    referred_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT email_lowercase CHECK (email = LOWER(email))
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_plan ON users(plan) WHERE is_active = true;
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- ============================================================================

-- Templates table
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Template info
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('telegram_bot', 'api_service', 'saas')),
    
    -- Pricing
    credit_cost INTEGER NOT NULL DEFAULT 0 CHECK (credit_cost >= 0),
    
    -- Configuration schema (JSON Schema format)
    config_schema JSONB NOT NULL DEFAULT '{}',
    
    -- Code template
    code_template JSONB DEFAULT '{}',
    prompt_template TEXT NOT NULL,
    
    -- Metadata
    preview_image_url TEXT,
    features TEXT[] DEFAULT ARRAY[]::TEXT[],
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Stats
    usage_count INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Ordering
    sort_order INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_config_schema CHECK (jsonb_typeof(config_schema) = 'object')
);

-- Indexes for templates
CREATE INDEX idx_templates_category ON templates(category) WHERE is_active = true;
CREATE INDEX idx_templates_slug ON templates(slug);
CREATE INDEX idx_templates_active_sorted ON templates(is_active, sort_order) WHERE is_active = true;
CREATE INDEX idx_templates_usage ON templates(usage_count DESC);

-- ============================================================================

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Project info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
    
    -- Configuration (user inputs for template)
    config JSONB NOT NULL DEFAULT '{}',
    
    -- Generated code (file structure)
    generated_code JSONB,  -- {files: {path: content}}
    
    -- Generation metadata
    generation_logs TEXT,
    ai_model_used VARCHAR(50),  -- 'claude-sonnet-4', 'claude-haiku'
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft' CHECK (
        status IN ('draft', 'generating', 'ready', 'deploying', 'deployed', 'error')
    ),
    error_message TEXT,
    
    -- Deployment
    deployed_url TEXT,
    deploy_platform VARCHAR(50),  -- 'docker', 'website', etc
    
    -- Visibility
    is_public BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    generated_at TIMESTAMP,
    deployed_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_config CHECK (jsonb_typeof(config) = 'object')
);

-- Indexes for projects
CREATE INDEX idx_projects_user_id ON projects(user_id, created_at DESC);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_template_id ON projects(template_id) WHERE template_id IS NOT NULL;
CREATE INDEX idx_projects_public ON projects(is_public) WHERE is_public = true;

-- ============================================================================

-- Credit transactions table
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Transaction details
    amount INTEGER NOT NULL,  -- Positive = credit, negative = debit
    balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
    
    -- Type
    transaction_type VARCHAR(50) NOT NULL CHECK (
        transaction_type IN (
            'signup',
            'daily_bonus',
            'referral_bonus',
            'purchase',
            'refund',
            'generation',
            'rollover',
            'admin_adjustment'
        )
    ),
    
    -- References
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    related_user_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- For referrals
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    description TEXT,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for credit_transactions
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id, created_at DESC);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- ============================================================================

-- Deployments table
CREATE TABLE deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Deployment platform
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('docker', 'website')),
    external_id VARCHAR(255),  -- Platform-specific deployment ID
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (
        status IN ('pending', 'building', 'deploying', 'active', 'failed', 'stopped')
    ),
    
    -- URLs
    url TEXT,
    build_url TEXT,
    admin_url TEXT,
    
    -- Logs
    logs TEXT,
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deployed_at TIMESTAMP,
    last_health_check TIMESTAMP,
    
    -- Platform-specific data
    platform_data JSONB DEFAULT '{}',
    
    -- Resources
    memory_mb INTEGER,
    cpu_cores DECIMAL(3,2)
);

-- Indexes for deployments
CREATE INDEX idx_deployments_project_id ON deployments(project_id, created_at DESC);
CREATE INDEX idx_deployments_status ON deployments(status);
CREATE INDEX idx_deployments_platform ON deployments(platform, status);

-- ============================================================================
-- HELPER TABLES
-- ============================================================================

-- Daily bonus tracking
CREATE TABLE daily_bonuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Bonus details
    credits_awarded INTEGER NOT NULL,
    bonus_date DATE NOT NULL,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Unique constraint: one bonus per user per day
    CONSTRAINT unique_daily_bonus UNIQUE (user_id, bonus_date)
);

CREATE INDEX idx_daily_bonuses_user_date ON daily_bonuses(user_id, bonus_date DESC);

-- ============================================================================

-- API keys (for future API access feature)
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Key details
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    key_prefix VARCHAR(10) NOT NULL,  -- First few chars for display
    name VARCHAR(255) NOT NULL,
    
    -- Permissions
    scopes TEXT[] DEFAULT ARRAY['read']::TEXT[],
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Usage
    last_used_at TIMESTAMP,
    usage_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP  -- NULL = never expires
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id) WHERE is_active = true;
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deployments_updated_at BEFORE UPDATE ON deployments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================

-- Function to deduct credits
CREATE OR REPLACE FUNCTION deduct_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_transaction_type VARCHAR,
    p_project_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_current_credits INTEGER;
    v_new_balance INTEGER;
BEGIN
    -- Get current credits with row lock
    SELECT credits INTO v_current_credits
    FROM users
    WHERE id = p_user_id
    FOR UPDATE;
    
    -- Check if user has enough credits
    IF v_current_credits < p_amount THEN
        RETURN FALSE;
    END IF;
    
    -- Calculate new balance
    v_new_balance := v_current_credits - p_amount;
    
    -- Update user credits
    UPDATE users
    SET credits = v_new_balance
    WHERE id = p_user_id;
    
    -- Record transaction
    INSERT INTO credit_transactions (
        user_id,
        amount,
        balance_after,
        transaction_type,
        project_id,
        description
    ) VALUES (
        p_user_id,
        -p_amount,
        v_new_balance,
        p_transaction_type,
        p_project_id,
        p_description
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================

-- Function to add credits
CREATE OR REPLACE FUNCTION add_credits(
    p_user_id UUID,
    p_amount INTEGER,
    p_transaction_type VARCHAR,
    p_related_user_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_new_balance INTEGER;
BEGIN
    -- Update user credits
    UPDATE users
    SET credits = credits + p_amount
    WHERE id = p_user_id
    RETURNING credits INTO v_new_balance;
    
    -- Record transaction
    INSERT INTO credit_transactions (
        user_id,
        amount,
        balance_after,
        transaction_type,
        related_user_id,
        description
    ) VALUES (
        p_user_id,
        p_amount,
        v_new_balance,
        p_transaction_type,
        p_related_user_id,
        p_description
    );
    
    RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEED DATA (for development)
-- ============================================================================

-- Insert default templates (will be created via admin panel in production)
INSERT INTO templates (name, slug, description, category, credit_cost, config_schema, prompt_template, features, tags, sort_order, is_active) VALUES
(
    'FAQ Bot',
    'faq-bot',
    'Simple Q&A bot with inline buttons',
    'telegram_bot',
    3,
    '{"type": "object", "properties": {"bot_name": {"type": "string"}, "faq_items": {"type": "array"}}}',
    'Create a Telegram FAQ bot with these Q&A pairs: {{faq_items}}',
    ARRAY['Inline keyboard', 'Quick answers', 'Easy setup'],
    ARRAY['telegram', 'simple', 'faq'],
    1,
    true
),
(
    'Shop Bot',
    'shop-bot',
    'E-commerce bot with catalog and cart',
    'telegram_bot',
    5,
    '{"type": "object", "properties": {"shop_name": {"type": "string"}, "products": {"type": "array"}, "payment_provider": {"type": "string"}}}',
    'Create a Telegram shop bot for {{shop_name}} with products: {{products}}',
    ARRAY['Product catalog', 'Shopping cart', 'Payment integration'],
    ARRAY['telegram', 'ecommerce', 'shop'],
    2,
    true
);

-- ============================================================================
-- VIEWS (for analytics/reporting)
-- ============================================================================

-- User statistics view
CREATE VIEW user_stats AS
SELECT 
    u.id,
    u.email,
    u.plan,
    u.credits,
    COUNT(DISTINCT p.id) as total_projects,
    COUNT(DISTINCT CASE WHEN p.status = 'deployed' THEN p.id END) as deployed_projects,
    SUM(CASE WHEN ct.amount < 0 THEN ABS(ct.amount) ELSE 0 END) as total_credits_spent,
    u.created_at,
    u.last_login_at
FROM users u
LEFT JOIN projects p ON p.user_id = u.id
LEFT JOIN credit_transactions ct ON ct.user_id = u.id
GROUP BY u.id;

-- Template usage statistics
CREATE VIEW template_stats AS
SELECT 
    t.id,
    t.name,
    t.category,
    t.credit_cost,
    COUNT(p.id) as total_uses,
    COUNT(CASE WHEN p.status = 'deployed' THEN p.id END) as successful_deployments,
    t.created_at
FROM templates t
LEFT JOIN projects p ON p.template_id = t.id
WHERE t.is_active = true
GROUP BY t.id;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'Platform users with authentication and subscription info';
COMMENT ON TABLE templates IS 'Available project templates (bots, APIs, etc)';
COMMENT ON TABLE projects IS 'User-created projects';
COMMENT ON TABLE credit_transactions IS 'Credit purchase and usage history';
COMMENT ON TABLE deployments IS 'Deployment records for projects';
COMMENT ON TABLE daily_bonuses IS 'Daily credit bonus tracking';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
