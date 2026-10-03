-- Drop existing users table if you want a fresh start, otherwise remove the drop command
-- DROP TABLE IF EXISTS public.users;

-- Create the users table for UMKM
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  store_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: In a real production application, you should use Supabase Auth (auth.users)
-- instead of storing passwords in plain text in public.users. Since this is a migration
-- from the previous codebase that used simple table queries, we retain a simple
-- table structure but expand it for the requested fields.

-- Set up Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all actions for now (since we use anon key on server)
-- For production, restrict this!
CREATE POLICY "Allow anonymous read/write" ON public.users
  FOR ALL
  USING (true)
  WITH CHECK (true);
