import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Plus, Search, Edit, DollarSign, School, Trash2, Copy, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import ParticipationConfirmationsManager from '@/components/admin/ParticipationConfirmationsManager';

interface SchoolData {
  id: string;
  school_name: string;
  contact_name: string;
  phone_number: string;
  email: string | null;
  region: string;
  district: string;
  message: string | null;
  created_at: string;
}

interface PaymentStatus {
  id: string;
  school_id: string;
  series_number: number;
  status: string;
  amount: number | null;
  payment_date: string | null;
}

const SchoolManagementPage = () => {
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [payments, setPayments] = useState<PaymentStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<SchoolData | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmAutoDelete, setConfirmAutoDelete] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    school_name: '',
    contact_name: '',
    phone_number: '',
    email: '',
    region: '',
    district: '',
    message: ''
  });

  const [paymentFormData, setPaymentFormData] = useState({
    series_number: '6',
    status: 'pending',
    amount: '',
    payment_date: '',
    payment_method: '',
    receipt_number: '',
    notes: ''
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id);

    const isAdmin = roles?.some(r => r.role === 'admin');
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Admin privileges required.",
        variant: "destructive"
      });
      navigate('/');
      return;
    }

    fetchData();
  };

  const fetchData = async () => {
    setIsLoading(true);
    
    const [schoolsRes, paymentsRes] = await Promise.all([
      supabase.from('schools').select('*').order('created_at', { ascending: false }),
      supabase.from('payment_status').select('*')
    ]);

    if (schoolsRes.data) setSchools(schoolsRes.data);
    if (paymentsRes.data) setPayments(paymentsRes.data);
    
    setIsLoading(false);
  };

  const handleAddSchool = async () => {
    if (!formData.school_name || !formData.contact_name || !formData.phone_number || !formData.region || !formData.district) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (isEditMode && selectedSchool) {
      const { error } = await supabase
        .from('schools')
        .update({
          school_name: formData.school_name,
          contact_name: formData.contact_name,
          phone_number: formData.phone_number,
          email: formData.email || null,
          region: formData.region,
          district: formData.district,
          message: formData.message || null
        })
        .eq('id', selectedSchool.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update school.",
          variant: "destructive"
        });
        return;
      }

      toast({ title: "Success", description: "School updated successfully." });
    } else {
      const { error } = await supabase
        .from('schools')
        .insert({
          school_name: formData.school_name,
          contact_name: formData.contact_name,
          phone_number: formData.phone_number,
          email: formData.email || null,
          region: formData.region,
          district: formData.district,
          message: formData.message || null
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to add school.",
          variant: "destructive"
        });
        return;
      }

      toast({ title: "Success", description: "School added successfully." });
    }

    resetForm();
    setIsAddDialogOpen(false);
    fetchData();
  };

  const handleUpdatePayment = async () => {
    if (!selectedSchool) return;

    const existingPayment = payments.find(
      p => p.school_id === selectedSchool.id && p.series_number === parseInt(paymentFormData.series_number)
    );

    const paymentData = {
      school_id: selectedSchool.id,
      series_number: parseInt(paymentFormData.series_number),
      status: paymentFormData.status,
      amount: paymentFormData.amount ? parseFloat(paymentFormData.amount) : null,
      payment_date: paymentFormData.payment_date || null,
      payment_method: paymentFormData.payment_method || null,
      receipt_number: paymentFormData.receipt_number || null,
      notes: paymentFormData.notes || null
    };

    if (existingPayment) {
      const { error } = await supabase
        .from('payment_status')
        .update(paymentData)
        .eq('id', existingPayment.id);

      if (error) {
        toast({ title: "Error", description: "Failed to update payment.", variant: "destructive" });
        return;
      }
    } else {
      const { error } = await supabase
        .from('payment_status')
        .insert(paymentData);

      if (error) {
        toast({ title: "Error", description: "Failed to add payment.", variant: "destructive" });
        return;
      }
    }

    toast({ title: "Success", description: "Payment status updated." });
    setIsPaymentDialogOpen(false);
    resetPaymentForm();
    fetchData();
  };

  const resetForm = () => {
    setFormData({
      school_name: '',
      contact_name: '',
      phone_number: '',
      email: '',
      region: '',
      district: '',
      message: ''
    });
    setSelectedSchool(null);
    setIsEditMode(false);
  };

  const resetPaymentForm = () => {
    setPaymentFormData({
      series_number: '6',
      status: 'pending',
      amount: '',
      payment_date: '',
      payment_method: '',
      receipt_number: '',
      notes: ''
    });
    setSelectedSchool(null);
  };

  const openEditDialog = (school: SchoolData) => {
    setSelectedSchool(school);
    setFormData({
      school_name: school.school_name,
      contact_name: school.contact_name,
      phone_number: school.phone_number,
      email: school.email || '',
      region: school.region,
      district: school.district,
      message: school.message || ''
    });
    setIsEditMode(true);
    setIsAddDialogOpen(true);
  };

  const openPaymentDialog = (school: SchoolData) => {
    setSelectedSchool(school);
    
    // Check if payment exists for series 6
    const existingPayment = payments.find(
      p => p.school_id === school.id && p.series_number === 6
    );
    
    if (existingPayment) {
      setPaymentFormData({
        series_number: existingPayment.series_number.toString(),
        status: existingPayment.status || 'pending',
        amount: existingPayment.amount?.toString() || '',
        payment_date: existingPayment.payment_date || '',
        payment_method: '',
        receipt_number: '',
        notes: ''
      });
    }
    
    setIsPaymentDialogOpen(true);
  };

  const getPaymentStatus = (schoolId: string, seriesNumber: number) => {
    const payment = payments.find(p => p.school_id === schoolId && p.series_number === seriesNumber);
    return payment?.status || 'not set';
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'overdue': return 'destructive';
      default: return 'outline';
    }
  };

  const filteredSchools = schools.filter(school =>
    school.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.contact_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Normalize name for duplicate detection
  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

  const duplicateGroups = (() => {
    const map = new Map<string, SchoolData[]>();
    for (const s of schools) {
      const key = normalize(s.school_name);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.values()).filter((g) => g.length > 1);
  })();

  const duplicateIds = new Set(duplicateGroups.flat().map((s) => s.id));
  const displayedSchools = showDuplicatesOnly
    ? filteredSchools.filter((s) => duplicateIds.has(s.id))
    : filteredSchools;

  const isDuplicate = (s: SchoolData) => duplicateIds.has(s.id);

  const handleDeleteSchool = async (id: string) => {
    const { error } = await supabase.from('schools').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete school.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Deleted', description: 'School removed successfully.' });
    setConfirmDeleteId(null);
    fetchData();
  };

  const handleAutoDeleteDuplicates = async () => {
    // Keep oldest (first registered) per duplicate group, delete the rest
    const toDelete: string[] = [];
    for (const group of duplicateGroups) {
      const sorted = [...group].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      toDelete.push(...sorted.slice(1).map((s) => s.id));
    }
    if (toDelete.length === 0) {
      toast({ title: 'No duplicates', description: 'No duplicate schools found.' });
      setConfirmAutoDelete(false);
      return;
    }
    const { error } = await supabase.from('schools').delete().in('id', toDelete);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete duplicates.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Duplicates removed', description: `${toDelete.length} duplicate school(s) deleted.` });
    setConfirmAutoDelete(false);
    setShowDuplicatesOnly(false);
    fetchData();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-16 bg-muted/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin')}
          className="mb-6 flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Admin</span>
        </Button>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
              School Management
            </h1>
            <p className="text-muted-foreground">
              View, add, and manage registered schools ({schools.length} total
              {duplicateGroups.length > 0 && (
                <span className="text-destructive font-medium"> · {duplicateIds.size} possible duplicates in {duplicateGroups.length} group(s)</span>
              )}
              )
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={showDuplicatesOnly ? 'default' : 'outline'}
              onClick={() => setShowDuplicatesOnly((v) => !v)}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              {showDuplicatesOnly ? 'Show All Schools' : `Find Duplicates${duplicateGroups.length ? ` (${duplicateIds.size})` : ''}`}
            </Button>
            {duplicateGroups.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => setConfirmAutoDelete(true)}
                className="flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Auto-Delete Duplicates
              </Button>
            )}
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="btn-educational flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add School</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{isEditMode ? 'Edit School' : 'Add New School'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="school_name">School Name *</Label>
                  <Input
                    id="school_name"
                    value={formData.school_name}
                    onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                    placeholder="Enter school name"
                  />
                </div>
                <div>
                  <Label htmlFor="contact_name">Contact Person *</Label>
                  <Input
                    id="contact_name"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    placeholder="Enter contact name"
                  />
                </div>
                <div>
                  <Label htmlFor="phone_number">Phone Number *</Label>
                  <Input
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="region">Region *</Label>
                  <Input
                    id="region"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    placeholder="Enter region"
                  />
                </div>
                <div>
                  <Label htmlFor="district">District *</Label>
                  <Input
                    id="district"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="Enter district"
                  />
                </div>
                <div>
                  <Label htmlFor="message">Notes</Label>
                  <Input
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Additional notes"
                  />
                </div>
                <Button onClick={handleAddSchool} className="w-full btn-educational">
                  {isEditMode ? 'Update School' : 'Add School'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Payment Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={(open) => {
          setIsPaymentDialogOpen(open);
          if (!open) resetPaymentForm();
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update Payment Status</DialogTitle>
              {selectedSchool && (
                <p className="text-sm text-muted-foreground">{selectedSchool.school_name}</p>
              )}
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Series Number</Label>
                <Select
                  value={paymentFormData.series_number}
                  onValueChange={(value) => setPaymentFormData({ ...paymentFormData, series_number: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(num => (
                      <SelectItem key={num} value={num.toString()}>Series {num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Payment Status</Label>
                <Select
                  value={paymentFormData.status}
                  onValueChange={(value) => setPaymentFormData({ ...paymentFormData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount (TZS)</Label>
                <Input
                  type="number"
                  value={paymentFormData.amount}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <Label>Payment Date</Label>
                <Input
                  type="date"
                  value={paymentFormData.payment_date}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Payment Method</Label>
                <Input
                  value={paymentFormData.payment_method}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_method: e.target.value })}
                  placeholder="e.g., M-Pesa, Bank Transfer"
                />
              </div>
              <div>
                <Label>Receipt Number</Label>
                <Input
                  value={paymentFormData.receipt_number}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, receipt_number: e.target.value })}
                  placeholder="Enter receipt number"
                />
              </div>
              <Button onClick={handleUpdatePayment} className="w-full btn-educational">
                Update Payment
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by school name, region, district, or contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Schools Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <School className="h-5 w-5 text-primary" />
              <span>Registered Schools</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>School Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>District</TableHead>
                    <TableHead>Series 6 Payment</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedSchools.map((school) => (
                    <TableRow key={school.id} className={isDuplicate(school) ? 'bg-destructive/5' : ''}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {school.school_name}
                          {isDuplicate(school) && (
                            <Badge variant="destructive" className="text-[10px]">Duplicate</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{school.contact_name}</p>
                          <p className="text-xs text-muted-foreground">{school.phone_number}</p>
                        </div>
                      </TableCell>
                      <TableCell>{school.region}</TableCell>
                      <TableCell>{school.district}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(getPaymentStatus(school.id, 5))}>
                          {getPaymentStatus(school.id, 5)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(school)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPaymentDialog(school)}
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => setConfirmDeleteId(school.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {displayedSchools.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {showDuplicatesOnly ? 'No duplicate schools found.' : 'No schools found matching your search.'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <ParticipationConfirmationsManager />

        {/* Delete confirm */}
        <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this school?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The school will be permanently removed from the registry.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => confirmDeleteId && handleDeleteSchool(confirmDeleteId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Auto-delete duplicates confirm */}
        <AlertDialog open={confirmAutoDelete} onOpenChange={setConfirmAutoDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Auto-delete duplicate schools?</AlertDialogTitle>
              <AlertDialogDescription>
                Schools are grouped by normalized name. The oldest registration in each group is kept; the rest will be deleted.
                This will remove {Math.max(0, duplicateIds.size - duplicateGroups.length)} school(s).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleAutoDeleteDuplicates}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Duplicates
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default SchoolManagementPage;
