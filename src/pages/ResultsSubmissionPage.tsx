import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileSpreadsheet, Loader2, CheckCircle } from "lucide-react";
import SubmissionDeadlineCountdown, { type SubmissionSetting } from "@/components/SubmissionDeadlineCountdown";

export default function ResultsSubmissionPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deadlineSetting, setDeadlineSetting] = useState<SubmissionSetting | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("submission_settings")
        .select("id, deadline, is_enabled, block_after_deadline, message")
        .eq("is_enabled", true)
        .order("deadline", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setDeadlineSetting(data as SubmissionSetting);
    };
    load();
  }, []);

  const isExpired = deadlineSetting
    ? new Date(deadlineSetting.deadline).getTime() <= Date.now()
    : false;
  const isLocked = Boolean(deadlineSetting?.block_after_deadline) && isExpired;

  const [formData, setFormData] = useState({
    schoolName: "",
    teacherName: "",
    teacherEmail: "",
    teacherPhone: "",
    seriesNumber: "",
    notes: "",
  });

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

    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
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
      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${formData.schoolName.replace(/\s+/g, '_')}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('result-submissions')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get file URL
      const { data: urlData } = supabase.storage
        .from('result-submissions')
        .getPublicUrl(fileName);

      // Save submission record
      const { error: insertError } = await supabase
        .from('result_submissions')
        .insert({
          school_name: formData.schoolName,
          teacher_name: formData.teacherName,
          teacher_email: formData.teacherEmail || null,
          teacher_phone: formData.teacherPhone,
          series_number: parseInt(formData.seriesNumber),
          file_url: urlData.publicUrl,
          file_name: selectedFile.name,
          notes: formData.notes || null,
        });

      if (insertError) throw insertError;

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

              <div className="space-y-2">
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
              </div>

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

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Submitting..." : "Submit Results"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}