import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useProperties } from "@/hooks/use-properties";
import { Loader2 } from "lucide-react";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Properties from "@/pages/Properties";
import TenantReport from "@/pages/TenantReport";
import PrintFlyer from "@/pages/PrintFlyer";
import Pricing from "@/pages/Pricing";
import Staff from "@/pages/Staff";
import TrackRequest from "@/pages/TrackRequest";
import Profile from "@/pages/Profile";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Tenants from "@/pages/Tenants";
import Billing from "@/pages/Billing";
import CostTracking from "@/pages/CostTracking";
import RecurringMaintenance from "@/pages/RecurringMaintenance";
import Features from "@/pages/Features";
import Vendors from "@/pages/Vendors";
import VendorDetail from "@/pages/VendorDetail";
import Analytics from "@/pages/Analytics";
import RequestDetail from "@/pages/RequestDetail";
import Onboarding from "@/pages/Onboarding";
import VendorPortal from "@/pages/VendorPortal";
import DispatchBoard from "@/pages/DispatchBoard";
import Schedule from "@/pages/Schedule";
import Guide from "@/pages/Guide";
import VerifyEmail from "@/pages/VerifyEmail";
import ResetPassword from "@/pages/ResetPassword";
import { HelpChatbot } from "@/components/HelpChatbot";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  return <Component />;
}

function OnboardingGuard({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: properties, isLoading: propsLoading } = useProperties();
  const [location] = useLocation();

  if (authLoading || (isAuthenticated && propsLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  const skipOnboarding = localStorage.getItem("onboarding_complete") === "true";
  const hasProperties = properties && properties.length > 0;

  if (!hasProperties && !skipOnboarding && location !== "/onboarding") {
    return <Redirect to="/onboarding" />;
  }

  return <Component />;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/report/:propertyId" component={TenantReport} />
      <Route path="/track/:code" component={TrackRequest} />
      <Route path="/track" component={TrackRequest} />
      <Route path="/vendor-portal/:token" component={VendorPortal} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/features" component={Features} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/guide" component={Guide} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/reset-password" component={ResetPassword} />

      <Route path="/flyer/:propertyId">
        <ProtectedRoute component={PrintFlyer} />
      </Route>

      <Route path="/">
        {isAuthenticated ? <Dashboard /> : <Landing />}
      </Route>

      <Route path="/onboarding">
        <ProtectedRoute component={Onboarding} />
      </Route>

      <Route path="/dashboard">
        <OnboardingGuard component={Dashboard} />
      </Route>

      <Route path="/properties">
        <OnboardingGuard component={Properties} />
      </Route>

      <Route path="/tenants">
        <OnboardingGuard component={Tenants} />
      </Route>

      <Route path="/staff">
        <OnboardingGuard component={Staff} />
      </Route>

      <Route path="/billing">
        <OnboardingGuard component={Billing} />
      </Route>

      <Route path="/costs">
        <OnboardingGuard component={CostTracking} />
      </Route>

      <Route path="/scheduled">
        <OnboardingGuard component={RecurringMaintenance} />
      </Route>

      <Route path="/vendors/:id">
        <OnboardingGuard component={VendorDetail} />
      </Route>

      <Route path="/vendors">
        <OnboardingGuard component={Vendors} />
      </Route>

      <Route path="/analytics">
        <OnboardingGuard component={Analytics} />
      </Route>

      <Route path="/dispatch">
        <OnboardingGuard component={DispatchBoard} />
      </Route>

      <Route path="/schedule">
        <OnboardingGuard component={Schedule} />
      </Route>

      <Route path="/requests/:id">
        <OnboardingGuard component={RequestDetail} />
      </Route>

      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <HelpChatbot />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
