/*
  # Add admin submitted tracking

  1. Schema Changes
    - Add `is_admin_submitted` column to `resources` table
    - Add `is_admin_submitted` column to `resource_edits` table
    - Set default values and update existing records

  2. Security
    - No RLS changes needed as this is just a tracking field

  3. Data Migration
    - Set existing user-submitted resources to false
    - Set existing non-user-submitted resources to true (assuming they were admin-created)
*/

-- Add is_admin_submitted column to resources table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'is_admin_submitted'
  ) THEN
    ALTER TABLE resources ADD COLUMN is_admin_submitted boolean DEFAULT false;
  END IF;
END $$;

-- Add is_admin_submitted column to resource_edits table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resource_edits' AND column_name = 'is_admin_submitted'
  ) THEN
    ALTER TABLE resource_edits ADD COLUMN is_admin_submitted boolean DEFAULT false;
  END IF;
END $$;

-- Update existing records: if not user_submitted, assume it was admin-created
UPDATE resources 
SET is_admin_submitted = NOT is_user_submitted 
WHERE is_admin_submitted IS NULL;

-- Set default for future records
ALTER TABLE resources ALTER COLUMN is_admin_submitted SET DEFAULT false;
ALTER TABLE resource_edits ALTER COLUMN is_admin_submitted SET DEFAULT false;