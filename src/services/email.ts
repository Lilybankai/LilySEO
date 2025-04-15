import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';

// Initialize Resend client
// Ensure RESEND_API_KEY is set in your environment variables
const resendApiKey = process.env.RESEND_API_KEY;
let resend: Resend | null = null;
if (resendApiKey) {
  resend = new Resend(resendApiKey);
} else {
  console.warn('RESEND_API_KEY is not set. Email notifications will be disabled.');
}

// Define the sender email address (must be verified in Resend)
const FROM_EMAIL = process.env.EMAIL_FROM || 'info@thelilybankagency.co.uk';

// Define the base directory for email templates
const templatesDir = path.resolve(process.cwd(), 'src/resend-templates');

interface EmailOptions {
  to: string;
  subject: string;
  templateName: 'audit-completion' | 'team-invitation' | 'weekly-summary' | 'monthly-summary'; // Add more as needed
  templateData: Record<string, string>; // Placeholders like { userName: "Carl", reportUrl: "..." }
}

/**
 * Reads an HTML template file, replaces placeholders, and sends an email via Resend.
 */
export async function sendEmail({
  to,
  subject,
  templateName,
  templateData
}: EmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    const errorMsg = 'Resend is not configured. Cannot send email.';
    console.error(errorMsg);
    return { success: false, error: errorMsg };
  }

  try {
    // 1. Read the HTML template file
    const templatePath = path.join(templatesDir, `${templateName}.html`);
    let htmlContent = fs.readFileSync(templatePath, 'utf-8');

    // 2. Replace placeholders
    Object.entries(templateData).forEach(([key, value]) => {
      // Use a regex for global replacement (e.g., replace all instances of {{userName}})
      const regex = new RegExp(`{{\s*${key}\s*}}`, 'g');
      htmlContent = htmlContent.replace(regex, value);
    });

    // 3. Send the email using Resend
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: to,
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      console.error(`Resend error sending ${templateName} to ${to}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`Email (${templateName}) sent successfully to ${to}. Resend ID: ${data?.id}`);
    return { success: true };

  } catch (error: any) {
    console.error(`Error processing email (${templateName}) to ${to}:`, error);
    // Handle file read errors, etc.
    if (error.code === 'ENOENT') {
      return { success: false, error: `Template file not found: ${templateName}.html` };
    }
    return { success: false, error: error.message || 'Failed to send email due to an unexpected error.' };
  }
}

// Example Usage (demonstration purposes, call this from your API routes/triggers)
/*
async function exampleSend() {
  const result = await sendEmail({
    to: 'test@example.com',
    subject: 'Your Audit is Ready!',
    templateName: 'audit-completion',
    templateData: {
      userName: 'Carl Smith',
      projectName: 'My Website',
      projectUrl: 'https://example.com',
      reportUrl: 'https://app.lilyseo.co.uk/projects/123/audits/456' // Replace with actual URL
    }
  });

  if (result.success) {
    console.log("Example email sent!");
  } else {
    console.error("Example email failed:", result.error);
  }
}
// exampleSend();
*/ 