import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, ArrowRight, CalendarDays, School, CheckSquare } from 'lucide-react';
import TassaAI from '@/components/TassaAI';
import { Reveal } from '@/components/Reveal';
import AchievementsSection from '@/components/AchievementsSection';
import ExamCountdown from '@/components/ExamCountdown';
import LeadershipSection from '@/components/LeadershipSection';
import ContentHighlights from '@/components/academic/ContentHighlights';
import classroomImage from '@/assets/tassa-classroom.jpg';
import founderImage from '@/assets/founder-daudi-manumba.jpg';
import { supabase } from '@/integrations/supabase/client';

const schoolActions = [
  { title: 'Register a school', to: '/registration', icon: School },
  { title: 'Confirm participation', to: '/participation', icon: CheckSquare },
  { title: 'Submit results', to: '/submit-results', icon: FileText },
  { title: 'Study materials', to: '/store', icon: BookOpen },
];

const HomePage = () => {
  const [schools, setSchools] = useState<{ id: string; school_name: string; region: string }[]>([]);
  const [schoolStatus, setSchoolStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  useEffect(() => {
    supabase.from('schools').select('id, school_name, region').order('school_name').then(({ data, error }) => {
      setSchools(data ?? []);
      setSchoolStatus(error ? 'error' : 'ready');
    });
  }, []);
  const regions = Object.entries(schools.reduce<Record<string, typeof schools>>((acc, s) => { const raw = s.region?.trim().toLowerCase(); const r = raw ? raw.replace(/\b\w/g, c => c.toUpperCase()) : 'Other regions'; (acc[r] ||= []).push(s); return acc; }, {})).sort((a, b) => b[1].length - a[1].length);

  return <div className="bg-background">
    <TassaAI />
    <section className="relative isolate overflow-hidden text-hero-foreground">
      <img src={classroomImage} alt="Students studying together in a Tanzanian classroom" className="absolute inset-0 -z-20 h-full w-full object-cover object-center" fetchPriority="high" />
      <div className="hero-photo-shade absolute inset-0 -z-10" />
      <div className="page-shell py-12 sm:py-16 lg:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-5 text-hero-foreground/80">Est. in Geita · United Republic of Tanzania</p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.12] max-w-3xl">Tanzania Advanced Socratic Schools Association</h1>
        <p className="text-base sm:text-lg text-hero-foreground/85 mt-6 max-w-xl leading-relaxed">The examining association for Advanced Level geography series — coordinating examinations, publishing results and recognising achievement among member schools.</p>
        <div className="flex flex-wrap gap-3 mt-8">
          <Button asChild size="lg" className="bg-warning text-warning-foreground hover:bg-warning/90"><Link to="/results">Examination results</Link></Button>
          <Button asChild size="lg" variant="outline" className="border-hero-foreground/50 text-hero-foreground bg-transparent hover:bg-hero-foreground hover:text-foreground"><Link to="/registration">Register a member school</Link></Button>
        </div>
      </div>
    </section>
    <nav aria-label="School quick links" className="border-b border-border bg-card">
      <div className="page-shell grid grid-cols-2 lg:grid-cols-4">
        {schoolActions.map(a => <Link key={a.to} to={a.to} className="group flex items-center gap-3 py-6 pr-3 sm:pr-6 border-b lg:border-b-0 border-border hover:text-primary transition-colors"><a.icon className="h-6 w-6 shrink-0 text-primary" /><span className="font-semibold text-sm sm:text-base">{a.title}</span><ArrowRight className="h-4 w-4 ml-auto shrink-0 text-muted-foreground group-hover:text-primary" /></Link>)}
      </div>
    </nav>
    <div className="page-shell"><ExamCountdown /></div>
    <ContentHighlights />
    <section className="py-16 bg-secondary/50 border-b border-border">
      <div className="page-shell grid md:grid-cols-[240px_1fr] gap-8 md:gap-14 items-center max-w-5xl">
        <Reveal variant="up"><Link to="/about"><img src={founderImage} alt="Sir Daudi Musula Manumba, Co-Founder and Supervisor" className="w-56 h-64 object-cover object-top rounded-lg" loading="lazy" /></Link></Reveal>
        <Reveal variant="up"><p className="section-label mb-3">Our leadership</p><h2 className="text-3xl font-bold mb-6">Committed to education.<br />United by excellence.</h2><h3 className="text-xl font-semibold">Sir Daudi Musula Manumba</h3><p className="text-primary mt-2">Co-Founder &amp; Supervisor</p><Button asChild variant="outline" className="mt-6"><Link to="/about">About the association</Link></Button></Reveal>
      </div>
    </section>
    <LeadershipSection />
    <section className="py-16 bg-background overflow-hidden border-y border-border">
      <div className="page-shell">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8"><div><p className="section-label mb-3">Member schools</p><h2 className="text-3xl font-bold">Directory by region</h2>{schoolStatus === 'ready' && schools.length > 0 && <p className="text-muted-foreground mt-3">{schools.length} registered schools. </p>}</div><Button asChild variant="outline"><Link to="/registered-schools">School directory</Link></Button></div>
        {schoolStatus === 'loading' ? <p className="text-muted-foreground py-6">Loading registered schools…</p> : schoolStatus === 'error' ? <p className="text-muted-foreground py-6">The school directory is unavailable right now.</p> : !schools.length ? <p className="text-muted-foreground py-6">No schools registered yet.</p> : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 border-t border-border">{regions.slice(0, 6).map(([region, list]) => <div key={region} className="py-5 border-b border-border"><div className="flex items-baseline justify-between mb-2"><h3 className="text-lg">{region}</h3><span className="text-xs text-muted-foreground tabular-nums">{list.length} {list.length === 1 ? 'school' : 'schools'}</span></div><ul className="text-sm text-muted-foreground space-y-1">{list.slice(0, 4).map(s => <li key={s.id} className="truncate">{s.school_name}</li>)}{list.length > 4 && <li><Link to="/registered-schools" className="text-primary underline-offset-4 hover:underline">and {list.length - 4} more</Link></li>}</ul></div>)}</div>}
      </div>
    </section>
    <AchievementsSection />
    <section className="bg-secondary border-t border-border py-12"><div className="page-shell flex flex-col md:flex-row justify-between md:items-center gap-6"><div><p className="section-label mb-2">For your school</p><h2 className="text-2xl font-bold">Resources for the next step</h2></div><div className="flex flex-wrap gap-3"><Button asChild><Link to="/resources">School resource centre</Link></Button><Button asChild variant="outline"><Link to="/events"><CalendarDays />Events calendar</Link></Button></div></div></section>
  </div>;
};
export default HomePage;
