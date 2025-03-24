-- Master migration file
-- This file ensures that all migrations are run in the correct order

-- Create extension for UUID generation if not exists
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

BEGIN;

-- First run the profiles migration to ensure the base tables exist
\echo 'Running profiles migration...'
\ir 20250321_update_profiles.sql

-- Then run the support tickets migration
\echo 'Running support tickets migration...'
\ir 20250321_support_tickets.sql

-- Then run the changelog and feature requests migration
\echo 'Running changelog and feature requests migration...'
\ir 20250321_changelog_feature_requests.sql

-- Then run the API access migration
\echo 'Running API access migration...'
\ir 20250321_api_access.sql

-- Finally run the white label migration
\echo 'Running white label migration...'
\ir 20250321_white_label.sql

-- Fix security definer view issue
\echo 'Running security definer view fix...'
\ir fix_security_definer_view.sql

-- Fix function search path mutable issues
\echo 'Running function search path fix...'
\ir fix_function_search_path.sql

-- Fix feature requests user join issue
\echo 'Running feature requests user join fix...'
\ir fix_feature_requests_user_join.sql

-- Add increment and decrement functions
\echo 'Running increment/decrement functions...'
\ir fix_increment_decrement_functions.sql

COMMIT; 