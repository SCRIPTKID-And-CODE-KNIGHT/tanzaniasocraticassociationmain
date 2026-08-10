CREATE OR REPLACE FUNCTION public.submissions_open()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT s.is_enabled AND (NOT s.block_after_deadline OR s.deadline > now())
      FROM public.submission_settings s
      ORDER BY s.created_at DESC
      LIMIT 1
    ),
    true
  );
$$;

DROP POLICY IF EXISTS "Anyone can submit results" ON public.result_submissions;

CREATE POLICY "Anyone can submit results when open"
ON public.result_submissions
FOR INSERT
WITH CHECK (public.submissions_open());