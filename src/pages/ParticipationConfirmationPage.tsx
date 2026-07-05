import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Users, Calendar, School } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ParticipationConfirmationPage = () => {
  const [schools, setSchools] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    school_id: '',
    series_number: 1,
    confirmed_by: '',
    number_of_students: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSchools();
  }, []);

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
      toast({
        title: "Error",
        description: "Failed to load schools",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('participation_confirmations')
        .insert({
          school_id: formData.school_id,
          series_number: formData.series_number,
          confirmed_by: formData.confirmed_by,
          number_of_students: formData.number_of_students ? parseInt(formData.number_of_students) : null,
          notes: formData.notes || null
        });

      if (error) throw error;

      toast({
        title: "Participation Confirmed!",
        description: "Your school's participation has been successfully confirmed.",
      });

      setIsSubmitted(true);
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
                Thank you for confirming your school's participation in Series {formData.series_number}. 
                Your school is now officially registered for the upcoming competition.
              </p>
              <div className="bg-card p-4 rounded-lg border mb-6">
                <h3 className="font-semibold mb-2">What's Next?</h3>
                <ul className="text-left text-sm space-y-1 text-muted-foreground">
                  <li>• Watch for announcements regarding exam dates and materials</li>
                  <li>• Prepare your students according to the series syllabus</li>
                  <li>• Check payment requirements for your series</li>
                  <li>• Contact us if you have any questions</li>
                </ul>
              </div>
              <Button onClick={() => setIsSubmitted(false)} variant="outline">
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground mb-4">
            Participation Confirmation
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Confirm your school's participation in the upcoming TASSA Socratic Series. 
            This ensures your school is officially registered for the competition.
          </p>
        </div>

        <Card className="form-section">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-6 w-6 text-primary" />
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

              <div>
                <Label htmlFor="series_number">Series Number *</Label>
                <Select 
                  value={formData.series_number.toString()} 
                  onValueChange={(value) => setFormData({...formData, series_number: parseInt(value)})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Series 1 - July</SelectItem>
                    <SelectItem value="2">Series 2 - August</SelectItem>
                    <SelectItem value="3">Series 3 - September</SelectItem>
                    <SelectItem value="4">Series 4 - October</SelectItem>
                    <SelectItem value="5">Series 5</SelectItem>
                    <SelectItem value="6">Series 6</SelectItem>
                    <SelectItem value="7">Series 7</SelectItem>
                    <SelectItem value="8">Series 8</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="confirmed_by">Confirmed By (Name) *</Label>
                  <Input
                    id="confirmed_by"
                    name="confirmed_by"
                    value={formData.confirmed_by}
                    onChange={handleInputChange}
                    placeholder="Your full name"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="number_of_students">Number of Students</Label>
                  <Input
                    id="number_of_students"
                    name="number_of_students"
                    type="number"
                    min="1"
                    value={formData.number_of_students}
                    onChange={handleInputChange}
                    placeholder="Expected participants"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Any special requirements or comments..."
                  rows={4}
                  className="mt-1"
                />
              </div>

              <Alert>
                <School className="h-4 w-4" />
                <AlertDescription>
                  By confirming participation, you acknowledge that your school will participate 
                  in the selected series and agrees to follow all TASSA guidelines and requirements.
                </AlertDescription>
              </Alert>

              <Button 
                type="submit" 
                className="w-full btn-educational" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Confirming Participation...' : 'Confirm Participation'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Information Section */}
        <Card className="mt-8 border-primary/20 bg-primary-light/10">
          <CardHeader>
            <CardTitle className="text-center">Why Confirm Participation?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center">
                  <CheckCircle className="h-4 w-4 text-success mr-2" />
                  Official Registration
                </h4>
                <p className="text-muted-foreground pl-6">
                  Ensures your school is officially registered for the competition
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center">
                  <CheckCircle className="h-4 w-4 text-success mr-2" />
                  Resource Planning
                </h4>
                <p className="text-muted-foreground pl-6">
                  Helps us prepare adequate materials and examination centers
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center">
                  <CheckCircle className="h-4 w-4 text-success mr-2" />
                  Timely Updates
                </h4>
                <p className="text-muted-foreground pl-6">
                  Receive important announcements and schedule updates
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center">
                  <CheckCircle className="h-4 w-4 text-success mr-2" />
                  Results Access
                </h4>
                <p className="text-muted-foreground pl-6">
                  Quick access to results and performance analytics
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ParticipationConfirmationPage;