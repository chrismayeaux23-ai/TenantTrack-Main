import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Loader2, CreditCard, Shield, ExternalLink, Crown, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useSubscription } from "@/hooks/use-subscription";

export default function Billing() {
  const { toast } = useToast();
  const { tier, tierLabel, hasSubscription, isLoading: subLoading } = useSubscription();

  const { data: profile, isLoading: profileLoading } = useQuery<any>({
    queryKey: ["/api/profile"],
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe/portal", {});
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
    onError: (err: any) => {
      if (err.message?.includes("No billing account")) {
        toast({ title: "No billing account", description: "Subscribe to a plan first to manage billing.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: "Failed to open billing portal.", variant: "destructive" });
      }
    },
  });

  if (subLoading || profileLoading) {
    return (
      <AppLayout>
        <div className="h-[60vh] flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-2">Manage your subscription, payment methods, and invoices.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-4xl">
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Current Plan</h2>
              <Badge variant={tier === "trial" ? "outline" : "default"} data-testid="badge-current-plan">
                {tierLabel}
              </Badge>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <PlanFeature label="QR Code Submissions" included />
            <PlanFeature label="Request Tracking" included />
            <PlanFeature label="Staff Assignment" included={tier === "growth" || tier === "pro"} />
            <PlanFeature label="Analytics Dashboard" included={tier === "pro"} />
            <PlanFeature label="Custom Branding" included={tier === "pro"} />
          </div>

          {tier === "trial" && (
            <Button className="w-full rounded-xl" size="lg" onClick={() => window.location.href = "/pricing"} data-testid="button-upgrade-plan">
              Upgrade Plan
            </Button>
          )}
          {hasSubscription && (
            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isPending}
              data-testid="button-change-plan"
            >
              {portalMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Change Plan
            </Button>
          )}
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Payment & Invoices</h2>
              <p className="text-sm text-muted-foreground">Manage payment methods and view invoices</p>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-between rounded-xl"
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isPending || !hasSubscription}
              data-testid="button-manage-payment"
            >
              <span className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Manage Payment Methods
              </span>
              <ExternalLink className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between rounded-xl"
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isPending || !hasSubscription}
              data-testid="button-view-invoices"
            >
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                View Invoices & Receipts
              </span>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>

          {!hasSubscription && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Subscribe to a plan to manage payment methods.
            </p>
          )}
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-bold">Security & Data Protection</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="text-center p-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-medium">SSL Encrypted</p>
              <p className="text-xs text-muted-foreground">All data encrypted in transit</p>
            </div>
            <div className="text-center p-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-medium">Stripe Secure</p>
              <p className="text-xs text-muted-foreground">PCI-compliant payments</p>
            </div>
            <div className="text-center p-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-medium">Data Isolated</p>
              <p className="text-xs text-muted-foreground">Your data is never shared</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function PlanFeature({ label, included }: { label: string; included: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <CheckCircle className={`h-4 w-4 ${included ? "text-primary" : "text-muted-foreground/30"}`} />
      <span className={included ? "text-foreground" : "text-muted-foreground/50 line-through"}>{label}</span>
    </div>
  );
}
