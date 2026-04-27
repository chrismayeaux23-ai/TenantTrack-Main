import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Loader2, Check, Zap, Building2, Crown, X, ArrowLeft, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import logoPng from "@assets/tenanttrack-final-logo.png";
import bgFeatures2 from "@assets/featurespricingsection2_1774750600095.jpg";
import bgSaas from "@assets/A_dark,_high-end_SaaS_background_with_a_deep_navy_blue_to_blac_1774750600093.jpg";

const PLANS = [
  {
    tier: "starter",
    name: "Starter",
    description: "For small landlords managing 1–5 units",
    price: 29,
    icon: Building2,
    color: "text-primary",
    bg: "bg-primary/10",
    features: [
      { label: "QR maintenance system", included: true },
      { label: "Tenant request portal", included: true },
      { label: "Email notifications", included: true },
      { label: "Photo uploads", included: true },
      { label: "Up to 5 properties", included: true },
      { label: "Priority request highlighting", included: false },
      { label: "Vendor trust scores", included: false },
      { label: "Analytics & reporting", included: false },
      { label: "Staff assignment", included: false },
      { label: "Priority support", included: false },
    ],
  },
  {
    tier: "growth",
    name: "Growth",
    description: "For landlords managing 6–25 units",
    price: 59,
    icon: Zap,
    highlight: true,
    color: "text-primary",
    bg: "bg-primary/10",
    features: [
      { label: "Everything in Starter", included: true },
      { label: "Unlimited properties", included: true },
      { label: "Priority request highlighting", included: true },
      { label: "Vendor trust scores (0–100)", included: true },
      { label: "Vendor dispatch & tracking", included: true },
      { label: "Staff assignment", included: true },
      { label: "Job history & proof of completion", included: true },
      { label: "Analytics & reporting", included: false },
      { label: "Cost tracking", included: false },
      { label: "Priority support", included: false },
    ],
  },
  {
    tier: "pro",
    name: "Pro",
    description: "For professional landlords with 25+ units",
    price: 99,
    icon: Crown,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    features: [
      { label: "Everything in Growth", included: true },
      { label: "Advanced analytics & reporting", included: true },
      { label: "Cost tracking & exports", included: true },
      { label: "Scheduled recurring maintenance", included: true },
      { label: "Early access to new features", included: true },
      { label: "Priority support", included: true },
      { label: "Dedicated onboarding call", included: true },
      { label: "Custom integrations (on request)", included: true },
      { label: "", included: true },
      { label: "", included: true },
    ],
  },
];

export default function Pricing() {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

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
    enabled: isAuthenticated,
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

  const stripePriceMap = new Map<string, string>();
  if (stripePlans?.length) {
    for (const p of stripePlans) {
      const t = p.product_metadata?.tier;
      if (t && p.price_id) stripePriceMap.set(t, p.price_id);
    }
  }

  const currentTier = subData?.tier || "trial";
  const hasSubscription = !!subData?.subscription;

  const handlePlanClick = (tier: string) => {
    if (!isAuthenticated) {
      window.location.href = "/login?signup=1";
      return;
    }
    const priceId = stripePriceMap.get(tier);
    if (priceId) {
      checkoutMutation.mutate({ priceId, tier });
    } else {
      toast({ title: "Coming Soon", description: "This plan is not yet available for checkout.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute top-0 left-0 right-0 h-[600px] -z-10 overflow-hidden">
        <img src={bgFeatures2} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
      </div>
      {/* Nav */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src={logoPng} alt="TenantTrack" className="h-8 w-8 rounded-lg object-contain" />
            <span className="font-display font-bold text-lg text-foreground">TenantTrack</span>
          </Link>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button variant="outline" size="sm" onClick={() => window.location.href = "/dashboard"}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => window.location.href = "/login"}>
                  Log in
                </Button>
                <Button size="sm" className="rounded-full gap-1" onClick={() => window.location.href = "/login?signup=1"}>
                  Start Free Trial
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 text-sm px-4 py-1">Pricing</Badge>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-foreground mb-4">
            Simple, honest pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Try any plan free for 14 days. No credit card required. Cancel anytime.
          </p>
          {hasSubscription && (
            <div className="mt-6">
              <Button
                variant="outline"
                onClick={() => portalMutation.mutate()}
                disabled={portalMutation.isPending}
                data-testid="button-manage-billing"
              >
                {portalMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Manage Billing
              </Button>
            </div>
          )}
        </div>

        {/* Plan Cards */}
        {subLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              const isCurrentPlan = isAuthenticated && currentTier === plan.tier && hasSubscription;
              const priceId = stripePriceMap.get(plan.tier);
              const canCheckout = !isAuthenticated || !!priceId;

              return (
                <div
                  key={plan.tier}
                  className={`relative bg-card rounded-3xl p-7 border flex flex-col transition-all ${
                    plan.highlight
                      ? "border-primary shadow-2xl shadow-primary/10 ring-2 ring-primary/20 scale-[1.02]"
                      : "border-border shadow-sm hover:border-border/80 hover:shadow-md"
                  }`}
                  data-testid={`card-plan-${plan.tier}`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs font-bold shadow">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <div className="mb-6">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-4 ${plan.bg}`}>
                      <Icon className={`h-6 w-6 ${plan.color}`} />
                    </div>
                    <h3 className="text-xl font-display font-bold text-foreground">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                  </div>

                  <div className="mb-7">
                    <div className="flex items-end gap-1">
                      <span className="text-5xl font-display font-extrabold text-foreground">${plan.price}</span>
                      <span className="text-muted-foreground mb-1.5">/month</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">after 14-day free trial</p>
                  </div>

                  <ul className="space-y-2.5 mb-8 flex-1">
                    {plan.features.filter(f => f.label).map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        {feature.included ? (
                          <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/25 mt-0.5 shrink-0" />
                        )}
                        <span className={feature.included ? "text-foreground" : "text-muted-foreground/40"}>
                          {feature.label}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full rounded-xl"
                    variant={plan.highlight ? "default" : "outline"}
                    size="lg"
                    disabled={isCurrentPlan || checkoutMutation.isPending || !canCheckout}
                    onClick={() => handlePlanClick(plan.tier)}
                    data-testid={`button-subscribe-${plan.tier}`}
                  >
                    {checkoutMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {isCurrentPlan ? "Current Plan" : !canCheckout && isAuthenticated ? "Coming Soon" : "Start Free Trial"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Trust row */}
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 py-8 border-y border-border mb-12 text-sm text-muted-foreground">
          {[
            "No credit card to start",
            "Cancel anytime",
            "Your data is always yours",
            "SOC 2 compliant infrastructure",
            "Instant setup — no IT required",
          ].map(item => (
            <div key={item} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-display font-bold text-foreground text-center mb-8">Pricing FAQ</h2>
          <div className="space-y-4">
            {[
              {
                q: "What happens after the trial ends?",
                a: "After 14 days, you'll be prompted to subscribe. If you don't, your account is paused — your data stays safe and nothing is deleted.",
              },
              {
                q: "Can I switch plans?",
                a: "Yes. Upgrade or downgrade anytime from the Billing section. Changes take effect immediately and are prorated.",
              },
              {
                q: "Is there a per-unit fee?",
                a: "No. Plans are flat monthly rates — not per unit. Whether you have 5 or 50 units, you pay the same plan price.",
              },
              {
                q: "Do you offer annual billing?",
                a: "Annual billing with a discount is coming soon. Get in touch if you'd like early access to an annual plan.",
              },
            ].map((item, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-5">
                <p className="font-semibold text-foreground text-sm mb-2">{item.q}</p>
                <p className="text-sm text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 py-12 bg-gradient-to-br from-primary/10 to-orange-500/5 rounded-3xl border border-primary/20 px-8 relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <img src={bgSaas} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15 rounded-3xl" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">
              Ready to bring order to your maintenance chaos?
            </h2>
            <p className="text-muted-foreground mb-6">Start your free 14-day trial — no credit card, no setup fees.</p>
            <Button
              size="lg"
              className="rounded-full px-10 gap-2 text-base shadow-lg shadow-primary/20"
              onClick={() => window.location.href = isAuthenticated ? "/dashboard" : "/login?signup=1"}
              data-testid="button-cta-pricing-bottom"
            >
              {isAuthenticated ? "Go to Dashboard" : "Start Free Trial"}
              <ArrowRight className="h-5 w-5" />
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Questions? Email us at{" "}
              <a href="mailto:support@tenant-track.com" className="text-primary hover:underline">
                support@tenant-track.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
