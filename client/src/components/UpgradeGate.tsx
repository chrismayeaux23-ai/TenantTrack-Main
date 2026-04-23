import { Lock, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PLAN_CONFIG, type PlanTier } from "@/hooks/use-subscription";

interface UpgradeGateProps {
  feature: string;
  requiredPlan: PlanTier;
  currentPlan: PlanTier;
  description?: string;
  children: React.ReactNode;
  blurContent?: boolean;
}

const PLAN_ORDER: PlanTier[] = ["trial", "starter", "growth", "pro"];

function hasAccess(currentPlan: PlanTier, requiredPlan: PlanTier): boolean {
  return PLAN_ORDER.indexOf(currentPlan) >= PLAN_ORDER.indexOf(requiredPlan);
}

export function UpgradeGate({
  feature,
  requiredPlan,
  currentPlan,
  description,
  children,
  blurContent = true,
}: UpgradeGateProps) {
  if (hasAccess(currentPlan, requiredPlan)) {
    return <>{children}</>;
  }

  const planLabel = PLAN_CONFIG[requiredPlan].label;
  const planPrice = PLAN_CONFIG[requiredPlan].price;

  return (
    <div className="relative">
      {blurContent && (
        <div className="pointer-events-none select-none" style={{ filter: "blur(4px)", opacity: 0.35 }}>
          {children}
        </div>
      )}
      <div className={`${blurContent ? "absolute inset-0" : ""} flex items-center justify-center`}>
        <div className="bg-card border border-border rounded-3xl p-8 text-center max-w-sm mx-auto shadow-2xl shadow-black/40">
          <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-lg font-display font-bold text-foreground mb-2">
            {feature} requires {planLabel}
          </h3>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            {description || `Upgrade to ${planLabel} to unlock ${feature} and more advanced tools starting at $${planPrice}/month.`}
          </p>
          <Button
            className="w-full rounded-xl gap-2 neon-glow"
            onClick={() => window.location.href = "/pricing"}
            data-testid="button-upgrade-gate"
          >
            <Zap className="h-4 w-4" />
            Upgrade to {planLabel}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-xs text-muted-foreground mt-3">30-day free trial · Cancel anytime</p>
        </div>
      </div>
    </div>
  );
}

export function UpgradeBanner({ feature, requiredPlan, currentPlan, compact = false }: {
  feature: string;
  requiredPlan: PlanTier;
  currentPlan: PlanTier;
  compact?: boolean;
}) {
  if (hasAccess(currentPlan, requiredPlan)) return null;
  const planLabel = PLAN_CONFIG[requiredPlan].label;

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-3 bg-primary/8 border border-primary/20 rounded-xl px-4 py-2.5 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Lock className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-foreground/80">{feature} is available on <span className="font-semibold text-foreground">{planLabel}</span></span>
        </div>
        <Button size="sm" className="rounded-full h-7 px-4 text-xs shrink-0" onClick={() => window.location.href = "/pricing"} data-testid="button-upgrade-banner">
          Upgrade
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 bg-primary/8 border border-primary/20 rounded-2xl px-5 py-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <Zap className="h-4.5 w-4.5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{feature} — {planLabel} Plan</p>
          <p className="text-xs text-muted-foreground">Upgrade to unlock this feature</p>
        </div>
      </div>
      <Button size="sm" className="rounded-xl shrink-0" onClick={() => window.location.href = "/pricing"} data-testid="button-upgrade-banner-full">
        Upgrade Now
      </Button>
    </div>
  );
}
