import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TopNav } from "@/components/TopNav";
import { SiteFooter } from "@/components/SiteFooter";
import { ScrollProgress } from "@/components/ScrollProgress";
import { ContactNoticePopup } from "@/components/ContactNoticePopup";
import CertificateGeneratorPage from './pages/admin/CertificateGeneratorPage';
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ResultsPage from "./pages/ResultsPage";
import ResultsSubmissionPage from "./pages/ResultsSubmissionPage";
import RegistrationPage from "./pages/RegistrationPage";
import RegisteredSchoolsPage from "./pages/RegisteredSchoolsPage";
import PaymentStatusPage from "./pages/PaymentStatusPage";
import ParticipationPage from "./pages/ParticipationPage";
import ParticipationConfirmationPage from "./pages/ParticipationConfirmationPage";
import ContactPage from "./pages/ContactPage";
import StorePage from "./pages/StorePage";
import AlmanacPage from "./pages/AlmanacPage";
import LegalPage from "./pages/LegalPage";
import AdminPaymentStatusPage from './pages/admin/PaymentStatusPage';
import StoreMaterialsPage from './pages/admin/StoreMaterialsPage';
import HallOfExcellenceManagementPage from './pages/admin/HallOfExcellenceManagementPage';
import ResultsManagementPage from './pages/admin/ResultsManagementPage';
import SchoolResultsManagementPage from './pages/admin/SchoolResultsManagementPage';
import ResultsSubmissionsPage from './pages/admin/ResultsSubmissionsPage';
import AdminToolsPage from './pages/admin/AdminToolsPage';
import SchoolManagementPage from './pages/admin/SchoolManagementPage';
import ExamSettingsPage from './pages/admin/ExamSettingsPage';
import AlmanacManagementPage from './pages/admin/AlmanacManagementPage';
import SecurityLogsPage from './pages/admin/SecurityLogsPage';
import SecretariatManagementPage from './pages/admin/SecretariatManagementPage';
import AdminPage from "./pages/AdminPage";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="flex flex-col min-h-[100dvh] bg-background">
            <ScrollProgress />
            <TopNav />
            <ContactNoticePopup />
            <main className="flex flex-1 flex-col">
              <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/submit-results" element={<ResultsSubmissionPage />} />
              <Route path="/registration" element={<RegistrationPage />} />
              <Route path="/registered-schools" element={<RegisteredSchoolsPage />} />
              <Route path="/payment-status" element={<PaymentStatusPage />} />
              <Route path="/participation" element={<ParticipationPage />} />
              <Route path="/participation-confirmation" element={<ParticipationConfirmationPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/store" element={<StorePage />} />
              <Route path="/almanac" element={<AlmanacPage />} />
              <Route path="/legal" element={<LegalPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/payments" element={<AdminPaymentStatusPage />} />
              <Route path="/admin/store" element={<StoreMaterialsPage />} />
              <Route path="/admin/hall-of-excellence" element={<HallOfExcellenceManagementPage />} />
              <Route path="/admin/results" element={<ResultsManagementPage />} />
              <Route path="/admin/school-results" element={<SchoolResultsManagementPage />} />
              <Route path="/admin/submissions" element={<ResultsSubmissionsPage />} />
              <Route path="/admin/tools" element={<AdminToolsPage />} />
              <Route path="/admin/schools" element={<SchoolManagementPage />} />
              <Route path="/admin/exam-settings" element={<ExamSettingsPage />} />
              <Route path="/admin/almanac" element={<AlmanacManagementPage />} />
              <Route path="/admin/security-logs" element={<SecurityLogsPage />} />
              <Route path="/admin/certificates" element={<CertificateGeneratorPage />} />
              <Route path="/admin/secretariat" element={<SecretariatManagementPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <div className="mt-auto">
              <SiteFooter />
            </div>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
