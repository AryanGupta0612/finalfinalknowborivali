/*
  # Create voting functions and triggers

  1. Functions
    - `update_resource_votes()` - Updates vote counts on resources table
    - `handle_verification_vote()` - Handles verification votes for resources and edits
    - `get_total_visitors()` - Gets total unique visitors count

  2. Triggers
    - Updates resource vote counts when votes are added
    - Handles verification vote logic with auto-approval thresholds
*/

-- Function to update resource vote counts
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
    )
  WHERE id = NEW.resource_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle verification votes
CREATE OR REPLACE FUNCTION handle_verification_vote()
RETURNS TRIGGER AS $$
DECLARE
  helpful_count INTEGER;
  total_votes INTEGER;
BEGIN
  -- Handle resource verification votes
  IF NEW.resource_id IS NOT NULL THEN
    -- Update verification vote count
    UPDATE resources 
    SET verification_votes = verification_votes + 1
    WHERE id = NEW.resource_id;
    
    -- Check if we should auto-approve (5+ helpful votes with 70%+ approval rate)
    SELECT 
      COUNT(*) FILTER (WHERE vote_type = 'helpful'),
      COUNT(*)
    INTO helpful_count, total_votes
    FROM verification_votes 
    WHERE resource_id = NEW.resource_id;
    
    IF total_votes >= 5 AND (helpful_count::FLOAT / total_votes) >= 0.7 THEN
      UPDATE resources 
      SET 
        verification_status = 'live',
        approved = true
      WHERE id = NEW.resource_id;
    ELSIF total_votes >= 5 AND (helpful_count::FLOAT / total_votes) < 0.3 THEN
      UPDATE resources 
      SET 
        verification_status = 'rejected',
        approved = false
      WHERE id = NEW.resource_id;
    END IF;
  END IF;
  
  -- Handle edit verification votes
  IF NEW.edit_id IS NOT NULL THEN
    -- Update edit verification vote count
    UPDATE resource_edits 
    SET verification_votes = verification_votes + 1
    WHERE id = NEW.edit_id;
    
    -- Check if we should auto-approve edit
    SELECT 
      COUNT(*) FILTER (WHERE vote_type = 'helpful'),
      COUNT(*)
    INTO helpful_count, total_votes
    FROM verification_votes 
    WHERE edit_id = NEW.edit_id;
    
    IF total_votes >= 3 AND (helpful_count::FLOAT / total_votes) >= 0.7 THEN
      UPDATE resource_edits 
      SET verification_status = 'approved'
      WHERE id = NEW.edit_id;
      
      -- Apply the edit to the original resource
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
      WHERE re.id = NEW.edit_id AND resources.id = re.original_resource_id;
    ELSIF total_votes >= 3 AND (helpful_count::FLOAT / total_votes) < 0.3 THEN
      UPDATE resource_edits 
      SET verification_status = 'rejected'
      WHERE id = NEW.edit_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to get total visitors
CREATE OR REPLACE FUNCTION get_total_visitors()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM visitor_tracking);
END;
$$ LANGUAGE plpgsql;

-- Create triggers if they don't exist
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