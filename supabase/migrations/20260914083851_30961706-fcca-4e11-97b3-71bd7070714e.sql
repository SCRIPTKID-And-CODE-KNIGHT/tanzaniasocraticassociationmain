CREATE TABLE public.participation_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  active_series_number integer NOT NULL DEFAULT 1,
  is_open boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.participation_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.participation_settings TO authenticated;
GRANT ALL ON public.participation_settings TO service_role;

ALTER TABLE public.participation_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read participation settings"
ON public.participation_settings FOR SELECT USING (true);

CREATE POLICY "Admins can manage participation settings"
ON public.participation_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_participation_settings_updated_at
BEFORE UPDATE ON public.participation_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.participation_settings (active_series_number, is_open) VALUES (2, true);