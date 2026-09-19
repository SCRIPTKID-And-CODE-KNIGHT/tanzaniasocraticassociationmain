import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileSpreadsheet, Loader2, CheckCircle, Plus, Trash2, Table2, Download } from "lucide-react";
import * as XLSX from "xlsx";
import SubmissionDeadlineCountdown, { type SubmissionSetting } from "@/components/SubmissionDeadlineCountdown";

interface ResultRow {
  student_name: string;
  subject: string;
  marks: string;
  grade: string;
}

const emptyRow = (): ResultRow => ({ student_name: "", subject: "", marks: "", grade: "" });

const gradeFor = (marks: string) => {
  const n = Number(marks);
  if (!marks || Number.isNaN(n)) return "";
  if (n >= 80) return "A";
  if (n >= 65) return "B";
  if (n >= 50) return "C";
  if (n >= 35) return "D";
  return "F";
};


export default function ResultsSubmissionPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"upload" | "typed">("upload");
  const [rows, setRows] = useState<ResultRow[]>([emptyRow(), emptyRow(), emptyRow()]);

  const [deadlineSetting, setDeadlineSetting] = useState<SubmissionSetting | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("submission_settings")
        .select("id, deadline, is_enabled, block_after_deadline, message")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setDeadlineSetting(data as SubmissionSetting);
    };
    load();
  }, []);

  // is_enabled is the master switch: OFF = submissions closed entirely
  const acceptingEnabled = deadlineSetting ? deadlineSetting.is_enabled : true;
  const deadlinePassed = deadlineSetting
    ? new Date(deadlineSetting.deadline).getTime() <= Date.now()
    : false;
  const isLocked =
    !acceptingEnabled ||
    (Boolean(deadlineSetting?.block_after_deadline) && deadlinePassed);
  const isExpired = !acceptingEnabled || deadlinePassed;

  const [formData, setFormData] = useState({
    schoolName: "",
    teacherName: "",
    teacherEmail: "",
    teacherPhone: "",
    seriesNumber: "",
    notes: "",
  });

  const downloadTemplate = () => {
    const sheet = XLSX.utils.aoa_to_sheet([
      ["Student Name", "Subject", "Marks", "Grade"],
      ["Example: John Doe", "Geography", 82, "A"],
      ["", "", "", ""],
      ["", "", "", ""],
      ["", "", "", ""],
    ]);
    sheet["!cols"] = [{ wch: 30 }, { wch: 20 }, { wch: 10 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Results");
    XLSX.writeFile(wb, "TASSA_Results_Template.xlsx");
    toast({
      title: "Template downloaded",
      description: "Fill it in offline, then come back and upload it here.",
    });
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const removeRow = (index: number) =>
    setRows((prev) => (prev.length === 1 ? [emptyRow()] : prev.filter((_, i) => i !== index)));

  const updateRow = (index: number, field: keyof ResultRow, value: string) => {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const next = { ...row, [field]: value };
        if (field === "marks") next.grade = gradeFor(value);
        return next;
      })
    );
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    const text = e.clipboardData.getData("text/plain");
    if (!text || !/[\t\n]/.test(text)) return;
    e.preventDefault();
    const parsed = text
      .split(/\r?\n/)
      .filter((line) => line.trim())
      .map((line) => {
        const [student_name = "", subject = "", marks = "", grade = ""] = line.split("\t");
        const m = marks.trim();
        return {
          student_name: student_name.trim(),
          subject: subject.trim(),
          marks: m,
          grade: grade.trim() || gradeFor(m),
        };
      });
    if (parsed.length === 0) return;
    setRows((prev) => {
      const next = [...prev];
      parsed.forEach((row, i) => {
        next[index + i] = row;
      });
      return next;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/csv'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload an Excel, PDF, Word, or CSV file",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLocked) {
      toast({
        title: "Submissions closed",
        description: "The deadline has passed. The system is no longer accepting results.",
        variant: "destructive",
      });
      return;
    }

    const filledRows = rows.filter((r) => r.student_name.trim() !== "");

    if (mode === "upload" && !selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    if (mode === "typed" && filledRows.length === 0) {
      toast({
        title: "No results entered",
        description: "Add at least one student row before submitting",
        variant: "destructive",
      });
      return;
    }

    if (!formData.schoolName || !formData.teacherName || !formData.teacherPhone || !formData.seriesNumber) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let fileUrl: string | null = null;
      let fileNameValue: string | null = null;

      if (mode === "upload" && selectedFile) {
        // Upload file to storage
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}-${formData.schoolName.replace(/\s+/g, '_')}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('result-submissions')
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        // Get file URL
        const { data: urlData } = supabase.storage
          .from('result-submissions')
          .getPublicUrl(fileName);

        fileUrl = urlData.publicUrl;
        fileNameValue = selectedFile.name;
      }

      // Save submission record
      const { data: inserted, error: insertError } = await supabase
        .from('result_submissions')
        .insert({
          school_name: formData.schoolName,
          teacher_name: formData.teacherName,
          teacher_email: formData.teacherEmail || null,
          teacher_phone: formData.teacherPhone,
          series_number: parseInt(formData.seriesNumber),
          file_url: fileUrl,
          file_name: fileNameValue,
          source: mode,
          notes: formData.notes || null,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      if (mode === "typed" && inserted) {
        const { error: rowsError } = await supabase
          .from('result_submission_rows')
          .insert(
            filledRows.map((r, index) => ({
              submission_id: inserted.id,
              student_name: r.student_name.trim(),
              subject: r.subject.trim() || null,
              marks: r.marks === "" ? null : Number(r.marks),
              grade: r.grade.trim() || gradeFor(r.marks) || null,
              position: index + 1,
            }))
          );
        if (rowsError) throw rowsError;
      }



      setIsSuccess(true);
      toast({
        title: "Results submitted successfully!",
        description: "Your results have been uploaded and will be reviewed by admin.",
      });

    } catch (error: any) {
      console.error("Submission error:", error);
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit results. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-lg">
          <Card className="text-center">
            <CardContent className="pt-8 pb-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Submission Successful!</h2>
              <p className="text-muted-foreground mb-6">
                Your results have been uploaded and will be reviewed by the admin team.
              </p>
              <Button onClick={() => {
                setIsSuccess(false);
                setSelectedFile(null);
                setRows([emptyRow(), emptyRow(), emptyRow()]);

                setFormData({
                  schoolName: "",
                  teacherName: "",
                  teacherEmail: "",
                  teacherPhone: "",
                  seriesNumber: "",
                  notes: "",
                });
              }}>
                Submit Another
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Submit Results</h1>
          <p className="text-muted-foreground">
            Teachers can upload exam results for their schools here
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Results Submission Form
            </CardTitle>
            <CardDescription>
              Upload your results as Excel, PDF, Word, or CSV file
            </CardDescription>
          </CardHeader>
          <CardContent>
            {deadlineSetting && (
              <SubmissionDeadlineCountdown setting={deadlineSetting} expired={isExpired} />
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schoolName">School Name *</Label>
                  <Input
                    id="schoolName"
                    value={formData.schoolName}
                    onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                    placeholder="Enter school name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="seriesNumber">Series Number *</Label>
                  <Select
                    value={formData.seriesNumber}
                    onValueChange={(value) => setFormData({ ...formData, seriesNumber: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select series" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          Series {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="teacherName">Teacher Name *</Label>
                  <Input
                    id="teacherName"
                    value={formData.teacherName}
                    onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="teacherPhone">Phone Number *</Label>
                  <Input
                    id="teacherPhone"
                    type="tel"
                    value={formData.teacherPhone}
                    onChange={(e) => setFormData({ ...formData, teacherPhone: e.target.value })}
                    placeholder="e.g., 0712345678"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="teacherEmail">Email (Optional)</Label>
                <Input
                  id="teacherEmail"
                  type="email"
                  value={formData.teacherEmail}
                  onChange={(e) => setFormData({ ...formData, teacherEmail: e.target.value })}
                  placeholder="Enter your email address"
                />
              </div>

              <Tabs value={mode} onValueChange={(v) => setMode(v as "upload" | "typed")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload">
                    <Upload className="h-4 w-4 mr-2" /> Upload file
                  </TabsTrigger>
                  <TabsTrigger value="typed">
                    <Table2 className="h-4 w-4 mr-2" /> Enter results
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-2 mt-4">
                  <Label htmlFor="file">Results File *</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                    <input
                      id="file"
                      type="file"
                      accept=".xlsx,.xls,.csv,.pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="file" className="cursor-pointer">
                      <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      {selectedFile ? (
                        <p className="text-sm text-foreground font-medium">{selectedFile.name}</p>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Excel, PDF, Word, or CSV (max 10MB)
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                </TabsContent>

                <TabsContent value="typed" className="space-y-3 mt-4">
                  <div className="flex items-center justify-between">
                    <Label>Student Results *</Label>
                    <p className="text-xs text-muted-foreground">
                      Tip: copy rows from Excel and paste into the first cell
                    </p>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="p-2 text-left w-8">#</th>
                          <th className="p-2 text-left">Student Name</th>
                          <th className="p-2 text-left">Subject</th>
                          <th className="p-2 text-left w-24">Marks</th>
                          <th className="p-2 text-left w-24">Grade</th>
                          <th className="p-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, index) => (
                          <tr key={index} className="border-t border-border">
                            <td className="p-2 text-muted-foreground">{index + 1}</td>
                            <td className="p-1">
                              <Input
                                value={row.student_name}
                                onChange={(e) => updateRow(index, "student_name", e.target.value)}
                                onPaste={(e) => handlePaste(e, index)}
                                placeholder="Full name"
                              />
                            </td>
                            <td className="p-1">
                              <Input
                                value={row.subject}
                                onChange={(e) => updateRow(index, "subject", e.target.value)}
                                placeholder="Geography"
                              />
                            </td>
                            <td className="p-1">
                              <Input
                                type="number"
                                value={row.marks}
                                onChange={(e) => updateRow(index, "marks", e.target.value)}
                                placeholder="0"
                              />
                            </td>
                            <td className="p-1">
                              <Input
                                value={row.grade}
                                onChange={(e) => updateRow(index, "grade", e.target.value)}
                                placeholder={gradeFor(row.marks) || "-"}
                              />
                            </td>
                            <td className="p-1 text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeRow(index)}
                                disabled={rows.length === 1}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Button type="button" variant="outline" size="sm" onClick={addRow}>
                    <Plus className="h-4 w-4 mr-2" /> Add row
                  </Button>
                </TabsContent>
              </Tabs>


              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional information about the results..."
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting || isLocked}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLocked ? "Submissions Closed" : isSubmitting ? "Submitting..." : "Submit Results"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}