-- LegitiChain Supabase Profiles, Auth Triggers & Role-Based RLS Policies

-- 1. Create Profiles Table (Linked to Supabase Auth Users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    organization TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'INVESTIGATOR' CHECK (role IN ('INVESTIGATOR', 'LEGAL_AUDITOR', 'FORENSIC_EXPERT', 'ADMIN')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Allow authenticated users to read all profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow users to update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- 2. Function & Trigger to automatically handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, organization, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Forensic User'),
        COALESCE(NEW.raw_user_meta_data->>'organization', 'Independent'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'INVESTIGATOR')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        organization = EXCLUDED.organization,
        role = EXCLUDED.role;
    RETURN NEW;
END;
$$;

-- Restrict execution permissions on handle_new_user (internal trigger only)
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Trigger execution on auth.users creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Helper function to check role of current user
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    u_role TEXT;
BEGIN
    SELECT role INTO u_role FROM public.profiles WHERE id = user_id;
    RETURN COALESCE(u_role, 'GUEST');
END;
$$;

-- Restrict execution permissions on get_user_role
REVOKE ALL ON FUNCTION public.get_user_role(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_user_role(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO service_role;

-- 4. Updated RLS Policies for evidence_records, custody_logs, and ai_risk_signals

-- Drop previous open policies if they exist to apply role-aware policies
DROP POLICY IF EXISTS "Allow insert access to evidence records" ON public.evidence_records;
DROP POLICY IF EXISTS "Allow insert access to custody logs" ON public.custody_logs;

-- Evidence Records: Insert restricted to INVESTIGATOR, FORENSIC_EXPERT, ADMIN
CREATE POLICY "Allow role-based insert access to evidence records"
    ON public.evidence_records FOR INSERT
    TO authenticated
    WITH CHECK (
        public.get_user_role(auth.uid()) IN ('INVESTIGATOR', 'FORENSIC_EXPERT', 'ADMIN')
    );

-- Custody Logs: Insert allowed for all authenticated roles
CREATE POLICY "Allow authenticated insert access to custody logs"
    ON public.custody_logs FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- AI Risk Signals: Insert restricted to FORENSIC_EXPERT and ADMIN
CREATE POLICY "Allow expert insert access to AI risk signals"
    ON public.ai_risk_signals FOR INSERT
    TO authenticated
    WITH CHECK (
        public.get_user_role(auth.uid()) IN ('FORENSIC_EXPERT', 'ADMIN')
    );
