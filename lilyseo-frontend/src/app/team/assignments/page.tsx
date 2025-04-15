import React from 'react';
import { Metadata } from 'next';
import { TeamTasksPage } from '@/components/team/team-tasks-page';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export const metadata: Metadata = {
  title: 'Team Task Assignments - LilySEO',
  description: 'Review and manage tasks assigned to your team members.',
};

export default function TeamAssignmentsRoute() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-8">
        <TeamTasksPage />
      </div>
    </DashboardLayout>
  );
} 