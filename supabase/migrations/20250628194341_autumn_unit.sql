/*
  # Complete Resources Database Setup

  1. New Tables
    - `resources` table with all necessary columns
    - Proper data types matching the original resource structure
    - UUID primary keys and timestamps

  2. Security
    - Enable RLS on resources table
    - Public read access for approved resources
    - Public insert access for community contributions

  3. Sample Data
    - All original resources from the static data file
    - Properly formatted and categorized
    - Ready for immediate use

  4. Constraints
    - Rating validation (1-5 range)
    - Status validation (Open/Closed/Open 24/7)
    - Required fields enforcement
*/

-- Drop table if exists to start fresh
DROP TABLE IF EXISTS resources CASCADE;

-- Create resources table
CREATE TABLE resources (
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

-- Enable Row Level Security
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can read approved resources"
  ON resources
  FOR SELECT
  TO public
  USING (approved = true);

CREATE POLICY "Anyone can insert resources"
  ON resources
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Insert all sample data
INSERT INTO resources (name, type, category, address, contact, email, description, rating, status, hours, services, is_user_submitted, approved) VALUES

-- Hospitals & Clinics
('Shree Sai Hospital', 'Multi-specialty Hospital', 'Hospitals & Clinics', 'IC Colony, Borivali West, Mumbai - 400103', '+91 22 2898 5678', 'info@shreesaihospital.com', 'Full-service hospital with emergency services, ICU, and specialized departments for comprehensive healthcare.', 4.2, 'Open 24/7', '24 Hours', ARRAY['Emergency Services', 'ICU', 'Surgery', 'Cardiology', '+5 more'], false, true),

('Dr. Mehta''s Clinic', 'General Physician', 'Hospitals & Clinics', 'Eksar Road, Borivali West, Mumbai - 400092', '+91 22 2867 1234', 'drmehta@clinic.com', 'Family medicine and general health consultations with experienced physician.', 4.6, 'Open', '9:00 AM - 8:00 PM', ARRAY['General Consultation', 'Health Checkups', 'Vaccinations'], false, true),

('Central Health Pharmacy', 'Pharmacy', 'Hospitals & Clinics', 'SV Road, near Borivali Station, Mumbai - 400092', '+91 22 2890 9876', null, 'Full-service pharmacy with prescription medications, over-the-counter drugs, and health consultations.', 4.8, 'Closed', '9:00 AM - 6:00 PM', ARRAY['Prescription Services', 'Health Consultations', 'Home Delivery', '+1 more'], false, true),

-- Shops & Essentials
('Big Bazaar Borivali', 'Hypermarket', 'Shops & Essentials', 'Raghuleela Mall, SV Road, Kandivali West, Mumbai - 400067', '+91 22 6112 3456', null, 'One-stop shopping destination for groceries, clothing, electronics, and household items.', 4.1, 'Open', '10:00 AM - 10:00 PM', ARRAY['Groceries', 'Clothing', 'Electronics', 'Home Delivery'], false, true),

('D-Mart Borivali', 'Supermarket', 'Shops & Essentials', 'Link Road, Borivali West, Mumbai - 400092', '+91 22 2898 7654', null, 'Daily essentials and groceries at affordable prices with wide product selection.', 4.3, 'Open', '8:00 AM - 11:00 PM', ARRAY['Daily Essentials', 'Fresh Produce', 'Bulk Shopping'], false, true),

('Fresh Foods Market', 'Grocery Store', 'Shops & Essentials', 'IC Colony Main Road, Borivali West, Mumbai - 400103', '+91 22 2867 3456', null, 'Local market specializing in fresh vegetables, fruits, and daily groceries.', 4.5, 'Open', '6:00 AM - 9:00 PM', ARRAY['Fresh Vegetables', 'Fruits', 'Daily Groceries'], false, true),

-- Parks & Public Amenities
('Sanjay Gandhi National Park', 'National Park', 'Parks & Public Amenities', 'Borivali East, Mumbai - 400066', '+91 22 2886 0389', null, 'Large national park with wildlife, nature trails, boating, and recreational activities for families.', 4.7, 'Open', '7:30 AM - 6:00 PM', ARRAY['Nature Trails', 'Boating', 'Wildlife Safari', 'Picnic Areas'], false, true),

('Mandpeshwar Caves', 'Historical Site', 'Parks & Public Amenities', 'Near Borivali Station, Borivali West, Mumbai - 400092', null, null, 'Ancient rock-cut caves offering peaceful environment for meditation and historical exploration.', 4.0, 'Open', '6:00 AM - 6:00 PM', ARRAY['Historical Tours', 'Meditation', 'Photography'], false, true),

('Borivali Sports Complex', 'Sports Facility', 'Parks & Public Amenities', 'Poisar Gymkhana, Kandivali West, Mumbai - 400067', '+91 22 2867 8901', null, 'Comprehensive sports facility with cricket ground, swimming pool, and various indoor games.', 4.4, 'Open', '6:00 AM - 10:00 PM', ARRAY['Cricket Ground', 'Swimming Pool', 'Gym', 'Indoor Games'], false, true),

-- Residential Buildings & Societies
('Raheja Reflections', 'Residential Complex', 'Residential Buildings & Societies', 'Film City Road, Malad East, Mumbai - 400097', '+91 22 6112 5678', null, 'Premium residential towers with modern amenities, security, and recreational facilities.', 4.6, 'Open', '24 Hours', ARRAY['Security', 'Gym', 'Swimming Pool', 'Garden'], false, true),

('Ekta Garden Society', 'Housing Society', 'Residential Buildings & Societies', 'Eksar Road, Borivali West, Mumbai - 400092', '+91 22 2898 4321', null, 'Well-maintained housing society with garden, children''s play area, and 24/7 security.', 4.2, 'Open', '24 Hours', ARRAY['Garden', 'Security', 'Play Area', 'Parking'], false, true),

('Shanti Nagar CHS', 'Cooperative Housing Society', 'Residential Buildings & Societies', 'IC Colony, Borivali West, Mumbai - 400103', '+91 22 2867 6789', null, 'Affordable cooperative housing society with basic amenities and covered parking.', 3.9, 'Open', '24 Hours', ARRAY['Basic Amenities', 'Parking', 'Security'], false, true),

-- Transport Hubs
('Borivali Railway Station', 'Railway Station', 'Transport Hubs', 'SV Road, Borivali West, Mumbai - 400092', null, null, 'Major suburban railway station on Western line connecting to all parts of Mumbai and suburbs.', 4.0, 'Open 24/7', '24 Hours', ARRAY['Local Trains', 'Express Trains', 'Parking', 'Food Court'], false, true),

('Borivali Bus Depot', 'Bus Terminal', 'Transport Hubs', 'Link Road, Borivali West, Mumbai - 400092', '+91 22 2898 1122', null, 'BEST bus depot with extensive route network covering entire Mumbai metropolitan area.', 3.8, 'Open', '5:00 AM - 12:00 AM', ARRAY['City Buses', 'Express Routes', 'AC Buses', 'Prepaid Cards'], false, true),

('National Highway 8 Junction', 'Highway Access', 'Transport Hubs', 'Western Express Highway, Borivali East, Mumbai - 400066', null, null, 'Major highway junction providing connectivity to Gujarat, Rajasthan, and North India.', 4.1, 'Open 24/7', '24 Hours', ARRAY['Highway Access', 'Fuel Stations', 'Rest Areas', 'Toll Plaza'], false, true);

-- Add website data where applicable
UPDATE resources SET website = 'www.bigbazaar.com' WHERE name = 'Big Bazaar Borivali';
UPDATE resources SET website = 'www.sgnp.gov.in' WHERE name = 'Sanjay Gandhi National Park';