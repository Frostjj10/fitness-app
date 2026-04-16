-- Add progressive_overload column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS progressive_overload BOOLEAN DEFAULT TRUE;

-- Allow it to be updated via RLS
GRANT UPDATE ON public.profiles TO anon;
