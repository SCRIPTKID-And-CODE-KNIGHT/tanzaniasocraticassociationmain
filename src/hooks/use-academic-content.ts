import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useNews() {
  return useQuery({ queryKey: ['public-news'], queryFn: async () => {
    const { data, error } = await supabase.from('announcements').select('*').eq('is_published', true).order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }});
}
export function useEvents() {
  return useQuery({ queryKey: ['public-events'], queryFn: async () => {
    const { data, error } = await supabase.from('almanac_events').select('*').eq('is_published', true).order('event_date');
    if (error) throw error;
    return data ?? [];
  }});
}
