-- Create support_ticket_categories enum type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'support_ticket_category') THEN
        CREATE TYPE support_ticket_category AS ENUM (
            'Account',
            'Billing',
            'Technical',
            'Feature Request',
            'Bug',
            'Other'
        );
    END IF;
END
$$;

-- Create support_ticket_status enum type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'support_ticket_status') THEN
        CREATE TYPE support_ticket_status AS ENUM (
            'Open',
            'In Progress',
            'Resolved',
            'Closed'
        );
    END IF;
END
$$;

-- Create support_tickets table if it doesn't exist
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category support_ticket_category NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status support_ticket_status DEFAULT 'Open' NOT NULL,
    assigned_to UUID REFERENCES auth.users(id),
    priority INTEGER DEFAULT 0 NOT NULL,
    resolved_at TIMESTAMPTZ
);

-- Add indexes for faster querying
CREATE INDEX IF NOT EXISTS support_tickets_user_id_idx ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON support_tickets(status);
CREATE INDEX IF NOT EXISTS support_tickets_assigned_to_idx ON support_tickets(assigned_to);

-- Create support_ticket_replies table if it doesn't exist
CREATE TABLE IF NOT EXISTS support_ticket_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    support_ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE NOT NULL
);

-- Add indexes for faster querying
CREATE INDEX IF NOT EXISTS support_ticket_replies_ticket_id_idx ON support_ticket_replies(support_ticket_id);
CREATE INDEX IF NOT EXISTS support_ticket_replies_user_id_idx ON support_ticket_replies(user_id);

-- Create a function to update the updated_at timestamp whenever a support ticket is modified
CREATE OR REPLACE FUNCTION update_support_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on support_tickets
DROP TRIGGER IF EXISTS update_support_ticket_timestamp ON support_tickets;
CREATE TRIGGER update_support_ticket_timestamp
BEFORE UPDATE ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION update_support_ticket_updated_at();

-- Create trigger to update parent ticket's updated_at timestamp when a reply is added
CREATE OR REPLACE FUNCTION update_parent_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE support_tickets
    SET updated_at = now()
    WHERE id = NEW.support_ticket_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_parent_ticket_trigger ON support_ticket_replies;
CREATE TRIGGER update_parent_ticket_trigger
AFTER INSERT ON support_ticket_replies
FOR EACH ROW
EXECUTE FUNCTION update_parent_ticket_timestamp();

-- Create Row Level Security (RLS) policies for support_tickets

-- Enable RLS on support_tickets
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can see their own tickets, admins can see all tickets
CREATE POLICY "Users can view their own tickets" ON support_tickets
    FOR SELECT
    USING ((auth.uid() = user_id) OR 
           (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.role = 'admin')));

-- Users can insert their own tickets
CREATE POLICY "Users can create their own tickets" ON support_tickets
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Only the ticket creator or admins can update tickets
CREATE POLICY "Users can update their own tickets" ON support_tickets
    FOR UPDATE
    USING ((auth.uid() = user_id) OR 
           (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.role = 'admin')));

-- Enable RLS on support_ticket_replies
ALTER TABLE support_ticket_replies ENABLE ROW LEVEL SECURITY;

-- Users can see replies to their own tickets, admins can see all replies
CREATE POLICY "Users can view replies to their own tickets" ON support_ticket_replies
    FOR SELECT
    USING ((auth.uid() IN (SELECT user_id FROM support_tickets WHERE id = support_ticket_id)) OR 
           (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.role = 'admin')));

-- Users can insert replies to their own tickets, admins can reply to any ticket
CREATE POLICY "Users can reply to their own tickets" ON support_ticket_replies
    FOR INSERT
    WITH CHECK ((auth.uid() IN (SELECT user_id FROM support_tickets WHERE id = support_ticket_id)) OR 
                (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.role = 'admin')));

-- Set up functions for admin users
-- Create a function to assign a support ticket to a staff member
CREATE OR REPLACE FUNCTION assign_support_ticket(ticket_id UUID, staff_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user is an admin
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.role = 'admin') THEN
        RETURN FALSE;
    END IF;
    
    -- Update ticket assignment
    UPDATE support_tickets
    SET assigned_to = staff_id, 
        status = CASE WHEN status = 'Open' THEN 'In Progress'::support_ticket_status ELSE status END
    WHERE id = ticket_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to resolve a support ticket
CREATE OR REPLACE FUNCTION resolve_support_ticket(ticket_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user is an admin or the ticket is assigned to them
    IF NOT EXISTS (
        SELECT 1 
        FROM support_tickets 
        WHERE id = ticket_id AND 
              (auth.uid() = assigned_to OR 
               EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.role = 'admin'))
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Update ticket status
    UPDATE support_tickets
    SET status = 'Resolved'::support_ticket_status,
        resolved_at = now()
    WHERE id = ticket_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 