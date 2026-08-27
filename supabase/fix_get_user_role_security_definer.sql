-- LegitiChain Migration: Fix SECURITY DEFINER Warning on public.get_user_role
-- Converts get_user_role from SECURITY DEFINER to SECURITY INVOKER so signed-in users
-- can evaluate RLS policies without escalating to superuser privileges or triggering Security Advisor warnings.

BEGIN;

-- 1. Redefine get_user_role as SECURITY INVOKER with explicit search_path
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

-- 2. Revoke execution from unauthenticated users (PUBLIC & anon)
REVOKE ALL ON FUNCTION public.get_user_role(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_user_role(UUID) FROM anon;

-- 3. Grant execution to authenticated users (for RLS policy checks) and service_role
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO service_role;

COMMIT;
