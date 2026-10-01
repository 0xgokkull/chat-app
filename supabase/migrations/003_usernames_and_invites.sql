-- 003_usernames_and_invites.sql

-- 1. Add username to profiles
ALTER TABLE public.profiles ADD COLUMN username text UNIQUE;

-- Create an index on username for fast searching
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- 2. Add invite_code to groups for generating invite links
ALTER TABLE public.groups ADD COLUMN invite_code text UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex');

-- Create an index on invite_code for fast joining
CREATE INDEX idx_groups_invite_code ON public.groups(invite_code);

-- 3. Create connections table
CREATE TYPE public.connection_status AS ENUM ('pending', 'accepted', 'rejected');

CREATE TABLE public.connections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status public.connection_status DEFAULT 'pending' NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(requester_id, recipient_id) -- Prevent duplicate requests
);

-- Enable RLS on connections
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- Connections RLS Policies
-- Users can view their own connections (either they requested or received)
CREATE POLICY "Users can view their own connections" ON public.connections
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- Users can insert (send) connection requests
CREATE POLICY "Users can send connection requests" ON public.connections
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- Recipients can update connection status (accept/reject)
CREATE POLICY "Recipients can update connection status" ON public.connections
  FOR UPDATE USING (auth.uid() = recipient_id);

-- 4. Allow users to search profiles by username (public read access is already enabled in 002_rls.sql, but let's be sure)
-- "Public profiles are viewable by everyone" is already there.

-- 5. Add a policy for joining groups via invite link
-- Anyone can view a group if they have the invite code (handled in application logic before insert).
-- We need to ensure users can insert themselves into group_members if they are joining.
-- The policy "Users can join groups" in 002_rls.sql is: FOR INSERT WITH CHECK (auth.role() = 'authenticated'); 
-- So joining via invite link is already permitted by RLS, the UI just needs to insert the row.

-- 6. Trigger for updated_at on connections
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$ language 'plpgsql';

CREATE TRIGGER update_connections_modtime
BEFORE UPDATE ON public.connections
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
