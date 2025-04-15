-- First, let's check what the current increment_audit_usage function looks like
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'increment_audit_usage';

-- Now let's fix the increment_audit_usage function
CREATE OR REPLACE FUNCTION increment_audit_usage()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER := 0;
    new_usage JSONB;
BEGIN
    -- Get the current subscription for this user
    SELECT 
        CASE 
            WHEN audit_usage IS NULL OR audit_usage = '{}'::JSONB THEN 
                jsonb_build_object(
                    'current_period_start', current_period_start::TEXT,
                    'current_period_end', current_period_end::TEXT,
                    'count', 0
                )
            ELSE
                audit_usage
        END INTO new_usage
    FROM subscriptions
    WHERE user_id = NEW.user_id;
    
    -- If we couldn't find a subscription, create a minimal one
    IF new_usage IS NULL THEN
        new_usage := jsonb_build_object('count', 0);
    END IF;
    
    -- Extract the current count safely, defaulting to 0
    current_count := COALESCE((new_usage->>'count')::INTEGER, 0);
    
    -- Increment the count
    current_count := current_count + 1;
    
    -- Update the count in the JSON
    new_usage := jsonb_set(new_usage, '{count}', to_jsonb(current_count));
    
    -- Update the subscription
    UPDATE subscriptions
    SET audit_usage = new_usage
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but let the audit creation proceed
        RAISE NOTICE 'Error in increment_audit_usage: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql; 