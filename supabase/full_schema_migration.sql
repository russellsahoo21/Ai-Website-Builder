-- ==============================================================================
-- Migration: 001_phase1_trustworthy_core.sql
-- Description: Sets up production tables for user token usage tracking and plans.
-- Target: Supabase PostgreSQL (Project ref: rxmzcabkbxgtxblooreu)
-- ==============================================================================

-- 1. Ensure profiles table has plan, project_quota, and token tracking
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  project_quota INT NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create user_token_usage table for monthly token quotas
CREATE TABLE IF NOT EXISTS public.user_token_usage (
  user_id TEXT NOT NULL,
  period TEXT NOT NULL, -- Format: YYYY-MM
  tokens_used BIGINT NOT NULL DEFAULT 0,
  token_limit BIGINT NOT NULL DEFAULT 100000,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, period)
);

-- 3. Ensure projects table has RLS and strict ownership
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled Project',
  prompt TEXT,
  files JSONB NOT NULL DEFAULT '{}'::jsonb,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  file_count INT NOT NULL DEFAULT 0,
  is_starred BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id
  ON public.projects (user_id);

-- 4. Create index for fast monthly lookups
CREATE INDEX IF NOT EXISTS idx_user_token_usage_user_period 
  ON public.user_token_usage (user_id, period);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 6. Strict Row Level Security Policies
-- Sensitive tables are isolated to service_role on trusted backend API routes,
-- preventing unauthenticated or arbitrary anon clients from reading/modifying user data.

-- Revoke all direct permissions from public anonymous role
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.user_token_usage FROM anon;
REVOKE ALL ON public.projects FROM anon;

-- Drop legacy permissive policies
DROP POLICY IF EXISTS "Public profiles read policy" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles upsert policy" ON public.profiles;
DROP POLICY IF EXISTS "Token usage read policy" ON public.user_token_usage;
DROP POLICY IF EXISTS "Token usage modify policy" ON public.user_token_usage;
DROP POLICY IF EXISTS "Public projects read policy" ON public.projects;
DROP POLICY IF EXISTS "Public projects modify policy" ON public.projects;
DROP POLICY IF EXISTS "Projects user read" ON public.projects;
DROP POLICY IF EXISTS "Projects user modify" ON public.projects;

-- Strict ownership policies for authenticated users
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid())::text = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid())::text = id)
  WITH CHECK ((select auth.uid())::text = id);

CREATE POLICY "Users can view own token usage"
  ON public.user_token_usage FOR SELECT
  TO authenticated
  USING ((select auth.uid())::text = user_id);

CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING ((select auth.uid())::text = user_id);

CREATE POLICY "Users can insert own projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid())::text = user_id);

CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING ((select auth.uid())::text = user_id)
  WITH CHECK ((select auth.uid())::text = user_id);

CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  TO authenticated
  USING ((select auth.uid())::text = user_id);

-- Service role has unrestricted access for trusted server operations
CREATE POLICY "Service role full access on profiles"
  ON public.profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on user_token_usage"
  ON public.user_token_usage FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on projects"
  ON public.projects FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- Migration: 002_phase3_paid_product.sql
-- Description: Adds subscription fields, payment audit log, workspaces, and analytics.
-- Target: Supabase PostgreSQL (Project ref: rxmzcabkbxgtxblooreu)
-- ==============================================================================

-- 1. Extend profiles with subscription fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS customer_id TEXT,
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- 2. Audit table for confirmed payment transactions
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  provider TEXT NOT NULL, -- 'razorpay' | 'stripe'
  status TEXT NOT NULL DEFAULT 'captured', -- 'captured' | 'failed' | 'refunded'
  plan_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id 
  ON public.payment_transactions(user_id);

-- 3. Multi-tenant workspaces table
CREATE TABLE IF NOT EXISTS public.workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Workspace members table
CREATE TABLE IF NOT EXISTS public.workspace_members (
  workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'member', -- 'owner' | 'admin' | 'member'
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id 
  ON public.workspace_members(user_id);

-- 5. Daily token analytics table
CREATE TABLE IF NOT EXISTS public.daily_token_usage (
  user_id TEXT NOT NULL,
  usage_date DATE NOT NULL,
  model TEXT NOT NULL,
  tokens BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, usage_date, model)
);

CREATE INDEX IF NOT EXISTS idx_daily_token_usage_user_date 
  ON public.daily_token_usage(user_id, usage_date);

-- 6. Enable RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_token_usage ENABLE ROW LEVEL SECURITY;

-- 7. Strict Row Level Security Policies
-- Revoke all direct permissions from public anonymous role
REVOKE ALL ON public.payment_transactions FROM anon;
REVOKE ALL ON public.workspaces FROM anon;
REVOKE ALL ON public.workspace_members FROM anon;
REVOKE ALL ON public.daily_token_usage FROM anon;

-- Drop legacy permissive policies
DROP POLICY IF EXISTS "Payment transactions user read" ON public.payment_transactions;
DROP POLICY IF EXISTS "Payment transactions insert policy" ON public.payment_transactions;
DROP POLICY IF EXISTS "Workspaces read policy" ON public.workspaces;
DROP POLICY IF EXISTS "Workspaces modify policy" ON public.workspaces;
DROP POLICY IF EXISTS "Workspace members policy" ON public.workspace_members;
DROP POLICY IF EXISTS "Daily usage policy" ON public.daily_token_usage;

-- Strict ownership policies for authenticated users
CREATE POLICY "Users can view own payment transactions"
  ON public.payment_transactions FOR SELECT
  TO authenticated
  USING ((select auth.uid())::text = user_id);

CREATE POLICY "Users can view workspaces they own or belong to"
  ON public.workspaces FOR SELECT
  TO authenticated
  USING (
    (select auth.uid())::text = owner_id OR
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
      AND workspace_members.user_id = (select auth.uid())::text
    )
  );

CREATE POLICY "Workspace owners can update their workspaces"
  ON public.workspaces FOR UPDATE
  TO authenticated
  USING ((select auth.uid())::text = owner_id)
  WITH CHECK ((select auth.uid())::text = owner_id);

CREATE POLICY "Users can view workspace memberships"
  ON public.workspace_members FOR SELECT
  TO authenticated
  USING (
    (select auth.uid())::text = user_id OR
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE workspaces.id = workspace_members.workspace_id
      AND workspaces.owner_id = (select auth.uid())::text
    )
  );

CREATE POLICY "Users can view own daily analytics"
  ON public.daily_token_usage FOR SELECT
  TO authenticated
  USING ((select auth.uid())::text = user_id);

-- Service role has full access for server-side operations
CREATE POLICY "Service role full access on payment_transactions"
  ON public.payment_transactions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on workspaces"
  ON public.workspaces FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on workspace_members"
  ON public.workspace_members FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on daily_token_usage"
  ON public.daily_token_usage FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 8. Atomic Quota Reservation & Rollback Functions (Concurrency-Safe)
CREATE OR REPLACE FUNCTION public.increment_token_quota(
  p_user_id TEXT,
  p_period TEXT,
  p_tokens_to_add INT,
  p_token_cap INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_used INT := 0;
  v_new_used INT;
BEGIN
  -- Row-level locking to eliminate race conditions
  SELECT tokens_used INTO v_current_used
  FROM public.user_token_usage
  WHERE user_id = p_user_id AND period = p_period
  FOR UPDATE;

  IF NOT FOUND THEN
    v_current_used := 0;
    -- If cap is active and requested tokens exceed cap, reject atomically
    IF p_token_cap > 0 AND p_tokens_to_add > p_token_cap THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'current_used', 0,
        'tokens_to_add', p_tokens_to_add,
        'cap', p_token_cap,
        'reason', 'TOKEN_QUOTA_EXCEEDED'
      );
    END IF;

    INSERT INTO public.user_token_usage (user_id, period, tokens_used, token_limit, updated_at)
    VALUES (p_user_id, p_period, p_tokens_to_add, p_token_cap, NOW())
    ON CONFLICT (user_id, period) DO UPDATE
    SET tokens_used = user_token_usage.tokens_used + EXCLUDED.tokens_used,
        updated_at = NOW();

    RETURN jsonb_build_object(
      'allowed', true,
      'current_used', p_tokens_to_add,
      'tokens_to_add', p_tokens_to_add,
      'cap', p_token_cap
    );
  END IF;

  -- If cap > 0 and adding tokens exceeds cap, reject atomically
  IF p_token_cap > 0 AND (v_current_used + p_tokens_to_add) > p_token_cap THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'current_used', v_current_used,
      'tokens_to_add', p_tokens_to_add,
      'cap', p_token_cap,
      'reason', 'TOKEN_QUOTA_EXCEEDED'
    );
  END IF;

  v_new_used := v_current_used + p_tokens_to_add;

  UPDATE public.user_token_usage
  SET tokens_used = v_new_used,
      token_limit = p_token_cap,
      updated_at = NOW()
  WHERE user_id = p_user_id AND period = p_period;

  RETURN jsonb_build_object(
    'allowed', true,
    'current_used', v_new_used,
    'tokens_to_add', p_tokens_to_add,
    'cap', p_token_cap
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.rollback_token_quota(
  p_user_id TEXT,
  p_period TEXT,
  p_tokens_to_subtract INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.user_token_usage
  SET tokens_used = GREATEST(0, tokens_used - p_tokens_to_subtract),
      updated_at = NOW()
  WHERE user_id = p_user_id AND period = p_period;
END;
$$;

-- Explicitly revoke execute permissions from public roles to prevent client-side tampering
REVOKE EXECUTE
ON FUNCTION public.increment_token_quota(TEXT, TEXT, INT, INT)
FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE
ON FUNCTION public.rollback_token_quota(TEXT, TEXT, INT)
FROM PUBLIC, anon, authenticated;

-- Only trusted server-side execution via service_role is permitted
GRANT EXECUTE
ON FUNCTION public.increment_token_quota(TEXT, TEXT, INT, INT)
TO service_role;

GRANT EXECUTE
ON FUNCTION public.rollback_token_quota(TEXT, TEXT, INT)
TO service_role;


