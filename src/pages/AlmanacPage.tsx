import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Calendar, BookOpen, Users, Clock, FileCheck, Send, CheckCircle, Award, Settings, Truck, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { exportToPDF, exportToExcel, exportSeriesOnly } from '@/lib/almanacExport';
import { useToast } from '@/hooks/use-toast';

interface AlmanacEvent {
  id: string;
  series_number: number;
  event_date: string;
  event_start_date: string | null;
  event_end_date: string | null;
  event_name: string;
  responsible_person: string;
  description: string | null;
}

interface SeriesSummary {
  series_number: number;
  official_start_date: string;
  official_end_date: string;
  total_events: number;
}

const AlmanacPage = () => {
  const [events, setEvents] = useState<AlmanacEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('1');
  const { toast } = useToast();

  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from('almanac_events')
        .select('*')
        .eq('is_published', true)
        .order('event_start_date', { ascending: true });

      if (data && !error) {
        setEvents(data);
      }
      setLoading(false);
    };

    fetchEvents();
  }, []);

  const getEventsBySeries = (seriesNumber: number) => {
    return events.filter(event => event.series_number === seriesNumber);
  };

  const getSeriesSummary = (seriesNumber: number): SeriesSummary | null => {
    const seriesEvents = getEventsBySeries(seriesNumber);
    if (seriesEvents.length === 0) return null;

    const dates = seriesEvents
      .map(e => [e.event_start_date, e.event_end_date])
      .flat()
      .filter(Boolean) as string[];
    
    if (dates.length === 0) return null;

    const sortedDates = dates.sort();
    return {
      series_number: seriesNumber,
      official_start_date: sortedDates[0],
      official_end_date: sortedDates[sortedDates.length - 1],
      total_events: seriesEvents.length,
    };
  };

  const seriesList = [1, 2, 3, 4, 5, 6, 7, 8];

  const getEventIcon = (eventName: string) => {
    const name = eventName.toLowerCase();
    if (name.includes('setting')) return <Settings className="h-4 w-4 text-primary" />;
    if (name.includes('submission') || name.includes('submit')) return <Send className="h-4 w-4 text-orange-500" />;
    if (name.includes('moderation')) return <FileCheck className="h-4 w-4 text-purple-500" />;
    if (name.includes('returning')) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (name.includes('supplying')) return <Truck className="h-4 w-4 text-blue-500" />;
    if (name.includes('paper 1')) return <BookOpen className="h-4 w-4 text-red-500" />;
    if (name.includes('paper 2')) return <BookOpen className="h-4 w-4 text-red-600" />;
    if (name.includes('marking')) return <Users className="h-4 w-4 text-indigo-500" />;
    if (name.includes('processing')) return <Clock className="h-4 w-4 text-cyan-500" />;
    if (name.includes('announcing')) return <Award className="h-4 w-4 text-yellow-500" />;
    return <Calendar className="h-4 w-4 text-blue-500" />;
  };

  const formatDateRange = (startDate: string | null, endDate: string | null): string => {
    if (!startDate) return 'TBD';
    const start = format(new Date(startDate), 'dd MMM yyyy');
    if (!endDate || startDate === endDate) return start;
    const end = format(new Date(endDate), 'dd MMM yyyy');
    return `${start} - ${end}`;
  };

  const handleExportPDF = () => {
    try {
      exportToPDF(events, getSeriesSummary);
      toast({ title: 'Export Complete', description: 'PDF downloaded successfully' });
    } catch (error) {
      toast({ title: 'Export Failed', description: 'Could not generate PDF', variant: 'destructive' });
    }
  };

  const handleExportExcel = () => {
    try {
      exportToExcel(events, getSeriesSummary);
      toast({ title: 'Export Complete', description: 'Excel file downloaded successfully' });
    } catch (error) {
      toast({ title: 'Export Failed', description: 'Could not generate Excel file', variant: 'destructive' });
    }
  };

  const handleExportSeries = (series: number, format_type: 'pdf' | 'excel') => {
    try {
      exportSeriesOnly(events, series, format_type, getSeriesSummary);
      toast({ title: 'Export Complete', description: `Series ${series} exported successfully` });
    } catch (error) {
      toast({ title: 'Export Failed', description: 'Could not export series', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary via-primary/90 to-accent text-primary-foreground py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Calendar className="h-16 w-16 text-yellow-300" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              TASSA 2026 Examination Almanac
            </h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Complete schedule for Series 1 – 8 examinations and related activities
            </p>
          </div>
        </div>
      </div>

      {/* Series Overview Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {seriesList.map((series) => {
            const summary = getSeriesSummary(series);
            return (
              <Card 
                key={series} 
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  activeTab === series.toString() ? 'ring-2 ring-primary shadow-lg' : ''
                }`}
                onClick={() => setActiveTab(series.toString())}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg">Series {series}</h3>
                    <Badge variant={activeTab === series.toString() ? 'default' : 'secondary'}>
                      {summary?.total_events || 0} Events
                    </Badge>
                  </div>
                  {summary ? (
                    <div className="text-sm text-muted-foreground">
                      <p>{format(new Date(summary.official_start_date), 'dd MMM')} - {format(new Date(summary.official_end_date), 'dd MMM yyyy')}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not scheduled yet</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="shadow-xl border-2 border-primary/10">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-2xl flex items-center gap-3">
                <BookOpen className="h-6 w-6 text-primary" />
                Examination Schedule 2026
              </CardTitle>
              {events.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      Export Schedule
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Export All Series</DropdownMenuLabel>
                    <DropdownMenuItem onClick={handleExportPDF} className="gap-2">
                      <FileText className="h-4 w-4 text-red-500" />
                      Download as PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportExcel} className="gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-green-600" />
                      Download as Excel
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Export Current Series</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleExportSeries(parseInt(activeTab), 'pdf')} className="gap-2">
                      <FileText className="h-4 w-4 text-red-500" />
                      Series {activeTab} as PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportSeries(parseInt(activeTab), 'excel')} className="gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-green-600" />
                      Series {activeTab} as Excel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-muted-foreground">No Events Published Yet</h3>
                <p className="text-muted-foreground mt-2">
                  The almanac schedule will be published soon. Please check back later.
                </p>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 mb-6">
                  {seriesList.map((series) => (
                    <TabsTrigger 
                      key={series} 
                      value={series.toString()}
                      className="text-lg font-semibold"
                    >
                      Series {series}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {seriesList.map((series) => {
                  const summary = getSeriesSummary(series);
                  return (
                    <TabsContent key={series} value={series.toString()}>
                      {summary && (
                        <div className="mb-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div>
                              <span className="font-medium text-muted-foreground">Official Start:</span>{' '}
                              <span className="font-bold">{format(new Date(summary.official_start_date), 'dd MMMM yyyy')}</span>
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">Official End:</span>{' '}
                              <span className="font-bold">{format(new Date(summary.official_end_date), 'dd MMMM yyyy')}</span>
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">Duration:</span>{' '}
                              <span className="font-bold">32 Working Days</span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="rounded-lg border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gradient-to-r from-primary/10 to-accent/10">
                              <TableHead className="font-bold text-foreground w-[60px]">#</TableHead>
                              <TableHead className="font-bold text-foreground w-[220px]">Date Range</TableHead>
                              <TableHead className="font-bold text-foreground">Event</TableHead>
                              <TableHead className="font-bold text-foreground w-[200px]">Responsible</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getEventsBySeries(series).length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                  No events scheduled for Series {series} yet.
                                </TableCell>
                              </TableRow>
                            ) : (
                              getEventsBySeries(series).map((event, index) => (
                                <TableRow 
                                  key={event.id}
                                  className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}
                                >
                                  <TableCell className="font-medium text-muted-foreground">
                                    {index + 1}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4 text-primary" />
                                      <span className="text-sm">
                                        {formatDateRange(event.event_start_date, event.event_end_date)}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {getEventIcon(event.event_name)}
                                      <div>
                                        <div className="font-medium">{event.event_name}</div>
                                        {event.description && (
                                          <div className="text-sm text-muted-foreground">{event.description}</div>
                                        )}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Users className="h-4 w-4 text-muted-foreground" />
                                      {event.responsible_person}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="mt-8 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Event Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                <span className="text-sm">Setting</span>
              </div>
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5 text-orange-500" />
                <span className="text-sm">Submission</span>
              </div>
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-purple-500" />
                <span className="text-sm">Moderation</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-red-500" />
                <span className="text-sm">Examination</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <span className="text-sm">Results</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AlmanacPage;
