5. Backend Structure Document
5.1 Architectural Overview
API Layer (Node + Express/NestJS):
Routes for user authentication, SEO audits, competitor analysis, subscription management.
Integrates with AI API for generating SEO recommendations.
Database (Supabase / PostgreSQL):
Tables for Users, Subscriptions, Audit Reports, Competitor Data, etc.
Real-time data and authentication features leveraged from Supabase.
5.2 Database Schema (Example)
diff
Copy
Edit
Table: users
- id (uuid)
- email (string)
- password_hash (string)
- subscription_level (string)  // free, premium
- created_at (timestamp)
- updated_at (timestamp)

Table: audit_reports
- id (uuid)
- user_id (uuid)  // references users.id
- url (string)
- report_data (jsonb)
- created_at (timestamp)

Table: competitor_data
- id (uuid)
- user_id (uuid)
- competitor_url (string)
- analysis_data (jsonb)
- created_at (timestamp)
5.3 Key Modules
Auth Module: JWT-based or Supabase Auth.
Audit Module:
Receives user’s site URL, performs crawl & analysis.
Saves results in audit_reports.
AI Module:
Communicates with external LLM API for recommendations.
Caches results to minimize repeated calls.
Payment & Subscription Module:
Manages plan tiers, billing cycles, usage limits.
Admin Module:
Dashboard for managing all user data, subscriptions, analytics.
5.4 Security
HTTPS everywhere
Input Validation: Sanitizing user input to prevent injection.
Rate Limiting: To prevent abuse of SEO crawling and AI endpoints.