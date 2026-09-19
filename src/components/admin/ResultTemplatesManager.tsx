import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Download, Save, Loader2, Search } from "lucide-react";
import { downloadResultTemplate, MAX_STUDENTS } from "@/lib/resultTemplate";

interface SchoolRow {
  id: string;
  school_name: string;
  region: string;
}

interface TemplateRow {
  school_id: string | null;
  student_count: number;
  average_divisor: number;
}

export default function ResultTemplatesManager() {
  const { toast } = useToast();
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [templates, setTemplates] = useState<Record<string, TemplateRow>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [defaultCount, setDefaultCount] = useState("50");
  const [defaultDivisor, setDefaultDivisor] = useState("2");
  const [applying, setApplying] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: schoolData }, { data: templateData }] = await Promise.all([
      supabase.from("schools").select("id, school_name, region").order("school_name"),
      supabase.from("result_templates").select("school_id, student_count, average_divisor"),
    ]);
    setSchools((schoolData as SchoolRow[]) || []);
    const map: Record<string, TemplateRow> = {};
    (templateData as TemplateRow[] | null)?.forEach((t) => {
      if (t.school_id) map[t.school_id] = t;
    });
    setTemplates(map);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const valueFor = (schoolId: string) =>
    templates[schoolId] || {
      school_id: schoolId,
      student_count: Number(defaultCount) || 50,
      average_divisor: Number(defaultDivisor) || 2,
    };

  const setValue = (schoolId: string, field: "student_count" | "average_divisor", raw: string) => {
    const num = Number(raw);
    setTemplates((prev) => ({
      ...prev,
      [schoolId]: { ...valueFor(schoolId), school_id: schoolId, [field]: Number.isNaN(num) ? 0 : num },
    }));
  };

  const save = async (school: SchoolRow) => {
    const t = valueFor(school.id);
    if (t.student_count < 1 || t.student_count > MAX_STUDENTS) {
      toast({ title: "Invalid number of students", description: `Use 1 to ${MAX_STUDENTS}.`, variant: "destructive" });
      return;
    }
    if (t.average_divisor <= 0) {
      toast({ title: "Invalid average rate", description: "Must be greater than 0.", variant: "destructive" });
      return;
    }
    setSavingId(school.id);
    const { error } = await supabase.from("result_templates").upsert(
      {
        school_id: school.id,
        school_name: school.school_name,
        student_count: Math.floor(t.student_count),
        average_divisor: t.average_divisor,
      },
      { onConflict: "school_id" }
    );
    setSavingId(null);
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Template saved", description: `${school.school_name} updated.` });
  };

  const applyToAll = async () => {
    const count = Number(defaultCount);
    const divisor = Number(defaultDivisor);
    if (!count || count < 1 || count > MAX_STUDENTS || !divisor || divisor <= 0) {
      toast({ title: "Check the default values", description: `Students 1-${MAX_STUDENTS}, average rate above 0.`, variant: "destructive" });
      return;
    }
    setApplying(true);
    const { error } = await supabase.from("result_templates").upsert(
      schools.map((s) => ({
        school_id: s.id,
        school_name: s.school_name,
        student_count: Math.floor(count),
        average_divisor: divisor,
      })),
      { onConflict: "school_id" }
    );
    setApplying(false);
    if (error) {
      toast({ title: "Could not apply", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Applied to all schools", description: `${schools.length} templates updated.` });
    load();
  };

  const filtered = schools.filter((s) =>
    `${s.school_name} ${s.region}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Results Templates</CardTitle>
        <CardDescription>
          Set how many student rows each school's template has (max {MAX_STUDENTS}) and the number used to
          calculate the average (Total ÷ rate). Teachers download their school's template on the submit results page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-3 items-end rounded-lg border p-4 bg-muted/30">
          <div className="space-y-1">
            <Label>Default number of students</Label>
            <Input
              type="number"
              min={1}
              max={MAX_STUDENTS}
              value={defaultCount}
              onChange={(e) => setDefaultCount(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Default average rate (Total ÷)</Label>
            <Input
              type="number"
              min={0.1}
              step="0.1"
              value={defaultDivisor}
              onChange={(e) => setDefaultDivisor(e.target.value)}
            />
          </div>
          <Button onClick={applyToAll} disabled={applying || schools.length === 0}>
            {applying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Apply to all schools
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search schools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading schools...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School</TableHead>
                  <TableHead className="w-32">Students</TableHead>
                  <TableHead className="w-32">Average rate</TableHead>
                  <TableHead className="w-56 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((school) => {
                  const t = valueFor(school.id);
                  return (
                    <TableRow key={school.id}>
                      <TableCell>
                        <div className="font-medium">{school.school_name}</div>
                        <div className="text-xs text-muted-foreground">{school.region}</div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          max={MAX_STUDENTS}
                          value={t.student_count}
                          onChange={(e) => setValue(school.id, "student_count", e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0.1}
                          step="0.1"
                          value={t.average_divisor}
                          onChange={(e) => setValue(school.id, "average_divisor", e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" onClick={() => save(school)} disabled={savingId === school.id}>
                          {savingId === school.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            downloadResultTemplate({
                              schoolName: school.school_name,
                              studentCount: t.student_count,
                              averageDivisor: t.average_divisor,
                            })
                          }
                        >
                          <Download className="h-4 w-4 mr-2" /> Template
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                      No schools found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
