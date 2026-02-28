import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Loader2, Check, Zap, Building2, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const PLAN_FEATURES: Record<string, { features: string[]; icon: any; highlight?: boolean }> = {
  starter: {
    icon: Building2,
    features: [
      "Up to 5 properties",
      "QR code tenant submission",
      "Basic request tracking",
      "Email notifications",
    ],
  },
  growth: {
    icon: Zap,
    highlight: true,
    features: [
      "Unlimited properties",
      "Priority notifications",
      "Exportable repair logs",
      "Status updates for tenants",
      "Photo uploads",
      "Everything in Starter",
    ],
  },
  pro: {
    icon: Crown,
    features: [
      "Unlimited properties",
      "Analytics dashboard",
      "Maintenance cost tracking",
      "Custom branding",
      "Everything in Growth",
    ],
  },
};

export default function Pricing() {
  const { toast } = useToast();

  const { data: plans, isLoading: plansLoading, error: plansError } = useQuery<any[]>({
    queryKey: ['/api/stripe/plans'],
    queryFn: async () => {
      const res = await fetch('/api/stripe/plans');
      if (!res.ok) throw new Error("Failed to fetch plans");
      return res.json();
    },
  });

  const { data: subData, isLoading: subLoading } = useQuery<any>({
    queryKey: ['/api/stripe/subscription'],
  });

  const checkoutMutation = useMutation({
    mutationFn: async ({ priceId, tier }: { priceId: string; tier: string }) => {
      const res = await apiRequest('POST', '/api/stripe/checkout', { priceId, tier });
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to start checkout. Please try again.", variant: "destructive" });
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/stripe/portal', {});
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to open billing portal.", variant: "destructive" });
    },
  });

  if (plansLoading || subLoading) {
    return (
      <AppLayout>
        <div className="h-[60vh] flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const currentTier = subData?.tier || 'trial';
  const hasSubscription = !!subData?.subscription;

  return (
    <AppLayout>
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">Choose Your Plan</h1>
        <p className="text-muted-foreground text-lg">All plans include a 14-day free trial. No credit card required to start.</p>
        {hasSubscription && (
          <div className="mt-4">
            <Button variant="outline" onClick={() => portalMutation.mutate()} data-testid="button-manage-billing">
              Manage Billing
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
        {(plans || []).map((plan: any) => {
          const tier = plan.product_metadata?.tier || 'starter';
          const config = PLAN_FEATURES[tier] || PLAN_FEATURES.starter;
          const Icon = config.icon;
          const price = plan.unit_amount ? (plan.unit_amount / 100) : 0;
          const isCurrentPlan = currentTier === tier && hasSubscription;

          return (
            <div
              key={plan.price_id}
              className={`
                relative bg-card rounded-2xl p-6 border flex flex-col
                ${config.highlight ? 'border-primary shadow-xl shadow-primary/10 ring-2 ring-primary/20' : 'border-border shadow-sm'}
              `}
              data-testid={`card-plan-${tier}`}
            >
              {config.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs font-bold">Most Popular</Badge>
                </div>
              )}

              <div className="mb-6">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 ${config.highlight ? 'bg-primary/10' : 'bg-muted'}`}>
                  <Icon className={`h-6 w-6 ${config.highlight ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <h3 className="text-xl font-bold">{plan.product_name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.product_description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-display font-extrabold">${price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {config.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full rounded-xl ${config.highlight ? '' : ''}`}
                variant={config.highlight ? 'default' : 'outline'}
                size="lg"
                disabled={isCurrentPlan || checkoutMutation.isPending}
                onClick={() => checkoutMutation.mutate({ priceId: plan.price_id, tier })}
                data-testid={`button-subscribe-${tier}`}
              >
                {checkoutMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {isCurrentPlan ? 'Current Plan' : 'Start Free Trial'}
              </Button>
            </div>
          );
        })}

        {(!plans || plans.length === 0) && (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">Subscription plans are being set up. Please check back shortly.</p>
          </div>
        )}
      </div>

      <div className="mt-12 text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          14-day free trial on all plans. No credit card required. Cancel anytime.
        </p>
        <p className="text-xs text-muted-foreground">
          By subscribing, you agree to our{" "}
          <a href="/terms" className="text-primary hover:underline">Terms & Conditions</a>{" "}
          and{" "}
          <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
        </p>
      </div>
    </AppLayout>
  );
}
