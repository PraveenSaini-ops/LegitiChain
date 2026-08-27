-- LegitiChain Supabase Storage Setup for Evidence Payloads

-- 1. Create storage bucket 'evidence-files' (private bucket)
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence-files', 'evidence-files', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- 2. Storage RLS Policies

-- Authenticated Read Policy: Allow authenticated users to view/download evidence payload files
CREATE POLICY "Authenticated Read Access to Evidence Files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'evidence-files');

-- Authenticated Insert Policy: Allow authenticated users to upload files to evidence-files bucket
CREATE POLICY "Authenticated Upload Access to Evidence Files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'evidence-files');

-- Authenticated Update Policy
CREATE POLICY "Authenticated Update Access to Evidence Files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'evidence-files');
