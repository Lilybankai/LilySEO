-- Add new columns to projects table if they don't exist
DO $$
BEGIN
    -- Add crawl_frequency column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'projects' 
                   AND column_name = 'crawl_frequency') THEN
        ALTER TABLE public.projects 
        ADD COLUMN crawl_frequency TEXT NOT NULL DEFAULT 'monthly' 
        CHECK (crawl_frequency IN ('monthly', 'weekly', 'daily'));
    END IF;

    -- Add crawl_depth column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'projects' 
                   AND column_name = 'crawl_depth') THEN
        ALTER TABLE public.projects 
        ADD COLUMN crawl_depth INTEGER NOT NULL DEFAULT 3;
    END IF;

    -- Add description column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'projects' 
                   AND column_name = 'description') THEN
        ALTER TABLE public.projects 
        ADD COLUMN description TEXT;
    END IF;

    -- Add keywords column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'projects' 
                   AND column_name = 'keywords') THEN
        ALTER TABLE public.projects 
        ADD COLUMN keywords TEXT[];
    END IF;

    -- Add competitors column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'projects' 
                   AND column_name = 'competitors') THEN
        ALTER TABLE public.projects 
        ADD COLUMN competitors TEXT[];
    END IF;
END $$; 