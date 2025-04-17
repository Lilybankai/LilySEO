-- Function to update the report field for an audit
CREATE OR REPLACE FUNCTION update_audit_report(audit_id UUID, report_json TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE audits 
  SET report = report_json::jsonb 
  WHERE id = audit_id;
END;
$$ LANGUAGE plpgsql; 