import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarDays, Newspaper } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useNews, useEvents } from '@/hooks/use-academic-content';
import { Reveal } from '@/components/Reveal';

export default function ContentHighlights() {
  const news = useNews();
  const events = useEvents();
  const today = format(new Date(), 'yyyy-MM-dd');
  const upcoming = (events.data ?? []).filter(e => (e.event_end_date ?? e.event_start_date ?? e.event_date) >= today).slice(0, 3);
  return <section className="py-16 border-b border-border"><div className="page-shell grid gap-12 lg:grid-cols-2">
    <Reveal variant="up"><div className="flex items-center justify-between mb-6"><div><p className="section-label mb-2">From the association</p><h2 className="text-2xl font-bold">News & announcements</h2></div><Button asChild variant="ghost" size="icon" aria-label="View all news"><Link to="/news"><ArrowUpRight /></Link></Button></div>
      {news.isError ? <p className="text-muted-foreground">News is unavailable right now.</p> : news.isLoading ? <p className="text-muted-foreground">Loading news…</p> : !news.data?.length ? <div className="border-t border-border py-8 flex gap-4"><Newspaper className="text-primary"/><p className="text-muted-foreground">No announcements published yet.</p></div> : news.data.slice(0,3).map(n => <Link key={n.id} to={`/news#${n.id}`} className="block border-t border-border py-5 group"><p className="text-xs text-muted-foreground mb-2">{format(parseISO(n.created_at), 'dd MMM yyyy')}</p><h3 className="font-semibold group-hover:text-primary">{n.title}</h3><p className="text-sm text-muted-foreground line-clamp-2 mt-2">{n.content}</p></Link>)}
      <Button asChild variant="link" className="px-0 mt-3"><Link to="/news">All news <ArrowUpRight /></Link></Button>
    </Reveal>
    <Reveal variant="up" delay={100}><div className="flex items-center justify-between mb-6"><div><p className="section-label mb-2">Academic calendar</p><h2 className="text-2xl font-bold">Upcoming events</h2></div><Button asChild variant="ghost" size="icon" aria-label="View events calendar"><Link to="/events"><CalendarDays /></Link></Button></div>
      {events.isError ? <p className="text-muted-foreground">The schedule is unavailable right now.</p> : events.isLoading ? <p className="text-muted-foreground">Loading events…</p> : !upcoming.length ? <div className="border-t border-border py-8 text-muted-foreground">No upcoming events published.</div> : upcoming.map(e => <Link key={e.id} to="/events" className="flex gap-5 border-t border-border py-5 group"><div className="w-14 shrink-0 text-center text-primary"><p className="text-xs uppercase">{format(parseISO(e.event_start_date ?? e.event_date),'MMM')}</p><p className="text-3xl font-bold">{format(parseISO(e.event_start_date ?? e.event_date),'dd')}</p></div><div><p className="text-xs text-muted-foreground mb-1">Series {e.series_number}</p><h3 className="font-semibold group-hover:text-primary">{e.event_name}</h3><p className="text-sm text-muted-foreground mt-1">{e.responsible_person}</p></div></Link>)}
      <Button asChild variant="link" className="px-0 mt-3"><Link to="/events">Full calendar <ArrowUpRight /></Link></Button>
    </Reveal>
  </div></section>;
}
