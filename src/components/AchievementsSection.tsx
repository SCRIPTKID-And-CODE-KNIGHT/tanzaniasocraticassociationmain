import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Eye, EyeOff, Medal, Award, Star, GraduationCap, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Reveal } from '@/components/Reveal';

interface TopStudent {
  id: string;
  student_name: string;
  school_name: string;
  region: string;
  district: string;
  subject: string;
  marks: number;
  position: number;
  series_number: number;
}

interface BestSchool {
  id: string;
  school_name: string;
  region: string;
  district: string;
  average_marks: number;
  position: number;
  series_number: number;
  total_students: number | null;
}

const AchievementsSection = () => {
  const [topStudents, setTopStudents] = useState<TopStudent[]>([]);
  const [bestSchools, setBestSchools] = useState<BestSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStudents, setShowStudents] = useState(false);
  const [showSchools, setShowSchools] = useState(false);

  useEffect(() => {
    fetchPublishedData();
  }, []);

  const fetchPublishedData = async () => {
    try {
      const [studentsResponse, schoolsResponse] = await Promise.all([
        supabase
          .from('top_students')
          .select('*')
          .eq('is_published', true)
          .order('series_number', { ascending: false })
          .order('position', { ascending: true }),
        supabase
          .from('best_schools')
          .select('*')
          .eq('is_published', true)
          .order('series_number', { ascending: false })
          .order('position', { ascending: true })
      ]);

      if (studentsResponse.data) setTopStudents(studentsResponse.data);
      if (schoolsResponse.data) setBestSchools(schoolsResponse.data);
    } catch (error) {
      console.error('Error fetching published data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-secondary/40 to-background">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-primary">Loading achievements...</p>
        </div>
      </section>
    );
  }

  const positionStyle = (pos: number) => {
    if (pos === 1) return { ring: 'ring-2 ring-warning/70', badge: 'bg-warning text-warning-foreground', icon: Trophy, label: 'Gold', header: 'from-warning to-warning/60' };
    if (pos === 2) return { ring: 'ring-2 ring-muted-foreground/40', badge: 'bg-muted text-foreground', icon: Medal, label: 'Silver', header: 'from-muted-foreground/60 to-muted-foreground/30' };
    if (pos === 3) return { ring: 'ring-2 ring-warning/40', badge: 'bg-warning/40 text-warning-foreground', icon: Award, label: 'Bronze', header: 'from-warning/60 to-warning/20' };
    return { ring: '', badge: 'bg-primary/10 text-primary', icon: Star, label: '', header: 'from-primary to-primary/60' };
  };

  return (
    <section className="py-20 bg-gradient-to-b from-secondary/40 to-background">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-3">Achievements</p>
          <h2 className="text-4xl font-bold text-foreground mb-4 font-heading">
            Hall of Excellence
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Celebrating outstanding academic achievements and exceptional performance
          </p>
        </Reveal>

        {/* Top Students */}
        <div className="mb-16">
          <Reveal className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/15 text-warning">
                <Trophy className="h-5 w-5" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Top Performing Students</h3>
            </div>
            <Button
              variant={showStudents ? 'secondary' : 'default'}
              onClick={() => setShowStudents((v) => !v)}
              className="gap-2"
            >
              {showStudents ? <><EyeOff className="h-4 w-4" /> Hide</> : <><Eye className="h-4 w-4" /> View Top Performing Students</>}
            </Button>
          </Reveal>

          {showStudents && (topStudents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topStudents.map((student, i) => {
                const s = positionStyle(student.position);
                const Icon = s.icon;
                const initials = student.student_name.split(' ').map((n) => n[0]).slice(0, 2).join('');
                return (
                  <Reveal key={student.id} variant="up" delay={i * 70}>
                    <Card className={`group relative overflow-hidden rounded-2xl border bg-card ${s.ring} hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
                      <div className="absolute inset-x-0 top-0 h-1 bg-[image:var(--gradient-hero)]" />
                      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-warning/10 blur-2xl group-hover:bg-warning/20 transition-colors" />
                      <CardContent className="relative pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-md">
                              {initials}
                            </div>
                            <div>
                              <h4 className="text-base font-bold text-foreground leading-tight">{student.student_name}</h4>
                              <p className="text-xs text-muted-foreground">Series {student.series_number}</p>
                            </div>
                          </div>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${s.badge}`}>
                            <Icon className="h-3 w-3" /> #{student.position}
                          </span>
                        </div>
                        <div className="space-y-1.5 text-sm">
                          <p className="flex items-center gap-2 text-foreground font-medium">
                            <GraduationCap className="h-4 w-4 text-primary" />
                            {student.school_name}
                          </p>
                          <p className="flex items-center gap-2 text-muted-foreground text-xs">
                            <MapPin className="h-3.5 w-3.5" />
                            {student.district}, {student.region}
                          </p>
                        </div>
                        <div className="mt-4 flex items-center justify-between rounded-xl bg-secondary/60 px-3 py-2.5">
                          <span className="text-xs font-medium text-muted-foreground">{student.subject}</span>
                          <span className="text-lg font-bold text-primary">{student.marks}%</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Reveal>
                );
              })}
            </div>
          ) : (
            <Card className="text-center py-12 bg-card border border-border">
              <CardContent>
                <Trophy className="h-16 w-16 text-warning mx-auto mb-4" />
                <p className="text-foreground text-lg font-semibold mb-2">
                  Top Performing Students
                </p>
                <p className="text-muted-foreground">Will be nominated soon</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Best Schools */}
        <div>
          <Reveal className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Top Performing Schools</h3>
            </div>
            <Button
              variant={showSchools ? 'secondary' : 'default'}
              onClick={() => setShowSchools((v) => !v)}
              className="gap-2"
            >
              {showSchools ? <><EyeOff className="h-4 w-4" /> Hide</> : <><Eye className="h-4 w-4" /> View Top Performing Schools</>}
            </Button>
          </Reveal>

          {showSchools && (bestSchools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bestSchools.map((school, i) => {
                const s = positionStyle(school.position);
                const Icon = s.icon;
                return (
                  <Reveal key={school.id} variant="up" delay={i * 70}>
                    <Card className={`group relative overflow-hidden rounded-2xl border bg-card ${s.ring} hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
                      <div className="absolute inset-x-0 top-0 h-1 bg-[image:var(--gradient-hero)]" />
                      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 transition-colors" />
                      <CardContent className="relative pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
                              <GraduationCap className="h-6 w-6" />
                            </div>
                            <div>
                              <h4 className="text-base font-bold text-foreground leading-tight">{school.school_name}</h4>
                              <p className="text-xs text-muted-foreground">Series {school.series_number}</p>
                            </div>
                          </div>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${s.badge}`}>
                            <Icon className="h-3 w-3" /> #{school.position}
                          </span>
                        </div>
                        <p className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                          <MapPin className="h-3.5 w-3.5" />
                          {school.district}, {school.region}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-xl bg-secondary/60 px-3 py-2.5">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Average</p>
                            <p className="text-lg font-bold text-primary">{Number(school.average_marks).toFixed(1)}%</p>
                          </div>
                          <div className="rounded-xl bg-secondary/60 px-3 py-2.5">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Students</p>
                            <p className="text-lg font-bold text-foreground">{school.total_students ?? '—'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Reveal>
                );
              })}
            </div>
          ) : (
            <Card className="text-center py-12 bg-card border border-border">
              <CardContent>
                <TrendingUp className="h-16 w-16 text-primary mx-auto mb-4" />
                <p className="text-foreground text-lg font-semibold mb-2">
                  Top Performing Schools
                </p>
                <p className="text-muted-foreground">Will be uploaded soon</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AchievementsSection;
