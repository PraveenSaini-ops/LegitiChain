-- LegitiChain Migration: Fix Supabase Security Advisor Warnings
-- Resolves Search Path Mutability, Storage Listing RLS, and Function Execution Privileges

BEGIN;

-- ============================================================================
-- 1. FIX FUNCTION SEARCH PATH MUTABILITY & DEFINER SETTINGS
-- ============================================================================

-- Fix public.handle_new_user (Trigger function - SECURITY DEFINER with fixed search_path)
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

-- Fix public.get_user_role (SECURITY INVOKER to eliminate Security DEFINER warning)
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


-- ============================================================================
-- 2. RESTRICT FUNCTION EXECUTE PRIVILEGES (PUBLIC / ANON / AUTHENTICATED)
-- ============================================================================

-- A. Restrict handle_new_user():
-- Trigger function ONLY — Revoke execution from PUBLIC, anon, and authenticated users.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- B. Restrict get_user_role(uuid):
-- Revoke execution from PUBLIC and anon (unauthenticated users).
-- Grant execution ONLY to authenticated users (for RLS policy checks) and service_role.
REVOKE ALL ON FUNCTION public.get_user_role(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_user_role(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO service_role;


-- ============================================================================
-- 3. TIGHTEN STORAGE BUCKET & RLS POLICIES (evidence-files)
-- ============================================================================

-- Ensure evidence-files bucket is set to private (public = false)
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence-files', 'evidence-files', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Remove public/unauthenticated listing & read access policies
DROP POLICY IF EXISTS "Public Read Access to Evidence Files" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Read Access to Evidence Files" ON storage.objects;

-- Create tightened SELECT policy restricted strictly to authenticated users
CREATE POLICY "Authenticated Read Access to Evidence Files"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'evidence-files'
);

COMMIT;
