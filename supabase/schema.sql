-- LegitiChain Complete Supabase Schema Definition, Auth Profiles & RLS Policies

-- 1. Profiles Table (Linked to Supabase Auth Users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    organization TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'INVESTIGATOR' CHECK (role IN ('INVESTIGATOR', 'LEGAL_AUDITOR', 'FORENSIC_EXPERT', 'ADMIN')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Evidence Records Table
CREATE TABLE IF NOT EXISTS public.evidence_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id VARCHAR(64) UNIQUE NOT NULL,
    evidence_hash VARCHAR(66) NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    submitter_address VARCHAR(42) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ANCHORED', 'TAMPERED')),
    tx_hash VARCHAR(66),
    block_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Custody Logs Table
CREATE TABLE IF NOT EXISTS public.custody_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id VARCHAR(64) REFERENCES public.evidence_records(evidence_id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    from_entity TEXT NOT NULL,
    to_entity TEXT NOT NULL,
    tx_id VARCHAR(66),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 4. AI Risk Signals Table
CREATE TABLE IF NOT EXISTS public.ai_risk_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id VARCHAR(64) REFERENCES public.evidence_records(evidence_id) ON DELETE CASCADE,
    target_file TEXT NOT NULL,
    confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 100),
    risk_level VARCHAR(20) DEFAULT 'LOW' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    flags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custody_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_risk_signals ENABLE ROW LEVEL SECURITY;

-- 5. Helper function to check role of current user
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

-- 6. Trigger to automatically handle new user signup
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Read policies for public/authenticated users
CREATE POLICY "Allow read access to profiles" 
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Allow public read access to evidence records" 
    ON public.evidence_records FOR SELECT USING (true);

CREATE POLICY "Allow public read access to custody logs" 
    ON public.custody_logs FOR SELECT USING (true);

CREATE POLICY "Allow public read access to AI risk signals" 
    ON public.ai_risk_signals FOR SELECT USING (true);

-- 8. Write policies with role checking
CREATE POLICY "Allow users to update own profile" 
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow role-based insert to evidence records" 
    ON public.evidence_records FOR INSERT 
    WITH CHECK (
        auth.role() = 'authenticated' AND
        public.get_user_role(auth.uid()) IN ('INVESTIGATOR', 'FORENSIC_EXPERT', 'ADMIN')
    );

CREATE POLICY "Allow insert access to custody logs" 
    ON public.custody_logs FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow insert access to AI risk signals" 
    ON public.ai_risk_signals FOR INSERT 
    WITH CHECK (
        auth.role() = 'authenticated' AND
        public.get_user_role(auth.uid()) IN ('FORENSIC_EXPERT', 'ADMIN')
    );
