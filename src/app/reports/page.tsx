import { Metadata } from 'next'
import ReportGenerator from '@/components/reports/ReportGenerator'
import { createClient } from '@/lib/supabase/server' // Ensure server client is used correctly here if needed

export const metadata: Metadata = {
  title: 'Reports - Lily SEO',
  description: 'Generate and export SEO reports for your projects.',
}

export default async function ReportsPage() {
  const supabase = await createClient(); // Use server client if fetching initial data server-side

  // Example: Fetch projects server-side to pass to the client component
  const { data: { user } } = await supabase.auth.getUser();
  let projects: { id: string; name: string }[] = [];

  if (user) {
    const { data: projectData, error: projectsError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (projectsError) {
      console.error('Error fetching projects for reports page:', projectsError);
      // Handle error appropriately, maybe show an error message
    } else {
      projects = projectData || [];
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Report Generator</h1>
      <ReportGenerator initialProjects={projects} />
    </div>
  )
} 