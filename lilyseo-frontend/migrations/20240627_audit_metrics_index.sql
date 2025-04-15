-- Audit Metrics History Migration Index File
-- This file runs all the audit metrics migrations in the correct order

-- 1. First create the audit_metrics_history table and related triggers
\ir 20240627_audit_metrics_history.sql

-- 2. Populate the metrics history from existing audits
\ir 20240627_populate_metrics_history.sql

-- 3. Create functions to access trend data
\ir 20240627_metrics_trend_functions.sql

-- Log successful migration
DO $$
BEGIN
  RAISE NOTICE 'Audit Metrics History migrations completed successfully.';
END $$; 