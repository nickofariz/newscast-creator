-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create a table for overlay templates
CREATE TABLE public.overlay_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  settings JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.overlay_templates ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all users to read templates (public templates)
CREATE POLICY "Templates are viewable by everyone" 
ON public.overlay_templates 
FOR SELECT 
USING (true);

-- Create policy to allow insert
CREATE POLICY "Anyone can create templates" 
ON public.overlay_templates 
FOR INSERT 
WITH CHECK (true);

-- Create policy to allow update
CREATE POLICY "Anyone can update templates" 
ON public.overlay_templates 
FOR UPDATE 
USING (true);

-- Create policy to allow delete
CREATE POLICY "Anyone can delete templates" 
ON public.overlay_templates 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_overlay_templates_updated_at
BEFORE UPDATE ON public.overlay_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();