/**
 * This script generates placeholder images for PDF templates.
 * Run with Node.js: node scripts/generate-template-previews.js
 */
const fs = require('fs');
const path = require('path');

const TEMPLATES = [
  { id: 1, name: 'Minimal White', primaryColor: '#3b82f6', backgroundColor: '#ffffff', accentColor: '#f0f7ff' },
  { id: 2, name: 'Gradient Theme', primaryColor: '#3b82f6', backgroundColor: '#ffffff', accentColor: '#dbeafe' },
  { id: 3, name: 'Dark Theme', primaryColor: '#3b82f6', backgroundColor: '#1f2937', accentColor: '#111827' },
  { id: 4, name: 'Colored Banner', primaryColor: '#3b82f6', backgroundColor: '#ffffff', accentColor: '#bfdbfe' },
  { id: 5, name: 'Split Color', primaryColor: '#3b82f6', backgroundColor: '#ffffff', accentColor: '#eff6ff' },
];

// Create the output directory if it doesn't exist
const outputDir = path.join(__dirname, '..', 'public', 'images', 'pdf-templates');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`Created directory: ${outputDir}`);
}

// Generate an SVG template placeholder for each template
TEMPLATES.forEach(template => {
  const svg = generateTemplateSvg(template);
  const outputPath = path.join(outputDir, `template${template.id}.svg`);
  
  fs.writeFileSync(outputPath, svg);
  console.log(`Generated: ${outputPath}`);
});

// Generate template SVG based on template properties
function generateTemplateSvg(template) {
  const { id, name, primaryColor, backgroundColor, accentColor } = template;
  
  // Different layouts based on template ID
  let contentSvg = '';
  
  switch (id) {
    case 1: // Minimal White
      contentSvg = `
        <rect x="50" y="100" width="750" height="200" fill="${primaryColor}" />
        <text x="425" y="70" font-size="40" font-weight="bold" text-anchor="middle" fill="#333333">SEO AUDIT REPORT</text>
        <text x="425" y="400" font-size="24" text-anchor="middle" fill="#555555">Minimal White Template</text>
        <rect x="175" y="500" width="500" height="2" fill="${primaryColor}" />
        <rect x="175" y="520" width="500" height="2" fill="#dddddd" />
        <text x="425" y="580" font-size="20" text-anchor="middle" fill="#555555">Template Preview</text>
        <circle cx="425" cy="700" r="100" fill="${primaryColor}" opacity="0.1" />
        <path d="M375,700 L475,700 M425,650 L425,750" stroke="${primaryColor}" stroke-width="5" />
      `;
      break;
      
    case 2: // Gradient Theme
      contentSvg = `
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.8" />
            <stop offset="100%" stop-color="${accentColor}" stop-opacity="0.3" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="850" height="300" fill="url(#gradient)" />
        <text x="425" y="150" font-size="40" font-weight="bold" text-anchor="middle" fill="white">SEO AUDIT REPORT</text>
        <text x="425" y="400" font-size="24" text-anchor="middle" fill="#555555">Gradient Theme Template</text>
        <rect x="175" y="500" width="500" height="2" fill="${primaryColor}" />
        <text x="425" y="580" font-size="20" text-anchor="middle" fill="#555555">Template Preview</text>
      `;
      break;
      
    case 3: // Dark Theme
      contentSvg = `
        <rect x="0" y="0" width="850" height="1100" fill="${backgroundColor}" />
        <rect x="50" y="50" width="750" height="1000" fill="${accentColor}" />
        <text x="425" y="150" font-size="40" font-weight="bold" text-anchor="middle" fill="white">SEO AUDIT REPORT</text>
        <rect x="200" y="200" width="450" height="2" fill="${primaryColor}" />
        <text x="425" y="400" font-size="24" text-anchor="middle" fill="#cccccc">Dark Theme Template</text>
        <rect x="175" y="500" width="500" height="2" fill="${primaryColor}" />
        <text x="425" y="580" font-size="20" text-anchor="middle" fill="#cccccc">Template Preview</text>
      `;
      break;
      
    case 4: // Colored Banner
      contentSvg = `
        <rect x="0" y="0" width="850" height="200" fill="${primaryColor}" />
        <text x="425" y="120" font-size="40" font-weight="bold" text-anchor="middle" fill="white">SEO AUDIT REPORT</text>
        <text x="425" y="400" font-size="24" text-anchor="middle" fill="#555555">Colored Banner Template</text>
        <rect x="175" y="500" width="500" height="2" fill="${primaryColor}" />
        <rect x="175" y="520" width="500" height="2" fill="#dddddd" />
        <text x="425" y="580" font-size="20" text-anchor="middle" fill="#555555">Template Preview</text>
      `;
      break;
      
    case 5: // Split Color
      contentSvg = `
        <rect x="0" y="0" width="425" height="1100" fill="${primaryColor}" />
        <rect x="425" y="0" width="425" height="1100" fill="${backgroundColor}" />
        <text x="425" y="150" font-size="40" font-weight="bold" text-anchor="middle" fill="white">SEO AUDIT</text>
        <text x="425" y="200" font-size="40" font-weight="bold" text-anchor="middle" fill="#333333">REPORT</text>
        <text x="425" y="400" font-size="24" text-anchor="middle" fill="#555555">Split Color Template</text>
        <rect x="175" y="500" width="500" height="2" fill="${primaryColor}" opacity="0.5" />
        <text x="425" y="580" font-size="20" text-anchor="middle" fill="#555555">Template Preview</text>
      `;
      break;
      
    default:
      contentSvg = `
        <text x="425" y="550" font-size="30" text-anchor="middle" fill="#555555">Template ${id}</text>
      `;
  }
  
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="850" height="1100" viewBox="0 0 850 1100" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="850" height="1100" fill="${backgroundColor}" />
  <text x="425" y="950" font-size="16" text-anchor="middle" fill="#999999">Template ${id}: ${name}</text>
  ${contentSvg}
  <rect x="0" y="0" width="850" height="1100" fill="none" stroke="#dddddd" stroke-width="1" />
</svg>`;
}

console.log('All template previews generated successfully!'); 