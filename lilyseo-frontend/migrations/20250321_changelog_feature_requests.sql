-- Create changelog_item_type enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'changelog_item_type') THEN
        CREATE TYPE changelog_item_type AS ENUM (
            'Feature',
            'Improvement',
            'Bugfix',
            'Security',
            'Documentation',
            'Other'
        );
    END IF;
END
$$;

-- Create feature_request_status enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feature_request_status') THEN
        CREATE TYPE feature_request_status AS ENUM (
            'Submitted',
            'Under Review',
            'Planned',
            'In Development',
            'Completed',
            'Declined'
        );
    END IF;
END
$$;

-- Create changelog_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS changelog_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type changelog_item_type NOT NULL,
    version TEXT,
    release_date TIMESTAMPTZ,
    is_major BOOLEAN DEFAULT FALSE NOT NULL,
    created_by UUID REFERENCES auth.users(id)
);

-- Add index for faster querying
CREATE INDEX IF NOT EXISTS changelog_items_release_date_idx ON changelog_items(release_date);
CREATE INDEX IF NOT EXISTS changelog_items_type_idx ON changelog_items(type);

-- Create feature_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS feature_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status feature_request_status DEFAULT 'Submitted' NOT NULL,
    upvotes INTEGER DEFAULT 0 NOT NULL,
    planned_release TEXT,
    implemented_in UUID REFERENCES changelog_items(id),
    is_public BOOLEAN DEFAULT TRUE NOT NULL
);

-- Add indexes for faster querying
CREATE INDEX IF NOT EXISTS feature_requests_user_id_idx ON feature_requests(user_id);
CREATE INDEX IF NOT EXISTS feature_requests_status_idx ON feature_requests(status);
CREATE INDEX IF NOT EXISTS feature_requests_upvotes_idx ON feature_requests(upvotes);

-- Create feature_request_votes table to track who upvoted what
CREATE TABLE IF NOT EXISTS feature_request_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    feature_request_id UUID NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    UNIQUE(feature_request_id, user_id)
);

-- Add indexes for faster querying
CREATE INDEX IF NOT EXISTS feature_request_votes_feature_id_idx ON feature_request_votes(feature_request_id);
CREATE INDEX IF NOT EXISTS feature_request_votes_user_id_idx ON feature_request_votes(user_id);

-- Create feature_request_comments table for discussions
CREATE TABLE IF NOT EXISTS feature_request_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    feature_request_id UUID NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE NOT NULL
);

-- Add indexes for faster querying
CREATE INDEX IF NOT EXISTS feature_request_comments_feature_id_idx ON feature_request_comments(feature_request_id);
CREATE INDEX IF NOT EXISTS feature_request_comments_user_id_idx ON feature_request_comments(user_id);

-- Create functions to update updated_at columns
CREATE OR REPLACE FUNCTION update_changelog_item_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_feature_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_changelog_item_timestamp ON changelog_items;
CREATE TRIGGER update_changelog_item_timestamp
BEFORE UPDATE ON changelog_items
FOR EACH ROW
EXECUTE FUNCTION update_changelog_item_updated_at();

DROP TRIGGER IF EXISTS update_feature_request_timestamp ON feature_requests;
CREATE TRIGGER update_feature_request_timestamp
BEFORE UPDATE ON feature_requests
FOR EACH ROW
EXECUTE FUNCTION update_feature_request_updated_at();

-- Create a function to handle voting logic
CREATE OR REPLACE FUNCTION vote_for_feature_request(feature_request_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    already_voted BOOLEAN;
BEGIN
    -- Check if user has already voted for this feature request
    SELECT EXISTS (
        SELECT 1 FROM feature_request_votes
        WHERE feature_request_id = vote_for_feature_request.feature_request_id
        AND user_id = auth.uid()
    ) INTO already_voted;
    
    -- If user hasn't voted yet, add their vote
    IF NOT already_voted THEN
        -- Insert vote record
        INSERT INTO feature_request_votes (feature_request_id, user_id)
        VALUES (vote_for_feature_request.feature_request_id, auth.uid());
        
        -- Update upvote count
        UPDATE feature_requests
        SET upvotes = upvotes + 1
        WHERE id = vote_for_feature_request.feature_request_id;
        
        RETURN TRUE;
    ELSE
        -- User already voted, remove their vote
        DELETE FROM feature_request_votes
        WHERE feature_request_id = vote_for_feature_request.feature_request_id
        AND user_id = auth.uid();
        
        -- Update upvote count
        UPDATE feature_requests
        SET upvotes = upvotes - 1
        WHERE id = vote_for_feature_request.feature_request_id;
        
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if a user has voted for a feature
CREATE OR REPLACE FUNCTION has_voted_for_feature(feature_request_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM feature_request_votes
        WHERE feature_request_id = has_voted_for_feature.feature_request_id
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to link a feature request to a changelog item
CREATE OR REPLACE FUNCTION implement_feature_request(feature_request_id UUID, changelog_item_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user is an admin
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.role = 'admin') THEN
        RETURN FALSE;
    END IF;
    
    -- Update feature request to link to changelog item and mark as completed
    UPDATE feature_requests
    SET implemented_in = changelog_item_id,
        status = 'Completed'::feature_request_status
    WHERE id = feature_request_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set up RLS policies

-- Enable RLS on changelog_items
ALTER TABLE changelog_items ENABLE ROW LEVEL SECURITY;

-- Anyone can view public changelog items
CREATE POLICY "Anyone can view changelog items" ON changelog_items
    FOR SELECT
    USING (TRUE);

-- Only admins can insert, update, or delete changelog items
CREATE POLICY "Admins can manage changelog items" ON changelog_items
    FOR ALL
    USING (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.role = 'admin'));

-- Enable RLS on feature_requests
ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can view public feature requests
CREATE POLICY "Anyone can view public feature requests" ON feature_requests
    FOR SELECT
    USING (is_public OR auth.uid() = user_id OR 
          EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.role = 'admin'));

-- Users can create their own feature requests
CREATE POLICY "Users can create their own feature requests" ON feature_requests
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own feature requests, admins can update any
CREATE POLICY "Users can update their own feature requests" ON feature_requests
    FOR UPDATE
    USING ((auth.uid() = user_id AND status = 'Submitted') OR 
           EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.role = 'admin'));

-- Enable RLS on feature_request_votes
ALTER TABLE feature_request_votes ENABLE ROW LEVEL SECURITY;

-- Users can see their own votes and admins can see all votes
CREATE POLICY "Users can see their own votes" ON feature_request_votes
    FOR SELECT
    USING (auth.uid() = user_id OR 
          EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.role = 'admin'));

-- Users can insert their own votes
CREATE POLICY "Users can add their own votes" ON feature_request_votes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own votes
CREATE POLICY "Users can remove their own votes" ON feature_request_votes
    FOR DELETE
    USING (auth.uid() = user_id);

-- Enable RLS on feature_request_comments
ALTER TABLE feature_request_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can see public comments, only admins can see internal comments
CREATE POLICY "Anyone can see public comments" ON feature_request_comments
    FOR SELECT
    USING (NOT is_internal OR 
          EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.role = 'admin'));

-- Users can add their own comments
CREATE POLICY "Users can add their own comments" ON feature_request_comments
    FOR INSERT
    WITH CHECK (auth.uid() = user_id AND NOT is_internal);

-- Admins can add any comments, including internal ones
CREATE POLICY "Admins can add any comments" ON feature_request_comments
    FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.role = 'admin'));

-- Users can update their own comments, admins can update any
CREATE POLICY "Users can update their own comments" ON feature_request_comments
    FOR UPDATE
    USING ((auth.uid() = user_id) OR 
           EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.role = 'admin')); 