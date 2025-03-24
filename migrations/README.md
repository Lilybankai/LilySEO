# LilySEO Database Migrations

This directory contains all the SQL migration files necessary to set up and update the database schema for LilySEO.

## How to Run Migrations

To run all migrations in the correct order, execute the master migration file:

```sql
psql -U postgres -d your_database_name -f 00000000000000_run_all_migrations.sql
```

Or within Supabase, you can run each migration individually in the SQL editor in the following order:

1. `20250321_update_profiles.sql`
2. `20250321_support_tickets.sql`
3. `20250321_changelog_feature_requests.sql`
4. `20250321_api_access.sql`
5. `20250321_white_label.sql`

## Database Schema

### Profiles Table

The main user profile table with the following key fields:
- `id`: UUID (references auth.users)
- `first_name`, `last_name`: User's name
- `full_name`: Automatically generated from first and last name
- `avatar_url`: Profile image URL
- `company`, `job_title`, `website`: Professional details
- `subscription_tier`: 'free', 'pro', or 'enterprise'
- `subscription_status`: 'active', 'trialing', 'canceled', etc.

### Support Tickets

Tables:
- `support_tickets`: Stores support tickets submitted by users
- `support_ticket_replies`: Stores replies to support tickets

Key features:
- Status tracking ('Open', 'In Progress', 'Resolved', 'Closed')
- Ticket assignment to staff members
- Priority levels
- Internal replies visible only to staff

### Changelog & Feature Requests

Tables:
- `changelog_items`: Stores product updates and new features
- `feature_requests`: Stores feature requests from users
- `feature_request_votes`: Tracks user votes on feature requests
- `feature_request_comments`: Stores discussion on feature requests

Key features:
- Upvoting system for feature requests
- Status tracking for feature requests
- Linkage between implemented features and changelog items
- Comment threads on feature requests

### API Access

Tables:
- `api_keys`: Stores API keys for users
- `api_usage`: Tracks API usage
- `api_rate_limits`: Defines rate limits per subscription tier

Key features:
- API key generation and management
- Usage tracking and rate limiting
- Scoped access control
- Origin restrictions

### White Label

Tables:
- `white_label_settings`: Stores branding customization settings

Key features:
- Custom branding (logo, colors, domain)
- Email template customization
- PDF report styling
- Navigation and footer customization

## Security Model

All tables utilize Postgres Row Level Security (RLS) to ensure:
- Users can only access their own data
- Admin users have elevated access where appropriate
- Functions use SECURITY DEFINER to execute with elevated privileges when necessary

## Storage Buckets

The migrations also set up the following storage buckets:
- `avatars`: For user profile pictures
- `white-label`: For custom logos and branding assets 