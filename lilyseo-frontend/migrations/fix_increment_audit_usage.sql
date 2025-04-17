-- Fix the increment_audit_usage function to avoid JSONB errors
CREATE OR REPLACE FUNCTION increment_audit_usage()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    new_json JSONB;
BEGIN
    -- Get the current count, defaulting to 0 if not set
    SELECT COALESCE((audit_usage->>'count')::INTEGER, 0) 
    INTO current_count 
    FROM public.subscriptions 
    WHERE user_id = NEW.user_id;
    
    -- Increment the count
    current_count := current_count + 1;
    
    -- Create the new JSON object
    SELECT 
        CASE 
            WHEN audit_usage = '{}'::JSONB OR audit_usage IS NULL THEN 
                jsonb_build_object(
                    'current_period_start', current_period_start,
                    'current_period_end', current_period_end,
                    'count', current_count
                )
            ELSE
                -- Keep the existing JSON but update the count field
                jsonb_build_object(
                    'current_period_start', COALESCE(audit_usage->>'current_period_start', current_period_start),
                    'current_period_end', COALESCE(audit_usage->>'current_period_end', current_period_end),
                    'count', current_count
                )
        END
    INTO new_json
    FROM public.subscriptions
    WHERE user_id = NEW.user_id;
    
    -- Update using the new JSON object directly
    UPDATE public.subscriptions
    SET audit_usage = new_json
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql; 