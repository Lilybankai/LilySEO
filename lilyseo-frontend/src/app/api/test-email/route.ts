import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/services/email';

// This is a simple example route to demonstrate sending an email.
// In a real application, email sending would be triggered by specific events
// (e.g., background jobs, database triggers, other API route actions).

export async function GET(request: Request) {
  // Optional: Protect this route if needed
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Example: Send an audit completion email
  console.log("Attempting to send test email...");
  try {
    // Fetch necessary data (user name, project details, report URL) - using placeholders here
    const userName = session.user.email || 'User'; // Use email as fallback
    const projectName = 'Example Project';
    const projectUrl = 'https://example.com';
    const reportUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/projects/123/audits/456`; // Placeholder URL

    const result = await sendEmail({
      to: session.user.email!, // Send to the logged-in user for testing
      subject: '[Test] Your Audit is Ready!',
      templateName: 'audit-completion',
      templateData: {
        userName: userName,
        projectName: projectName,
        projectUrl: projectUrl,
        reportUrl: reportUrl
      }
    });

    if (result.success) {
      return NextResponse.json({ message: 'Test email sent successfully!' });
    } else {
      return NextResponse.json({ error: `Failed to send test email: ${result.error}` }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error in test email API route:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 