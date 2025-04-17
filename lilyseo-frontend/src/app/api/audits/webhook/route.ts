import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { notifyAuditComplete } from '@/lib/notification-utils';
import { generateTodosFromAudit } from '@/lib/todo-service';

export async function POST(request: Request) {
  try {
    // Parse webhook payload
    const payload = await request.json();
    const { audit_id, project_id, status, result } = payload;
    
    if (!audit_id || !project_id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verify API key for security (if implemented)
    // const apiKey = request.headers.get('x-api-key');
    // if (!apiKey || apiKey !== process.env.CRAWLER_SERVICE_API_KEY) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    // Get audit and project details
    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .select('id, project_id, user_id')
      .eq('id', audit_id)
      .eq('project_id', project_id)
      .single();
    
    if (auditError || !audit) {
      console.error('Audit not found:', audit_id);
      return NextResponse.json(
        { error: 'Audit not found' },
        { status: 404 }
      );
    }
    
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, user_id')
      .eq('id', project_id)
      .single();
    
    if (projectError || !project) {
      console.error('Project not found:', project_id);
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Update audit status
    const { error: updateError } = await supabase
      .from('audits')
      .update({
        status,
        result,
        completed_at: status === 'completed' ? new Date().toISOString() : null
      })
      .eq('id', audit_id);
    
    if (updateError) {
      console.error('Error updating audit status:', updateError);
      return NextResponse.json(
        { error: 'Error updating audit status' },
        { status: 500 }
      );
    }
    
    // If the audit is completed, generate todos and send notification
    if (status === 'completed') {
      // Send notification to user
      await notifyAuditComplete(
        project.user_id,
        project.name,
        audit_id
      );
      
      // Generate todos from the audit recommendations
      const { count } = await generateTodosFromAudit(audit_id, project_id);
      
      console.log(`Generated ${count} todos from audit ${audit_id} for project ${project_id}`);
    }
    
    return NextResponse.json({ success: true, status });
    
  } catch (error) {
    console.error('Error handling audit webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 