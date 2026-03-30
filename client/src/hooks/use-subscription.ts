import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { differenceInDays } from "date-fns";

export const PLAN_CONFIG = {
  trial: {
    label: "Free Trial",
    price: 0,
    maxProperties: 1,
    maxVendors: 3,
    maxStaff: 0,
    vendorTrustScores: false,
    dispatch: false,
    analytics: false,
    costTracking: false,
    scheduledMaintenance: false,
    priorityHighlighting: false,
    staffAssignment: false,
    photoUploads: false,
    exportLogs: false,
    vendorImport: false,
  },
  starter: {
    label: "Starter",
    price: 29,
    maxProperties: 5,
    maxVendors: 10,
    maxStaff: 0,
    vendorTrustScores: false,
    dispatch: true,
    analytics: false,
    costTracking: false,
    scheduledMaintenance: false,
    priorityHighlighting: false,
    staffAssignment: false,
    photoUploads: true,
    exportLogs: false,
    vendorImport: false,
  },
  growth: {
    label: "Growth",
    price: 59,
    maxProperties: 25,
    maxVendors: 50,
    maxStaff: 5,
    vendorTrustScores: true,
    dispatch: true,
    analytics: false,
    costTracking: true,
    scheduledMaintenance: false,
    priorityHighlighting: true,
    staffAssignment: true,
    photoUploads: true,
    exportLogs: true,
    vendorImport: true,
  },
  pro: {
    label: "Pro",
    price: 99,
    maxProperties: -1,
    maxVendors: -1,
    maxStaff: -1,
    vendorTrustScores: true,
    dispatch: true,
    analytics: true,
    costTracking: true,
    scheduledMaintenance: true,
    priorityHighlighting: true,
    staffAssignment: true,
    photoUploads: true,
    exportLogs: true,
    vendorImport: true,
  },
} as const;

export type PlanTier = keyof typeof PLAN_CONFIG;
export type PlanLimits = (typeof PLAN_CONFIG)[PlanTier];

interface SubscriptionData {
  subscription: any;
  tier: string;
  stripeCustomerId: string | null;
}

const TRIAL_DAYS = 14;

export function useSubscription() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery<SubscriptionData>({
    queryKey: ["/api/stripe/subscription"],
  });

  const tier = (data?.tier || "trial") as PlanTier;
  const limits = PLAN_CONFIG[tier] ?? PLAN_CONFIG.trial;
  const hasSubscription = !!data?.subscription;

  const createdAt = user?.createdAt ? new Date(user.createdAt as string) : null;
  const daysSinceSignup = createdAt ? differenceInDays(new Date(), createdAt) : 0;
  const trialDaysRemaining = Math.max(0, TRIAL_DAYS - daysSinceSignup);
  const trialExpired = tier === "trial" && trialDaysRemaining === 0;

  const can = (feature: keyof Omit<PlanLimits, "label" | "price" | "maxProperties" | "maxVendors" | "maxStaff">): boolean => {
    return !!(limits as any)[feature];
  };

  const atLimit = (resource: "properties" | "vendors" | "staff", current: number): boolean => {
    const key = `max${resource.charAt(0).toUpperCase() + resource.slice(1)}` as "maxProperties" | "maxVendors" | "maxStaff";
    const max = limits[key];
    if (max === -1) return false;
    return current >= max;
  };

  const usagePercent = (resource: "properties" | "vendors" | "staff", current: number): number => {
    const key = `max${resource.charAt(0).toUpperCase() + resource.slice(1)}` as "maxProperties" | "maxVendors" | "maxStaff";
    const max = limits[key];
    if (max === -1) return 0;
    if (max === 0) return 100;
    return Math.min(100, Math.round((current / max) * 100));
  };

  const nextPlan = (): PlanTier | null => {
    if (tier === "trial" || tier === "starter") return "growth";
    if (tier === "growth") return "pro";
    return null;
  };

  return {
    tier,
    limits,
    isLoading,
    hasSubscription,
    tierLabel: limits.label,
    trialDaysRemaining,
    trialExpired,
    can,
    atLimit,
    usagePercent,
    nextPlan,
    PLAN_CONFIG,
  };
}
