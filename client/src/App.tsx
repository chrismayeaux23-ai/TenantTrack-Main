import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
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
      
      <Route path="/flyer/:propertyId">
        <ProtectedRoute component={PrintFlyer} />
      </Route>
      
      <Route path="/">
        {isAuthenticated ? <Dashboard /> : <Landing />}
      </Route>

      <Route path="/properties">
        <ProtectedRoute component={Properties} />
      </Route>
      
      <Route path="/tenants">
        <ProtectedRoute component={Tenants} />
      </Route>

      <Route path="/staff">
        <ProtectedRoute component={Staff} />
      </Route>

      <Route path="/billing">
        <ProtectedRoute component={Billing} />
      </Route>

      <Route path="/costs">
        <ProtectedRoute component={CostTracking} />
      </Route>

      <Route path="/scheduled">
        <ProtectedRoute component={RecurringMaintenance} />
      </Route>

      <Route path="/vendors">
        <ProtectedRoute component={Vendors} />
      </Route>

      <Route path="/pricing">
        <ProtectedRoute component={Pricing} />
      </Route>

      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>

      <Route path="/features" component={Features} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />

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
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
