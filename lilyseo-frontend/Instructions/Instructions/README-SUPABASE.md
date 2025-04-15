# Supabase Setup Instructions

## Database Schema Setup

1. Create a new Supabase project at [https://app.supabase.com/](https://app.supabase.com/)
2. Once your project is created, go to the SQL Editor
3. Create a new query and paste the contents of `lib/database-schema.sql`
4. Run the query to create all the necessary tables and policies
5. Verify that the tables have been created by checking the Table Editor

## Authentication Setup

1. Go to Authentication > Settings
2. Enable Email/Password sign-in method
3. Configure email templates for confirmation, invitation, and password reset
4. (Optional) Set up additional providers like Google, GitHub, etc.

## API Keys

1. Go to Project Settings > API
2. Copy the URL and anon/public key to your `.env.local` file:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
3. Copy the service role key (keep this secret, server-side only):
   ```
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ```

## Row Level Security (RLS)

The SQL script already sets up Row Level Security policies for all tables. These policies ensure that:

- Users can only access their own data
- Users cannot access other users' data
- Authentication is required for most operations

## Triggers and Functions

For automatic updates to the `updated_at` column, you can add the following function and triggers:

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to all tables
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_audit_reports_updated_at
BEFORE UPDATE ON public.audit_reports
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_white_label_settings_updated_at
BEFORE UPDATE ON public.white_label_settings
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
``` 