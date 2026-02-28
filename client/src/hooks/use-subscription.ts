import { useQuery } from "@tanstack/react-query";

interface SubscriptionData {
  subscription: any;
  tier: string;
  stripeCustomerId: string | null;
}

const PLAN_LIMITS: Record<string, { maxProperties: number; photoUploads: boolean; staffAssignment: boolean; analytics: boolean; exportLogs: boolean; customBranding: boolean }> = {
  trial: { maxProperties: 2, photoUploads: false, staffAssignment: false, analytics: false, exportLogs: false, customBranding: false },
  starter: { maxProperties: 5, photoUploads: true, staffAssignment: false, analytics: false, exportLogs: false, customBranding: false },
  growth: { maxProperties: 999, photoUploads: true, staffAssignment: true, analytics: false, exportLogs: true, customBranding: false },
  pro: { maxProperties: 999, photoUploads: true, staffAssignment: true, analytics: true, exportLogs: true, customBranding: true },
};

export function useSubscription() {
  const { data, isLoading } = useQuery<SubscriptionData>({
    queryKey: ["/api/stripe/subscription"],
  });

  const tier = data?.tier || "trial";
  const limits = PLAN_LIMITS[tier] || PLAN_LIMITS.trial;

  return {
    tier,
    limits,
    isLoading,
    hasSubscription: !!data?.subscription,
    tierLabel: tier === "trial" ? "Free Trial" : tier.charAt(0).toUpperCase() + tier.slice(1),
  };
}
