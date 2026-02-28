import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

// Pages
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
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

// Protected Route Wrapper
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
    // Replit Auth standard redirects to Landing/Login
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
      {/* Public Tenant Route - Open to anyone with the QR code */}
      <Route path="/report/:propertyId" component={TenantReport} />
      
      {/* Public Tracking Route */}
      <Route path="/track/:code" component={TrackRequest} />
      <Route path="/track" component={TrackRequest} />
      
      {/* Printable Flyer Route */}
      <Route path="/flyer/:propertyId">
        <ProtectedRoute component={PrintFlyer} />
      </Route>
      
      {/* Root handling based on auth state */}
      <Route path="/">
        {isAuthenticated ? <Dashboard /> : <Landing />}
      </Route>

      {/* Protected Landlord Routes */}
      <Route path="/properties">
        <ProtectedRoute component={Properties} />
      </Route>
      
      <Route path="/staff">
        <ProtectedRoute component={Staff} />
      </Route>

      <Route path="/pricing">
        <ProtectedRoute component={Pricing} />
      </Route>

      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>

      {/* Public Legal Pages */}
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />

      {/* Fallback */}
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
