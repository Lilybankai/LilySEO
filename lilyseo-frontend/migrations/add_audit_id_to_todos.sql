-- Add auditId column to the todos table
-- This migration adds the auditId column to associate todos with specific audits

-- Check if the column already exists to avoid errors
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'todos' AND column_name = 'auditId'
    ) THEN
        -- Add the auditId column
        ALTER TABLE todos ADD COLUMN "auditId" uuid REFERENCES audit_reports(id) ON DELETE SET NULL;
        
        -- Add an index for better query performance
        CREATE INDEX idx_todos_audit_id ON todos("auditId");
        
        -- Create a function to add todo items with auditId handling
        CREATE OR REPLACE FUNCTION public.add_todo_item(
            user_id uuid, 
            project_id uuid, 
            audit_id uuid, 
            title text, 
            description text, 
            status text, 
            priority text, 
            created_at timestamptz, 
            updated_at timestamptz
        ) 
        RETURNS TABLE (
            id uuid,
            user_id uuid,
            project_id uuid,
            "auditId" uuid,
            title text,
            description text,
            status text,
            priority text,
            created_at timestamptz,
            updated_at timestamptz,
            due_date timestamptz
        ) 
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $function$
        BEGIN
            RETURN QUERY
            INSERT INTO public.todos (
                user_id, 
                project_id, 
                "auditId", 
                title, 
                description, 
                status, 
                priority, 
                created_at, 
                updated_at
            ) VALUES (
                user_id, 
                project_id, 
                audit_id, 
                title, 
                description, 
                status, 
                priority, 
                created_at, 
                updated_at
            )
            RETURNING *;
        END;
        $function$;
        
        RAISE NOTICE 'Added auditId column to todos table';
    ELSE
        RAISE NOTICE 'auditId column already exists in todos table';
    END IF;
END $$;

-- Add RLS policies for the todos table if they don't exist
DO $$ 
BEGIN
    -- Check if RLS is enabled
    IF NOT EXISTS (
        SELECT FROM pg_tables 
        WHERE tablename = 'todos' AND rowsecurity = true
    ) THEN
        -- Enable row level security
        ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Add policies if they don't exist
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'todos' AND policyname = 'todos_select_policy'
    ) THEN
        -- Policy for SELECT
        CREATE POLICY todos_select_policy ON todos 
            FOR SELECT 
            USING (auth.uid() = user_id);
            
        -- Policy for INSERT
        CREATE POLICY todos_insert_policy ON todos 
            FOR INSERT 
            WITH CHECK (auth.uid() = user_id);
            
        -- Policy for UPDATE
        CREATE POLICY todos_update_policy ON todos 
            FOR UPDATE 
            USING (auth.uid() = user_id);
            
        -- Policy for DELETE
        CREATE POLICY todos_delete_policy ON todos 
            FOR DELETE 
            USING (auth.uid() = user_id);
            
        RAISE NOTICE 'Added RLS policies to todos table';
    ELSE
        RAISE NOTICE 'RLS policies already exist for todos table';
    END IF;
END $$; 