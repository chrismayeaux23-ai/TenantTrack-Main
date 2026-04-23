import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, User, Mail, Phone, Building2, Crown, Zap, ArrowRight } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";

interface ProfileData {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  companyName: string | null;
  profileImageUrl: string | null;
  subscriptionTier: string;
}

const TIER_LABELS: Record<string, { label: string; variant: "default" | "warning" | "success" | "destructive" | "outline" }> = {
  trial: { label: "Free Trial", variant: "outline" },
  starter: { label: "Starter", variant: "default" },
  growth: { label: "Growth", variant: "warning" },
  pro: { label: "Pro", variant: "success" },
};

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { tier, tierLabel, limits, hasSubscription, trialDaysRemaining, trialExpired } = useSubscription();

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ["/api/profile"],
  });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || "");
      setLastName(profile.lastName || "");
      setPhone(profile.phone || "");
      setCompanyName(profile.companyName || "");
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async (data: { firstName?: string; lastName?: string; phone?: string; companyName?: string }) => {
      const res = await apiRequest("PATCH", "/api/profile", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Profile Updated", description: "Your information has been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = {};
    if (firstName.trim()) data.firstName = firstName.trim();
    if (lastName.trim()) data.lastName = lastName.trim();
    data.phone = phone.trim();
    data.companyName = companyName.trim();
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="h-[60vh] flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const tierInfo = TIER_LABELS[profile?.subscriptionTier || "trial"] || TIER_LABELS.trial;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground mt-2">Manage your account information.</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 mb-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold shrink-0">
              {profile?.firstName?.charAt(0) || profile?.email?.charAt(0) || "L"}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate" data-testid="text-profile-name">
                {profile?.firstName ? `${profile.firstName}${profile.lastName ? " " + profile.lastName : ""}` : profile?.email || "Landlord"}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground truncate" data-testid="text-profile-email">{profile?.email}</span>
              </div>
              {profile?.companyName && (
                <div className="flex items-center gap-2 mt-0.5">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{profile.companyName}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Plan Status Card */}
        <div className="bg-card rounded-2xl border border-border p-5 mb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{tierLabel} Plan</p>
                  <Badge variant={tierInfo.variant} className="text-[10px]" data-testid="text-subscription-tier">{tierInfo.label}</Badge>
                </div>
                {tier === "trial" && !trialExpired && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {trialDaysRemaining} day{trialDaysRemaining !== 1 ? "s" : ""} remaining in free trial
                  </p>
                )}
                {tier === "trial" && trialExpired && (
                  <p className="text-xs text-red-400 mt-0.5">Trial has expired</p>
                )}
                {hasSubscription && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ${(limits as any).price ?? 0}/month · Active
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {!hasSubscription && (
                <Button size="sm" className="rounded-xl gap-1.5 text-xs" onClick={() => window.location.href = "/pricing"} data-testid="button-profile-upgrade">
                  <Zap className="h-3.5 w-3.5" />
                  {trialExpired ? "Choose Plan" : "Upgrade"}
                </Button>
              )}
              <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => window.location.href = "/billing"} data-testid="button-profile-billing">
                Billing
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>

          {tier === "trial" && !trialExpired && (
            <div className="mt-4 pt-4 border-t border-border">
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

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <h3 className="text-lg font-bold mb-2">Edit Information</h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4" /> First Name
              </Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Your first name"
                className="bg-muted"
                data-testid="input-first-name"
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4" /> Last Name
              </Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Your last name"
                className="bg-muted"
                data-testid="input-last-name"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
              <Phone className="h-4 w-4" /> Phone Number
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className="bg-muted"
              data-testid="input-phone"
            />
          </div>

          <div>
            <Label htmlFor="companyName" className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4" /> Company Name
            </Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Your property management company"
              className="bg-muted"
              data-testid="input-company-name"
            />
          </div>

          <Button type="submit" disabled={updateMutation.isPending} className="w-full sm:w-auto" data-testid="button-save-profile">
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
