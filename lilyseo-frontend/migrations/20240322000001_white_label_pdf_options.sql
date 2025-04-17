-- Add PDF branding option columns to white_label_settings table
ALTER TABLE white_label_settings
ADD COLUMN IF NOT EXISTS remove_powered_by BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS use_custom_email_branding BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS use_custom_pdf_branding BOOLEAN DEFAULT FALSE;

-- Add comments to columns
COMMENT ON COLUMN white_label_settings.remove_powered_by IS 'Remove "Powered by LilySEO" branding';
COMMENT ON COLUMN white_label_settings.use_custom_email_branding IS 'Use custom branding in email notifications';
COMMENT ON COLUMN white_label_settings.use_custom_pdf_branding IS 'Use custom branding in PDF reports';

-- Update existing settings to enable PDF branding if pdf_defaults is already set
UPDATE white_label_settings
SET use_custom_pdf_branding = TRUE
WHERE pdf_defaults IS NOT NULL AND pdf_defaults::text != '{}'::text; 