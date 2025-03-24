-- Fix for Function Search Path Mutable issue
-- This migration alters existing functions to set search_path parameter to enhance security

-- Function list to fix:
-- 1. update_pdf_templates_updated_at
-- 2. reset_audit_usage_on_period_change
-- 3. update_profile_full_name
-- 4. update_audit_report
-- 5. update_support_ticket_updated_at
-- 6. update_parent_ticket_timestamp
-- 7. assign_support_ticket
-- 8. resolve_support_ticket
-- 9. get_user_remaining_searches
-- 10. update_lead_search_count
-- 11. handle_new_user
-- 12. update_changelog_item_updated_at
-- 13. update_feature_request_updated_at
-- 14. vote_for_feature_request
-- 15. has_voted_for_feature
-- 16. implement_feature_request
-- 17. safely_store_report
-- 18. update_white_label_settings_updated_at
-- 19. verify_custom_domain
-- 20. has_white_label_access
-- 21. create_audit_record
-- 22. execute_sql
-- 23. insert_audit_bypass_rls
-- 24. increment_audit_usage
-- 25. update_updated_at_column

-- Function to help with altering functions
CREATE OR REPLACE FUNCTION fix_function_search_path(func_name text, func_schema text DEFAULT 'public')
RETURNS void AS $$
DECLARE
    func_def text;
    fixed_def text;
BEGIN
    -- Get the function definition
    SELECT pg_get_functiondef(p.oid)
    INTO func_def
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = func_schema
    AND p.proname = func_name;
    
    -- Replace or add search_path parameter
    -- Check if function has SET clause already
    IF func_def ~* 'SET search_path' THEN
        RAISE NOTICE 'Function %s.%s already has search_path set', func_schema, func_name;
    ELSIF func_def ~* 'LANGUAGE (\w+)' THEN
        -- Replace LANGUAGE with SET search_path and LANGUAGE
        fixed_def := regexp_replace(
            func_def,
            'LANGUAGE (\w+)',
            'SET search_path = ''$1'', pg_catalog, public LANGUAGE \1',
            'g'
        );
        
        -- Execute the fixed function definition
        EXECUTE fixed_def;
        RAISE NOTICE 'Fixed search_path for %s.%s', func_schema, func_name;
    ELSE
        RAISE NOTICE 'Could not fix %s.%s', func_schema, func_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Fix all affected functions
SELECT fix_function_search_path('update_pdf_templates_updated_at');
SELECT fix_function_search_path('reset_audit_usage_on_period_change');
SELECT fix_function_search_path('update_profile_full_name');
SELECT fix_function_search_path('update_audit_report');
SELECT fix_function_search_path('update_support_ticket_updated_at');
SELECT fix_function_search_path('update_parent_ticket_timestamp');
SELECT fix_function_search_path('assign_support_ticket');
SELECT fix_function_search_path('resolve_support_ticket');
SELECT fix_function_search_path('get_user_remaining_searches');
SELECT fix_function_search_path('update_lead_search_count');
SELECT fix_function_search_path('handle_new_user');
SELECT fix_function_search_path('update_changelog_item_updated_at');
SELECT fix_function_search_path('update_feature_request_updated_at');
SELECT fix_function_search_path('vote_for_feature_request');
SELECT fix_function_search_path('has_voted_for_feature');
SELECT fix_function_search_path('implement_feature_request');
SELECT fix_function_search_path('safely_store_report');
SELECT fix_function_search_path('update_white_label_settings_updated_at');
SELECT fix_function_search_path('verify_custom_domain');
SELECT fix_function_search_path('has_white_label_access');
SELECT fix_function_search_path('create_audit_record');
SELECT fix_function_search_path('execute_sql');
SELECT fix_function_search_path('insert_audit_bypass_rls');
SELECT fix_function_search_path('increment_audit_usage');
SELECT fix_function_search_path('update_updated_at_column');

-- Drop the helper function when done
DROP FUNCTION fix_function_search_path(text, text); 