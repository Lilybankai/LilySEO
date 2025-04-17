# LilySEO Layout Structure and Navigation

## Overview

This document outlines the layout structure of the LilySEO application, detailing how navigation, headers, and content areas are organized throughout the application.

## Layout Hierarchy

### 1. Root Layout (`src/app/layout.tsx`)

The Root Layout is the top-level layout component that wraps the entire application. It contains:

- Font definitions using Geist Sans and Geist Mono
- Global CSS imports
- Query Provider for React Query
- HTML and body structure

```jsx
<html lang="en" suppressHydrationWarning>
  <body className={`${GeistSans.variable} ${GeistMono.variable} min-h-screen bg-background font-sans antialiased`}>
    <QueryProvider>
      {children}
    </QueryProvider>
  </body>
</html>
```

### 2. Dashboard Layout (`src/components/layout/dashboard-layout.tsx`)

The Dashboard Layout is used for authenticated user pages and provides:

- Sidebar navigation with collapsible sections
- Top navigation bar with notifications and user profile
- Responsive design with mobile toggle
- Access control for premium features

```jsx
<DashboardLayout>
  {/* Page content */}
</DashboardLayout>
```

## Navigation Structure

The sidebar navigation is organized into logical sections:

1. **Core Features**
   - Dashboard
   - Projects

2. **SEO Features**
   - SEO Audits
   - Competitors
   - Reports

3. **Task Management**
   - Tasks & Todos (with subitems):
     - Kanban Board
     - Calendar
     - Time Tracking
     - Metrics

4. **Team Features**
   - Team Management (with subitems):
     - Team Members
     - Task Assignments

5. **Lead Generation**
   - Lead Finder (Enterprise only)

## Implementation Best Practices

When creating new pages:

1. Always wrap page content with the appropriate layout component:

```jsx
export default function MyNewPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        {/* Page content */}
      </div>
    </DashboardLayout>
  );
}
```

2. Follow consistent container and spacing patterns:

```jsx
<div className="container mx-auto py-6 space-y-8">
  {/* Content with consistent spacing */}
</div>
```

3. Use metadata for proper page titles and descriptions:

```jsx
export const metadata: Metadata = {
  title: 'Page Title - LilySEO',
  description: 'Description for SEO purposes',
};
```

## Authentication Integration

The Dashboard layout includes authentication checks:

- Redirects unauthenticated users to the login page
- Checks feature access based on subscription level
- Displays appropriate icons for premium features

## Responsive Design Considerations

The layout system implements responsive behavior:

- Collapsible sidebar on mobile devices with toggle button
- Adjusted spacing and sizing for different viewport sizes
- Responsive container classes that adapt to screen width 