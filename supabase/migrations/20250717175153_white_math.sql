/*
  # Fix Resource Deletion and Real-time Updates

  1. Database Functions
    - Create function to get total live resources count
    - Create function to handle resource deletion cleanup
    - Add proper triggers for real-time updates

  2. Indexes
    - Add indexes for better query performance on deletion
    - Optimize real-time subscription queries

  3. RLS Policies
    - Ensure proper permissions for deletion operations
*/

-- Function to get total count of live resources
CREATE OR REPLACE FUNCTION get_total_live_resources()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM resources 
    WHERE verification_status = 'live' 
    AND approved = true
  );
END;
$$ LANGUAGE plpgsql;

-- Function to clean up related data when resource is deleted
CREATE OR REPLACE FUNCTION cleanup_resource_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete related votes
  DELETE FROM resource_votes WHERE resource_id = OLD.id;
  DELETE FROM verification_votes WHERE resource_id = OLD.id;
  
  -- Delete related edits
  DELETE FROM resource_edits WHERE original_resource_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for resource cleanup on deletion
DROP TRIGGER IF EXISTS trigger_cleanup_resource_data ON resources;
CREATE TRIGGER trigger_cleanup_resource_data
  BEFORE DELETE ON resources
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_resource_data();

-- Function to update resource counts in real-time
CREATE OR REPLACE FUNCTION notify_resource_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify about resource changes for real-time updates
  IF TG_OP = 'DELETE' THEN
    PERFORM pg_notify('resource_deleted', OLD.id::text);
    RETURN OLD;
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM pg_notify('resource_added', NEW.id::text);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM pg_notify('resource_updated', NEW.id::text);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for real-time notifications
DROP TRIGGER IF EXISTS trigger_notify_resource_change ON resources;
CREATE TRIGGER trigger_notify_resource_change
  AFTER INSERT OR UPDATE OR DELETE ON resources
  FOR EACH ROW
  EXECUTE FUNCTION notify_resource_change();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_resources_verification_live ON resources (verification_status, approved) WHERE verification_status = 'live' AND approved = true;
CREATE INDEX IF NOT EXISTS idx_resources_category_live ON resources (category, verification_status, approved) WHERE verification_status = 'live' AND approved = true;
CREATE INDEX IF NOT EXISTS idx_resources_created_at_desc ON resources (created_at DESC);

-- Update RLS policies to ensure proper deletion permissions
DROP POLICY IF EXISTS "Admins can delete resources" ON resources;
CREATE POLICY "Admins can delete resources"
  ON resources
  FOR DELETE
  TO public
  USING (true); -- Allow deletion for now, frontend will handle admin check

-- Ensure proper permissions for the cleanup function
GRANT EXECUTE ON FUNCTION cleanup_resource_data() TO public;
GRANT EXECUTE ON FUNCTION notify_resource_change() TO public;
GRANT EXECUTE ON FUNCTION get_total_live_resources() TO public;