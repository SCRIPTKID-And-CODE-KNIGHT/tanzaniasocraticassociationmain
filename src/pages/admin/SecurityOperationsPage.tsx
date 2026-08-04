import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import {
  Activity, AlertTriangle, Ban, Bot, Download, Globe, RefreshCw, Search,
  Shield, ShieldAlert, ShieldCheck, Trash2, XCircle, Radio, ArrowLeft,
  Network, ListChecks, Siren,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SecurityLog {
  id: string;
  event_type: string;
  severity: string;
  ip_address: string | null;
  user_agent: string | null;
  path: string | null;
  method: string | null;
  country: string | null;
  city: string | null;
  blocked: boolean | null;
  resolved: boolean | null;
  source: string | null;
  details: unknown;
  created_at: string;
}

const SEVERITY_RANK: Record<string, number> = { info: 0, low: 1, medium: 2, high: 3, critical: 4 };
const WINDOWS = { "1h": 1, "24h": 24, "7d": 168, "30d": 720 } as const;
type WindowKey = keyof typeof WINDOWS;

const severityBadge = (severity: string) => {
  const map: Record<string, string> = {
    critical: "bg-destructive text-destructive-foreground",
    high: "bg-destructive/80 text-destructive-foreground",
    medium: "bg-warning text-warning-foreground",
    low: "bg-secondary text-secondary-foreground",
    info: "bg-muted text-muted-foreground",
  };
  return <Badge className={`${map[severity] ?? map.info} capitalize`}>{severity}</Badge>;
};

export default function SecurityOperationsPage() {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [live, setLive] = useState(true);
  const [windowKey, setWindowKey] = useState<WindowKey>("24h");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const since = useMemo(
    () => new Date(Date.now() - WINDOWS[windowKey] * 3600_000).toISOString(),
    [windowKey],
  );

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("security_logs")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) {
      toast({ title: "Failed to load events", description: error.message, variant: "destructive" });
    } else {
      setLogs((data ?? []) as SecurityLog[]);
    }
    setIsLoading(false);
  }, [since, toast]);

  // Admin gate
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      const { data: roles } = await supabase
        .from("user_roles").select("role").eq("user_id", session.user.id);
      if (!roles?.some((r) => r.role === "admin")) {
        toast({ title: "Access Denied", description: "Admin privileges required.", variant: "destructive" });
        navigate("/");
      }
    })();
  }, [navigate, toast]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Realtime live feed
  useEffect(() => {
    if (!live) return;
    const channel = supabase
      .channel("soc-security-logs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "security_logs" },
        (payload) => {
          const row = payload.new as SecurityLog;
          setLogs((prev) => [row, ...prev].slice(0, 1000));
          if (SEVERITY_RANK[row.severity] >= 3) {
            toast({
              title: `${row.severity === "critical" ? "CRITICAL" : "HIGH"} security alert`,
              description: `${row.event_type} from ${row.ip_address ?? "unknown IP"} on ${row.path ?? "/"}`,
              variant: "destructive",
            });
          }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [live, toast]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((l) => {
      if (severityFilter !== "all" && l.severity !== severityFilter) return false;
      if (typeFilter !== "all" && l.event_type !== typeFilter) return false;
      if (!q) return true;
      return [l.event_type, l.ip_address, l.path, l.country, l.user_agent, JSON.stringify(l.details)]
        .some((f) => (f ?? "").toString().toLowerCase().includes(q));
    });
  }, [logs, severityFilter, typeFilter, search]);

  const metrics = useMemo(() => {
    const total = logs.length;
    const blocked = logs.filter((l) => l.blocked).length;
    const suspicious = logs.filter((l) => SEVERITY_RANK[l.severity] >= 2).length;
    const critical = logs.filter((l) => l.severity === "critical" && !l.resolved).length;
    const bots = logs.filter((l) => l.event_type === "bot_traffic").length;
    const uniqueIps = new Set(logs.map((l) => l.ip_address).filter(Boolean)).size;
    const threatRatio = total ? suspicious / total : 0;
    const health = critical > 0 ? "critical" : threatRatio > 0.25 ? "degraded" : "healthy";
    return { total, blocked, suspicious, critical, bots, uniqueIps, health };
  }, [logs]);

  const trend = useMemo(() => {
    const buckets = new Map<string, { label: string; total: number; threats: number }>();
    const hours = WINDOWS[windowKey];
    const step = hours <= 24 ? 3600_000 : 24 * 3600_000;
    const slots = hours <= 24 ? hours : hours / 24;
    for (let i = slots - 1; i >= 0; i--) {
      const t = new Date(Math.floor((Date.now() - i * step) / step) * step);
      buckets.set(t.toISOString(), {
        label: step === 3600_000 ? format(t, "HH:mm") : format(t, "MMM dd"),
        total: 0,
        threats: 0,
      });
    }
    logs.forEach((l) => {
      const t = new Date(Math.floor(new Date(l.created_at).getTime() / step) * step).toISOString();
      const b = buckets.get(t);
      if (!b) return;
      b.total += 1;
      if (SEVERITY_RANK[l.severity] >= 2) b.threats += 1;
    });
    return [...buckets.values()];
  }, [logs, windowKey]);

  const byType = useMemo(() => {
    const m = new Map<string, number>();
    logs.filter((l) => SEVERITY_RANK[l.severity] >= 1)
      .forEach((l) => m.set(l.event_type, (m.get(l.event_type) ?? 0) + 1));
    return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [logs]);

  const bySeverity = useMemo(
    () => ["critical", "high", "medium", "low", "info"].map((s) => ({
      name: s, value: logs.filter((l) => l.severity === s).length,
    })).filter((d) => d.value > 0),
    [logs],
  );

  const topSources = useMemo(() => {
    const m = new Map<string, { ip: string; country: string | null; hits: number; threats: number }>();
    logs.forEach((l) => {
      if (!l.ip_address) return;
      const e = m.get(l.ip_address) ?? { ip: l.ip_address, country: l.country, hits: 0, threats: 0 };
      e.hits += 1;
      if (SEVERITY_RANK[l.severity] >= 2) e.threats += 1;
      m.set(l.ip_address, e);
    });
    return [...m.values()].sort((a, b) => b.threats - a.threats || b.hits - a.hits).slice(0, 6);
  }, [logs]);

  const eventTypes = useMemo(() => [...new Set(logs.map((l) => l.event_type))].sort(), [logs]);
  const openCritical = useMemo(
    () => logs.filter((l) => SEVERITY_RANK[l.severity] >= 3 && !l.resolved).slice(0, 3),
    [logs],
  );

  const exportCsv = () => {
    const headers = ["timestamp", "severity", "event_type", "ip_address", "country", "city", "method", "path", "blocked", "resolved", "user_agent"];
    const rows = filtered.map((l) => [
      l.created_at, l.severity, l.event_type, l.ip_address ?? "", l.country ?? "", l.city ?? "",
      l.method ?? "", l.path ?? "", l.blocked ? "yes" : "no", l.resolved ? "yes" : "no", l.user_agent ?? "",
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tassa-security-events-${format(new Date(), "yyyyMMdd-HHmm")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resolveEvent = async (id: string) => {
    const { error } = await supabase.from("security_logs").update({ resolved: true }).eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, resolved: true } : l)));
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from("security_logs").delete().eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setLogs((prev) => prev.filter((l) => l.id !== id));
  };

  const PIE_COLORS = ["hsl(var(--destructive))", "hsl(var(--warning))", "hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--muted-foreground))"];

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <div className="relative overflow-hidden border-b border-border bg-card/80 px-4 py-3 backdrop-blur-md">
        <div className="soc-scan-line pointer-events-none absolute inset-x-0 top-0 h-px bg-primary/40" />
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-xs">TS</div>
            <div>
              <p className="font-semibold leading-none">TASSA <span className="font-normal text-muted-foreground">ADMIN</span></p>
              <p className="mt-1 text-[10px] uppercase text-muted-foreground">Secure operations environment</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-2 text-success"><span className="h-2 w-2 animate-pulse rounded-full bg-success" /> System nominal</span>
            <span className="hidden text-muted-foreground sm:inline">AES-256 · LIVE MONITORING</span>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1500px]">
        <aside className="hidden w-64 shrink-0 border-r border-border bg-card/40 p-4 lg:flex lg:flex-col">
          <p className="mb-4 text-[10px] font-bold uppercase text-muted-foreground">Threat intelligence</p>
          <div className="space-y-1">
            <Button className="w-full justify-start gap-3" size="sm"><Radio className="h-4 w-4" /> Active Monitors</Button>
            <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" size="sm" onClick={() => navigate('/admin/security-logs')}><ListChecks className="h-4 w-4" /> Security Logs</Button>
            <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" size="sm"><Network className="h-4 w-4" /> Network Sources</Button>
          </div>
          <div className="mt-8 border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-destructive"><Siren className="h-4 w-4" /> Priority alert</div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{metrics.critical} unresolved critical incident(s) require review.</p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/admin')} className="mt-auto justify-start gap-2 text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Admin Dashboard</Button>
        </aside>

        <div className="min-w-0 flex-1 px-4 py-6 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 animate-fade-in">
          <div>
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold md:text-3xl">Security Operations Center</h1>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              Real-time threat detection, attack analytics and incident response.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant={live ? "default" : "outline"} onClick={() => setLive((v) => !v)} className="gap-2">
              <Radio className={`h-4 w-4 ${live ? "animate-pulse" : ""}`} />
              {live ? "Live" : "Paused"}
            </Button>
            <Button variant="outline" onClick={fetchLogs} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button variant="outline" onClick={exportCsv} className="gap-2">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        {openCritical.length > 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{openCritical.length} unresolved high-severity incident(s)</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 space-y-1 text-sm">
                {openCritical.map((l) => (
                  <li key={l.id} className="font-mono">
                    {l.event_type} · {l.ip_address ?? "unknown"} · {l.path} ·{" "}
                    {formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Overview */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5 mb-6 animate-fade-in">
          {[
            { label: "Total Requests", value: metrics.total, icon: Activity, tone: "text-primary" },
            { label: "Blocked", value: metrics.blocked, icon: Ban, tone: "text-destructive" },
            { label: "Suspicious", value: metrics.suspicious, icon: AlertTriangle, tone: "text-warning" },
            { label: "Bot Traffic", value: metrics.bots, icon: Bot, tone: "text-muted-foreground" },
            { label: "Unique Sources", value: metrics.uniqueIps, icon: Globe, tone: "text-primary" },
          ].map((m) => (
            <Card key={m.label} className="rounded-md border-border bg-card/70 shadow-none transition-colors hover:border-primary/60">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{m.label}</p>
                  <p className="text-2xl font-bold">{m.value}</p>
                </div>
                <m.icon className={`h-7 w-7 opacity-60 ${m.tone}`} />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mb-6 rounded-md border-border bg-card/70 shadow-none">
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {metrics.health === "healthy" ? (
                <ShieldCheck className="h-8 w-8 text-success" />
              ) : metrics.health === "degraded" ? (
                <AlertTriangle className="h-8 w-8 text-warning" />
              ) : (
                <XCircle className="h-8 w-8 text-destructive" />
              )}
              <div>
                <p className="text-sm text-muted-foreground">System Health</p>
                <p className="text-lg font-semibold capitalize">{metrics.health}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-xl">
              {metrics.health === "healthy"
                ? "No unresolved critical incidents. Traffic patterns are within normal range."
                : metrics.health === "degraded"
                ? "Elevated share of suspicious traffic detected — review the live feed."
                : `${metrics.critical} unresolved critical incident(s) require immediate attention.`}
            </p>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-3 mb-6">
          <Card className="lg:col-span-2 rounded-md border-border bg-card/70 shadow-none">
            <CardHeader>
              <CardTitle>Attack Trends</CardTitle>
              <CardDescription>Requests vs. suspicious activity over the selected window</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gThreat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                  <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="url(#gTotal)" name="Requests" />
                  <Area type="monotone" dataKey="threats" stroke="hsl(var(--destructive))" fill="url(#gThreat)" name="Threats" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="rounded-md border-border bg-card/70 shadow-none">
            <CardHeader>
              <CardTitle>Severity Mix</CardTitle>
              <CardDescription>Distribution of logged events</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              {bySeverity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={bySeverity} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                      {bySeverity.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 mb-6">
          <Card className="rounded-md border-border bg-card/70 shadow-none">
            <CardHeader>
              <CardTitle>Top Attack Types</CardTitle>
              <CardDescription>Signature matches detected at the edge</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              {byType.length === 0 ? (
                <p className="text-sm text-muted-foreground">No threats detected in this window.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byType} layout="vertical" margin={{ left: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis type="category" dataKey="name" width={120} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-md border-border bg-card/70 shadow-none">
            <CardHeader>
              <CardTitle>Top Sources</CardTitle>
              <CardDescription>Most active networks (IPs are anonymised)</CardDescription>
            </CardHeader>
            <CardContent>
              {topSources.length === 0 ? (
                <p className="text-sm text-muted-foreground">No traffic recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {topSources.map((s) => (
                    <div key={s.ip} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                      <div>
                        <p className="font-mono text-sm">{s.ip}</p>
                        <p className="text-xs text-muted-foreground">{s.country ?? "Unknown region"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{s.hits} events</p>
                        <p className={`text-xs ${s.threats ? "text-destructive" : "text-muted-foreground"}`}>
                          {s.threats} threats
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters + live feed */}
        <Card className="rounded-md border-border bg-card/70 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" /> Live Event Feed
            </CardTitle>
            <CardDescription>{filtered.length} event(s) matching filters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder="Search IP, path, user agent, attack type..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={windowKey} onValueChange={(v) => setWindowKey(v as WindowKey)}>
                <SelectTrigger className="w-full lg:w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last hour</SelectItem>
                  <SelectItem value="24h">Last 24 hours</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-full lg:w-40"><SelectValue placeholder="Severity" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full lg:w-48"><SelectValue placeholder="Attack type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All event types</SelectItem>
                  {eventTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <ShieldCheck className="h-14 w-14 text-success mx-auto mb-3 opacity-60" />
                <p className="font-semibold">No events match the current filters</p>
                <p className="text-sm text-muted-foreground">Traffic is being monitored continuously.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Attack Type</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Request</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.slice(0, 200).map((l) => (
                      <TableRow key={l.id} className={l.severity === "critical" && !l.resolved ? "bg-destructive/5" : ""}>
                        <TableCell className="whitespace-nowrap text-sm">
                          <div>{format(new Date(l.created_at), "MMM dd HH:mm:ss")}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}
                          </div>
                        </TableCell>
                        <TableCell>{severityBadge(l.severity)}</TableCell>
                        <TableCell className="font-mono text-sm">{l.event_type}</TableCell>
                        <TableCell className="text-sm">
                          <div className="font-mono">{l.ip_address ?? "—"}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {[l.city, l.country].filter(Boolean).join(", ") || l.user_agent?.slice(0, 40) || "—"}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm max-w-[240px]">
                          <span className="font-mono">{l.method ?? "GET"}</span>{" "}
                          <span className="font-mono text-muted-foreground break-all">{l.path ?? "/"}</span>
                        </TableCell>
                        <TableCell>
                          {l.blocked ? <Badge variant="destructive">Blocked</Badge> : <Badge variant="outline">Allowed</Badge>}
                          {l.resolved && <Badge variant="secondary" className="ml-1">Resolved</Badge>}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {!l.resolved && (
                            <Button size="sm" variant="ghost" onClick={() => resolveEvent(l.id)}>Resolve</Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => deleteEvent(l.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground mt-6">
          Privacy note: source IP addresses are anonymised (last octet / suffix removed) before storage, no request
          bodies or credentials are recorded, and only data required for security incident response is retained.
        </p>
        </div>
      </div>
    </div>
  );
}
