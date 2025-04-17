Implementation Plan: White-Label PDF Generation with Puppeteer and Open AI Azure

✅ COMPLETED WORK:

1. Basic Infrastructure Setup
- Created /pdf directory structure in crawler service
- Implemented core types in types/index.ts
- Created template renderer utility
- Implemented basic PDF generator service
- Created initial cover page templates
- Created executive summary template

2. Template System
- Implemented template rendering engine
- Created HTML/CSS base templates
- Added dynamic data injection system
- Implemented template combining utility

3. PDF Generation Core
3.1 Puppeteer Setup ✅
- Configured headless mode
- Added proper error handling
- Implemented browser management

3.2 PDF Generation Service ✅
- Basic PDF generation implemented
- Added AI content generation
- Added progress tracking
- Improved error handling

3.3 Job Queue & Progress Tracking ✅
- Implemented Bull queue system
- Added progress tracking with events
- Added job state management
- Implemented error handling

3.4 Caching System ✅
- Implemented Redis-based caching
- Added cache invalidation rules
- Added cache key generation based on content hash
- Integrated caching with PDF generation

4. API Integration
4.1 Create PDF Generation Endpoints ✅
- Implemented POST /api/pdf/generate
- Implemented GET /api/pdf/status/:jobId
- Implemented GET /api/pdf/download/:jobId

4.2 Add to Crawler Service ✅
- Created auth middleware
- Registered PDF routes
- Added error handling

5. Frontend Integration
5.1 Remove React-PDF Dependencies ✅
- Removed @react-pdf/renderer package
- Removed jspdf and pdf-lib packages
- Removed puppeteer from frontend

5.2 Create New PDF Services ✅
- Created PDF generation service
- Added job status polling
- Added download handling

5.3 API Route Implementation ✅
- Created Next.js API routes
- Added authentication with Supabase
- Added error handling
- Added proper response handling

🚀 IN PROGRESS:

5.4 Update PDFPreview Component (Current Task)
- Update to use new API endpoints
- Add progress tracking UI
- Implement preview functionality

🔄 REMAINING TASKS:

Phase 6: White Label Integration
6.1 Logo Management
6.2 Theme & Styling Options

Phase 7: Testing & Optimization
7.1 Unit & Integration Testing
7.2 Performance Optimization
7.3 Security Review

Phase 8: Rollout & Documentation
8.1 Deployment Strategy
8.2 Documentation

1. Extend the Puppeteer ServerCurrent Functionality: Your Puppeteer server crawls websites, calls external APIs, and stores data in a database for frontend display.
New Goal: Add a PDF generation API endpoint to produce branded audit reports.Add Express FrameworkInstall Express: npm install express.Set up a server that runs alongside your crawler logic (assumed to be Node.js-based).Basic structure:const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
app.use(express.json());

// Existing crawler logic remains untouched (e.g., in a separate module or process)

app.listen(3001, () => console.log('Puppeteer server running on port 3001'));Create /generate-pdf EndpointAdd a POST endpoint to accept PDF generation requests from Next.js.Expected payload: auditData (from database), clientDetails (name, preparedBy), logoUrl, primaryColor, coverStyle (1–5).Response: A PDF buffer.Initial setup:app.post('/generate-pdf', async (req, res) => {
  const { auditData, clientDetails, logoUrl, primaryColor, coverStyle } = req.body;
  // PDF generation logic will go here
});Secure the EndpointUse an API key for authentication between Next.js and the Puppeteer server.Example:const API_KEY = process.env.PDF_API_KEY;
app.post('/generate-pdf', (req, res) => {
  if (req.headers['x-api-key'] !== API_KEY) {
    return res.status(403).send('Unauthorized');
  }
  // Proceed with PDF generation
});2. Design Five Custom Cover Page TemplatesObjective: Create five distinct HTML/CSS cover page templates for white-label branding, stored on the Puppeteer server.Template DirectoryCreate a /templates folder in your Puppeteer server project.Add files: cover1.html, cover2.html, cover3.html, cover4.html, cover5.html.Cover Page Templates (Dynamic placeholders for logo, color, client info)Cover 1: Minimal White<div style="background: #fff; padding: 40px; text-align: center; height: 100%;">
  <img src="{{logoUrl}}" style="max-width: 200px; margin-bottom: 20px;" />
  <h1 style="color: {{primaryColor}}; font-size: 36px;">SEO Audit Report</h1>
  <p style="font-size: 16px;">Prepared for: {{clientName}}</p>
  <p style="font-size: 16px;">By: {{preparedBy}}</p>
</div>Cover 2: Gradient<div style="background: linear-gradient(135deg, {{primaryColor}}, #fff); padding: 40px; height: 100%;">
  <img src="{{logoUrl}}" style="max-width: 200px; float: left;" />
  <h1 style="color: #fff; font-size: 36px; text-align: right;">SEO Audit Report</h1>
  <p style="font-size: 16px; text-align: right;">Prepared for: {{clientName}}</p>
  <p style="font-size: 16px; text-align: right;">By: {{preparedBy}}</p>
</div>Cover 3: Dark Theme<div style="background: #333; padding: 40px; text-align: center; color: #fff; height: 100%;">
  <img src="{{logoUrl}}" style="max-width: 200px; margin-bottom: 20px;" />
  <h1 style="color: {{primaryColor}}; font-size: 36px;">SEO Audit Report</h1>
  <p style="font-size: 16px;">Prepared for: {{clientName}}</p>
  <p style="font-size: 16px;">By: {{preparedBy}}</p>
</div>Cover 4: Colored Banner<div style="height: 100%; padding: 40px; text-align: right;">
  <div style="background: {{primaryColor}}; height: 200px; width: 100%; position: absolute; top: 0; left: 0;"></div>
  <img src="{{logoUrl}}" style="max-width: 200px; position: relative;" />
  <h1 style="color: #000; font-size: 36px;">SEO Audit Report</h1>
  <p style="font-size: 16px;">Prepared for: {{clientName}}</p>
  <p style="font-size: 16px;">By: {{preparedBy}}</p>
</div>Cover 5: Split-Color<div style="height: 100%; padding: 40px; text-align: center;">
  <div style="background: {{primaryColor}}; height: 50%; width: 100%; position: absolute; top: 0; left: 0;"></div>
  <div style="background: #fff; height: 50%; width: 100%; position: absolute; bottom: 0; left: 0;"></div>
  <img src="{{logoUrl}}" style="max-width: 200px; position: relative;" />
  <h1 style="color: {{primaryColor}}; font-size: 36px;">SEO Audit Report</h1>
  <p style="font-size: 16px;">Prepared for: {{clientName}}</p>
  <p style="font-size: 16px;">By: {{preparedBy}}</p>
</div>Template Rendering FunctionWrite a utility to inject dynamic data into templates (no external library needed for simplicity).Example:const fs = require('fs');
function renderTemplate(templateName, data) {
  let html = fs.readFileSync(./templates/${templateName}, 'utf8');
  for (const [key, value] of Object.entries(data)) {
    html = html.replace(new RegExp({{${key}}}, 'g'), value);
  }
  return html;
}3. Create Audit Content TemplateObjective: Adapt your frontend audit display into an HTML template for PDF inclusion.Convert Frontend UIExtract your Next.js audit component's HTML/CSS structure (e.g., a list or table of tasks). If it's React-based, manually replicate it or use a tool to export static HTML.Sample template (audit.html):<div style="padding: 20px;">
  <h2 style="font-size: 24px; color: {{primaryColor}};">Audit Results</h2>
  <ul style="font-size: 14px;">
    {{auditTasks}}
  </ul>
</div>Pre-process auditData to format tasks:function renderAuditTemplate(auditData, primaryColor) {
  const tasksHtml = auditData.tasks
    .map(task => <li>${task.description}</li>)
    .join('');
  return renderTemplate('audit.html', { auditTasks: tasksHtml, primaryColor });
}4. Integrate Open AI Azure for Executive SummaryObjective: Generate an executive summary using Open AI's Azure deployment.Setup Open AI Azure ClientInstall the Open AI SDK: npm install @azure/openai.Configure with your Azure endpoint and key (stored in environment variables).Example:const { OpenAIClient, AzureKeyCredential } = require('@azure/openai');
const client = new OpenAIClient(
  process.env.AZURE_OPENAI_ENDPOINT,
  new AzureKeyCredential(process.env.AZURE_OPENAI_KEY)
);

async function aiGenerateSummary(auditData) {
  const prompt = Generate a concise executive summary for this SEO audit: ${JSON.stringify(auditData)};
  const response = await client.getCompletions({
    prompt,
    maxTokens: 150,
    temperature: 0.7,
  });
  return response.choices[0].text.trim();
}Summary TemplateCreate summary.html:<div style="padding: 20px;">
  <h2 style="font-size: 24px; color: {{primaryColor}};">Executive Summary</h2>
  <p style="font-size: 14px;">{{summary}}</p>
</div>5. Generate the PDF on Puppeteer ServerObjective: Combine cover page, summary, and audit content into a single PDF.Full /generate-pdf Implementationapp.post('/generate-pdf', async (req, res) => {
  const { auditData, clientDetails, logoUrl, primaryColor, coverStyle } = req.body;

  // Input validation
  if (!auditData || !clientDetails || !coverStyle || coverStyle < 1 || coverStyle > 5) {
    return res.status(400).send('Invalid or missing data');
  }

  // Generate AI summary
  const summary = await aiGenerateSummary(auditData);

  // Render templates
  const coverHtml = renderTemplate(cover${coverStyle}.html, {
    logoUrl: logoUrl || 'https://via.placeholder.com/200x50',
    primaryColor: primaryColor || '#000000',
    clientName: clientDetails.name || 'Unknown Client',
    preparedBy: clientDetails.preparedBy || 'Your Team',
  });
  const summaryHtml = renderTemplate('summary.html', { summary, primaryColor });
  const auditHtml = renderAuditTemplate(auditData, primaryColor);
  const fullHtml = `
    <html>
      <head>
        <style>body { font-family: Arial, sans-serif; }</style>
      </head>
      <body>
        ${coverHtml}
        <div style="page-break-before: always;"></div>
        ${summaryHtml}
        <div style="page-break-before: always;"></div>
        ${auditHtml}
      </body>
    </html>
  `;

  // Generate PDF with Puppeteer
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
  });
  await browser.close();

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=audit.pdf');
  res.send(pdf);
});6. Modify Next.js FrontendObjective: Collect user inputs and trigger PDF generation via the Puppeteer server.White-Label Input FormAdd a form in your Next.js app for:Client name (text).Prepared by (text).Logo upload (convert to URL, e.g., via temporary S3 upload or base64).Primary color (color picker).Cover style (dropdown: 1–5).Example React component:import { useState } from 'react';

export default function PdfForm({ auditData }) {
  const [formData, setFormData] = useState({
    clientDetails: { name: '', preparedBy: '' },
    logoUrl: '',
    primaryColor: '#000000',
    coverStyle: 1,
  });

  const handleSubmit = async () => {
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, auditData }),
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'audit.pdf';
    link.click();
  };

  return (
    <form onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
      <input type="text" placeholder="Client Name" onChange={e => setFormData({ ...formData, clientDetails: { ...formData.clientDetails, name: e.target.value } })} />
      <input type="text" placeholder="Prepared By" onChange={e => setFormData({ ...formData, clientDetails: { ...formData.clientDetails, preparedBy: e.target.value } })} />
      <input type="file" onChange={e => setFormData({ ...formData, logoUrl: URL.createObjectURL(e.target.files[0]) })} />
      <input type="color" value={formData.primaryColor} onChange={e => setFormData({ ...formData, primaryColor: e.target.value })} />
      <select onChange={e => setFormData({ ...formData, coverStyle: parseInt(e.target.value) })}>
        <option value="1">Minimal White</option>
        <option value="2">Gradient</option>
        <option value="3">Dark Theme</option>
        <option value="4">Colored Banner</option>
        <option value="5">Split-Color</option>
      </select>
      <button type="submit">Generate PDF</button>
    </form>
  );
}Next.js API RouteProxy the request to the Puppeteer server.Example:import fetch from 'node-fetch';

export default async function handler(req, res) {
  const response = await fetch('http://puppeteer-server:3001/generate-pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.PDF_API_KEY,
    },
    body: JSON.stringify(req.body),
  });
  if (!response.ok) {
    return res.status(response.status).send('PDF generation failed');
  }
  const pdf = await response.buffer();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=audit.pdf');
  res.send(pdf);
}


I'll create a detailed implementation plan based on your responses. First, let me check the current API communication between the frontend and crawler service.
Now let me check how logo uploads are handled:
Let me also check for any polling mechanisms in the existing code:
Based on the information collected, here's a comprehensive implementation plan for the Puppeteer-based PDF generation system:
Puppeteer PDF Generation Implementation Plan
Phase 1: Setup & Infrastructure (3 Days)
1.1 Crawler Service Extensions
Create a new /pdf directory in the crawler service with subdirectories:
/templates - HTML templates for the PDF
/services - PDF generation logic
/routes - API endpoints
1.2 API Security Implementation
Add API key authentication middleware in the crawler service
Generate a secure API key and store it in environment variables
Set up CORS properly to allow only the frontend to access PDF endpoints
1.3 Create Storage Utilities
Set up Supabase client in the crawler service to access the logo storage
Create utility functions for retrieving logos from the white-label bucket
Phase 2: Template Development (4 Days)
2.1 Create Base Templates
Develop HTML/CSS base templates with consistent styling
Create a templating system to inject dynamic data
Implement Tailwind CSS for styling
2.2 Cover Page Templates
Create 5 distinct cover page templates as specified:
Minimal White
Gradient
Dark Theme
Colored Banner
Split-Color
2.3 Content Section Templates
Create templates for:
Executive Summary (AI-generated)
Issues Summary (High/Medium/Low priorities)
Performance Metrics (PageSpeed, Core Web Vitals)
SEO Metrics (Moz Data, links, etc.)
Custom Notes Section
2.4 Template Rendering System
Develop a utility to compile multiple templates into a single HTML document
Add page breaks between sections
Implement dynamic data injection
Phase 3: PDF Generation Core (4 Days)
3.1 Puppeteer Setup
Configure Puppeteer for headless operation
Optimize for performance and reliability
Set up proper error handling and logging
3.2 PDF Generation Service
Create a service to generate PDFs from templates and data
Implement AI content generation via Azure OpenAI
Create fallback mechanisms for when AI generation fails
3.3 Job Queue & Progress Tracking
Implement a job queue system for PDF generation tasks
Add progress tracking for each step of the generation process
Store job states in database for persistence
3.4 Caching System
Add Redis-based caching for generated PDFs
Implement cache invalidation rules
Store cache keys based on audit data hash and template selection
Phase 4: API Endpoints (2 Days)
4.1 Create PDF Generation Endpoints
POST /api/pdf/generate - Initiate PDF generation
GET /api/pdf/status/:jobId - Check generation status and progress
GET /api/pdf/download/:jobId - Download the generated PDF
4.2 Add to Crawler Service
Register PDF routes in main express app
Add proper error handling and logging
Phase 5: Frontend Integration (4 Days)
5.1 Remove React-PDF Dependencies
Remove @react-pdf/renderer and related dependencies
Clean up imports and related code
5.2 Create New PDF Services
Implement service for communicating with the crawler PDF endpoints
Create hooks for tracking PDF generation status
5.3 API Route Implementation
Create/update Next.js API routes to proxy requests to the crawler service
Add proper error handling and response types
Phase 6: White Label Integration (2 Days)
6.1 Logo Management
Ensure logo uploads work with the new PDF generation system
Implement base64 conversion for temporary uploads
Connect to the Supabase storage bucket for persistent logos
6.2 Theme & Styling Options
Connect the existing white label theming options with the new templates
Ensure color schemes are properly applied
Test all combinations of customization options
Phase 7: Testing & Optimization (3 Days)
7.1 Unit & Integration Testing
Create tests for template rendering
Test PDF generation with various data scenarios
Test performance under load
7.2 Performance Optimization
Optimize Puppeteer configuration for speed
Implement browser instance pooling
Fine-tune caching strategy
7.3 Security Review
Ensure API keys are properly secured
Validate user permissions for white label features
Sanitize all user inputs
Phase 8: Rollout & Documentation (2 Days)
8.1 Deployment Strategy
Create a phased deployment plan
Implement feature flags for gradual rollout
Set up monitoring and alerts
8.2 Documentation
Document the API endpoints
Create internal documentation for the template system
Document the caching mechanism
Implementation Details
PDF Generation Flow
Frontend submits PDF generation request with audit data, client details, and styling options
Crawler service creates a job entry with 'pending' status and returns a job ID
PDF generation starts in the background with progress updates
Frontend polls the status endpoint to get progress updates
When complete, frontend displays preview and/or download options
PDF Structure
Cover Page (custom template based on selection)
Executive Summary (AI-generated based on audit data)
Issues Summary (grouped by priority)
Performance Metrics (page speed, etc.)
SEO Metrics (Moz data, links, etc.)
Custom Notes (optional)
Error Handling & Fallbacks
If AI summary generation fails, use pre-defined templates based on score ranges
Cache partially generated PDFs to avoid regenerating from scratch
Implement timeouts and retry logic for long-running operations
Provide meaningful error messages to the frontend
Progress Tracking
Track progress through phases: 0% (Queued) → 10% (Started) → 30% (Templates Rendered) → 50% (AI Content Generated) → 70% (PDF Compilation) → 90% (Optimization) → 100% (Complete)
Store progress in database and return via status API
Update progress in real-time as tasks complete
Code Implementation Examples