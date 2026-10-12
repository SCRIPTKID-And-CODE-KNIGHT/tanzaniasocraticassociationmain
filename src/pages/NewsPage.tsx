import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Search, Newspaper } from 'lucide-react';
import { useNews } from '@/hooks/use-academic-content';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
export default function NewsPage() {
 const news=useNews(); const [search,setSearch]=useState('');
 const items=(news.data??[]).filter(n=>`${n.title} ${n.content}`.toLowerCase().includes(search.toLowerCase()));
 return <div><header className="page-heading"><div className="page-shell"><p className="section-label mb-3">Association updates</p><h1 className="text-3xl sm:text-4xl font-bold">News & announcements</h1></div></header><div className="page-shell py-10"><div className="relative max-w-md mb-10"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/><Input aria-label="Search news" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search announcements…" className="pl-10"/></div>{news.isLoading?<p>Loading announcements…</p>:news.isError?<div><p className="text-destructive mb-4">We couldn't load the announcements.</p><Button onClick={()=>news.refetch()}>Try again</Button></div>:!items.length?<div className="py-16 text-center"><Newspaper className="mx-auto h-10 w-10 text-muted-foreground mb-4"/><p className="text-muted-foreground">{search?'No matching announcements.':'No announcements published yet.'}</p></div>:<div className="max-w-4xl">{items.map(n=><article id={n.id} key={n.id} className="border-b border-border pb-8 mb-8 scroll-mt-32"><div className="flex gap-3 items-center text-xs text-muted-foreground mb-4"><time>{format(parseISO(n.created_at),'dd MMMM yyyy')}</time>{n.priority==='high'&&<span className="bg-warning-light text-warning-foreground px-2 py-1 rounded">Important</span>}</div><h2 className="text-2xl font-bold mb-4">{n.title}</h2><p className="whitespace-pre-wrap text-muted-foreground leading-relaxed break-words">{n.content}</p></article>)}</div>}</div></div>;
}
