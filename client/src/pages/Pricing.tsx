import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Loader2, Check, Zap, Building2, Crown, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const HARDCODED_PLANS = [
  {
    tier: "starter",
    name: "Starter Package",
    description: "Up to 5 properties. Includes QR tenant submission and basic request tracking.",
    price: 19,
    icon: Building2,
    features: [
      { label: "Up to 5 properties", included: true },
      { label: "QR code tenant submission", included: true },
      { label: "Basic request tracking", included: true },
      { label: "Email notifications", included: true },
      { label: "Photo uploads", included: true },
      { label: "Staff assignment", included: false },
      { label: "Analytics dashboard", included: false },
      { label: "Custom branding", included: false },
    ],
  },
  {
    tier: "growth",
    name: "Growth Package",
    description: "Unlimited properties with staff management and export tools.",
    price: 39,
    icon: Zap,
    highlight: true,
    features: [
      { label: "Unlimited properties", included: true },
      { label: "QR code tenant submission", included: true },
      { label: "Advanced request tracking", included: true },
      { label: "Priority notifications", included: true },
      { label: "Photo uploads", included: true },
      { label: "Staff assignment", included: true },
      { label: "Exportable repair logs", included: true },
      { label: "Custom branding", included: false },
    ],
  },
  {
    tier: "pro",
    name: "Pro Package",
    description: "Everything you need to manage maintenance at scale.",
    price: 59,
    icon: Crown,
    features: [
      { label: "Unlimited properties", included: true },
      { label: "QR code tenant submission", included: true },
      { label: "Advanced request tracking", included: true },
      { label: "Priority notifications", included: true },
      { label: "Photo uploads", included: true },
      { label: "Staff assignment", included: true },
      { label: "Exportable repair logs", included: true },
      { label: "Analytics dashboard", included: true },
      { label: "Custom branding", included: true },
    ],
  },
];

export default function Pricing() {
  const { toast } = useToast();

  const { data: stripePlans } = useQuery<any[]>({
    queryKey: ["/api/stripe/plans"],
    queryFn: async () => {
      const res = await fetch("/api/stripe/plans");
      if (!res.ok) throw new Error("Failed to fetch plans");
      return res.json();
    },
  });

  const { data: subData, isLoading: subLoading } = useQuery<any>({
    queryKey: ["/api/stripe/subscription"],
  });

  const checkoutMutation = useMutation({
    mutationFn: async ({ priceId, tier }: { priceId: string; tier: string }) => {
      const res = await apiRequest("POST", "/api/stripe/checkout", { priceId, tier });
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to start checkout. Please try again.", variant: "destructive" });
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe/portal", {});
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to open billing portal.", variant: "destructive" });
    },
  });

  if (subLoading) {
    return (
      <AppLayout>
        <div className="h-[60vh] flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const currentTier = subData?.tier || "trial";
  const hasSubscription = !!subData?.subscription;

  const stripePriceMap = new Map<string, string>();
  if (stripePlans?.length) {
    for (const p of stripePlans) {
      const t = p.product_metadata?.tier;
      if (t && p.price_id) stripePriceMap.set(t, p.price_id);
    }
  }

  return (
    <AppLayout>
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">Choose Your Plan</h1>
        <p className="text-muted-foreground text-lg">
          All plans include a 14-day free trial. No credit card required to start.
        </p>
        {hasSubscription && (
          <div className="mt-4">
            <Button variant="outline" onClick={() => portalMutation.mutate()} data-testid="button-manage-billing">
              Manage Billing
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
        {HARDCODED_PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrentPlan = currentTier === plan.tier && hasSubscription;
          const priceId = stripePriceMap.get(plan.tier);
          const canCheckout = !!priceId;

          return (
            <div
              key={plan.tier}
              className={`
                relative bg-card rounded-2xl p-6 border flex flex-col
                ${plan.highlight ? "border-primary shadow-xl shadow-primary/10 ring-2 ring-primary/20" : "border-border shadow-sm"}
              `}
              data-testid={`card-plan-${plan.tier}`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs font-bold">
                    Most Popular
                  </Badge>
                </div>
              )}

              <div className="mb-6">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 ${plan.highlight ? "bg-primary/10" : "bg-muted"}`}>
                  <Icon className={`h-6 w-6 ${plan.highlight ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-display font-extrabold">${plan.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    {feature.included ? (
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/30 mt-0.5 shrink-0" />
                    )}
                    <span className={feature.included ? "" : "text-muted-foreground/50"}>{feature.label}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full rounded-xl"
                variant={plan.highlight ? "default" : "outline"}
                size="lg"
                disabled={isCurrentPlan || checkoutMutation.isPending || !canCheckout}
                onClick={() => {
                  if (priceId) checkoutMutation.mutate({ priceId, tier: plan.tier });
                }}
                data-testid={`button-subscribe-${plan.tier}`}
              >
                {checkoutMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {isCurrentPlan ? "Current Plan" : !canCheckout ? "Coming Soon" : "Start Free Trial"}
              </Button>
            </div>
          );
        })}
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
