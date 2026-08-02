// @ts-nocheck
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// --- Detection signatures -------------------------------------------------
const SIGNATURES: { type: string; severity: string; re: RegExp }[] = [
  { type: "sql_injection", severity: "critical", re: /(\b(union\s+select|select\s+.*\s+from\s+information_schema|drop\s+table|insert\s+into\s+|update\s+.*\s+set\s+|delete\s+from\s+)\b)|(\bor\b\s+1\s*=\s*1)|(';\s*--)|(\bpg_sleep\s*\()|(\bsleep\s*\(\s*\d)/i },
  { type: "xss_attempt", severity: "critical", re: /(<\s*script)|(javascript\s*:)|(on(error|load|click|mouseover)\s*=)|(<\s*iframe)|(document\.cookie)|(<\s*img[^>]+src\s*=\s*["']?\s*x)/i },
  { type: "path_traversal", severity: "high", re: /(\.\.\/|\.\.\\|%2e%2e%2f|\/etc\/passwd|\/proc\/self\/environ)/i },
  { type: "command_injection", severity: "critical", re: /(;\s*(cat|ls|wget|curl|nc|bash|sh)\s)|(\|\s*(bash|sh)\b)|(\$\(.*\))/i },
  { type: "scanner_probe", severity: "high", re: /(\/wp-(admin|login|content))|(\/\.env)|(\/\.git)|(phpmyadmin)|(\/vendor\/phpunit)|(\.php$)|(\/config\.json)|(\/actuator)/i },
];

const BOT_UA = /(sqlmap|nikto|nmap|masscan|acunetix|nessus|dirbuster|gobuster|wpscan|havij|python-requests|curl\/|libwww-perl|scrapy|zgrab|semrushbot|ahrefsbot|mj12bot|petalbot|bytespider)/i;

const SEVERITY_RANK: Record<string, number> = { info: 0, low: 1, medium: 2, high: 3, critical: 4 };

function maskIp(ip: string | null): string | null {
  if (!ip) return null;
  if (ip.includes(":")) {
    // IPv6 -> keep first 3 hextets (privacy preserving)
    const parts = ip.split(":");
    return parts.slice(0, 3).join(":") + "::";
  }
  const parts = ip.split(".");
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  return ip;
}

function clientIp(req: Request): string | null {
  const h = req.headers;
  const fwd = h.get("x-forwarded-for");
  return (
    h.get("cf-connecting-ip") ||
    h.get("x-vercel-forwarded-for") ||
    h.get("x-real-ip") ||
    (fwd ? fwd.split(",")[0].trim() : null)
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const rawPath: string = String(body.path ?? "/").slice(0, 500);
    const method: string = String(body.method ?? "GET").slice(0, 10).toUpperCase();
    const payload: string = String(body.payload ?? "").slice(0, 2000);
    const declaredType: string | undefined = body.event_type;
    const meta = typeof body.details === "object" && body.details ? body.details : {};

    const h = req.headers;
    const userAgent = (h.get("user-agent") || "").slice(0, 400);
    const ip = maskIp(clientIp(req));
    const country = h.get("cf-ipcountry") || h.get("x-vercel-ip-country") || null;
    const city = h.get("x-vercel-ip-city") ? decodeURIComponent(h.get("x-vercel-ip-city")!) : null;

    const haystack = `${rawPath} ${payload}`;
    const findings: { type: string; severity: string }[] = [];

    for (const sig of SIGNATURES) {
      if (sig.re.test(haystack)) findings.push({ type: sig.type, severity: sig.severity });
    }
    if (userAgent && BOT_UA.test(userAgent)) findings.push({ type: "bot_traffic", severity: "medium" });
    if (!userAgent) findings.push({ type: "bot_traffic", severity: "low" });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // --- Rate / DDoS heuristics based on recent events from same masked IP
    let rateEvent: { type: string; severity: string } | null = null;
    if (ip) {
      const since = new Date(Date.now() - 60_000).toISOString();
      const { count } = await supabase
        .from("security_logs")
        .select("id", { count: "exact", head: true })
        .eq("ip_address", ip)
        .gte("created_at", since);
      const recent = count ?? 0;
      if (recent > 240) rateEvent = { type: "ddos_pattern", severity: "critical" };
      else if (recent > 120) rateEvent = { type: "rate_limit_exceeded", severity: "high" };
      else if (recent > 60) rateEvent = { type: "rate_limit_exceeded", severity: "medium" };

      if (declaredType === "auth_failure") {
        const { count: fails } = await supabase
          .from("security_logs")
          .select("id", { count: "exact", head: true })
          .eq("ip_address", ip)
          .eq("event_type", "auth_failure")
          .gte("created_at", new Date(Date.now() - 10 * 60_000).toISOString());
        if ((fails ?? 0) >= 4) findings.push({ type: "brute_force", severity: "critical" });
      }
    }
    if (rateEvent) findings.push(rateEvent);

    const primary =
      findings.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])[0] ??
      { type: declaredType || "request", severity: declaredType ? "low" : "info" };

    const blocked = SEVERITY_RANK[primary.severity] >= 3;

    const { error } = await supabase.from("security_logs").insert({
      event_type: primary.type,
      severity: primary.severity,
      ip_address: ip,
      user_agent: userAgent || null,
      path: rawPath,
      method,
      country,
      city,
      blocked,
      source: "edge",
      details: {
        ...meta,
        declared_type: declaredType ?? null,
        matched: findings.map((f) => f.type),
        // payload is truncated + never stores credentials
        sample: payload ? payload.slice(0, 300) : null,
      },
    });
    if (error) console.error("insert error", error.message);

    return new Response(
      JSON.stringify({ ok: true, event_type: primary.type, severity: primary.severity, blocked }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("security-monitor error", e);
    return new Response(JSON.stringify({ ok: false }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
