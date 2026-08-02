import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Users, FileText, Store, DollarSign, BarChart3, LogOut, Settings, Upload, Clock, Calendar, ShieldAlert, Award, Crown, Radar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const AdminPage = () => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      setUser(session.user);

      // Check if user has admin role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      const isAdmin = roles?.some(r => r.role === 'admin');
      if (!isAdmin) {
        toast({
          title: "Access Denied",
          description: "You need admin privileges to access this page.",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      setUserRole('admin');
      setIsLoading(false);
    };

    checkAuth();
  }, [navigate, toast]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-16 bg-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
               Admin Access Only
            </h1>
            <p className="text-muted-foreground">
              Welcome, {user?.email} | Manage your TASSA platform
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="flex items-center space-x-2">
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>

        {/* Admin Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Hall of Excellence */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/hall-of-excellence')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <span>Hall of Excellence</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Add and manage top performing students and schools
              </p>
              <Button className="w-full btn-educational">
                Manage Excellence
              </Button>
            </CardContent>
          </Card>

          {/* Payment Status */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/payments')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <span>Payment Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                View and manage school payment status for Series 1-4
              </p>
              <Button className="w-full btn-educational">
                View Payments
              </Button>
            </CardContent>
          </Card>

          {/* Store Materials */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/store')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Store className="h-5 w-5 text-primary" />
                <span>Store Materials</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Publish books, lesson notes, schemes, and lesson plans
              </p>
              <Button className="w-full btn-educational">
                Manage Store
              </Button>
            </CardContent>
          </Card>

          {/* Results Management */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/results')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span>Top Students & Schools</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Manage top 10 students and best performing schools
              </p>
              <Button className="w-full btn-educational">
                Manage Top Results
              </Button>
            </CardContent>
          </Card>

          {/* School Results Links */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/school-results')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary" />
                <span>School Results Links</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Publish Google Drive links for school results
              </p>
              <Button className="w-full btn-educational">
                Manage Links
              </Button>
            </CardContent>
          </Card>

          {/* School Management */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/schools')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <span>School Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                View all schools, add new ones, and manage payment status
              </p>
              <Button className="w-full btn-educational">
                Manage Schools
              </Button>
            </CardContent>
          </Card>

          {/* Results Submissions */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/submissions')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5 text-primary" />
                <span>Results Submissions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Review results uploaded by teachers
              </p>
              <Button className="w-full btn-educational">
                View Submissions
              </Button>
            </CardContent>
          </Card>

          {/* Contact Management */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/contact')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary" />
                <span>Contact Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                View contact messages and update information
              </p>
              <Button className="w-full btn-educational">
                View Messages
              </Button>
            </CardContent>
          </Card>

          {/* Admin Tools */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/tools')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-primary" />
                <span>Admin Tools</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Manage user roles and system settings
              </p>
              <Button className="w-full btn-educational">
                Admin Tools
              </Button>
            </CardContent>
          </Card>

          {/* Exam Countdown Settings */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/exam-settings')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-primary" />
                <span>Exam Countdown</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Manage the exam countdown timer on homepage
              </p>
              <Button className="w-full btn-educational">
                Manage Countdown
              </Button>
            </CardContent>
          </Card>

          {/* Almanac Management */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/almanac')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span>Almanac Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Manage exam schedules for Series 5, 6 & 7
              </p>
              <Button className="w-full btn-educational">
                Manage Almanac
              </Button>
            </CardContent>
          </Card>

          {/* Security Logs */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-primary/40" onClick={() => navigate('/admin/soc')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Radar className="h-5 w-5 text-primary" />
                <span>Security Operations Center</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Live threat feed, attack analytics, alerts and log export
              </p>
              <Button className="w-full btn-educational">
                Open SOC Dashboard
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/security-logs')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ShieldAlert className="h-5 w-5 text-primary" />
                <span>Security Logs</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Monitor brute force, SQL injection & security events
              </p>
              <Button className="w-full btn-educational">
                View Security Logs
              </Button>
            </CardContent>
          </Card>

          {/* Certificate Generator */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/certificates')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-primary" />
                <span>Certificates & IDs</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Generate certificates for teachers, schools & staff IDs
              </p>
              <Button className="w-full btn-educational">
                Generate Certificates
              </Button>
            </CardContent>
          </Card>

          {/* Academic Secretariat */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/secretariat')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Crown className="h-5 w-5 text-primary" />
                <span>Academic Secretariat</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Manage committee members, chairperson & leadership groups
              </p>
              <Button className="w-full btn-educational">
                Manage Committees
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <h3 className="text-2xl font-bold text-primary">0</h3>
              <p className="text-sm text-muted-foreground">Total Schools</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <h3 className="text-2xl font-bold text-primary">0</h3>
              <p className="text-sm text-muted-foreground">Confirmed Participations</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <h3 className="text-2xl font-bold text-primary">0</h3>
              <p className="text-sm text-muted-foreground">Published Results</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <h3 className="text-2xl font-bold text-primary">0</h3>
              <p className="text-sm text-muted-foreground">Top Achievers</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
