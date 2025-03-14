# Database Migrations

This folder contains SQL migration files for the LilySEO application. These migrations should be applied in order to set up the database schema in Supabase.

## Migration Files

1. `00_extensions.sql` - Enables the UUID extension required for generating UUIDs.
2. `01_initial_schema.sql` - Creates the initial database schema with tables for users, projects, audit reports, etc.
3. `02_stripe_subscriptions.sql` - Creates tables for Stripe subscription integration.

## How to Apply Migrations

You can apply these migrations in the Supabase dashboard:

1. Go to the SQL Editor in your Supabase project.
2. Copy the contents of each migration file.
3. Paste the SQL into the editor.
4. Click "Run" to execute the SQL.

Make sure to run the migrations in the correct order (00, 01, 02, etc.).

## Database Schema

The database schema includes the following tables:

- `users` - User accounts and profiles
- `projects` - SEO projects created by users
- `audit_reports` - SEO audit reports for projects
- `competitor_data` - Competitor analysis data
- `todos` - SEO tasks and to-dos
- `notifications` - User notifications
- `api_keys` - API keys for accessing the API
- `white_label` - White label settings for reports
- `subscriptions` - User subscription information
- `subscription_items` - Items within subscriptions
- `plans` - Available subscription plans

## Row Level Security (RLS)

All tables have Row Level Security (RLS) enabled to ensure that users can only access their own data. The policies are set up to:

- Allow users to view and update their own data
- Prevent users from accessing other users' data
- Allow public access to certain data (e.g., subscription plans)

## Indexes

Indexes are created on foreign key columns to improve query performance. 