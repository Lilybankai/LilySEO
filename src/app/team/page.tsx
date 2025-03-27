import React from 'react';
import { Metadata } from 'next';
import { TeamManagementPage } from '@/components/team/team-management-page';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export const metadata: Metadata = {
  title: 'Team Management - LilySEO',
  description: 'Manage your team members, assign permissions and collaborate more effectively.',
};

export default function TeamManagementRoute() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-8">
        <TeamManagementPage />
      </div>
    </DashboardLayout>
  );
} 