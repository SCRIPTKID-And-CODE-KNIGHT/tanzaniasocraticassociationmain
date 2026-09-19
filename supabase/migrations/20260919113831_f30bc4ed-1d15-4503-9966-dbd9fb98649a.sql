CREATE TABLE public.result_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  school_name text NOT NULL,
  student_count integer NOT NULL DEFAULT 50,
  average_divisor numeric NOT NULL DEFAULT 2,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id)
);

GRANT SELECT ON public.result_templates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.result_templates TO authenticated;
GRANT ALL ON public.result_templates TO service_role;

ALTER TABLE public.result_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view result templates" ON public.result_templates FOR SELECT USING (true);
CREATE POLICY "Admins can manage result templates" ON public.result_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.validate_result_template()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.student_count < 1 OR NEW.student_count > 250 THEN
    RAISE EXCEPTION 'student_count must be between 1 and 250';
  END IF;
  IF NEW.average_divisor <= 0 THEN
    RAISE EXCEPTION 'average_divisor must be greater than 0';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_result_templates
BEFORE INSERT OR UPDATE ON public.result_templates
FOR EACH ROW EXECUTE FUNCTION public.validate_result_template();

CREATE TRIGGER update_result_templates_updated_at
BEFORE UPDATE ON public.result_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();