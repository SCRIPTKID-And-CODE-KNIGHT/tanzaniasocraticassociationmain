import { supabase } from "@/integrations/supabase/client";

export type MonitorEvent = {
  path: string;
  method?: string;
  /** Untrusted user-supplied string (query string, form value) that should be inspected. Never pass passwords. */
  payload?: string;
  event_type?: "request" | "auth_failure" | "suspicious_input" | "access_denied";
  details?: Record<string, unknown>;
};

/**
 * Sends a telemetry event to the security-monitor edge function.
 * Fire-and-forget: never blocks or breaks the UI, never sends credentials.
 */
export async function reportSecurityEvent(event: MonitorEvent): Promise<void> {
  try {
    await supabase.functions.invoke("security-monitor", {
      body: {
        path: event.path.slice(0, 500),
        method: event.method ?? "GET",
        payload: event.payload?.slice(0, 2000),
        event_type: event.event_type ?? "request",
        details: event.details ?? {},
      },
    });
  } catch {
    /* monitoring must never surface errors to users */
  }
}
