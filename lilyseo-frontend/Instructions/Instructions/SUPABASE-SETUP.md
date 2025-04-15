# Supabase Setup Instructions

This document provides instructions on how to set up Supabase for the LilySEO project.

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- A Supabase project created

## Environment Variables

Add the following environment variables to your `.env.local` file:

```
# Supabase Database Connection
DATABASE_URL=postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-eu-west-2.pooler.supabase.com:6543/postgres

# Supabase Client
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-SUPABASE-ANON-KEY]
```

Replace the placeholders with your actual values:
- `[YOUR-PROJECT-REF]`: Your Supabase project reference
- `[YOUR-PASSWORD]`: Your Supabase database password
- `[YOUR-SUPABASE-ANON-KEY]`: Your Supabase anon key

## Connection Types

Supabase offers different connection types:

1. **Direct Connection**: Ideal for applications with persistent, long-lived connections.
   ```
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```

2. **Transaction Pooler**: Ideal for serverless functions where each interaction with Postgres is brief.
   ```
   DATABASE_URL=postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-eu-west-2.pooler.supabase.com:6543/postgres
   ```

3. **Session Pooler**: Alternative to Direct Connection when connecting via an IPv4 network.
   ```
   DATABASE_URL=postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-eu-west-2.pooler.supabase.com:5432/postgres
   ```

## Usage in the Application

### Using the Supabase Client

```javascript
import supabase from '@/lib/supabase';

// Example query
const { data, error } = await supabase
  .from('your_table')
  .select('*')
  .limit(10);
```

### Using Direct SQL Queries

```javascript
import sql from '@/lib/db';

// Example query
const result = await sql`SELECT * FROM your_table LIMIT 10`;
```

## Testing the Connection

Run the test script to verify the connection:

```bash
node test-supabase-client.js
```

Make sure to replace `'your_table_name'` in the test script with an actual table name from your Supabase project. 