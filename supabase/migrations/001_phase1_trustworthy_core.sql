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

