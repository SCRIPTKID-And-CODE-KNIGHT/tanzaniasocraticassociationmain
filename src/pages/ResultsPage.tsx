import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  School,
  Archive,
  ExternalLink,
  Trophy,
  Search,
  Award,
  TrendingUp,
  Medal,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GeneralResults {
  general_results_url: string | null;
  top_ten_students_url: string | null;
  top_ten_schools_url: string | null;
}

interface SchoolResult {
  individual_results_url: string | null;
  schools: {
    school_name: string;
  };
}

interface TopStudent {
  id: string;
  student_name: string;
  school_name: string;
  region: string;
  district: string;
  position: number;
  marks: number;
  subject: string;
}

interface BestSchool {
  id: string;
  school_name: string;
  region: string;
  district: string;
  position: number;
  average_marks: number;
  total_students: number | null;
}

const SchoolsResultsPage = () => {
  const [selectedSchool, setSelectedSchool] = useState('');
  const [schools, setSchools] = useState<any[]>([]);
  const [generalResults, setGeneralResults] = useState<GeneralResults | null>(null);
  const [schoolResult, setSchoolResult] = useState<SchoolResult | null>(null);
  const [currentSeries, setCurrentSeries] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [topStudents, setTopStudents] = useState<TopStudent[]>([]);
  const [bestSchools, setBestSchools] = useState<BestSchool[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchSchools();
    fetchGeneralResults();
    fetchTopStudents();
    fetchBestSchools();
  }, [currentSeries]);

  useEffect(() => {
    if (selectedSchool) {
      fetchSchoolResult(selectedSchool);
    }
  }, [selectedSchool, currentSeries]);

  const fetchSchools = async () => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .order('school_name');

      if (error) throw error;
      setSchools(data || []);
    } catch (error) {
      console.error('Error fetching schools:', error);
      toast({
        title: "Error",
        description: "Failed to load schools",
        variant: "destructive"
      });
    }
  };

  const fetchGeneralResults = async () => {
    try {
      const { data, error } = await supabase
        .from('general_results')
        .select('general_results_url, top_ten_students_url, top_ten_schools_url')
        .eq('series_number', currentSeries)
        .eq('is_published', true)
        .maybeSingle();

      if (error) throw error;
      setGeneralResults(data);
    } catch (error) {
      console.error('Error fetching general results:', error);
    }
  };

  const fetchSchoolResult = async (schoolId: string) => {
    try {
      const { data, error } = await supabase
        .from('school_results')
        .select(`
          individual_results_url,
          schools!inner(school_name)
        `)
        .eq('school_id', schoolId)
        .eq('series_number', currentSeries)
        .eq('is_published', true)
        .maybeSingle();

      if (error) throw error;
      setSchoolResult(data);
    } catch (error) {
      console.error('Error fetching school result:', error);
    }
  };

  const fetchTopStudents = async () => {
    const { data } = await supabase
      .from('top_students')
      .select('*')
      .eq('series_number', currentSeries)
      .eq('is_published', true)
      .order('position', { ascending: true });
    setTopStudents((data as TopStudent[]) || []);
  };

  const fetchBestSchools = async () => {
    const { data } = await supabase
      .from('best_schools')
      .select('*')
      .eq('series_number', currentSeries)
      .eq('is_published', true)
      .order('position', { ascending: true });
    setBestSchools((data as BestSchool[]) || []);
  };

  const regions = useMemo(
    () => Array.from(new Set(schools.map((s) => s.region).filter(Boolean))).sort(),
    [schools]
  );

  const filteredSchools = useMemo(() => {
    return schools.filter((s) => {
      const matchesSearch = s.school_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRegion = regionFilter === 'all' || s.region === regionFilter;
      return matchesSearch && matchesRegion;
    });
  }, [schools, searchTerm, regionFilter]);

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <Badge variant="secondary" className="mb-3">Series {currentSeries}</Badge>
          <h1 className="text-3xl sm:text-5xl font-bold text-foreground mb-3">
            TASSA Results
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Browse general results, top performers, and individual school reports.
          </p>
        </div>

        {/* Series 1 notice */}
        <Card className="mb-8 border-primary/30 bg-primary/5 animate-fade-in">
          <CardContent className="py-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Series 1 results — releasing soon
              </h2>
              <p className="text-sm text-muted-foreground">
                The Series 1 competition conducted in August has been completed. Marking and results
                compilation is ongoing, and the official results will be released soon on this page.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Filter Bar */}
        <Card className="mb-8 animate-fade-in">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Series</label>
                <Select value={currentSeries.toString()} onValueChange={(v) => setCurrentSeries(parseInt(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8].map((n) => (
                      <SelectItem key={n} value={n.toString()}>Series {n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Region</label>
                <Select value={regionFilter} onValueChange={setRegionFilter}>
                  <SelectTrigger><SelectValue placeholder="All regions" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All regions</SelectItem>
                    {regions.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Search school</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Type to search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-xl mx-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="top">Top Performers</TabsTrigger>
            <TabsTrigger value="schools">By School</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: Archive, title: 'General Results', url: generalResults?.general_results_url, desc: 'Complete result set for the series' },
                { icon: Trophy, title: 'Top Ten Students', url: generalResults?.top_ten_students_url, desc: 'Highest-scoring students nationally' },
                { icon: Medal, title: 'Top Ten Schools', url: generalResults?.top_ten_schools_url, desc: 'Best-performing schools nationally' },
              ].map((item) => (
                <Card key={item.title} className="hover:shadow-lg hover:-translate-y-1 transition-all">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription>{item.desc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-primary font-medium hover:underline"
                      >
                        Open document <ExternalLink className="h-4 w-4 ml-1" />
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not yet published</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Top Performers */}
          <TabsContent value="top" className="space-y-6 animate-fade-in">
            {bestSchools.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" /> Top Schools — Average Marks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72 w-full">
                    <ResponsiveContainer>
                      <BarChart data={bestSchools.slice(0, 10).map((s) => ({ name: s.school_name, avg: Number(s.average_marks) }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} interval={0} angle={-25} textAnchor="end" height={70} />
                        <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                        <Bar dataKey="avg" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {topStudents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" /> Top Students
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {topStudents.slice(0, 9).map((s) => (
                    <div key={s.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition-colors">
                      <div className="h-10 w-10 rounded-full bg-warning/15 text-warning flex items-center justify-center font-bold">
                        #{s.position}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{s.student_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.school_name} · {s.region}</p>
                      </div>
                      <Badge variant="secondary" className="font-bold">{s.marks}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {bestSchools.length === 0 && topStudents.length === 0 && (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No top performers published for Series {currentSeries} yet.</CardContent></Card>
            )}
          </TabsContent>

          {/* By School */}
          <TabsContent value="schools" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <School className="h-5 w-5 text-primary" /> Select a School
                </CardTitle>
                <CardDescription>{filteredSchools.length} schools match your filters</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                  <SelectTrigger><SelectValue placeholder="Choose school..." /></SelectTrigger>
                  <SelectContent>
                    {filteredSchools.map((school) => (
                      <SelectItem key={school.id} value={school.id}>{school.school_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {selectedSchool && (
              <Card>
                <CardHeader>
                  <CardTitle>{schoolResult?.schools?.school_name || 'School Results'}</CardTitle>
                </CardHeader>
                <CardContent>
                  {schoolResult?.individual_results_url ? (
                    <a
                      href={schoolResult.individual_results_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow hover:opacity-90 transition"
                    >
                      Open School Results <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  ) : (
                    <p className="text-muted-foreground">Individual results for the selected school will be uploaded soon.</p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SchoolsResultsPage;