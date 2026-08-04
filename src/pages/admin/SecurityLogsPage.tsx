import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield, AlertTriangle, Info, XCircle, RefreshCw, Search, Filter, Radar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface SecurityLog {
  id: string;
  event_type: string;
  ip_address: string | null;
  user_agent: string | null;
  path: string | null;
  details: unknown;
  severity: string;
  created_at: string;
}

export default function SecurityLogsPage() {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('security_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (severityFilter !== "all") {
        query = query.eq('severity', severityFilter);
      }

      if (eventTypeFilter !== "all") {
        query = query.eq('event_type', eventTypeFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error: unknown) {
      console.error("Error fetching security logs:", error);
      toast({
        title: "Error",
        description: "Failed to fetch security logs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [severityFilter, eventTypeFilter]);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Critical</Badge>;
      case 'high':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> High</Badge>;
      case 'medium':
        return <Badge className="bg-warning text-warning-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Medium</Badge>;
      case 'low':
        return <Badge variant="secondary" className="flex items-center gap-1"><Info className="h-3 w-3" /> Low</Badge>;
      default:
        return <Badge variant="outline" className="flex items-center gap-1"><Info className="h-3 w-3" /> Info</Badge>;
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    if (eventType.includes('sql_injection') || eventType.includes('xss')) {
      return <XCircle className="h-4 w-4 text-destructive" />;
    }
    if (eventType.includes('brute_force') || eventType.includes('auth')) {
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    }
    return <Info className="h-4 w-4 text-muted-foreground" />;
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      log.event_type.toLowerCase().includes(searchLower) ||
      log.ip_address?.toLowerCase().includes(searchLower) ||
      log.path?.toLowerCase().includes(searchLower) ||
      JSON.stringify(log.details).toLowerCase().includes(searchLower)
    );
  });

  const eventTypes = [...new Set(logs.map(log => log.event_type))];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6 flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => navigate('/admin')}>
            ← Back to Admin Dashboard
          </Button>
          <Button onClick={() => navigate('/admin/soc')} className="gap-2 shadow-educational">
            <Radar className="h-4 w-4" /> Open Security Operations Center
          </Button>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Security Logs</h1>
          </div>
          <p className="text-muted-foreground">
            Monitor security events including brute force attempts, SQL injection, XSS attacks, and suspicious activities
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Events</p>
                  <p className="text-2xl font-bold">{logs.length}</p>
                </div>
                <Shield className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critical</p>
                  <p className="text-2xl font-bold text-destructive">
                    {logs.filter(l => l.severity === 'critical').length}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-destructive opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">High</p>
                  <p className="text-2xl font-bold text-destructive">
                    {logs.filter(l => l.severity === 'high').length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-destructive opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Medium</p>
                  <p className="text-2xl font-bold text-warning">
                    {logs.filter(l => l.severity === 'medium').length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-warning opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by IP, path, or event type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {eventTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={fetchLogs} variant="outline" className="flex items-center gap-2">
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Security Events</CardTitle>
            <CardDescription>
              {filteredLogs.length} event{filteredLogs.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-16 w-16 text-success mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Security Events</h3>
                <p className="text-muted-foreground">
                  No security events have been logged yet. This is good news!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Event Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Path</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getEventTypeIcon(log.event_type)}
                            <span className="font-mono text-sm">{log.event_type}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.ip_address || '-'}
                        </TableCell>
                        <TableCell className="max-w-48 truncate font-mono text-sm">
                          {log.path || '-'}
                        </TableCell>
                        <TableCell className="max-w-64">
                          {log.details ? (
                            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-20">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Tips */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Security Event Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <XCircle className="h-4 w-4 text-destructive" />
                  SQL Injection
                </h4>
                <p className="text-sm text-muted-foreground">
                  Attempts to inject malicious SQL code to manipulate the database
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <XCircle className="h-4 w-4 text-destructive" />
                  XSS Attack
                </h4>
                <p className="text-sm text-muted-foreground">
                  Cross-site scripting attempts to inject malicious scripts
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Brute Force
                </h4>
                <p className="text-sm text-muted-foreground">
                  Repeated login attempts trying to guess credentials
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Rate Limit Exceeded
                </h4>
                <p className="text-sm text-muted-foreground">
                  Too many requests from a single IP address
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-primary" />
                  Suspicious Activity
                </h4>
                <p className="text-sm text-muted-foreground">
                  Unusual patterns or behaviors detected
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-primary" />
                  Authentication Events
                </h4>
                <p className="text-sm text-muted-foreground">
                  Login failures, session issues, and auth anomalies
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
