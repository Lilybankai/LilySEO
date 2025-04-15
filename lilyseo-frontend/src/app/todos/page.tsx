import React from 'react';
import { Metadata } from 'next';
import { TodosPage } from '@/components/todos/todos-page';

export const metadata: Metadata = {
  title: 'Todos & Action Items - LilySEO',
  description: 'Manage your SEO tasks and action items in an interactive kanban board.',
};

export default function TodosRoute() {
  return <TodosPage />;
} 