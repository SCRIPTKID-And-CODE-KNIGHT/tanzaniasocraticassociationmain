import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Calendar, Clock, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import SubmissionDeadlineSettings from '@/components/admin/SubmissionDeadlineSettings';

interface ExamSetting {
  id: string;
  exam_date: string;
  series_name: string;
  is_active: boolean;
  created_at: string;
}

const ExamSettingsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settings, setSettings] = useState<ExamSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<ExamSetting | null>(null);
  
  const [formData, setFormData] = useState({
    exam_date: '',
    exam_time: '08:00',
    series_name: '',
    is_active: true,
  });

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  const checkAdminAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      navigate('/');
      toast({ title: 'Access Denied', description: 'Admin access required', variant: 'destructive' });
      return;
    }

    fetchSettings();
  };

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('exam_settings')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && !error) {
      setSettings(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const examDateTime = `${formData.exam_date}T${formData.exam_time}:00`;
    
    if (editingSetting) {
      const { error } = await supabase
        .from('exam_settings')
        .update({
          exam_date: examDateTime,
          series_name: formData.series_name,
          is_active: formData.is_active,
        })
        .eq('id', editingSetting.id);

      if (error) {
        toast({ title: 'Error', description: 'Failed to update exam setting', variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Exam setting updated successfully' });
        fetchSettings();
        setDialogOpen(false);
        resetForm();
      }
    } else {
      // If setting as active, deactivate all others first
      if (formData.is_active) {
        await supabase
          .from('exam_settings')
          .update({ is_active: false })
          .neq('id', 'placeholder');
      }

      const { error } = await supabase
        .from('exam_settings')
        .insert({
          exam_date: examDateTime,
          series_name: formData.series_name,
          is_active: formData.is_active,
        });

      if (error) {
        toast({ title: 'Error', description: 'Failed to create exam setting', variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Exam setting created successfully' });
        fetchSettings();
        setDialogOpen(false);
        resetForm();
      }
    }
  };

  const handleEdit = (setting: ExamSetting) => {
    const date = new Date(setting.exam_date);
    setEditingSetting(setting);
    setFormData({
      exam_date: format(date, 'yyyy-MM-dd'),
      exam_time: format(date, 'HH:mm'),
      series_name: setting.series_name,
      is_active: setting.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('exam_settings')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete exam setting', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Exam setting deleted successfully' });
      fetchSettings();
    }
  };

  const toggleActive = async (id: string, currentState: boolean) => {
    if (!currentState) {
      // Deactivate all others first
      await supabase
        .from('exam_settings')
        .update({ is_active: false })
        .neq('id', id);
    }

    const { error } = await supabase
      .from('exam_settings')
      .update({ is_active: !currentState })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    } else {
      fetchSettings();
    }
  };

  const resetForm = () => {
    setEditingSetting(null);
    setFormData({
      exam_date: '',
      exam_time: '08:00',
      series_name: '',
      is_active: true,
    });
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin Panel
        </Button>

        <SubmissionDeadlineSettings />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-6 w-6 text-primary" />
                Exam Countdown Settings
              </CardTitle>
              <CardDescription>
                Manage the exam countdown timer displayed on the homepage
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Exam Date
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingSetting ? 'Edit Exam Setting' : 'Add New Exam Date'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="series_name">Series Name</Label>
                    <Input
                      id="series_name"
                      placeholder="e.g., Series 5 Exam 2026"
                      value={formData.series_name}
                      onChange={(e) => setFormData({ ...formData, series_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="exam_date">Exam Date</Label>
                      <Input
                        id="exam_date"
                        type="date"
                        value={formData.exam_date}
                        onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="exam_time">Exam Time</Label>
                      <Input
                        id="exam_time"
                        type="time"
                        value={formData.exam_time}
                        onChange={(e) => setFormData({ ...formData, exam_time: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Set as active countdown</Label>
                  </div>
                  <Button type="submit" className="w-full">
                    {editingSetting ? 'Update' : 'Create'} Exam Setting
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : settings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No exam settings configured yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Series Name</TableHead>
                    <TableHead>Exam Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings.map((setting) => (
                    <TableRow key={setting.id}>
                      <TableCell className="font-medium">{setting.series_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(setting.exam_date), 'MMM dd, yyyy h:mm a')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={setting.is_active}
                          onCheckedChange={() => toggleActive(setting.id, setting.is_active)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(setting)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(setting.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExamSettingsPage;