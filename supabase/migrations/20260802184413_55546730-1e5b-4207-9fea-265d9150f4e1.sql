ALTER TABLE public.security_logs
  ADD COLUMN IF NOT EXISTS method text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS blocked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS resolved boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'app';

CREATE INDEX IF NOT EXISTS security_logs_created_at_idx ON public.security_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS security_logs_severity_idx ON public.security_logs (severity);
CREATE INDEX IF NOT EXISTS security_logs_ip_idx ON public.security_logs (ip_address);

GRANT SELECT, UPDATE, DELETE ON public.security_logs TO authenticated;
GRANT ALL ON public.security_logs TO service_role;

DROP POLICY IF EXISTS "Only admins can update security logs" ON public.security_logs;
CREATE POLICY "Only admins can update security logs"
ON public.security_logs FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Only admins can delete security logs" ON public.security_logs;
CREATE POLICY "Only admins can delete security logs"
ON public.security_logs FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.security_logs REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'security_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.security_logs;
  END IF;
END $$;