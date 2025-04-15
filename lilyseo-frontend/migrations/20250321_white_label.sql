-- Create white_label_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS white_label_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    company_name TEXT,
    logo_url TEXT,
    favicon_url TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    accent_color TEXT,
    custom_domain TEXT,
    custom_domain_verified BOOLEAN DEFAULT FALSE,
    email_template_header TEXT,
    email_template_footer TEXT,
    navigation_items JSONB,
    footer_navigation JSONB,
    social_links JSONB,
    pdf_defaults JSONB,
    UNIQUE(user_id)
);

-- Add index for faster querying
CREATE INDEX IF NOT EXISTS white_label_settings_user_id_idx ON white_label_settings(user_id);

-- Create a function to update the updated_at timestamp whenever white label settings are modified
CREATE OR REPLACE FUNCTION update_white_label_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on white_label_settings
DROP TRIGGER IF EXISTS update_white_label_settings_timestamp ON white_label_settings;
CREATE TRIGGER update_white_label_settings_timestamp
BEFORE UPDATE ON white_label_settings
FOR EACH ROW
EXECUTE FUNCTION update_white_label_settings_updated_at();

-- Create a function to verify a custom domain
CREATE OR REPLACE FUNCTION verify_custom_domain(domain TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- This is a placeholder function that would be implemented with actual domain verification logic
    -- For now, it just returns TRUE to simulate successful verification
    
    -- Update the custom_domain_verified flag
    UPDATE white_label_settings
    SET custom_domain_verified = TRUE
    WHERE user_id = auth.uid()
    AND custom_domain = domain;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a storage bucket for white-label assets
INSERT INTO storage.buckets (id, name)
VALUES ('white-label', 'white-label')
ON CONFLICT (id) DO NOTHING;

-- Set up storage policy to allow authenticated users to upload their own white-label assets
CREATE POLICY "Allow users to upload their own white-label assets" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'white-label' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to access any white-label asset for preview purposes
CREATE POLICY "Allow public access to white-label assets" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'white-label');

-- Set up RLS policies

-- Enable RLS on white_label_settings
ALTER TABLE white_label_settings ENABLE ROW LEVEL SECURITY;

-- Users can only see their own white label settings
CREATE POLICY "Users can view their own white label settings" ON white_label_settings
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own white label settings
CREATE POLICY "Users can create their own white label settings" ON white_label_settings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own white label settings
CREATE POLICY "Users can update their own white label settings" ON white_label_settings
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own white label settings
CREATE POLICY "Users can delete their own white label settings" ON white_label_settings
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create a function to check if a user has white label access based on their subscription tier
CREATE OR REPLACE FUNCTION has_white_label_access()
RETURNS BOOLEAN AS $$
DECLARE
    user_tier TEXT;
    user_status TEXT;
BEGIN
    -- Get user's subscription tier and status
    SELECT subscription_tier, subscription_status INTO user_tier, user_status
    FROM profiles
    WHERE id = auth.uid();
    
    -- Only pro and enterprise users with active subscriptions have access to white label features
    RETURN (user_tier = 'pro' OR user_tier = 'enterprise') AND 
           (user_status = 'active' OR user_status = 'trialing');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 