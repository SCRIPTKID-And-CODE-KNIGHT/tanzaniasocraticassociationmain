import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowUpRight, Trophy, FileSpreadsheet, BookOpen, School, CheckSquare, CalendarDays, CreditCard, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
const resources = [
  { title: 'School & series results', category: 'Results', detail: 'Published school results, top students and top schools.', to: '/results', icon: Trophy },
  { title: 'Results templates & submission', category: 'Results', detail: 'School templates and completed results uploads.', to: '/submit-results', icon: FileSpreadsheet },
  { title: 'Study materials', category: 'Learning', detail: 'Geography books, exams and learning materials.', to: '/store', icon: BookOpen },
  { title: 'Register your school', category: 'Schools', detail: 'School registration with the association.', to: '/registration', icon: School },
  { title: 'Confirm participation', category: 'Schools', detail: 'Participation in the series opened by the administrator.', to: '/participation', icon: CheckSquare },
  { title: 'Events & deadlines', category: 'Learning', detail: 'Published series dates and academic activities.', to: '/events', icon: CalendarDays },
  { title: 'Payment status', category: 'Schools', detail: 'School payment records by series.', to: '/payment-status', icon: CreditCard },
  { title: 'School directory', category: 'Schools', detail: 'Registered schools across Tanzania.', to: '/registered-schools', icon: Building2 },
];
export default function ResourceCentrePage() {
  const [search, setSearch] = useState(''); const [category, setCategory] = useState('All');
  const filtered = resources.filter(r => (category === 'All' || r.category === category) && `${r.title} ${r.detail}`.toLowerCase().includes(search.toLowerCase()));
  return <div><header className="page-heading"><div className="page-shell"><p className="section-label mb-3">For teachers & students</p><h1 className="text-3xl sm:text-4xl font-bold">School resource centre</h1></div></header><div className="page-shell py-10"><div className="flex flex-col sm:flex-row justify-between gap-5 mb-8"><div className="relative sm:w-80"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/><Input aria-label="Search resources" placeholder="Search resources…" className="pl-10" value={search} onChange={e=>setSearch(e.target.value)}/></div><div className="flex gap-2 flex-wrap">{['All','Results','Schools','Learning'].map(c=><Button key={c} variant={category===c?'default':'outline'} size="sm" onClick={()=>setCategory(c)}>{c}</Button>)}</div></div><div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">{filtered.map(r=><article key={r.to} className="border border-border rounded-lg bg-card p-6 flex flex-col"><r.icon className="h-7 w-7 text-primary mb-6"/><p className="section-label mb-2">{r.category}</p><h2 className="text-lg font-semibold">{r.title}</h2><p className="text-sm text-muted-foreground mt-3 mb-6">{r.detail}</p><Button asChild variant="outline" className="mt-auto justify-between"><Link to={r.to}>Open <ArrowUpRight/></Link></Button></article>)}</div>{!filtered.length&&<p className="py-12 text-muted-foreground text-center">No resources match your search.</p>}</div></div>;
}
