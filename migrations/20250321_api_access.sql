-- Create API keys table if it doesn't exist
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    key_value TEXT NOT NULL,
    name TEXT,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    scopes TEXT[] DEFAULT array['read']::TEXT[] NOT NULL,
    allowed_origins TEXT[] DEFAULT array['*']::TEXT[]
);

-- Add indexes for faster querying
CREATE INDEX IF NOT EXISTS api_keys_user_id_idx ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS api_keys_key_value_idx ON api_keys(key_value);

-- Create a function to create a new API key
CREATE OR REPLACE FUNCTION create_api_key(
    name TEXT DEFAULT 'Default API Key',
    scopes TEXT[] DEFAULT array['read']::TEXT[],
    expires_days INTEGER DEFAULT 365
)
RETURNS TEXT AS $$
DECLARE
    new_key TEXT;
    new_key_id UUID;
BEGIN
    -- Generate a random API key with a prefix
    new_key := 'lilyseo_' || encode(gen_random_bytes(24), 'hex');
    
    -- Insert the new key
    INSERT INTO api_keys (
        user_id,
        key_value,
        name,
        expires_at,
        scopes
    ) VALUES (
        auth.uid(),
        new_key,
        name,
        CASE WHEN expires_days > 0 THEN now() + (expires_days || ' days')::INTERVAL ELSE NULL END,
        scopes
    ) RETURNING id INTO new_key_id;
    
    -- Return the key value
    RETURN new_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to regenerate an API key
CREATE OR REPLACE FUNCTION regenerate_api_key(key_id UUID)
RETURNS TEXT AS $$
DECLARE
    new_key TEXT;
    user_owns_key BOOLEAN;
BEGIN
    -- Check if the user owns the key
    SELECT EXISTS (
        SELECT 1 FROM api_keys
        WHERE id = key_id AND user_id = auth.uid()
    ) INTO user_owns_key;
    
    IF NOT user_owns_key THEN
        RAISE EXCEPTION 'User does not own this API key';
    END IF;
    
    -- Generate a new random API key with a prefix
    new_key := 'lilyseo_' || encode(gen_random_bytes(24), 'hex');
    
    -- Update the key value and reset the updated_at timestamp
    UPDATE api_keys
    SET key_value = new_key,
        updated_at = now()
    WHERE id = key_id;
    
    -- Return the new key value
    RETURN new_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to revoke an API key
CREATE OR REPLACE FUNCTION revoke_api_key(key_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_owns_key BOOLEAN;
BEGIN
    -- Check if the user owns the key
    SELECT EXISTS (
        SELECT 1 FROM api_keys
        WHERE id = key_id AND user_id = auth.uid()
    ) INTO user_owns_key;
    
    IF NOT user_owns_key THEN
        RAISE EXCEPTION 'User does not own this API key';
    END IF;
    
    -- Update the key to set it as inactive
    UPDATE api_keys
    SET is_active = FALSE
    WHERE id = key_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to validate an API key
CREATE OR REPLACE FUNCTION validate_api_key(key_value TEXT, required_scope TEXT DEFAULT 'read')
RETURNS UUID AS $$
DECLARE
    key_user_id UUID;
BEGIN
    -- Get the user ID for the API key if it's valid
    SELECT user_id INTO key_user_id
    FROM api_keys
    WHERE key_value = validate_api_key.key_value
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > now())
    AND required_scope = ANY(scopes);
    
    -- Update the last used timestamp
    IF key_user_id IS NOT NULL THEN
        UPDATE api_keys
        SET last_used_at = now()
        WHERE key_value = validate_api_key.key_value;
    END IF;
    
    RETURN key_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create api_usage table to track API usage
CREATE TABLE IF NOT EXISTS api_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER,
    response_time INTEGER, -- in milliseconds
    ip_address TEXT,
    user_agent TEXT
);

-- Add indexes for faster querying
CREATE INDEX IF NOT EXISTS api_usage_user_id_idx ON api_usage(user_id);
CREATE INDEX IF NOT EXISTS api_usage_api_key_id_idx ON api_usage(api_key_id);
CREATE INDEX IF NOT EXISTS api_usage_created_at_idx ON api_usage(created_at);

-- Create a function to log API usage
CREATE OR REPLACE FUNCTION log_api_usage(
    api_key_id UUID,
    user_id UUID,
    endpoint TEXT,
    method TEXT,
    status_code INTEGER,
    response_time INTEGER,
    ip_address TEXT DEFAULT NULL,
    user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO api_usage (
        api_key_id,
        user_id,
        endpoint,
        method,
        status_code,
        response_time,
        ip_address,
        user_agent
    ) VALUES (
        api_key_id,
        user_id,
        endpoint,
        method,
        status_code,
        response_time,
        ip_address,
        user_agent
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create API rate limits table
CREATE TABLE IF NOT EXISTS api_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_tier TEXT NOT NULL,
    daily_limit INTEGER NOT NULL,
    monthly_limit INTEGER NOT NULL,
    UNIQUE(user_id)
);

-- Add default rate limits for each subscription tier
INSERT INTO api_rate_limits (user_id, subscription_tier, daily_limit, monthly_limit)
VALUES 
    ('00000000-0000-0000-0000-000000000000', 'free', 100, 1000),
    ('00000000-0000-0000-0000-000000000001', 'pro', 1000, 30000),
    ('00000000-0000-0000-0000-000000000002', 'enterprise', 5000, 150000)
ON CONFLICT DO NOTHING;

-- Create a function to check if a user has exceeded their API rate limit
CREATE OR REPLACE FUNCTION check_api_rate_limit(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_tier TEXT;
    daily_limit INTEGER;
    monthly_limit INTEGER;
    daily_usage INTEGER;
    monthly_usage INTEGER;
BEGIN
    -- Get user's subscription tier
    SELECT subscription_tier INTO user_tier
    FROM profiles
    WHERE id = check_api_rate_limit.user_id;
    
    -- Get rate limits for the user's tier
    SELECT arl.daily_limit, arl.monthly_limit 
    INTO daily_limit, monthly_limit
    FROM api_rate_limits arl
    WHERE subscription_tier = user_tier;
    
    -- Count API calls in the last 24 hours
    SELECT COUNT(*) INTO daily_usage
    FROM api_usage
    WHERE user_id = check_api_rate_limit.user_id
    AND created_at > now() - INTERVAL '24 hours';
    
    -- Count API calls in the current month
    SELECT COUNT(*) INTO monthly_usage
    FROM api_usage
    WHERE user_id = check_api_rate_limit.user_id
    AND created_at > date_trunc('month', now());
    
    -- Return true if user has not exceeded limits
    RETURN (daily_usage < daily_limit) AND (monthly_usage < monthly_limit);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set up RLS policies

-- Enable RLS on api_keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Users can only see their own API keys
CREATE POLICY "Users can view their own API keys" ON api_keys
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own API keys
CREATE POLICY "Users can create their own API keys" ON api_keys
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own API keys
CREATE POLICY "Users can update their own API keys" ON api_keys
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own API keys
CREATE POLICY "Users can delete their own API keys" ON api_keys
    FOR DELETE
    USING (auth.uid() = user_id);

-- Enable RLS on api_usage
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Users can only see their own API usage
CREATE POLICY "Users can view their own API usage" ON api_usage
    FOR SELECT
    USING (auth.uid() = user_id);

-- API logging function can insert usage records
CREATE POLICY "System can insert API usage logs" ON api_usage
    FOR INSERT
    WITH CHECK (TRUE);

-- Nobody can update or delete API usage records
CREATE POLICY "Nobody can update API usage logs" ON api_usage
    FOR UPDATE
    USING (FALSE);

CREATE POLICY "Nobody can delete API usage logs" ON api_usage
    FOR DELETE
    USING (FALSE);

-- Enable RLS on api_rate_limits
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only admins can manage rate limits
CREATE POLICY "Only admins can manage rate limits" ON api_rate_limits
    FOR ALL
    USING (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.role = 'admin'));

-- Users can see global tier rate limits and their own
CREATE POLICY "Users can view global tier rate limits" ON api_rate_limits
    FOR SELECT
    USING (user_id = auth.uid() OR user_id IN ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')); 