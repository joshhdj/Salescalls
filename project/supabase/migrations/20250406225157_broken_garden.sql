/*
  # Initial Schema Setup for Sales Consultation Analyzer

  1. New Tables
    - `consultants` - Stores consultant information
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text)
      - `created_at` (timestamp)
    
    - `consultations` - Stores consultation recordings and transcripts
      - `id` (uuid, primary key)
      - `consultant_id` (uuid, foreign key)
      - `audio_url` (text)
      - `transcript` (text)
      - `email_source` (text)
      - `created_at` (timestamp)
    
    - `scores` - Stores consultation scores
      - `id` (uuid, primary key)
      - `consultation_id` (uuid, foreign key)
      - `category` (text)
      - `score` (integer)
      - `notes` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create consultants table
CREATE TABLE consultants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create consultations table
CREATE TABLE consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id uuid REFERENCES consultants(id) NOT NULL,
  audio_url text NOT NULL,
  transcript text,
  email_source text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create scores table
CREATE TABLE scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid REFERENCES consultations(id) NOT NULL,
  category text NOT NULL,
  score integer NOT NULL CHECK (score >= 0 AND score <= 100),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE consultants ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Consultants are viewable by authenticated users"
  ON consultants
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Consultations are viewable by authenticated users"
  ON consultations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Scores are viewable by authenticated users"
  ON scores
  FOR SELECT
  TO authenticated
  USING (true);