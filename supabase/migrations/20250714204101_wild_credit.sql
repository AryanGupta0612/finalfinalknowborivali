/*
  # Vote Counting System Implementation

  1. Database Functions
    - `get_total_visitors()` - Returns total unique visitor count
    - `update_resource_votes()` - Updates vote counts when votes are cast
    - `handle_verification_vote()` - Handles verification voting logic

  2. Triggers
    - Auto-update vote counts when votes are inserted
    - Handle verification vote processing

  3. Security
    - Proper RLS policies for all vote tables
    - Public access for voting operations

  4. Vote Count Columns
    - Ensure all resources have proper vote counting columns
    - Default values and constraints
*/

-- Create function to get total visitors
CREATE OR REPLACE FUNCTION get_total_visitors()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM visitor_tracking);
END;
$$ LANGUAGE plpgsql;

-- Create function to update resource vote counts
CREATE OR REPLACE FUNCTION update_resource_votes()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the resource vote counts
  UPDATE resources 
  SET 
    helpful_votes = (
      SELECT COUNT(*) 
      FROM resource_votes 
      WHERE resource_id = NEW.resource_id AND vote_type = 'helpful'
    ),
    unhelpful_votes = (
      SELECT COUNT(*) 
      FROM resource_votes 
      WHERE resource_id = NEW.resource_id AND vote_type = 'unhelpful'
    ),
    updated_at = now()
  WHERE id = NEW.resource_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle verification votes
CREATE OR REPLACE FUNCTION handle_verification_vote()
RETURNS TRIGGER AS $$
BEGIN
  -- If voting for a resource
  IF NEW.resource_id IS NOT NULL THEN
    UPDATE resources 
    SET 
      verification_votes = (
        SELECT COUNT(*) 
        FROM verification_votes 
        WHERE resource_id = NEW.resource_id AND vote_type = 'helpful'
      ),
      updated_at = now()
    WHERE id = NEW.resource_id;
    
    -- Auto-approve if enough helpful votes (threshold: 3)
    UPDATE resources 
    SET 
      verification_status = 'live',
      approved = true,
      updated_at = now()
    WHERE id = NEW.resource_id 
      AND verification_status = 'pending'
      AND (
        SELECT COUNT(*) 
        FROM verification_votes 
        WHERE resource_id = NEW.resource_id AND vote_type = 'helpful'
      ) >= 3;
  END IF;
  
  -- If voting for an edit
  IF NEW.edit_id IS NOT NULL THEN
    UPDATE resource_edits 
    SET 
      verification_votes = (
        SELECT COUNT(*) 
        FROM verification_votes 
        WHERE edit_id = NEW.edit_id AND vote_type = 'helpful'
      ),
      updated_at = now()
    WHERE id = NEW.edit_id;
    
    -- Auto-approve edit if enough helpful votes (threshold: 3)
    UPDATE resource_edits 
    SET 
      verification_status = 'approved',
      updated_at = now()
    WHERE id = NEW.edit_id 
      AND verification_status = 'pending'
      AND (
        SELECT COUNT(*) 
        FROM verification_votes 
        WHERE edit_id = NEW.edit_id AND vote_type = 'helpful'
      ) >= 3;
      
    -- Apply approved edits to original resource
    UPDATE resources 
    SET 
      name = re.name,
      type = re.type,
      category = re.category,
      address = re.address,
      contact = re.contact,
      email = re.email,
      website = re.website,
      description = re.description,
      rating = re.rating,
      status = re.status,
      hours = re.hours,
      services = re.services,
      updated_at = now()
    FROM resource_edits re
    WHERE resources.id = re.original_resource_id 
      AND re.id = NEW.edit_id
      AND re.verification_status = 'approved';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure vote count columns exist with proper defaults
DO $$
BEGIN
  -- Add helpful_votes column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'helpful_votes'
  ) THEN
    ALTER TABLE resources ADD COLUMN helpful_votes INTEGER DEFAULT 0;
  END IF;
  
  -- Add unhelpful_votes column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'unhelpful_votes'
  ) THEN
    ALTER TABLE resources ADD COLUMN unhelpful_votes INTEGER DEFAULT 0;
  END IF;
  
  -- Add verification_votes column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'verification_votes'
  ) THEN
    ALTER TABLE resources ADD COLUMN verification_votes INTEGER DEFAULT 0;
  END IF;
  
  -- Add is_admin_submitted column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'is_admin_submitted'
  ) THEN
    ALTER TABLE resources ADD COLUMN is_admin_submitted BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Update existing resources to have proper vote counts
UPDATE resources 
SET 
  helpful_votes = COALESCE((
    SELECT COUNT(*) 
    FROM resource_votes 
    WHERE resource_id = resources.id AND vote_type = 'helpful'
  ), 0),
  unhelpful_votes = COALESCE((
    SELECT COUNT(*) 
    FROM resource_votes 
    WHERE resource_id = resources.id AND vote_type = 'unhelpful'
  ), 0),
  verification_votes = COALESCE((
    SELECT COUNT(*) 
    FROM verification_votes 
    WHERE resource_id = resources.id AND vote_type = 'helpful'
  ), 0)
WHERE helpful_votes IS NULL OR unhelpful_votes IS NULL OR verification_votes IS NULL;

-- Create or replace triggers
DROP TRIGGER IF EXISTS trigger_update_resource_votes ON resource_votes;
CREATE TRIGGER trigger_update_resource_votes
  AFTER INSERT ON resource_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_resource_votes();

DROP TRIGGER IF EXISTS trigger_handle_verification_vote ON verification_votes;
CREATE TRIGGER trigger_handle_verification_vote
  AFTER INSERT ON verification_votes
  FOR EACH ROW
  EXECUTE FUNCTION handle_verification_vote();

-- Enable real-time for resources table (for vote counts)
alter publication supabase_realtime add table resources;

-- Ensure proper RLS policies exist
ALTER TABLE resource_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_votes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can insert resource votes" ON resource_votes;
DROP POLICY IF EXISTS "Anyone can read resource votes" ON resource_votes;
DROP POLICY IF EXISTS "Anyone can insert verification votes" ON verification_votes;
DROP POLICY IF EXISTS "Anyone can read verification votes" ON verification_votes;

-- Create RLS policies for resource_votes
CREATE POLICY "Anyone can insert resource votes"
  ON resource_votes
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can read resource votes"
  ON resource_votes
  FOR SELECT
  TO public
  USING (true);

-- Create RLS policies for verification_votes
CREATE POLICY "Anyone can insert verification votes"
  ON verification_votes
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can read verification votes"
  ON verification_votes
  FOR SELECT
  TO public
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_resource_votes_resource_id ON resource_votes(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_votes_voter_ip ON resource_votes(voter_ip);
CREATE INDEX IF NOT EXISTS idx_verification_votes_resource_id ON verification_votes(resource_id);
CREATE INDEX IF NOT EXISTS idx_verification_votes_edit_id ON verification_votes(edit_id);
CREATE INDEX IF NOT EXISTS idx_verification_votes_voter_ip ON verification_votes(voter_ip);
CREATE INDEX IF NOT EXISTS idx_resources_verification_status ON resources(verification_status);
CREATE INDEX IF NOT EXISTS idx_resources_is_admin_submitted ON resources(is_admin_submitted);