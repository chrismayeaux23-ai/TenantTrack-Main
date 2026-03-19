import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import {
  Building2, Users, CheckCircle2, ArrowRight, Loader2,
  ShieldCheck, Zap, Check, Sparkles
} from "lucide-react";
import logoPng from "@assets/file_000000001adc71f58731a09f21d2988d_1772208715788.png";

const TRADE_CATEGORIES = [
  "Plumbing", "Electrical", "HVAC", "General Handyman",
  "Appliance Repair", "Painting", "Roofing", "Landscaping",
  "Pest Control", "Cleaning", "Locksmith", "Other",
];

const STEPS = [
  { id: 1, icon: Building2, label: "Your Property", description: "Add your first rental property" },
  { id: 2, icon: Users, label: "Your First Vendor", description: "Add a contractor you already trust" },
  { id: 3, icon: Sparkles, label: "You're Ready!", description: "Start dispatching maintenance" },
];

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [property, setProperty] = useState({ name: "", address: "" });
  const [vendor, setVendor] = useState({ name: "", tradeCategory: "", phone: "", email: "" });

  const handleSkipToDemo = async () => {
    setSaving(true);
    try {
      await fetch("/api/demo-login", { method: "POST", credentials: "include" });
      window.location.href = "/dashboard";
    } catch {
      navigate("/dashboard");
    }
  };

  const handlePropertySubmit = async () => {
    if (!property.name.trim() || !property.address.trim()) return;
    setSaving(true);
    try {
      await apiRequest("POST", "/api/properties", property);
      await queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      setStep(2);
    } catch {
      toast({ title: "Error", description: "Failed to save property. Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleVendorSubmit = async () => {
    if (!vendor.name.trim() || !vendor.tradeCategory) return;
    setSaving(true);
    try {
      await apiRequest("POST", "/api/vendors", vendor);
      await queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      setStep(3);
    } catch {
      toast({ title: "Error", description: "Failed to save vendor. Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSkipVendor = () => setStep(3);

  const completedPercent = ((step - 1) / 2) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b border-border bg-card/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logoPng} alt="VendorTrust" className="h-8 w-8 rounded-lg object-contain" />
          <span className="font-display font-bold text-lg text-foreground">VendorTrust</span>
        </div>
        <button
          onClick={() => {
            localStorage.setItem("onboarding_complete", "true");
            navigate("/dashboard");
          }}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip setup →
        </button>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Progress */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-3">
              {STEPS.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step > s.id ? "bg-primary text-primary-foreground" :
                    step === s.id ? "bg-primary/20 text-primary border-2 border-primary" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {step > s.id ? <Check className="h-4 w-4" /> : s.id}
                  </div>
                  <span className={`text-sm font-medium hidden sm:block ${step >= s.id ? "text-foreground" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${step > s.id ? "bg-primary" : "bg-border"} min-w-[24px]`} />
                  )}
                </div>
              ))}
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-1 bg-primary rounded-full transition-all duration-500" style={{ width: `${completedPercent}%` }} />
            </div>
          </div>

          {/* Step 1: Add Property */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="text-center mb-8">
                <div className="h-16 w-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-2xl font-display font-bold text-foreground mb-2">Add your first property</h1>
                <p className="text-muted-foreground text-sm">This is where your tenants will submit maintenance requests.</p>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Property Name <span className="text-red-400">*</span></label>
                  <Input
                    placeholder="e.g. Sunset Apartments"
                    value={property.name}
                    onChange={e => setProperty(p => ({ ...p, name: e.target.value }))}
                    data-testid="input-property-name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Address <span className="text-red-400">*</span></label>
                  <Input
                    placeholder="e.g. 450 Sunset Blvd, Portland, OR 97201"
                    value={property.address}
                    onChange={e => setProperty(p => ({ ...p, address: e.target.value }))}
                    data-testid="input-property-address"
                  />
                </div>

                <Button
                  className="w-full gap-2"
                  onClick={handlePropertySubmit}
                  disabled={!property.name.trim() || !property.address.trim() || saving}
                  data-testid="button-save-property"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save Property & Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-center text-muted-foreground mb-2">Want to explore first with sample data?</p>
                  <button
                    onClick={handleSkipToDemo}
                    className="w-full text-sm text-primary hover:underline font-medium"
                    data-testid="button-load-demo"
                  >
                    Load demo data instead →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Add Vendor */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="text-center mb-8">
                <div className="h-16 w-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-2xl font-display font-bold text-foreground mb-2">Add your first vendor</h1>
                <p className="text-muted-foreground text-sm">Add a contractor you already work with. VendorTrust will track their reliability over time.</p>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-foreground block mb-1.5">Vendor Name <span className="text-red-400">*</span></label>
                    <Input
                      placeholder="e.g. Carlos Ruiz"
                      value={vendor.name}
                      onChange={e => setVendor(v => ({ ...v, name: e.target.value }))}
                      data-testid="input-vendor-name"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-foreground block mb-1.5">Trade / Specialty <span className="text-red-400">*</span></label>
                    <Select
                      value={vendor.tradeCategory}
                      onChange={e => setVendor(v => ({ ...v, tradeCategory: e.target.value }))}
                      options={[{ label: "Select a trade...", value: "" }, ...TRADE_CATEGORIES.map(t => ({ label: t, value: t }))]}
                      data-testid="select-vendor-trade"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">Phone</label>
                    <Input
                      placeholder="503-555-0100"
                      value={vendor.phone}
                      onChange={e => setVendor(v => ({ ...v, phone: e.target.value }))}
                      data-testid="input-vendor-phone"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
                    <Input
                      type="email"
                      placeholder="vendor@email.com"
                      value={vendor.email}
                      onChange={e => setVendor(v => ({ ...v, email: e.target.value }))}
                      data-testid="input-vendor-email"
                    />
                  </div>
                </div>

                <Button
                  className="w-full gap-2"
                  onClick={handleVendorSubmit}
                  disabled={!vendor.name.trim() || !vendor.tradeCategory || saving}
                  data-testid="button-save-vendor"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save Vendor & Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <button
                  onClick={handleSkipVendor}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-skip-vendor"
                >
                  Skip for now — I'll add vendors later
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Complete */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 text-center">
              <div className="h-20 w-20 rounded-3xl bg-primary/15 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-3xl font-display font-bold text-foreground mb-3">You're all set!</h1>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                Your VendorTrust command center is ready. Start by creating a maintenance request or adding more vendors.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                {[
                  { icon: Zap, title: "Dispatch vendors", sub: "Assign jobs from the dashboard" },
                  { icon: ShieldCheck, title: "Build trust scores", sub: "Rate vendors after each job" },
                  { icon: Building2, title: "Add more properties", sub: "Each gets its own QR code" },
                ].map(item => (
                  <div key={item.title} className="bg-card border border-border rounded-2xl p-4 text-left">
                    <item.icon className="h-5 w-5 text-primary mb-2" />
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.sub}</p>
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                className="w-full gap-2 rounded-xl text-base"
                onClick={() => {
                  localStorage.setItem("onboarding_complete", "true");
                  navigate("/dashboard");
                }}
                data-testid="button-go-to-dashboard"
              >
                Go to My Dashboard
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
