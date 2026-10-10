import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { FileText, Plus, Edit, School, ExternalLink, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ResultLinkField } from '@/components/admin/ResultLinkField';
import { openResultFile } from '@/lib/resultFiles';

interface GeneralResults {
  id: string;
  series_number: number;
  general_results_url: string | null;
  top_ten_students_url: string | null;
  top_ten_schools_url: string | null;
  is_published: boolean;
}

interface SchoolResults {
  id: string;
  school_id: string;
  series_number: number;
  individual_results_url: string | null;
  is_published: boolean;
  schools: {
    school_name: string;
    region: string;
  };
}

const SchoolResultsManagementPage = () => {
  const navigate = useNavigate();
  const [generalResults, setGeneralResults] = useState<GeneralResults[]>([]);
  const [schoolResults, setSchoolResults] = useState<SchoolResults[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [showGeneralDialog, setShowGeneralDialog] = useState(false);
  const [showSchoolDialog, setShowSchoolDialog] = useState(false);
  const [editingGeneral, setEditingGeneral] = useState<GeneralResults | null>(null);
  const [editingSchool, setEditingSchool] = useState<SchoolResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [generalForm, setGeneralForm] = useState({
    series_number: 3,
    general_results_url: '',
    top_ten_students_url: '',
    top_ten_schools_url: '',
    is_published: false
  });

  const [schoolForm, setSchoolForm] = useState({
    school_id: '',
    series_number: 3,
    individual_results_url: '',
    is_published: false
  });

  useEffect(() => {
    checkAuth();
    fetchSchools();
    fetchGeneralResults();
    fetchSchoolResults();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    if (!roleData || roleData.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges",
        variant: "destructive"
      });
      navigate('/');
    }
  };

  const fetchSchools = async () => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .order('school_name');

      if (error) throw error;
      setSchools(data || []);
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  const fetchGeneralResults = async () => {
    try {
      const { data, error } = await supabase
        .from('general_results')
        .select('*')
        .order('series_number', { ascending: false });

      if (error) throw error;
      setGeneralResults(data || []);
    } catch (error) {
      console.error('Error fetching general results:', error);
      toast({
        title: "Error",
        description: "Failed to fetch general results",
        variant: "destructive"
      });
    }
  };

  const fetchSchoolResults = async () => {
    try {
      const { data, error } = await supabase
        .from('school_results')
        .select(`
          *,
          schools!inner(school_name, region)
        `)
        .order('series_number', { ascending: false });

      if (error) throw error;
      setSchoolResults(data || []);
    } catch (error) {
      console.error('Error fetching school results:', error);
      toast({
        title: "Error",
        description: "Failed to fetch school results",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const resultData = {
        ...generalForm,
        published_by: user.id
      };

      if (editingGeneral) {
        const { error } = await supabase
          .from('general_results')
          .update(resultData)
          .eq('id', editingGeneral.id);

        if (error) throw error;
        toast({ title: "Success", description: "General results updated successfully" });
      } else {
        const { data: existing } = await supabase
          .from('general_results')
          .select('id')
          .eq('series_number', resultData.series_number)
          .limit(1);
        const { error } = existing && existing.length
          ? await supabase.from('general_results').update(resultData).eq('id', existing[0].id)
          : await supabase.from('general_results').insert(resultData);

        if (error) throw error;
        toast({ title: "Success", description: "General results added successfully" });
      }

      setShowGeneralDialog(false);
      setEditingGeneral(null);
      resetGeneralForm();
      fetchGeneralResults();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save general results",
        variant: "destructive"
      });
    }
  };

  const handleSchoolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const resultData = {
        ...schoolForm,
        published_by: user.id
      };

      if (editingSchool) {
        const { error } = await supabase
          .from('school_results')
          .update(resultData)
          .eq('id', editingSchool.id);

        if (error) throw error;
        toast({ title: "Success", description: "School results updated successfully" });
      } else {
        if (!resultData.school_id) throw new Error('Please select a school');
        if (!resultData.individual_results_url) throw new Error('Add a link or upload the results file');
        const { data: existing } = await supabase
          .from('school_results')
          .select('id')
          .eq('school_id', resultData.school_id)
          .eq('series_number', resultData.series_number)
          .limit(1);
        const { error } = existing && existing.length
          ? await supabase.from('school_results').update(resultData).eq('id', existing[0].id)
          : await supabase.from('school_results').insert(resultData);

        if (error) throw error;
        toast({ title: "Success", description: "School results added successfully" });
      }

      setShowSchoolDialog(false);
      setEditingSchool(null);
      resetSchoolForm();
      fetchSchoolResults();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save school results",
        variant: "destructive"
      });
    }
  };

  const toggleGeneralPublish = async (result: GeneralResults) => {
    try {
      const { error } = await supabase
        .from('general_results')
        .update({ is_published: !result.is_published })
        .eq('id', result.id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `General results ${!result.is_published ? 'published' : 'unpublished'}`
      });
      
      fetchGeneralResults();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update publish status",
        variant: "destructive"
      });
    }
  };

  const toggleSchoolPublish = async (result: SchoolResults) => {
    try {
      const { error } = await supabase
        .from('school_results')
        .update({ is_published: !result.is_published })
        .eq('id', result.id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `School results ${!result.is_published ? 'published' : 'unpublished'}`
      });
      
      fetchSchoolResults();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update publish status",
        variant: "destructive"
      });
    }
  };

  const resetGeneralForm = () => {
    setGeneralForm({
      series_number: 3,
      general_results_url: '',
      top_ten_students_url: '',
      top_ten_schools_url: '',
      is_published: false
    });
  };

  const resetSchoolForm = () => {
    setSchoolForm({
      school_id: '',
      series_number: 3,
      individual_results_url: '',
      is_published: false
    });
  };

  const openEditGeneralDialog = (result: GeneralResults) => {
    setEditingGeneral(result);
    setGeneralForm({
      series_number: result.series_number,
      general_results_url: result.general_results_url || '',
      top_ten_students_url: result.top_ten_students_url || '',
      top_ten_schools_url: result.top_ten_schools_url || '',
      is_published: result.is_published
    });
    setShowGeneralDialog(true);
  };

  const openEditSchoolDialog = (result: SchoolResults) => {
    setEditingSchool(result);
    setSchoolForm({
      school_id: result.school_id,
      series_number: result.series_number,
      individual_results_url: result.individual_results_url || '',
      is_published: result.is_published
    });
    setShowSchoolDialog(true);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen py-8 bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
              School Results Management
            </h1>
            <p className="text-muted-foreground">
              Manage Google Drive links for general results and individual school results
            </p>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General Results</TabsTrigger>
            <TabsTrigger value="schools">School Results</TabsTrigger>
          </TabsList>

          {/* General Results Tab */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    General Results URLs
                  </CardTitle>
                  <Button 
                    className="btn-educational" 
                    onClick={() => { 
                      resetGeneralForm(); 
                      setEditingGeneral(null); 
                      setShowGeneralDialog(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Series Results
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Series</TableHead>
                      <TableHead>General Results</TableHead>
                      <TableHead>Top 10 Students</TableHead>
                      <TableHead>Top 10 Schools</TableHead>
                      <TableHead>Published</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {generalResults.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell>Series {result.series_number}</TableCell>
                        <TableCell>
                          {result.general_results_url ? (
                            <a href="#" onClick={(e) => { e.preventDefault(); openResultFile(result.general_results_url).catch((err) => toast({ title: "Error", description: err.message, variant: "destructive" })); }} className="text-primary hover:underline flex items-center gap-1">
                              Link <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {result.top_ten_students_url ? (
                            <a href="#" onClick={(e) => { e.preventDefault(); openResultFile(result.top_ten_students_url).catch((err) => toast({ title: "Error", description: err.message, variant: "destructive" })); }} className="text-primary hover:underline flex items-center gap-1">
                              Link <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {result.top_ten_schools_url ? (
                            <a href="#" onClick={(e) => { e.preventDefault(); openResultFile(result.top_ten_schools_url).catch((err) => toast({ title: "Error", description: err.message, variant: "destructive" })); }} className="text-primary hover:underline flex items-center gap-1">
                              Link <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={result.is_published}
                              onCheckedChange={() => toggleGeneralPublish(result)}
                            />
                            <Badge variant={result.is_published ? "default" : "secondary"}>
                              {result.is_published ? 'Published' : 'Draft'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditGeneralDialog(result)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* School Results Tab */}
          <TabsContent value="schools">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <School className="h-5 w-5 mr-2" />
                    Individual School Results
                  </CardTitle>
                  <Button 
                    className="btn-educational" 
                    onClick={() => { 
                      resetSchoolForm(); 
                      setEditingSchool(null); 
                      setShowSchoolDialog(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add School Result
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School Name</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Series</TableHead>
                      <TableHead>Results URL</TableHead>
                      <TableHead>Published</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schoolResults.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell>{result.schools.school_name}</TableCell>
                        <TableCell>{result.schools.region}</TableCell>
                        <TableCell>Series {result.series_number}</TableCell>
                        <TableCell>
                          {result.individual_results_url ? (
                            <a href="#" onClick={(e) => { e.preventDefault(); openResultFile(result.individual_results_url).catch((err) => toast({ title: "Error", description: err.message, variant: "destructive" })); }} className="text-primary hover:underline flex items-center gap-1">
                              Link <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={result.is_published}
                              onCheckedChange={() => toggleSchoolPublish(result)}
                            />
                            <Badge variant={result.is_published ? "default" : "secondary"}>
                              {result.is_published ? 'Published' : 'Draft'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditSchoolDialog(result)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* General Results Dialog */}
        <Dialog open={showGeneralDialog} onOpenChange={setShowGeneralDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingGeneral ? 'Edit General Results' : 'Add General Results'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleGeneralSubmit} className="space-y-4">
              <div>
                <Label htmlFor="series_number">Series Number *</Label>
                <Select 
                  value={generalForm.series_number.toString()} 
                  onValueChange={(value) => setGeneralForm({...generalForm, series_number: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Series 1</SelectItem>
                    <SelectItem value="2">Series 2</SelectItem>
                    <SelectItem value="3">Series 3</SelectItem>
                    <SelectItem value="4">Series 4</SelectItem>
                    <SelectItem value="5">Series 5</SelectItem>
                    <SelectItem value="6">Series 6</SelectItem>
                    <SelectItem value="7">Series 7</SelectItem>
                    <SelectItem value="8">Series 8</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ResultLinkField id="general_results_url" label="General Results" folder={`general/series-${generalForm.series_number}`} value={generalForm.general_results_url} onChange={(v) => setGeneralForm({...generalForm, general_results_url: v})} />

              <ResultLinkField id="top_ten_students_url" label="Top 10 Students" folder={`top-students/series-${generalForm.series_number}`} value={generalForm.top_ten_students_url} onChange={(v) => setGeneralForm({...generalForm, top_ten_students_url: v})} />

              <ResultLinkField id="top_ten_schools_url" label="Top 10 Schools" folder={`top-schools/series-${generalForm.series_number}`} value={generalForm.top_ten_schools_url} onChange={(v) => setGeneralForm({...generalForm, top_ten_schools_url: v})} />

              <div className="flex items-center space-x-2">
                <Switch
                  checked={generalForm.is_published}
                  onCheckedChange={(checked) => setGeneralForm({...generalForm, is_published: checked})}
                />
                <Label>Publish immediately</Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowGeneralDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="btn-educational">
                  {editingGeneral ? 'Update' : 'Add'} Results
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* School Results Dialog */}
        <Dialog open={showSchoolDialog} onOpenChange={setShowSchoolDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingSchool ? 'Edit School Results' : 'Add School Results'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSchoolSubmit} className="space-y-4">
              <div>
                <Label htmlFor="school_id">School *</Label>
                <Select 
                  value={schoolForm.school_id} 
                  onValueChange={(value) => setSchoolForm({...schoolForm, school_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select school" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.school_name} - {school.region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="series_number">Series Number *</Label>
                <Select 
                  value={schoolForm.series_number.toString()} 
                  onValueChange={(value) => setSchoolForm({...schoolForm, series_number: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Series 1</SelectItem>
                    <SelectItem value="2">Series 2</SelectItem>
                    <SelectItem value="3">Series 3</SelectItem>
                    <SelectItem value="4">Series 4</SelectItem>
                    <SelectItem value="5">Series 5</SelectItem>
                    <SelectItem value="6">Series 6</SelectItem>
                    <SelectItem value="7">Series 7</SelectItem>
                    <SelectItem value="8">Series 8</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ResultLinkField id="individual_results_url" label="School Results (link or Excel file)" folder={`schools/series-${schoolForm.series_number}`} value={schoolForm.individual_results_url} onChange={(v) => setSchoolForm({...schoolForm, individual_results_url: v})} required />

              <div className="flex items-center space-x-2">
                <Switch
                  checked={schoolForm.is_published}
                  onCheckedChange={(checked) => setSchoolForm({...schoolForm, is_published: checked})}
                />
                <Label>Publish immediately</Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowSchoolDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="btn-educational">
                  {editingSchool ? 'Update' : 'Add'} Results
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SchoolResultsManagementPage;