import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Loader2, CreditCard, Shield, ExternalLink, Crown,
  Check, X, Zap, Building2, ArrowRight, AlertTriangle, Lock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useSubscription, PLAN_CONFIG } from "@/hooks/use-subscription";
import { useProperties } from "@/hooks/use-properties";
import { useVendors } from "@/hooks/use-vendors";

const PLANS = [
  {
    tier: "starter" as const,
    icon: Building2,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    features: [
      "Up to 5 properties",
      "QR maintenance system",
      "Tenant request portal",
      "Email notifications",
      "Photo uploads",
    ],
    missing: [
      "Vendor trust scores",
      "Staff assignment",
      "Analytics & reporting",
      "Cost tracking",
    ],
  },
  {
    tier: "growth" as const,
    icon: Zap,
    highlight: true,
    color: "text-primary",
    bg: "bg-primary/10",
    features: [
      "Up to 25 properties",
      "Everything in Starter",
      "Vendor trust scores (0–100)",
      "Staff assignment & dispatch",
      "Job history & proof of completion",
      "Cost tracking",
      "Priority request highlighting",
    ],
    missing: [
      "Advanced analytics",
      "Scheduled maintenance",
      "Priority support",
    ],
  },
  {
    tier: "pro" as const,
    icon: Crown,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    features: [
      "Unlimited properties",
      "Everything in Growth",
      "Advanced analytics",
      "Scheduled maintenance",
      "Priority support",
      "Export & reporting tools",
      "Early feature access",
    ],
    missing: [],
  },
];

export default function Billing() {
  const { toast } = useToast();
  const { tier, tierLabel, hasSubscription, trialDaysRemaining, trialExpired, usagePercent, limits, isLoading: subLoading } = useSubscription();
  const { data: properties } = useProperties();
  const { data: vendors } = useVendors();

  const { data: stripePlans } = useQuery<any[]>({
    queryKey: ["/api/stripe/plans"],
    queryFn: async () => {
      const res = await fetch("/api/stripe/plans");
      if (!res.ok) throw new Error();
      return res.json();
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe/portal", {});
      return await res.json();
    },
    onSuccess: (data) => { if (data.url) window.location.href = data.url; },
    onError: () => toast({ title: "Error", description: "Failed to open billing portal.", variant: "destructive" }),
  });

  const checkoutMutation = useMutation({
    mutationFn: async ({ priceId, tier }: { priceId: string; tier: string }) => {
      const res = await apiRequest("POST", "/api/stripe/checkout", { priceId, tier });
      return await res.json();
    },
    onSuccess: (data) => { if (data.url) window.location.href = data.url; },
    onError: () => toast({ title: "Error", description: "Failed to start checkout.", variant: "destructive" }),
  });

  const stripePriceMap = new Map<string, string>();
  if (stripePlans?.length) {
    for (const p of stripePlans) {
      const t = p.product_metadata?.tier;
      if (t && p.price_id) stripePriceMap.set(t, p.price_id);
    }
  }

  const propertyCount = properties?.length ?? 0;
  const vendorCount = vendors?.length ?? 0;

  if (subLoading) {
    return (
      <AppLayout>
        <div className="h-[60vh] flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const isTrial = tier === "trial" && !hasSubscription;

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">Billing & Plan</h1>
        <p className="text-muted-foreground mt-1">Manage your subscription, usage, and payment settings.</p>
      </div>

      <div className="space-y-6 max-w-5xl">

        {/* Trial / Current plan header */}
        {isTrial && (
          <div className={`rounded-2xl border p-6 ${trialExpired
            ? "bg-red-950/30 border-red-500/30"
            : trialDaysRemaining <= 3
              ? "bg-primary/8 border-primary/30"
              : "bg-card border-border"
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${trialExpired ? "bg-red-500/20" : "bg-primary/15"}`}>
                  {trialExpired ? <AlertTriangle className="h-6 w-6 text-red-400" /> : <Zap className="h-6 w-6 text-primary" />}
                </div>
                <div>
                  {trialExpired ? (
                    <>
                      <h2 className="font-display font-bold text-foreground">Your free trial has ended</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">Subscribe to continue accessing TenantTrack. Your data is safe.</p>
                    </>
                  ) : (
                    <>
                      <h2 className="font-display font-bold text-foreground">
                        {trialDaysRemaining} day{trialDaysRemaining !== 1 ? "s" : ""} left in your free trial
                      </h2>
                      <p className="text-sm text-muted-foreground mt-0.5">No credit card required. Subscribe anytime to unlock full features.</p>
                    </>
                  )}
                </div>
              </div>
              <Button className="shrink-0 rounded-xl gap-2" onClick={() => window.location.href = "/pricing"} data-testid="button-start-subscription">
                <Zap className="h-4 w-4" />
                {trialExpired ? "Choose a Plan" : "Start Subscription"}
              </Button>
            </div>

            {!trialExpired && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Trial progress</span>
                  <span>{14 - trialDaysRemaining} of 14 days used</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min(100, ((14 - trialDaysRemaining) / 14) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Active subscription header */}
        {hasSubscription && (
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="font-display font-bold text-foreground">{tierLabel} Plan</h2>
                  <Badge variant="default" data-testid="badge-current-plan">{tierLabel}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">${PLAN_CONFIG[tier]?.price ?? 0}/month · Active subscription</p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" className="rounded-xl" onClick={() => portalMutation.mutate()} disabled={portalMutation.isPending} data-testid="button-manage-billing">
                {portalMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Manage Billing
              </Button>
            </div>
          </div>
        )}

        {/* Usage Meters */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-base font-display font-bold text-foreground mb-5">Plan Usage</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <UsageMeter
              label="Properties"
              current={propertyCount}
              max={limits.maxProperties}
              percent={usagePercent("properties", propertyCount)}
            />
            <UsageMeter
              label="Vendors"
              current={vendorCount}
              max={limits.maxVendors}
              percent={usagePercent("vendors", vendorCount)}
            />
            <FeatureStatus label="Vendor Trust Scores" enabled={limits.vendorTrustScores} requiredPlan="Growth" />
            <FeatureStatus label="Analytics & Reporting" enabled={limits.analytics} requiredPlan="Pro" />
            <FeatureStatus label="Cost Tracking" enabled={limits.costTracking} requiredPlan="Growth" />
            <FeatureStatus label="Scheduled Maintenance" enabled={limits.scheduledMaintenance} requiredPlan="Pro" />
          </div>
        </div>

        {/* Plan comparison cards */}
        {!hasSubscription || tier !== "pro" ? (
          <div>
            <h2 className="text-base font-display font-bold text-foreground mb-4">
              {hasSubscription ? "Upgrade Your Plan" : "Choose a Plan"}
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {PLANS.map((plan) => {
                const Icon = plan.icon;
                const config = PLAN_CONFIG[plan.tier];
                const isCurrentPlan = tier === plan.tier && hasSubscription;
                const priceId = stripePriceMap.get(plan.tier);

                return (
                  <div
                    key={plan.tier}
                    className={`relative bg-card rounded-2xl border flex flex-col p-5 transition-all ${
                      plan.highlight
                        ? "border-primary shadow-xl shadow-primary/10 ring-1 ring-primary/20"
                        : isCurrentPlan
                          ? "border-border/80"
                          : "border-border"
                    }`}
                    data-testid={`card-plan-${plan.tier}`}
                  >
                    {plan.highlight && !isCurrentPlan && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground text-xs px-3 py-0.5">Most Popular</Badge>
                      </div>
                    )}
                    {isCurrentPlan && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge variant="outline" className="text-xs px-3 py-0.5 bg-card">Current Plan</Badge>
                      </div>
                    )}

                    <div className="mb-4">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center mb-3 ${plan.bg}`}>
                        <Icon className={`h-4.5 w-4.5 ${plan.color}`} />
                      </div>
                      <p className="font-display font-bold text-foreground text-base">{config.label}</p>
                      <div className="flex items-end gap-1 mt-1">
                        <span className="text-2xl font-display font-extrabold">${config.price}</span>
                        <span className="text-sm text-muted-foreground mb-0.5">/mo</span>
                      </div>
                    </div>

                    <ul className="space-y-2 mb-5 flex-1">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-1.5 text-xs">
                          <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                          <span className="text-foreground/80">{f}</span>
                        </li>
                      ))}
                      {plan.missing.map(f => (
                        <li key={f} className="flex items-start gap-1.5 text-xs">
                          <X className="h-3.5 w-3.5 text-muted-foreground/25 mt-0.5 shrink-0" />
                          <span className="text-muted-foreground/35">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="w-full rounded-xl"
                      variant={plan.highlight && !isCurrentPlan ? "default" : "outline"}
                      size="sm"
                      disabled={isCurrentPlan || checkoutMutation.isPending || (!priceId && hasSubscription)}
                      onClick={() => {
                        if (!hasSubscription && !priceId) {
                          window.location.href = "/pricing";
                        } else if (priceId && !isCurrentPlan) {
                          checkoutMutation.mutate({ priceId, tier: plan.tier });
                        } else if (hasSubscription) {
                          portalMutation.mutate();
                        }
                      }}
                      data-testid={`button-plan-${plan.tier}`}
                    >
                      {checkoutMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                      {isCurrentPlan ? "Current Plan" : hasSubscription ? "Switch Plan" : "Start Free Trial"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Payment & invoices */}
        {hasSubscription && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-base font-display font-bold mb-4">Payment & Invoices</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <Button variant="outline" className="w-full justify-between rounded-xl" onClick={() => portalMutation.mutate()} disabled={portalMutation.isPending} data-testid="button-manage-payment">
                <span className="flex items-center gap-2 text-sm"><CreditCard className="h-4 w-4" /> Payment Methods</span>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button variant="outline" className="w-full justify-between rounded-xl" onClick={() => portalMutation.mutate()} disabled={portalMutation.isPending} data-testid="button-view-invoices">
                <span className="flex items-center gap-2 text-sm"><Shield className="h-4 w-4" /> Invoices & Receipts</span>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        )}

        {/* Security */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-base font-display font-bold">Security & Data</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 text-center">
            {[
              { icon: Shield, label: "SSL Encrypted", sub: "All data encrypted in transit" },
              { icon: CreditCard, label: "Stripe Secure", sub: "PCI-compliant payments" },
              { icon: Lock, label: "Data Isolated", sub: "Your data is never shared" },
            ].map(item => (
              <div key={item.label} className="py-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <item.icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Questions?{" "}
              <a href="mailto:support@tenant-track.com" className="text-primary hover:underline">support@tenant-track.com</a>
              {" "} · {" "}
              <a href="/terms" className="text-primary hover:underline">Terms</a>
              {" "} · {" "}
              <a href="/privacy" className="text-primary hover:underline">Privacy</a>
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function UsageMeter({ label, current, max, percent }: { label: string; current: number; max: number; percent: number }) {
  const isUnlimited = max === -1;
  const isNearLimit = percent >= 80 && !isUnlimited;
  const isAtLimit = percent >= 100 && !isUnlimited;

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="font-medium text-foreground">{label}</span>
        <span className={`text-xs font-medium ${isAtLimit ? "text-red-400" : isNearLimit ? "text-amber-400" : "text-muted-foreground"}`}>
          {isUnlimited ? `${current} used · Unlimited` : `${current} / ${max}`}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isAtLimit ? "bg-red-500" : isNearLimit ? "bg-amber-500" : "bg-primary"}`}
            style={{ width: `${Math.min(100, percent)}%` }}
          />
        </div>
      )}
      {isUnlimited && (
        <div className="h-1.5 bg-primary/20 rounded-full" />
      )}
    </div>
  );
}

function FeatureStatus({ label, enabled, requiredPlan }: { label: string; enabled: boolean; requiredPlan: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-foreground/80">{label}</span>
      {enabled ? (
        <div className="flex items-center gap-1.5 text-xs text-green-400">
          <Check className="h-3.5 w-3.5" />
          <span>Active</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <Lock className="h-3 w-3 text-muted-foreground/40" />
          <span className="text-xs text-muted-foreground/50">{requiredPlan}</span>
          <button
            onClick={() => window.location.href = "/pricing"}
            className="text-[10px] text-primary hover:underline font-medium"
          >
            Upgrade
          </button>
        </div>
      )}
    </div>
  );
}
