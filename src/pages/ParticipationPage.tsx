import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Calendar, Users, Clock, FileCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface School {
  id: string;
  school_name: string;
  region: string;
  district: string;
}

interface ConfirmedSchool {
  id: string;
  school_name: string;
  region: string;
  district: string;
  students: number;
  confirmed_by: string;
}

const ParticipationPage = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [formData, setFormData] = useState({
    school_id: '',
    contactPerson: '',
    numberOfStudents: '',
    series_number: 1
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [confirmedSchools, setConfirmedSchools] = useState<ConfirmedSchool[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [schoolsResponse, confirmationsResponse] = await Promise.all([
        supabase.from('schools').select('*').order('school_name'),
        supabase
          .from('participation_confirmations')
          .select(`
            *,
            schools!inner(school_name, region, district)
          `)
          .eq('series_number', 1)
      ]);

      if (schoolsResponse.error) throw schoolsResponse.error;
      if (confirmationsResponse.error) throw confirmationsResponse.error;

      setSchools(schoolsResponse.data || []);
      
      const confirmed = confirmationsResponse.data?.map((conf: any) => ({
        id: conf.school_id,
        school_name: conf.schools.school_name,
        region: conf.schools.region,
        district: conf.schools.district,
        students: conf.number_of_students || 0,
        confirmed_by: conf.confirmed_by
      })) || [];
      
      setConfirmedSchools(confirmed);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const selectedSchool = schools.find(s => s.id === formData.school_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('participation_confirmations')
        .insert({
          school_id: formData.school_id,
          series_number: formData.series_number,
          confirmed_by: formData.contactPerson,
          number_of_students: formData.numberOfStudents ? parseInt(formData.numberOfStudents) : null
        });

      if (error) throw error;

      toast({
        title: "Participation Confirmed!",
        description: "Your school's participation has been confirmed for Series 1.",
      });

      setIsSubmitted(true);
      fetchData(); // Refresh the confirmed schools list
    } catch (error: any) {
      console.error('Error confirming participation:', error);
      toast({
        title: "Confirmation Failed",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="text-center border-success/20 bg-success-light/20">
            <CardContent className="pt-12 pb-12">
              <CheckCircle className="h-16 w-16 text-success mx-auto mb-6" />
              <h1 className="text-2xl font-heading font-bold text-foreground mb-4">
                Participation Confirmed!
              </h1>
              <p className="text-muted-foreground mb-6">
                <strong>{selectedSchool?.school_name}</strong> has been successfully confirmed for participation 
                in TASSA Socratic Series 1.
              </p>
              <div className="bg-card p-4 rounded-lg border mb-6">
                <h3 className="font-semibold mb-2">Confirmation Details</h3>
                <div className="text-left text-sm space-y-1 text-muted-foreground">
                  <p><strong>School:</strong> {selectedSchool?.school_name}</p>
                  <p><strong>Contact:</strong> {formData.contactPerson}</p>
                  <p><strong>Students:</strong> {formData.numberOfStudents}</p>
                  <p><strong>Location:</strong> {selectedSchool?.district}, {selectedSchool?.region}</p>
                  <p><strong>Series:</strong> Series 1</p>
                </div>
              </div>
              <Button 
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({
                    school_id: '',
                    contactPerson: '',
                    numberOfStudents: '',
                    series_number: 1
                  });
                }}
                variant="outline"
              >
                Confirm Another School
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground mb-4">
            Participation Confirmation
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Confirm your participation in TASSA Socratic Series 1. 
            Only registered schools can confirm participation for this series.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="form-section">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileCheck className="h-6 w-6 text-primary" />
                  <span>Confirm Participation</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="school_id">Select School *</Label>
                    <Select 
                      value={formData.school_id} 
                      onValueChange={(value) => setFormData({...formData, school_id: value})}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Choose your school" />
                      </SelectTrigger>
                      <SelectContent>
                        {schools.map((school) => (
                          <SelectItem key={school.id} value={school.id}>
                            {school.school_name} - {school.region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {schools.length === 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        No registered schools found. Please register your school first.
                      </p>
                    )}
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="contactPerson">Contact Person *</Label>
                      <Input
                        id="contactPerson"
                        name="contactPerson"
                        value={formData.contactPerson}
                        onChange={handleInputChange}
                        placeholder="Your full name"
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="numberOfStudents">Number of Students</Label>
                      <Input
                        id="numberOfStudents"
                        name="numberOfStudents"
                        type="number"
                        min="1"
                        value={formData.numberOfStudents}
                        onChange={handleInputChange}
                        placeholder="Expected participants"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <Alert>
                    <Calendar className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Series 1</strong><br />
                      Confirmation deadline:You are reminded to confirm for prticipation before the confirmation window is closed.
                    </AlertDescription>
                  </Alert>

                  <Button 
                    type="submit" 
                    className="w-full btn-educational" 
                    disabled={isSubmitting || !formData.school_id || !formData.contactPerson}
                  >
                    {isSubmitting ? 'Confirming Participation...' : 'Confirm Participation'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            {/* Series Information */}
            <Card className="form-section">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-6 w-6 text-primary" />
                  <span>Series Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-primary">SERIES 6</h4>
                  <p className="text-sm text-muted-foreground">Both Physical & Human Geography Focus</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Confirmation Deadline:</span>
                    <Badge variant="outline">TBA</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Competition Dates:</span>
                    <Badge variant="outline">TBA</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Results Release:</span>
                    <Badge variant="outline">WILL BE PUBLISHED SOON</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="form-section">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-6 w-6 text-primary" />
                  <span>Important Dates</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                    <span>Registration Opens</span>
                    <Badge className="bg-success text-success-foreground">Completed</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-warning-light/20">
                    <span>Participation Confirmation</span>
                    <Badge className="bg-warning text-warning-foreground">Open Now</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                    <span>Results Release</span>
                    <Badge variant="outline">After Marking and Results compilation</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                    <span>Competition Week</span>
                    <Badge variant="outline">TBA</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Confirmed Schools List */}
        <div className="mt-12">
          <Card className="form-section">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-primary" />
                <span>Confirmed Schools for Series 1</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {confirmedSchools.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {confirmedSchools.map((school) => (
                    <div key={school.id} className="border rounded-lg p-4 bg-muted/20">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-sm">{school.school_name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {school.students > 0 ? `${school.students} students` : 'TBD'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {school.district}, {school.region}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Confirmed by: {school.confirmed_by}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center">No schools have confirmed for Series 1 yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ParticipationPage;
