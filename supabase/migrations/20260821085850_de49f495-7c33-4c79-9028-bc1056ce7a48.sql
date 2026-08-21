ALTER TABLE public.result_submissions
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'upload',
  ALTER COLUMN file_url DROP NOT NULL,
  ALTER COLUMN file_name DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.result_submission_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.result_submissions(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  subject text,
  marks numeric,
  grade text,
  position integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS result_submission_rows_submission_id_idx
  ON public.result_submission_rows(submission_id);

GRANT SELECT, INSERT ON public.result_submission_rows TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.result_submission_rows TO authenticated;
GRANT ALL ON public.result_submission_rows TO service_role;

ALTER TABLE public.result_submission_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can add result rows while submissions are open"
ON public.result_submission_rows
FOR INSERT
WITH CHECK (public.submissions_open());

CREATE POLICY "Admins can view result rows"
ON public.result_submission_rows
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete result rows"
ON public.result_submission_rows
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));