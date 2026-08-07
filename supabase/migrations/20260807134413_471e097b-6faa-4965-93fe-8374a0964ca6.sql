CREATE TABLE public.submission_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deadline timestamp with time zone NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  block_after_deadline boolean NOT NULL DEFAULT true,
  message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.submission_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submission_settings TO authenticated;
GRANT ALL ON public.submission_settings TO service_role;

ALTER TABLE public.submission_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view submission settings"
ON public.submission_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can manage submission settings"
ON public.submission_settings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_submission_settings_updated_at
BEFORE UPDATE ON public.submission_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();