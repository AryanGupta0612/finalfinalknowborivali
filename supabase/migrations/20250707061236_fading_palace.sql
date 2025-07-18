/*
  # Enhanced Features for Know Borivali

  1. New Tables
    - `resource_votes` - Track helpful/unhelpful votes for resources
    - `resource_edits` - Track pending edits in fugue state
    - `visitor_tracking` - Global unique visitor counter
    - `verification_votes` - Track verification votes for pending resources

  2. Updates to existing tables
    - Add verification status and vote counts to resources table

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for public access
*/

-- Add new columns to resources table
ALTER TABLE resources ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'live' CHECK (verification_status IN ('live', 'pending', 'rejected'));
ALTER TABLE resources ADD COLUMN IF NOT EXISTS helpful_votes integer DEFAULT 0;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS unhelpful_votes integer DEFAULT 0;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS verification_votes integer DEFAULT 0;

-- Create resource_votes table for tracking helpful/unhelpful votes
CREATE TABLE IF NOT EXISTS resource_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid REFERENCES resources(id) ON DELETE CASCADE,
  voter_ip text NOT NULL,
  vote_type text NOT NULL CHECK (vote_type IN ('helpful', 'unhelpful')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(resource_id, voter_ip)
);

-- Create resource_edits table for pending edits
CREATE TABLE IF NOT EXISTS resource_edits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_resource_id uuid REFERENCES resources(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  category text NOT NULL,
  address text NOT NULL,
  contact text,
  email text,
  website text,
  description text,
  rating numeric DEFAULT 4.0 CHECK (rating >= 1 AND rating <= 5),
  status text DEFAULT 'Open' CHECK (status IN ('Open', 'Closed', 'Open 24/7')),
  hours text,
  services text[],
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  verification_votes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create visitor_tracking table for global visitor count
CREATE TABLE IF NOT EXISTS visitor_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_ip text NOT NULL,
  user_agent text,
  first_visit timestamptz DEFAULT now(),
  last_visit timestamptz DEFAULT now(),
  visit_count integer DEFAULT 1,
  UNIQUE(visitor_ip)
);

-- Create verification_votes table for pending resource verification
CREATE TABLE IF NOT EXISTS verification_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid,
  edit_id uuid,
  voter_ip text NOT NULL,
  vote_type text NOT NULL CHECK (vote_type IN ('helpful', 'unhelpful')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(resource_id, voter_ip),
  UNIQUE(edit_id, voter_ip),
  CHECK ((resource_id IS NOT NULL AND edit_id IS NULL) OR (resource_id IS NULL AND edit_id IS NOT NULL))
);

-- Enable RLS on new tables
ALTER TABLE resource_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_votes ENABLE ROW LEVEL SECURITY;

-- Create policies for resource_votes
CREATE POLICY "Anyone can read resource votes"
  ON resource_votes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert resource votes"
  ON resource_votes
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create policies for resource_edits
CREATE POLICY "Anyone can read pending edits"
  ON resource_edits
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert edits"
  ON resource_edits
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update edit verification"
  ON resource_edits
  FOR UPDATE
  TO public
  USING (true);

-- Create policies for visitor_tracking
CREATE POLICY "Anyone can read visitor count"
  ON visitor_tracking
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert visitor data"
  ON visitor_tracking
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update visitor data"
  ON visitor_tracking
  FOR UPDATE
  TO public
  USING (true);

-- Create policies for verification_votes
CREATE POLICY "Anyone can read verification votes"
  ON verification_votes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert verification votes"
  ON verification_votes
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Enable real-time for resources table (for vote counts)
alter publication supabase_realtime add table resources;

-- Create function to get total unique visitors
CREATE OR REPLACE FUNCTION get_total_visitors()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(COUNT(DISTINCT visitor_ip), 0)::integer FROM visitor_tracking;
$$;

-- Create function to update resource votes
CREATE OR REPLACE FUNCTION update_resource_votes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'helpful' THEN
      UPDATE resources 
      SET helpful_votes = helpful_votes + 1 
      WHERE id = NEW.resource_id;
    ELSE
      UPDATE resources 
      SET unhelpful_votes = unhelpful_votes + 1 
      WHERE id = NEW.resource_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for resource votes
DROP TRIGGER IF EXISTS trigger_update_resource_votes ON resource_votes;
CREATE TRIGGER trigger_update_resource_votes
  AFTER INSERT ON resource_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_resource_votes();

-- Create function to handle verification votes
CREATE OR REPLACE FUNCTION handle_verification_vote()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.vote_type = 'helpful' THEN
    -- Update verification votes count
    IF NEW.resource_id IS NOT NULL THEN
      UPDATE resources 
      SET verification_votes = verification_votes + 1 
      WHERE id = NEW.resource_id;
      
      -- Check if resource should be approved (3+ helpful votes)
      UPDATE resources 
      SET verification_status = 'live', approved = true
      WHERE id = NEW.resource_id AND verification_votes >= 3 AND verification_status = 'pending';
    END IF;
    
    IF NEW.edit_id IS NOT NULL THEN
      UPDATE resource_edits 
      SET verification_votes = verification_votes + 1 
      WHERE id = NEW.edit_id;
      
      -- Check if edit should be approved (3+ helpful votes)
      UPDATE resource_edits 
      SET verification_status = 'approved'
      WHERE id = NEW.edit_id AND verification_votes >= 3 AND verification_status = 'pending';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for verification votes
DROP TRIGGER IF EXISTS trigger_handle_verification_vote ON verification_votes;
CREATE TRIGGER trigger_handle_verification_vote
  AFTER INSERT ON verification_votes
  FOR EACH ROW
  EXECUTE FUNCTION handle_verification_vote();