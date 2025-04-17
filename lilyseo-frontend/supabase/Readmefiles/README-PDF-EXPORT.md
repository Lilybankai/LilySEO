# PDF Export Functionality

This document describes the enhanced PDF export functionality implemented in the LilySEO frontend.

## Overview

The PDF export feature allows users to generate professional-looking PDF reports of their SEO audits. The PDFs include:

- Cover page with branding and client information
- Executive summary with key metrics
- Detailed issue sections by category
- Performance metrics from PageSpeed Insights
- End page with recommendations and contact information

The implementation uses React-PDF (@react-pdf/renderer) for client-side PDF generation.

## Access Restrictions

PDF export customization features are only available to Pro and Enterprise users:

- **Free Users**: Can export basic PDFs with default LilySEO branding and no customization options
- **Pro Users**: Full access to all PDF customization options, templates, and white label branding
- **Enterprise Users**: Same as Pro users, plus additional enterprise-specific features

All customization settings in the white label section are locked to Pro/Enterprise tier users, ensuring the premium features are properly restricted.

## Advanced Customization Features

The PDF export system now includes these advanced customization options:

- **Content Selection**: Choose which sections to include/exclude in your report
- **Page Size Options**: A4, US Letter, and US Legal formats
- **Color Mode Selection**: Full color or grayscale
- **Output Quality Settings**: Draft, Standard, and High quality
- **Font Selection**: Multiple font families (Poppins, Montserrat, Helvetica)
- **Brand Colors**: Custom primary and secondary colors
- **Template Management**: Save and reuse customized PDF templates
- **Client Information**: Add client details for white-labeled reports

## Components

The PDF components are located in `src/components/pdf/` and include:

- `CoverPage.tsx`: The first page of the PDF with branding and title
- `ExecutiveSummary.tsx`: Overview of the audit results with key metrics
- `IssueSection.tsx`: Displays issues by category with severity indicators
- `PerformanceMetrics.tsx`: Shows PageSpeed Insights metrics for mobile and desktop
- `EndPage.tsx`: Closing page with recommendations and contact information
- `SEOAuditReport.tsx`: The main component that combines all other components
- `PDFPreview.tsx`: UI component for previewing and downloading the PDF
- `CustomizePanel.tsx`: UI for customizing PDF export settings
- `SaveTemplateDialog.tsx`: UI for managing saved PDF templates

## White Label Integration

PDF exports are fully integrated with the white label settings system:

1. PDF exports automatically inherit the company name, logo, colors, and footer text from white label settings
2. All PDF customization options are available directly within the white label settings page
3. Pro users can preview their PDFs with white label branding applied
4. Saved PDF templates are accessible both from the white label settings page and the PDF export modal
5. PDF customization settings are stored in the `pdf_defaults` field of the `white_label_settings` table

## Theming and White Label Support

PDF reports can be themed to match the user's branding through white label settings. Pro users can customize:

- Logo
- Primary and secondary colors
- Company name and contact information
- Footer text
- Font family
- Page size and layout

The theming system is implemented through a React context (`src/context/ThemeContext.tsx`).

## PDF Templates

Users can save their customization settings as templates for reuse:

- Templates are stored in the `pdf_templates` table in the database
- Each template includes a name, description, and all theme settings
- Users can manage multiple templates
- Templates can be loaded, updated, or deleted

## Usage

The PDF export is accessed in two ways:

1. **From audit reports**: Click "Export PDF" on any audit report to open the PDF preview dialog
2. **From white label settings**: Pro users can access all PDF customization features in the "PDF Export" tab

When customizing PDFs:

1. Users can select which sections to include/exclude
2. Choose page size, color mode, and output quality
3. Pro users can add client information and personalized notes
4. Users can save settings as a template for future use
5. Preview the PDF before downloading
6. Download the finalized PDF

## Pro Features

Pro users have access to additional features:

- White label branding (logo, colors, company name)
- Client information fields
- Custom notes section
- Template saving and management
- Advanced output quality settings

## Database Structure

### PDF Templates Table
The PDF templates are stored in the `pdf_templates` table with the following structure:

- `id`: UUID primary key
- `user_id`: Reference to the auth.users table
- `name`: Template name
- `description`: Optional template description
- `theme_settings`: JSONB field containing all theme settings
- `created_at`: Timestamp
- `updated_at`: Timestamp

### White Label Settings Updates
The `white_label_settings` table has been extended with a new column:

- `pdf_defaults`: JSONB field containing default PDF settings (font, page size, content options, etc.)

## Implementation Details

- All PDF rendering happens client-side in the browser
- PDF styling is done with StyleSheet from @react-pdf/renderer
- Dynamic data is passed from the audit to each component
- Advanced styling options are controlled through the theme context
- Custom fonts are registered for PDF rendering

## Adding New Pages or Sections

To add new pages or sections to the PDF:

1. Create a new component in the `src/components/pdf/` directory
2. Import and add it to the `SEOAuditReport.tsx` component
3. Add a new option in the `includeOptions` object in the theme context
4. Add UI controls in the `CustomizePanel.tsx` component

## Potential Future Improvements

- More advanced template sharing between team members
- Additional font options and typography controls
- Interactive PDF elements and links
- Additional export formats (DOCX, HTML)
- PDF annotation and commenting features 