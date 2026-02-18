/*
  # Create appointments table

  1. New Tables
    - `appointments`
      - `id` (uuid, primary key)
      - `patient_name` (text)
      - `phone` (text)
      - `reason` (text)
      - `doctor_assigned` (text)
      - `status` (text) - Today, Completed, Cancelled, Upcoming
      - `type` (text) - Hospital, Zoom
      - `appointment_date` (date)
      - `appointment_time` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `appointments` table
    - Add policy for authenticated users to read all appointments
    - Add policy for authenticated users to create appointments
    - Add policy for authenticated users to update appointments
    - Add policy for authenticated users to delete appointments
*/

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name text NOT NULL,
  phone text NOT NULL,
  reason text NOT NULL,
  doctor_assigned text NOT NULL,
  status text NOT NULL DEFAULT 'Upcoming',
  type text NOT NULL DEFAULT 'Hospital',
  appointment_date date NOT NULL,
  appointment_time text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete appointments"
  ON appointments FOR DELETE
  TO authenticated
  USING (true);
