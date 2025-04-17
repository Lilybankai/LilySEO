-- Add image_data field to crawl_results table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'crawl_results' 
        AND column_name = 'image_data'
    ) THEN
        ALTER TABLE public.crawl_results 
        ADD COLUMN image_data JSONB DEFAULT '[]'::jsonb;
        
        COMMENT ON COLUMN public.crawl_results.image_data IS 'Detailed information about images including alt text and thumbnails';
    END IF;
END
$$;

-- Add webhook_url field to projects table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'webhook_url'
    ) THEN
        ALTER TABLE public.projects 
        ADD COLUMN webhook_url TEXT;
        
        COMMENT ON COLUMN public.projects.webhook_url IS 'URL to notify when audit is complete';
    END IF;
END
$$;

-- Add api_integration_settings field to projects table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'api_integration_settings'
    ) THEN
        ALTER TABLE public.projects 
        ADD COLUMN api_integration_settings JSONB DEFAULT '{}'::jsonb;
        
        COMMENT ON COLUMN public.projects.api_integration_settings IS 'Settings for API integrations like MOZ, PageSpeed, GSC';
    END IF;
END
$$;

-- Add service_type field to api_keys table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'api_keys' 
        AND column_name = 'service_type'
    ) THEN
        ALTER TABLE public.api_keys 
        ADD COLUMN service_type TEXT;
        
        COMMENT ON COLUMN public.api_keys.service_type IS 'Type of service (MOZ, PageSpeed, GSC, etc.)';
    END IF;
END
$$;

-- Add RLS policies for api_keys table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'api_keys' 
        AND policyname = 'Users can view their own API keys'
    ) THEN
        CREATE POLICY "Users can view their own API keys"
          ON public.api_keys FOR SELECT
          USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'api_keys' 
        AND policyname = 'Users can insert their own API keys'
    ) THEN
        CREATE POLICY "Users can insert their own API keys"
          ON public.api_keys FOR INSERT
          WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'api_keys' 
        AND policyname = 'Users can update their own API keys'
    ) THEN
        CREATE POLICY "Users can update their own API keys"
          ON public.api_keys FOR UPDATE
          USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'api_keys' 
        AND policyname = 'Users can delete their own API keys'
    ) THEN
        CREATE POLICY "Users can delete their own API keys"
          ON public.api_keys FOR DELETE
          USING (auth.uid() = user_id);
    END IF;
END
$$;

-- Create indexes if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'api_keys' 
        AND indexname = 'idx_api_keys_user_id'
    ) THEN
        CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'api_keys' 
        AND indexname = 'idx_api_keys_service_type'
    ) THEN
        CREATE INDEX idx_api_keys_service_type ON public.api_keys(service_type);
    END IF;
END
$$;

-- Add notification_settings field to user_settings table if it doesn't exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'user_settings'
    ) AND NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_settings' 
        AND column_name = 'notification_settings'
    ) THEN
        ALTER TABLE public.user_settings 
        ADD COLUMN notification_settings JSONB DEFAULT '{"email": true, "webhook": false}'::jsonb;
        
        COMMENT ON COLUMN public.user_settings.notification_settings IS 'Settings for audit completion notifications';
    END IF;
END
$$; 