import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { AlertTriangle, CalendarClock, Lock } from "lucide-react";

export interface SubmissionSetting {
  id: string;
  deadline: string;
  is_enabled: boolean;
  block_after_deadline: boolean;
  message: string | null;
}

interface Props {
  setting: SubmissionSetting;
  expired: boolean;
}

const pad = (n: number) => n.toString().padStart(2, "0");

export const SubmissionDeadlineCountdown = ({ setting, expired }: Props) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const target = new Date(setting.deadline);
  const diff = target.getTime() - now;

  const dateLabel = target.toLocaleString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (expired) {
    const closedReason = !setting.is_enabled
      ? setting.message ||
        "Result submissions are currently turned off by the administrator."
      : setting.message ||
        `The system stopped accepting results on ${dateLabel}. Please contact the secretariat for assistance.`;
    return (
      <Card className="border-destructive/40 bg-destructive/10 p-5 mb-6">
        <div className="flex items-start gap-3">
          <Lock className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-destructive">Submissions are closed</p>
            <p className="text-sm text-muted-foreground mt-1">
              {closedReason}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff / 3600000) % 24);
  const minutes = Math.floor((diff / 60000) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  const blocks = [
    { v: days, l: "Days" },
    { v: hours, l: "Hours" },
    { v: minutes, l: "Mins" },
    { v: seconds, l: "Secs" },
  ];

  return (
    <Card className="border-primary/30 bg-primary/5 p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-5 w-5 text-primary" />
        <p className="font-semibold text-foreground">
          {setting.message || "Submission deadline is approaching"}
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 sm:gap-3">
        {blocks.map((b) => (
          <div key={b.l} className="flex flex-col items-center">
            <div className="bg-primary text-primary-foreground rounded-lg w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center shadow">
              <span className="text-xl sm:text-2xl font-bold tabular-nums">{pad(b.v)}</span>
            </div>
            <span className="text-[10px] sm:text-xs font-medium text-muted-foreground mt-1 uppercase tracking-wider">
              {b.l}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
        <CalendarClock className="h-4 w-4" />
        <span>
          {setting.block_after_deadline ? "No results accepted after" : "Deadline"}: {dateLabel}
        </span>
      </div>
    </Card>
  );
};

export default SubmissionDeadlineCountdown;
