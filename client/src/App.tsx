import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { ProtectedRoute, AdminProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { CompanySettingsProvider } from "./hooks/use-company-settings";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import JobsPage from "@/pages/jobs-page";
import VehicleInspectionPage from "@/pages/vehicle-inspection-page";
import InvoicePage from "@/pages/invoice-page";
import CustomersPage from "@/pages/customers-page";
import StaffPage from "@/pages/staff-page";
import ReportsPage from "@/pages/reports-page";
import SettingsPage from "@/pages/settings-page";
import ProfilePage from "@/pages/profile-page";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/jobs" component={JobsPage} />
      <ProtectedRoute path="/vehicle-inspections" component={VehicleInspectionPage} />
      <ProtectedRoute path="/vehicle-inspections/:jobId" component={VehicleInspectionPage} />
      <ProtectedRoute path="/invoices" component={InvoicePage} />
      <ProtectedRoute path="/invoices/:id" component={InvoicePage} />
      <ProtectedRoute path="/customers" component={CustomersPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      
      {/* Admin-only routes */}
      <AdminProtectedRoute path="/staff" component={StaffPage} />
      <AdminProtectedRoute path="/reports" component={ReportsPage} />
      <AdminProtectedRoute path="/settings" component={SettingsPage} />
      
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CompanySettingsProvider>
          <Router />
          <Toaster />
        </CompanySettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
