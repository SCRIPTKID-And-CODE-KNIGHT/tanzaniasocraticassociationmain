import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, Menu, ChevronDown, LogOut, ArrowUpRight } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
const groups=[
 {title:'Home',url:'/'},
 {title:'About',children:[{title:'About TASSA',url:'/about'},{title:'News & announcements',url:'/news'},{title:'Events calendar',url:'/events'},{title:'Examination almanac',url:'/almanac'}]},
 {title:'Schools',children:[{title:'Register school',url:'/registration'},{title:'Confirm participation',url:'/participation'},{title:'Registered schools',url:'/registered-schools'},{title:'Payment status',url:'/payment-status'}]},
 {title:'Results',children:[{title:'View results',url:'/results'},{title:'Submit results',url:'/submit-results'}]},
 {title:'Resources',children:[{title:'School resource centre',url:'/resources'},{title:'Study materials',url:'/store'},{title:'Help & FAQs',url:'/help'}]},
 {title:'Contact',url:'/contact'},
];
export function TopNav(){const {pathname}=useLocation();const navigate=useNavigate();const [user,setUser]=useState<User|null>(null);const [open,setOpen]=useState(false);
 useEffect(()=>{supabase.auth.getSession().then(({data})=>setUser(data.session?.user??null));const {data}=supabase.auth.onAuthStateChange((_e,s)=>setUser(s?.user??null));return()=>data.subscription.unsubscribe()},[]);
 useEffect(()=>setOpen(false),[pathname]);
 const signOut=async()=>{await supabase.auth.signOut();navigate('/')};
 const active=(url:string)=>pathname===url;
 return <header className="sticky top-0 z-50 bg-card border-b border-border"><div className="bg-primary text-primary-foreground"><div className="page-shell py-2 flex justify-between items-center text-[11px] sm:text-xs"><span>Together for academic excellence</span><Link to="/help" className="hidden sm:block">Help & support</Link></div></div><div className="page-shell flex h-20 items-center justify-between gap-4"><Link to="/" className="flex items-center gap-3 shrink-0"><div className="bg-primary text-primary-foreground h-11 w-11 flex items-center justify-center rounded-lg"><GraduationCap className="h-7 w-7"/></div><div><span className="text-2xl font-bold text-primary">TASSA</span><span className="block text-[10px] text-muted-foreground">Advanced Socratic Schools</span></div></Link><nav aria-label="Main navigation" className="hidden xl:flex items-center gap-1">{groups.map(g=>g.children?<DropdownMenu key={g.title}><DropdownMenuTrigger asChild><Button variant="ghost" className={cn(g.children.some(c=>active(c.url))&&'text-primary bg-primary-light')}>{g.title}<ChevronDown className="h-3 w-3"/></Button></DropdownMenuTrigger><DropdownMenuContent align="start">{g.children.map(c=><DropdownMenuItem key={c.url} asChild><Link to={c.url}>{c.title}</Link></DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>:<Button key={g.title} asChild variant="ghost" className={cn(g.url&&active(g.url)&&'text-primary bg-primary-light')}><NavLink to={g.url??'/'}>{g.title}</NavLink></Button>)}</nav><div className="hidden xl:flex gap-2"><Button asChild variant="outline" size="sm"><Link to={user?'/admin':'/auth'}>{user?'Admin':'Login'}</Link></Button><Button asChild size="sm"><Link to="/registration">Join TASSA<ArrowUpRight/></Link></Button></div><Sheet open={open} onOpenChange={setOpen}><SheetTrigger asChild><Button variant="outline" className="xl:hidden"><Menu/>Menu</Button></SheetTrigger><SheetContent className="bg-card text-card-foreground w-[90vw] max-w-sm overflow-y-auto"><SheetTitle className="mb-6 text-primary">TASSA Menu</SheetTitle><nav aria-label="Mobile navigation" className="space-y-5">{groups.map(g=><div key={g.title}>{g.children?<><p className="section-label mb-2">{g.title}</p>{g.children.map(c=><Button key={c.url} variant={active(c.url)?'secondary':'ghost'} asChild className="w-full justify-start"><Link to={c.url}>{c.title}</Link></Button>)}</>:<Button asChild variant={g.url&&active(g.url)?'secondary':'ghost'} className="w-full justify-start"><Link to={g.url??'/'}>{g.title}</Link></Button>}</div>)}<Button asChild className="w-full"><Link to={user?'/admin':'/auth'}>{user?'Admin panel':'Login'}</Link></Button>{user&&<Button onClick={signOut} variant="outline" className="w-full"><LogOut/>Sign out</Button>}</nav></SheetContent></Sheet></div></header>;
}
