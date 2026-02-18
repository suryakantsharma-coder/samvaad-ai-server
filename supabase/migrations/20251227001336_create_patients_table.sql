/*
  # Create Patients Table

  1. New Tables
    - `patients`
      - `id` (uuid, primary key) - Unique identifier for each patient
      - `name` (text) - Full name of the patient
      - `age` (integer) - Age of the patient
      - `phone` (text) - Phone number with country code
      - `gender` (text) - Gender of the patient (Male/Female)
      - `reason` (text) - Reason for visit
      - `doctor` (text) - Doctor assigned to the patient
      - `status` (text) - Appointment status (Today, Upcoming, Completed, Cancelled)
      - `appointment_date` (date) - Date of appointment
      - `appointment_time` (time) - Time of appointment
      - `created_at` (timestamptz) - Timestamp when record was created
      - `updated_at` (timestamptz) - Timestamp when record was last updated

  2. Security
    - Enable RLS on `patients` table
    - Add policy for authenticated users to read all patients
    - Add policy for authenticated users to insert patients
    - Add policy for authenticated users to update patients
    - Add policy for authenticated users to delete patients
*/

CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  age integer NOT NULL,
  phone text NOT NULL,
  gender text NOT NULL,
  reason text NOT NULL,
  doctor text DEFAULT '',
  status text DEFAULT 'Upcoming',
  appointment_date date DEFAULT CURRENT_DATE,
  appointment_time time DEFAULT CURRENT_TIME,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all patients"
  ON patients
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert patients"
  ON patients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update patients"
  ON patients
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete patients"
  ON patients
  FOR DELETE
  TO authenticated
  USING (true);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
