/*
  # Create doctors table

  1. New Tables
    - `doctors`
      - `id` (uuid, primary key)
      - `name` (text, not null) - Full name of the doctor
      - `doctor_id` (text, unique, not null) - Medical ID (e.g., MD-2024-156789)
      - `phone` (text, not null) - Contact phone number
      - `email` (text, unique, not null) - Email address
      - `designation` (text, not null) - Specialization (Cardiologist, Pediatrician, etc.)
      - `availability` (text, not null) - Working hours (e.g., "9 AM–5 PM")
      - `status` (text, not null) - Current status (On Duty, On Break, Off Duty, On Leave)
      - `utilization` (integer, default 0) - Percentage of booked slots
      - `avatar_url` (text) - Profile picture URL
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `doctors` table
    - Add policy for authenticated users to read doctors data
    - Add policy for authenticated users to insert doctors data
    - Add policy for authenticated users to update doctors data
    - Add policy for authenticated users to delete doctors data
*/

CREATE TABLE IF NOT EXISTS doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  doctor_id text UNIQUE NOT NULL,
  phone text NOT NULL,
  email text UNIQUE NOT NULL,
  designation text NOT NULL,
  availability text NOT NULL DEFAULT '9 AM–5 PM',
  status text NOT NULL DEFAULT 'Off Duty',
  utilization integer DEFAULT 0,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view doctors"
  ON doctors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert doctors"
  ON doctors
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update doctors"
  ON doctors
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete doctors"
  ON doctors
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_doctors_status ON doctors(status);
CREATE INDEX IF NOT EXISTS idx_doctors_designation ON doctors(designation);
CREATE INDEX IF NOT EXISTS idx_doctors_doctor_id ON doctors(doctor_id);
