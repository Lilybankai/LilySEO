-- Add pdf_defaults column to white_label_settings table
ALTER TABLE white_label_settings
ADD COLUMN IF NOT EXISTS pdf_defaults JSONB DEFAULT '{
  "font_family": "Poppins, Montserrat, sans-serif",
  "page_size": "A4",
  "color_mode": "Full",
  "output_quality": "Standard",
  "include_options": {
    "executiveSummary": true,
    "technicalSEO": true,
    "onPageSEO": true,
    "offPageSEO": true,
    "performance": true,
    "userExperience": true,
    "insights": true,
    "recommendations": true,
    "charts": true,
    "branding": true
  }
}'::jsonb;

-- Add comment to column
COMMENT ON COLUMN white_label_settings.pdf_defaults IS 'PDF export settings and customizations'; 