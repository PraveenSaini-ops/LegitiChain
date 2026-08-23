-- LegitiChain Supabase Storage Setup for Evidence Payloads

-- 1. Create storage bucket 'evidence-files'
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence-files', 'evidence-files', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS Policies

-- Public Read Policy: Allow anyone to view/download evidence payload files
CREATE POLICY "Public Read Access to Evidence Files"
ON storage.objects FOR SELECT
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
