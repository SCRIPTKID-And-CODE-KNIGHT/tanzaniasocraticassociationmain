import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { reportSecurityEvent } from "@/lib/securityMonitor";

/**
 * Lightweight client telemetry: reports each navigation (path + query string)
 * to the security monitor so the SOC dashboard can detect probing, injection
 * attempts in query params, scanners and abnormal request rates.
 * No personal data is collected; IPs are masked server-side.
 */
export const SecurityTelemetry = () => {
  const location = useLocation();
  const last = useRef<string>("");

  useEffect(() => {
    const full = `${location.pathname}${location.search}`;
    if (full === last.current) return;
    last.current = full;
    reportSecurityEvent({
      path: full,
      method: "GET",
      payload: location.search,
      event_type: "request",
      details: { referrer: document.referrer ? new URL(document.referrer).host : null },
    });
  }, [location.pathname, location.search]);

  return null;
};
