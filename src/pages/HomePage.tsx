import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Trophy, FileText, ArrowRight, ExternalLink, Building2, Sparkles } from 'lucide-react';
import TassaAI from '@/components/TassaAI';
import { Reveal } from '@/components/Reveal';
import AchievementsSection from '@/components/AchievementsSection';
import ExamCountdown from '@/components/ExamCountdown';
import LeadershipSection from '@/components/LeadershipSection';
import geographyBooks from '@/assets/geography-books.jpg';
import founderImage from '@/assets/founder-daudi-manumba.jpg';
import { supabase } from '@/integrations/supabase/client';

const HomePage = () => {
  const [schools, setSchools] = useState<{ id: string; school_name: string; region: string }[]>([]);

  useEffect(() => {
    supabase
      .from('schools')
      .select('id, school_name, region')
      .order('school_name')
      .then(({ data }) => setSchools(data || []));
  }, []);

  const quickStats = [
    { icon: Users, label: 'Registered Schools', value: schools.length ? `${schools.length}+` : '25+' },
    { icon: Trophy, label: 'Annual Series', value: '12' },
    { icon: BookOpen, label: 'Subjects Covered', value: '1' },
    { icon: FileText, label: 'Past Papers', value: '200+' },
  ];

  const displaySchools = schools.slice(0, 12);

  return (
    <div className="bg-background">
      <TassaAI />

      {/* Top Study Materials Bar */}
      <div className="bg-[image:var(--gradient-hero)] text-primary-foreground py-4 text-center shadow-lg">
        <div className="flex items-center justify-center gap-3 flex-wrap px-4">
          <span className="text-xs font-medium bg-warning text-warning-foreground px-3 py-1 rounded-full">NEW 2026</span>
          <Button
            asChild
            className="bg-warning text-warning-foreground font-bold hover:opacity-90 hover:scale-105 transition-all duration-300 shadow-lg"
            size="lg"
          >
            <Link to="/store">
              <BookOpen className="mr-2 h-5 w-5" />
              STUDY MATERIALS AND RESOURCES
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <section
        className="py-24 relative overflow-hidden text-center text-primary-foreground"
        style={{
          backgroundImage: `linear-gradient(135deg, hsl(222 65% 12% / 0.92), hsl(212 60% 25% / 0.88)), url(${geographyBooks})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-5xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 mb-6 animate-fade-in">
            <Sparkles className="h-4 w-4 text-warning" />
            <span className="text-xs font-medium">Empowering Tanzania's brightest minds</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 font-heading animate-fade-in">
            Tanzania Advanced Socratic Schools Association
          </h1>
          <p className="text-base md:text-xl mb-8 text-white/80 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '120ms' }}>
            Empowering academic excellence through comprehensive educational
            competitions across Tanzania
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '240ms' }}>
            <Link to="/registration">
              <Button size="lg" className="bg-warning text-warning-foreground font-semibold hover:opacity-90 hover:scale-105 transition-transform">
                Register Your School
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/results">
              <Button size="lg" variant="outline" className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-primary transition">
                View Results
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Exam Countdown Section */}
      <section className="py-12 bg-card border-b border-border">
        <div className="max-w-2xl mx-auto px-6">
          <ExamCountdown />
        </div>
      </section>

      {/* Quick Stats - staggered side reveals */}
      <section className="py-16 bg-secondary/40">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {quickStats.map((stat, index) => (
            <Reveal key={index} variant={index % 2 === 0 ? "left" : "right"} delay={index * 100}>
              <Card className="rounded-2xl border-border shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6 text-center bg-card">
                <div className="mx-auto mb-3 h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <stat.icon className="h-6 w-6" />
                </div>
                <CardHeader>
                  <CardTitle className="text-3xl font-bold text-primary">{stat.value}</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground font-medium">{stat.label}</CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Co-Founder Section - combined effects */}
      <section className="py-16 bg-secondary/40">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Reveal variant="fade"><h2 className="text-3xl font-bold text-foreground mb-8">Our Leadership</h2></Reveal>
          <Reveal variant="scale" delay={120} className="flex flex-col items-center">
            <div className="relative mb-6 animate-float-slow">
              <img
                src={founderImage}
                alt="Sir Daudi Musula Manumba - Co-Founder of TASSA"
                className="rounded-xl shadow-xl w-48 h-56 object-cover object-top border-4 border-primary/20"
              />
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg whitespace-nowrap">
                <p className="text-xs font-semibold">Co-Founder</p>
              </div>
            </div>
            <h3 className="text-xl font-bold text-foreground mt-4">Sir Daudi Musula Manumba</h3>
            <p className="text-primary mt-2">Co-Founder & Supervisor</p>
            <Reveal variant="up" delay={240}>
              <Link to="/about" className="mt-4 inline-block">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  Learn More About Us
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </Reveal>
          </Reveal>
        </div>
      </section>

      {/* Committees / Academic Secretariat */}
      <LeadershipSection />

      {/* Trusted By Section - zoom scale reveal */}
      <section className="py-16 bg-background overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal className="text-center mb-10" variant="scale">
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-3">Trusted By</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              {schools.length || '25+'} Schools Across Tanzania
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Joining hands with the nation's leading institutions to deliver world-class academic competitions.
            </p>
          </Reveal>

          {schools.length > 0 ? (
            <div className="space-y-4">
              {/* Row 1 — scrolls left */}
              <div className="relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-r from-background to-transparent pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-l from-background to-transparent pointer-events-none" />
                <div className="flex gap-4 animate-scroll-left w-max">
                  {[...displaySchools, ...displaySchools].map((s, i) => (
                    <div
                      key={`left-${s.id}-${i}`}
                      className="group flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-3 shadow-sm hover:shadow-lg hover:border-primary/40 transition-all w-64 shrink-0"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col leading-tight min-w-0">
                        <span className="text-sm font-semibold text-foreground truncate">{s.school_name}</span>
                        <span className="text-xs text-muted-foreground truncate">{s.region}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 2 — scrolls right */}
              <div className="relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-r from-background to-transparent pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-l from-background to-transparent pointer-events-none" />
                <div className="flex gap-4 animate-scroll-right w-max">
                  {[...displaySchools.reverse(), ...displaySchools].map((s, i) => (
                    <div
                      key={`right-${s.id}-${i}`}
                      className="group flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-3 shadow-sm hover:shadow-lg hover:border-primary/40 transition-all w-64 shrink-0"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col leading-tight min-w-0">
                        <span className="text-sm font-semibold text-foreground truncate">{s.school_name}</span>
                        <span className="text-xs text-muted-foreground truncate">{s.region}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">Loading registered schools…</div>
          )}

          <div className="text-center mt-10">
            <Link to="/registered-schools">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                View All Registered Schools
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <AchievementsSection />

    </div>
  );
};

export default HomePage;
