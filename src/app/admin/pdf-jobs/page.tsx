import { Metadata } from 'next';
import PdfJobsDashboard from '@/components/admin/PdfJobsDashboard';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'PDF Jobs Admin | LilySEO',
  description: 'Manage and monitor PDF generation jobs',
};

export default async function AdminPdfJobsPage() {
  // Check if user is authenticated and has admin role
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login?redirectTo=/admin/pdf-jobs');
  }
  
  // Check if user has admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single();
  
  // Only allow access to enterprise users (or could be a specific admin role)
  if (!profile || profile.subscription_tier !== 'enterprise') {
    redirect('/dashboard?error=insufficient_permissions');
  }
  
  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">PDF Generation Jobs Admin</h1>
        <p className="text-muted-foreground mt-2">
          Monitor and manage PDF generation jobs in the system
        </p>
      </div>
      
      <PdfJobsDashboard />
    </div>
  );
} 