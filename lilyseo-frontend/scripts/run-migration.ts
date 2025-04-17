import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Get the SQL file path from command line arguments
const sqlFilePath = process.argv[2];

if (!sqlFilePath) {
  console.error('Error: SQL file path is required');
  console.log('Usage: npx ts-node scripts/run-migration.ts <path-to-sql-file>');
  process.exit(1);
}

// Resolve the absolute path of the SQL file
const resolvedPath = path.resolve(process.cwd(), sqlFilePath);

// Check if the file exists
if (!fs.existsSync(resolvedPath)) {
  console.error(`Error: SQL file not found at ${resolvedPath}`);
  process.exit(1);
}

// Read the SQL file content
console.log(`Reading SQL file: ${resolvedPath}`);
const sqlContent = fs.readFileSync(resolvedPath, 'utf8');
console.log('SQL content:', sqlContent);

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL and key are required. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Execute the SQL migration
async function runMigration() {
  try {
    console.log('Running migration...');
    
    // Split the SQL content into separate statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    // Execute each statement separately
    for (const [index, stmt] of statements.entries()) {
      console.log(`Executing statement ${index + 1}/${statements.length}`);
      
      const { data, error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });
      
      if (error) {
        console.error(`Error executing statement ${index + 1}:`, error.message);
        if (error.message.includes('function "exec_sql" does not exist')) {
          console.log('Creating exec_sql function...');
          await createExecSqlFunction();
          
          // Retry the statement
          console.log('Retrying statement...');
          const { error: retryError } = await supabase.rpc('exec_sql', { sql: stmt + ';' });
          
          if (retryError) {
            throw new Error(`Failed to execute statement: ${retryError.message}`);
          }
        } else {
          throw error;
        }
      } else {
        console.log(`Statement ${index + 1} executed successfully`);
      }
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Create the exec_sql function if it doesn't exist
async function createExecSqlFunction() {
  const createFunctionSql = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  
  const { error } = await supabase.rpc(
    'pg_exec',
    { command: createFunctionSql }
  );
  
  if (error) {
    // If pg_exec doesn't exist either, we need to use the SQL editor directly
    console.error('Could not create exec_sql function automatically');
    console.error('Please create the function manually in the Supabase SQL editor:');
    console.error(createFunctionSql);
    throw new Error('Migration requires manual intervention');
  }
}

// Run the migration
runMigration(); 