/*
  # Create Storage Bucket for Consultation Recordings

  1. New Storage Bucket
    - `consultations` - Stores audio recordings
    
  2. Security
    - Enable public access for authenticated users
    - Restrict uploads to authenticated users
*/

-- Create bucket for consultation recordings if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'consultations',
    'consultations',
    true,
    52428800, -- 50MB limit
    ARRAY['audio/mpeg', 'audio/mp3']::text[]
  )
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Create policy to allow authenticated users to upload files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow authenticated uploads'
  ) THEN
    CREATE POLICY "Allow authenticated uploads"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'consultations');
  END IF;
END $$;

-- Create policy to allow public access to files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow public access'
  ) THEN
    CREATE POLICY "Allow public access"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'consultations');
  END IF;
END $$;