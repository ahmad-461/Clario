-- Supabase Schema Setup for Clario Account System (Phase 10)

-- 1. Profiles Table (Personalized default tone mode)
CREATE TABLE IF NOT EXISTS public.profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    preferred_tone TEXT NOT NULL CHECK (preferred_tone IN ('simple', 'student', 'teacher', 'elderly-friendly', 'elderly')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can select their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- 2. Explanation History Table
CREATE TABLE IF NOT EXISTS public.explanation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    input_type TEXT NOT NULL CHECK (input_type IN ('text', 'pdf', 'image')),
    tone_mode TEXT NOT NULL CHECK (tone_mode IN ('simple', 'student', 'teacher', 'elderly-friendly', 'elderly')),
    explanation_text TEXT NOT NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    risk_reason TEXT,
    manipulation_flags TEXT[],
    confidence_level TEXT NOT NULL CHECK (confidence_level IN ('high', 'medium', 'low'))
);

-- Enable RLS on explanation_history
ALTER TABLE public.explanation_history ENABLE ROW LEVEL SECURITY;

-- Explanation History Policies
CREATE POLICY "Users can select their own history"
ON public.explanation_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own history"
ON public.explanation_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own history"
ON public.explanation_history FOR DELETE
USING (auth.uid() = user_id);
