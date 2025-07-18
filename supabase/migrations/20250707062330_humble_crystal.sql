/*
  # Create resources table for Know Borivali

  1. New Tables
    - `resources`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `type` (text, required)
      - `category` (text, required)
      - `address` (text, required)
      - `contact` (text, optional)
      - `email` (text, optional)
      - `website` (text, optional)
      - `description` (text, optional)
      - `rating` (numeric, default 4.0)
      - `status` (text, default 'Open')
      - `hours` (text, optional)
      - `services` (text array, optional)
      - `is_user_submitted` (boolean, default false)
      - `approved` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `resources` table
    - Add policy for public read access
    - Add policy for authenticated users to insert resources
*/

CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
  is_user_submitted boolean DEFAULT false,
  approved boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Public can read approved resources" ON resources;
DROP POLICY IF EXISTS "Anyone can insert resources" ON resources;

-- Allow public read access to approved resources
CREATE POLICY "Public can read approved resources"
  ON resources
  FOR SELECT
  TO public
  USING (approved = true);

-- Allow anyone to insert new resources (they'll need approval)
CREATE POLICY "Anyone can insert resources"
  ON resources
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Insert the existing Apex Hospital resource only if it doesn't exist
INSERT INTO resources (
  name,
  type,
  category,
  address,
  description,
  status,
  hours,
  services,
  is_user_submitted,
  approved
) 
SELECT 
  'Apex Superspeciality Hospitals – Borivali West',
  'Multi-specialty Hospital (Super-speciality)',
  'Hospitals & Clinics',
  'Beside Punjab & Sind Bank, Lokmanya Tilak Road, Babhai Naka, Borivali West, Mumbai 400092',
  'Offers a wide range of specialty services, including emergency care and routine diagnostics.',
  'Open',
  '24/7 emergency services (general OPD hours vary)',
  ARRAY['Multi-speciality consultations', 'Emergency care', 'Diagnostics', 'Inpatient care'],
  false,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM resources WHERE name = 'Apex Superspeciality Hospitals – Borivali West'
);