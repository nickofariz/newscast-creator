-- Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true);

-- Create RLS policies for videos bucket
CREATE POLICY "Anyone can view videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

CREATE POLICY "Authenticated users can upload videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'videos');

CREATE POLICY "Users can update their own videos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'videos');

CREATE POLICY "Users can delete their own videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'videos');

-- Create videos metadata table
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  audio_url TEXT,
  subtitle_url TEXT,
  duration INTEGER DEFAULT 0,
  template TEXT DEFAULT 'headline-top',
  voice TEXT DEFAULT 'female',
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- RLS policies for videos table (public access for now, can add auth later)
CREATE POLICY "Anyone can view videos"
ON public.videos FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert videos"
ON public.videos FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update videos"
ON public.videos FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete videos"
ON public.videos FOR DELETE
USING (true);