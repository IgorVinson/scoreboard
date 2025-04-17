-- Create user_preferences table for storing user-specific settings
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, key)
);

-- Create daily_notes table for storing user notes
CREATE TABLE IF NOT EXISTS public.daily_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  today_notes text DEFAULT '',
  tomorrow_notes text DEFAULT '',
  general_comments text DEFAULT '',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_preferences
CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own preferences"
  ON public.user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS policies for daily_notes
CREATE POLICY "Users can view their own daily notes"
  ON public.daily_notes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily notes"
  ON public.daily_notes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily notes"
  ON public.daily_notes
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_notes_updated_at
  BEFORE UPDATE ON public.daily_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add tables to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_preferences;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_notes; 