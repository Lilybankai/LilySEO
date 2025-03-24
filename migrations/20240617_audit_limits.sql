-- Update plans table with audit limits if they don't exist
DO $$
BEGIN
    -- Check if the features column exists and contains audit limits
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'plans' 
        AND column_name = 'features'
    ) THEN
        -- Update the free plan
        UPDATE public.plans
        SET features = features || '{"auditsPerMonth": 10}'::jsonb
        WHERE id = 'free' AND (features->>'auditsPerMonth') IS NULL;
        
        -- Update the pro plan
        UPDATE public.plans
        SET features = features || '{"auditsPerMonth": 50}'::jsonb
        WHERE id = 'pro' AND (features->>'auditsPerMonth') IS NULL;
        
        -- Update the enterprise plan
        UPDATE public.plans
        SET features = features || '{"auditsPerMonth": 200}'::jsonb
        WHERE id = 'enterprise' AND (features->>'auditsPerMonth') IS NULL;
    END IF;
END
$$;

-- Add audit_usage field to subscriptions table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'subscriptions' 
        AND column_name = 'audit_usage'
    ) THEN
        ALTER TABLE public.subscriptions 
        ADD COLUMN audit_usage JSONB DEFAULT '{}'::jsonb;
        
        COMMENT ON COLUMN public.subscriptions.audit_usage IS 'Tracks audit usage for the current billing period';
    END IF;
END
$$;

-- Create function to reset audit usage at the start of a new billing period
CREATE OR REPLACE FUNCTION reset_audit_usage_on_period_change()
RETURNS TRIGGER AS $$
BEGIN
    -- If the current_period_start has changed, reset the audit usage
    IF OLD.current_period_start IS DISTINCT FROM NEW.current_period_start THEN
        NEW.audit_usage = jsonb_build_object(
            'current_period_start', NEW.current_period_start,
            'current_period_end', NEW.current_period_end,
            'count', 0
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to reset audit usage on period change
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgname = 'reset_audit_usage_on_period_change'
    ) THEN
        CREATE TRIGGER reset_audit_usage_on_period_change
        BEFORE UPDATE ON public.subscriptions
        FOR EACH ROW
        EXECUTE FUNCTION reset_audit_usage_on_period_change();
    END IF;
END
$$;

-- Create function to increment audit usage when a new audit is created
CREATE OR REPLACE FUNCTION increment_audit_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- Increment the audit usage count for the user's subscription
    UPDATE public.subscriptions
    SET audit_usage = jsonb_set(
        CASE 
            WHEN audit_usage = '{}'::jsonb THEN 
                jsonb_build_object(
                    'current_period_start', current_period_start,
                    'current_period_end', current_period_end,
                    'count', 0
                )
            ELSE audit_usage
        END,
        '{count}',
        COALESCE((audit_usage->>'count')::integer, 0) + 1
    )
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to increment audit usage on new audit
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgname = 'increment_audit_usage_on_new_audit'
    ) THEN
        CREATE TRIGGER increment_audit_usage_on_new_audit
        AFTER INSERT ON public.audits
        FOR EACH ROW
        EXECUTE FUNCTION increment_audit_usage();
    END IF;
END
$$; 