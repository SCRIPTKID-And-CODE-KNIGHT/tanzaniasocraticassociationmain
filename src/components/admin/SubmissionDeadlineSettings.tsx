import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Hourglass, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Row {
  id: string;
  deadline: string;
  is_enabled: boolean;
  block_after_deadline: boolean;
  message: string | null;
}

const nextSunday = () => {
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
  return format(d, "yyyy-MM-dd");
};

export const SubmissionDeadlineSettings = () => {
  const { toast } = useToast();
  const [row, setRow] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: nextSunday(),
    time: "23:59",
    is_enabled: true,
    block_after_deadline: true,
    message: "Results submissions close this Sunday. After the deadline the system will not accept any results.",
  });

  const load = async () => {
    const { data } = await supabase
      .from("submission_settings")
      .select("id, deadline, is_enabled, block_after_deadline, message")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      const d = new Date(data.deadline);
      setRow(data as Row);
      setForm({
        date: format(d, "yyyy-MM-dd"),
        time: format(d, "HH:mm"),
        is_enabled: data.is_enabled,
        block_after_deadline: data.block_after_deadline,
        message: data.message ?? "",
      });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      deadline: new Date(`${form.date}T${form.time}:00`).toISOString(),
      is_enabled: form.is_enabled,
      block_after_deadline: form.block_after_deadline,
      message: form.message || null,
    };

    const { error } = row
      ? await supabase.from("submission_settings").update(payload).eq("id", row.id)
      : await supabase.from("submission_settings").insert(payload);

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Submission deadline updated" });
      load();
    }
  };

  const toggleEnabled = async (checked: boolean) => {
    setForm({ ...form, is_enabled: checked });
    if (!row) return;
    const { error } = await supabase
      .from("submission_settings")
      .update({ is_enabled: checked })
      .eq("id", row.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: checked ? "Countdown activated" : "Countdown turned off" });
      load();
    }
  };

  const remove = async () => {
    if (!row) return;
    const { error } = await supabase.from("submission_settings").delete().eq("id", row.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setRow(null);
      toast({ title: "Removed", description: "Submission deadline deleted" });
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hourglass className="h-6 w-6 text-primary" />
          Results Submission Deadline
        </CardTitle>
        <CardDescription>
          Show a countdown on the results submission form and stop accepting results after the deadline.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="sd_enabled">Countdown active</Label>
              <p className="text-xs text-muted-foreground">Turn the countdown on or off instantly.</p>
            </div>
            <Switch id="sd_enabled" checked={form.is_enabled} onCheckedChange={toggleEnabled} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sd_date">Deadline date</Label>
              <Input
                id="sd_date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="sd_time">Deadline time</Label>
              <Input
                id="sd_time"
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="sd_message">Notice message</Label>
            <Textarea
              id="sd_message"
              rows={2}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="e.g., Results submissions close this Sunday."
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="sd_block">Block submissions after deadline</Label>
              <p className="text-xs text-muted-foreground">Disables the submit button once time is up.</p>
            </div>
            <Switch
              id="sd_block"
              checked={form.block_after_deadline}
              onCheckedChange={(c) => setForm({ ...form, block_after_deadline: c })}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : row ? "Update Deadline" : "Set Deadline"}
            </Button>
            {row && (
              <Button type="button" variant="outline" onClick={remove}>
                <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                Remove
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SubmissionDeadlineSettings;
