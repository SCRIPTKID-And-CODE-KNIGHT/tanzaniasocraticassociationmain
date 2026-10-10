import { supabase } from '@/integrations/supabase/client';

export const RESULTS_BUCKET = 'published-results';
export const STORAGE_PREFIX = 'storage://';

export const isStoredFile = (v?: string | null) => !!v && v.startsWith(STORAGE_PREFIX);

export async function uploadResultFile(file: File, folder: string): Promise<string> {
  const safe = file.name.replace(/[^a-z0-9.\-_]+/gi, '_');
  const path = `${folder}/${Date.now()}_${safe}`;
  const { error } = await supabase.storage.from(RESULTS_BUCKET).upload(path, file, { upsert: false });
  if (error) throw error;
  return STORAGE_PREFIX + path;
}

/** Turn a saved value (web link or uploaded file) into a URL the browser can open. */
export async function resolveResultUrl(value?: string | null): Promise<string | null> {
  if (!value) return null;
  const v = value.trim();
  if (!isStoredFile(v)) return /^https?:\/\//i.test(v) ? v : `https://${v}`;
  const { data, error } = await supabase.storage
    .from(RESULTS_BUCKET)
    .createSignedUrl(v.slice(STORAGE_PREFIX.length), 3600, { download: false });
  if (error || !data) return null;
  return data.signedUrl;
}

export async function openResultFile(value?: string | null) {
  const win = window.open('', '_blank');
  const url = await resolveResultUrl(value);
  if (!url) {
    win?.close();
    throw new Error('This file could not be opened');
  }
  if (win) win.location.href = url;
  else window.location.href = url;
}

export const fileLabel = (v?: string | null) =>
  isStoredFile(v) ? v!.split('/').pop()!.replace(/^\d+_/, '') : v || '';
