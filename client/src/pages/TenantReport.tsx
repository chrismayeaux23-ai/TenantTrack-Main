import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useProperty } from "@/hooks/use-properties";
import { useCreateRequest } from "@/hooks/use-requests";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/NativeSelect";
import { PhotoUploadGroup } from "@/components/PhotoUploadGroup";
import { Wrench, CheckCircle2, Loader2, Info, Globe } from "lucide-react";
import type { MaintenanceRequestInput } from "@shared/routes";
import { type Lang, t } from "@/lib/i18n";
import logoPng from "@assets/tenanttrack-final-logo.png";

function PoweredBy() {
  return (
    <div className="mt-6 text-center">
      <a
        href="https://www.tenanttrack.xyz"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
      >
        <img src={logoPng} alt="TenantTrack" className="h-4 w-4 object-contain" />
        Powered by TenantTrack
      </a>
    </div>
  );
}

export default function TenantReport() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const id = parseInt(propertyId || "0");
  const [, setLocation] = useLocation();
  const [lang, setLang] = useState<Lang>("en");
  const txt = t(lang).report;
  
  const { data: property, isLoading: propLoading, error: propError } = useProperty(id);
  const { mutate: submitRequest, isPending: isSubmitting } = useCreateRequest();

  const [isSuccess, setIsSuccess] = useState(false);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [formData, setFormData] = useState<MaintenanceRequestInput>({
    propertyId: id,
    tenantName: "",
    tenantPhone: "",
    tenantEmail: "",
    unitNumber: "",
    issueType: "",
    urgency: "Low",
    description: "",
    photoUrls: [],
  });

  const handleChange = (field: keyof MaintenanceRequestInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.issueType) {
      alert(txt.selectIssue);
      return;
    }
    submitRequest(formData, {
      onSuccess: (data) => {
        setTrackingCode(data.trackingCode || null);
        setIsSuccess(true);
      }
    });
  };

  const langToggle = (
    <button
      type="button"
      onClick={() => setLang(lang === "en" ? "es" : "en")}
      className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/15"
      data-testid="button-toggle-language"
    >
      <Globe className="h-4 w-4" />
      {t(lang).lang.switch}
    </button>
  );

  if (propLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (propError || !property) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-card p-8 rounded-3xl shadow-xl max-w-md w-full border border-border">
          <div className="flex justify-end mb-4">{langToggle}</div>
          <Wrench className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold mb-2">{txt.propertyNotFound}</h1>
          <p className="text-muted-foreground mb-6">{txt.propertyNotFoundDesc}</p>
          <Button onClick={() => setLocation('/')} className="w-full">{txt.returnHome}</Button>
        </div>
        <PoweredBy />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-card p-10 rounded-[2rem] shadow-xl max-w-md w-full animate-in zoom-in-95 duration-500 border border-border">
          <div className="h-24 w-24 bg-primary/15 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold mb-3" data-testid="text-success-title">{txt.successTitle}</h1>
          <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
            {txt.successDesc} <strong>{property.name}</strong>, {txt.unit} {formData.unitNumber}.
          </p>

          {trackingCode && (
            <div className="bg-muted/50 rounded-xl p-5 mb-6 border border-border">
              <p className="text-sm text-muted-foreground mb-2">{txt.trackingCodeLabel}</p>
              <p className="text-2xl font-mono font-bold tracking-widest text-foreground" data-testid="text-tracking-code">{trackingCode}</p>
              <p className="text-xs text-muted-foreground mt-3">{txt.trackingCodeHelp}</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {trackingCode && (
              <Button
                onClick={() => setLocation(`/track/${trackingCode}`)}
                className="w-full rounded-xl"
                size="lg"
                data-testid="link-track-request"
              >
                {txt.trackMyRequest}
              </Button>
            )}
            <Button onClick={() => window.location.reload()} variant="outline" className="w-full rounded-xl" size="lg" data-testid="button-submit-another">
              {txt.submitAnother}
            </Button>
          </div>
        </div>
        <PoweredBy />
      </div>
    );
  }

  const urgencyLabels: Record<string, string> = {
    Low: txt.low,
    Med: txt.medium,
    Emergency: txt.emergency,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <img src={logoPng} alt="TenantTrack" className="h-10 w-10 rounded-xl object-contain" />
          <div className="flex-1">
            <h1 className="font-display font-bold text-lg leading-tight text-foreground">{txt.headerTitle}</h1>
            <p className="text-xs font-medium text-muted-foreground">{property.name}</p>
          </div>
          {langToggle}
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 py-6 md:py-10">
        <div className="bg-primary/10 text-primary rounded-2xl p-4 flex gap-3 items-start mb-8 border border-primary/20">
          <Info className="h-5 w-5 mt-0.5 shrink-0" />
          <p className="text-sm leading-relaxed">{txt.infoBanner}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 bg-card p-6 sm:p-8 rounded-[2rem] shadow-sm border border-border">
          
          <div className="space-y-6">
            <h2 className="text-xl font-display font-bold border-b pb-2">{txt.contactInfo}</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tenantName">{txt.yourName}</Label>
                <Input id="tenantName" required value={formData.tenantName} onChange={e => handleChange("tenantName", e.target.value)} placeholder={txt.namePlaceholder} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitNumber">{txt.unitNumber}</Label>
                <Input id="unitNumber" required value={formData.unitNumber} onChange={e => handleChange("unitNumber", e.target.value)} placeholder={txt.unitPlaceholder} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenantPhone">{txt.phone}</Label>
                <Input id="tenantPhone" type="tel" required value={formData.tenantPhone} onChange={e => handleChange("tenantPhone", e.target.value)} placeholder={txt.phonePlaceholder} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenantEmail">{txt.email}</Label>
                <Input id="tenantEmail" type="email" required value={formData.tenantEmail} onChange={e => handleChange("tenantEmail", e.target.value)} placeholder={txt.emailPlaceholder} />
              </div>
            </div>
          </div>

          <div className="space-y-6 pt-4">
            <h2 className="text-xl font-display font-bold border-b pb-2">{txt.issueDetails}</h2>
            
            <div className="space-y-2">
              <Label htmlFor="issueType">{txt.issueType}</Label>
              <Select 
                id="issueType"
                required
                value={formData.issueType}
                onChange={e => handleChange("issueType", e.target.value)}
                options={[
                  { label: txt.plumbing, value: "Plumbing" },
                  { label: txt.hvac, value: "HVAC" },
                  { label: txt.electrical, value: "Electrical" },
                  { label: txt.appliances, value: "Appliances" },
                  { label: txt.misc, value: "Misc" }
                ]}
              />
            </div>

            <div className="space-y-2">
              <Label>{txt.urgency}</Label>
              <div className="grid grid-cols-3 gap-3">
                {(["Low", "Med", "Emergency"] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleChange("urgency", level)}
                    className={`
                      py-3 rounded-xl text-sm font-semibold border-2 transition-all active-elevate
                      ${formData.urgency === level 
                        ? level === 'Emergency' ? 'border-destructive bg-destructive/10 text-destructive'
                        : level === 'Med' ? 'border-warning bg-warning/10 text-warning'
                        : 'border-primary bg-primary/10 text-primary'
                        : 'border-input bg-transparent text-muted-foreground hover:bg-muted'
                      }
                    `}
                  >
                    {urgencyLabels[level]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{txt.description}</Label>
              <Textarea 
                id="description" 
                required 
                value={formData.description}
                onChange={e => handleChange("description", e.target.value)}
                placeholder={txt.descriptionPlaceholder}
                className="h-32"
              />
            </div>

            <div className="space-y-3">
              <Label>{txt.photos}</Label>
              <PhotoUploadGroup 
                maxPhotos={3} 
                value={formData.photoUrls || []} 
                onChange={(urls) => handleChange("photoUrls", urls)} 
              />
            </div>
          </div>

          <div className="pt-6">
            <Button 
              type="submit" 
              size="lg" 
              className="w-full text-lg rounded-2xl h-16 shadow-xl shadow-primary/25" 
              isLoading={isSubmitting}
            >
              {txt.submit}
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-4">
              {txt.disclaimer}
            </p>
          </div>
        </form>
      </main>

      <footer className="py-6 px-4">
        <PoweredBy />
      </footer>
    </div>
  );
}
