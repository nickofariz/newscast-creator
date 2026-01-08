-- Add user_id columns to tables
ALTER TABLE public.videos ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.overlay_templates ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_videos_user_id ON public.videos(user_id);
CREATE INDEX idx_overlay_templates_user_id ON public.overlay_templates(user_id);

-- Drop existing permissive policies for videos
DROP POLICY IF EXISTS "Anyone can delete videos" ON public.videos;
DROP POLICY IF EXISTS "Anyone can insert videos" ON public.videos;
DROP POLICY IF EXISTS "Anyone can update videos" ON public.videos;
DROP POLICY IF EXISTS "Anyone can view videos" ON public.videos;

-- Create secure RLS policies for videos
CREATE POLICY "Users can view their own videos"
  ON public.videos FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own videos"
  ON public.videos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos"
  ON public.videos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos"
  ON public.videos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Drop existing permissive policies for overlay_templates
DROP POLICY IF EXISTS "Anyone can create templates" ON public.overlay_templates;
DROP POLICY IF EXISTS "Anyone can delete templates" ON public.overlay_templates;
DROP POLICY IF EXISTS "Anyone can update templates" ON public.overlay_templates;
DROP POLICY IF EXISTS "Templates are viewable by everyone" ON public.overlay_templates;

-- Create secure RLS policies for overlay_templates
CREATE POLICY "Users can view their own templates"
  ON public.overlay_templates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
  ON public.overlay_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON public.overlay_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON public.overlay_templates FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);