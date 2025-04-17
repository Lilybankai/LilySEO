# LilySEO New Features Documentation

This document provides detailed information about the new features implemented in the LilySEO platform.

## Table of Contents

1. [Enhanced Project Creation](#enhanced-project-creation)
2. [Industry Selection](#industry-selection)
3. [Template System](#template-system)
4. [AI Recommendations](#ai-recommendations)
5. [Google Search Console Integration](#google-search-console-integration)
6. [Subscription-Aware Features](#subscription-aware-features)
7. [Environment Variables](#environment-variables)

## Enhanced Project Creation

The project creation process has been significantly enhanced to provide a more intuitive and feature-rich experience for users.

### Key Features

- **Guided Setup**: A step-by-step wizard for first-time users
- **Advanced Options**: Detailed configuration for experienced users
- **Subscription Awareness**: Features are enabled/disabled based on the user's subscription tier
- **AI Integration**: Intelligent recommendations based on the website URL and industry
- **Template System**: Pre-configured settings for different industries and website types
- **Google Search Console Integration**: Import data directly from Google Search Console

### Implementation Details

The enhanced project creation form is implemented in `src/components/projects/new-project-form.tsx`. It uses React Hook Form with Zod for validation and integrates with various components to provide a comprehensive project setup experience.

## Industry Selection

The industry selection component allows users to categorize their website, which helps in providing industry-specific recommendations and templates.

### Key Features

- **Hierarchical Categories**: Industries are organized into categories and subcategories
- **Search Functionality**: Users can search for specific industries
- **Visual Feedback**: Selected industry is clearly displayed with a badge
- **Integration with AI**: Selected industry is used to generate relevant recommendations

### Implementation Details

The industry selection component is implemented in `src/components/projects/industry-select.tsx`. It uses the Command component from shadcn/ui for the dropdown and search functionality.

```typescript
// Example usage
<IndustrySelect 
  value={industry} 
  onChange={setIndustry} 
  disabled={isSubmitting}
/>
```

## Template System

The template system allows users to quickly apply pre-configured settings based on their industry or website type.

### Key Features

- **Industry-Specific Templates**: Templates are filtered based on the selected industry
- **Visual Preview**: Users can see what settings each template includes
- **One-Click Apply**: Apply all template settings with a single click
- **Customization**: Users can still modify settings after applying a template

### Implementation Details

The template selection component is implemented in `src/components/projects/template-select.tsx`. Templates are defined with the following structure:

```typescript
{
  id: 'template-id',
  name: 'Template Name',
  description: 'Template description',
  industry: 'Industry Category',
  settings: {
    crawl_frequency: 'weekly',
    crawl_depth: 3,
    keywords: ['keyword1', 'keyword2'],
    competitors: ['competitor1.com', 'competitor2.com'],
  },
}
```

Templates are stored in the `project_templates` table in the database, with row-level security policies to ensure users can only access their own templates.

## AI Recommendations

The AI recommendations feature provides intelligent suggestions based on the website URL and selected industry.

### Key Features

- **URL Analysis**: Recommendations are generated based on the website URL
- **Industry Context**: Industry selection is used to provide more relevant recommendations
- **Multiple Recommendation Types**: Keywords, competitors, crawl settings, and general recommendations
- **Confidence Levels**: Each recommendation includes a confidence level (high, medium, low)
- **Apply/Dismiss Actions**: Users can apply or dismiss individual recommendations

### Implementation Details

The recommendations display component is implemented in `src/components/projects/recommendations-display.tsx`. It fetches recommendations from the AI service and displays them in a collapsible panel.

The AI service is implemented with Azure OpenAI and includes the following endpoints:

- `/api/ai/recommendations`: Generates recommendations based on URL and industry
- `/api/ai/detect-industry`: Automatically detects the industry based on the URL

## Google Search Console Integration

The Google Search Console integration allows users to import data directly from their Google Search Console account.

### Key Features

- **OAuth Authentication**: Secure authentication with Google's OAuth 2.0
- **Site Selection**: Users can select which site to import data from
- **Data Import**: Import keywords and URL data from Search Console
- **Connection Management**: Connect and disconnect Search Console accounts

### Implementation Details

The Search Console button component is implemented in `src/components/projects/search-console-button.tsx`. It provides a dialog for connecting to Google Search Console and importing data.

The backend integration includes the following endpoints:

- `/api/google/auth`: Generates the OAuth URL for connecting to Google
- `/api/google/callback`: Handles the OAuth callback and stores the tokens

Connections are stored in the `google_search_console_connections` table in the database, with row-level security policies to ensure users can only access their own connections.

## Subscription-Aware Features

The platform now includes subscription awareness, which enables or disables features based on the user's subscription tier.

### Key Features

- **Tiered Access**: Features are available based on subscription tier (free, pro, enterprise)
- **Usage Limits**: Limits on projects, keywords, and competitors based on subscription
- **Upgrade Prompts**: Users are prompted to upgrade when they reach their limits
- **Subscription Management**: Users can view and manage their subscription

### Implementation Details

The subscription hook is implemented in `src/hooks/use-subscription.ts`. It fetches the user's subscription data from the database and provides it to components that need to check subscription status.

```typescript
// Example usage
const { subscription, isLoading } = useSubscription()

// Check if user has reached their project limit
const hasReachedProjectLimit = !isLoading && 
  subscription?.project_limit !== null && 
  subscription?.project_count >= subscription.project_limit
```

## Environment Variables

The following environment variables need to be configured for the new features to work properly:

### Azure OpenAI (for AI recommendations)

```
AZURE_OPENAI_ENDPOINT=your-azure-openai-endpoint
AZURE_OPENAI_API_KEY=your-azure-openai-api-key
AZURE_OPENAI_DEPLOYMENT_NAME=your-azure-openai-deployment-name
```

### Google OAuth (for Search Console integration)

```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_APP_URL=your-app-url  # Used for the OAuth redirect URI
```

## Database Schema Updates

The following database tables have been added to support the new features:

### project_templates

Stores project templates that users can apply when creating a new project.

```sql
CREATE TABLE IF NOT EXISTS public.project_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  organization_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_data JSONB NOT NULL,
  industry TEXT,
  is_default BOOLEAN DEFAULT FALSE
);
```

### google_search_console_connections

Stores connections to Google Search Console for importing data.

```sql
CREATE TABLE IF NOT EXISTS public.google_search_console_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMP WITH TIME ZONE NOT NULL,
  site_url TEXT NOT NULL
);
```

### projects (updated)

The projects table has been updated to include the following new fields:

- `industry`: The industry category of the project
- `keywords`: Array of keywords to track
- `competitors`: Array of competitor websites to track
- `crawl_frequency`: How often to crawl the website (daily, weekly, monthly)
- `crawl_depth`: How many levels deep to crawl the website 