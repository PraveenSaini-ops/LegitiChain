-- LegitiChain Schema & RLS Policy Fix for Evidence Records and Storage

-- 1. Expand submitter_address column from VARCHAR(42) to TEXT to support full submitter names/emails/roles
ALTER TABLE public.evidence_records ALTER COLUMN submitter_address TYPE TEXT;

-- 2. Ensure evidence_records table has clean role-based INSERT policy for authenticated users
DROP POLICY IF EXISTS "Allow role-based insert access to evidence records" ON public.evidence_records;
DROP POLICY IF EXISTS "Allow role-based insert to evidence records" ON public.evidence_records;
DROP POLICY IF EXISTS "Allow authenticated insert to evidence records" ON public.evidence_records;

CREATE POLICY "Allow authenticated insert to evidence records"
    ON public.evidence_records FOR INSERT
    TO authenticated
    WITH CHECK (
        public.get_user_role(auth.uid()) IN ('INVESTIGATOR', 'FORENSIC_EXPERT', 'ADMIN')
    );

-- 3. Ensure custody_logs has clean INSERT policy for authenticated users
DROP POLICY IF EXISTS "Allow authenticated insert access to custody logs" ON public.custody_logs;
DROP POLICY IF EXISTS "Allow insert access to custody logs" ON public.custody_logs;

CREATE POLICY "Allow authenticated insert access to custody logs"
    ON public.custody_logs FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- 4. Ensure storage policies for 'evidence-files' bucket allow authenticated upload
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence-files', 'evidence-files', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Authenticated Upload Access to Evidence Files" ON storage.objects;

CREATE POLICY "Authenticated Upload Access to Evidence Files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'evidence-files');

-- 5. Ensure ai_risk_signals has clean INSERT policy for authenticated users
DROP POLICY IF EXISTS "Allow authenticated insert access to AI risk signals" ON public.ai_risk_signals;
DROP POLICY IF EXISTS "Allow insert access to AI risk signals" ON public.ai_risk_signals;

CREATE POLICY "Allow authenticated insert access to AI risk signals"
    ON public.ai_risk_signals FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() IS NOT NULL
    );

