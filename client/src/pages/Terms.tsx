import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import logoPng from "@assets/tenanttrack-final-logo.png";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-card border-b border-border p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoPng} alt="TenantTrack" className="h-8 w-8 rounded-lg" />
            <span className="font-display font-bold text-xl">TenantTrack</span>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-back-home">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 md:p-10">
        <h1 className="text-3xl font-display font-bold mb-2">Terms and Conditions</h1>
        <p className="text-muted-foreground mb-8">Last updated: February 28, 2026</p>

        <div className="prose prose-invert max-w-none space-y-6 text-foreground/90">
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p className="text-sm leading-relaxed">By accessing or using TenantTrack ("the Service"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, you may not use the Service. TenantTrack reserves the right to update these terms at any time, and continued use constitutes acceptance of any changes.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">2. Description of Service</h2>
            <p className="text-sm leading-relaxed">TenantTrack is a property management platform that enables landlords to receive and manage maintenance requests from tenants via QR code technology. The Service includes property management tools, maintenance request tracking, staff assignment features, and subscription billing.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">3. User Accounts</h2>
            <p className="text-sm leading-relaxed">To access landlord features, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information when creating your account and keep it updated.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">4. Subscription Plans and Billing</h2>
            <p className="text-sm leading-relaxed">TenantTrack offers subscription plans with varying features and property limits. All plans include a 14-day free trial. After the trial period, you will be billed according to your selected plan. You may cancel your subscription at any time through the billing portal. Refunds are handled on a case-by-case basis.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">5. Tenant Data</h2>
            <p className="text-sm leading-relaxed">Tenants submit maintenance requests without creating accounts. By using the Service, landlords acknowledge they are responsible for informing their tenants about data collection practices. TenantTrack collects tenant names, contact information, and photos related to maintenance issues solely for the purpose of facilitating repairs.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">6. Acceptable Use</h2>
            <p className="text-sm leading-relaxed">You agree not to use the Service for any unlawful purpose, to upload harmful content, to attempt to gain unauthorized access to the Service, or to interfere with other users' access. TenantTrack reserves the right to suspend or terminate accounts that violate these terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">7. Intellectual Property</h2>
            <p className="text-sm leading-relaxed">All content, trademarks, and intellectual property associated with TenantTrack are owned by TenantTrack. You retain ownership of any content you submit through the Service, but grant TenantTrack a license to use it for providing the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">8. Limitation of Liability</h2>
            <p className="text-sm leading-relaxed">TenantTrack is provided "as is" without warranties of any kind. TenantTrack shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service. Our total liability shall not exceed the amount paid by you in the twelve months preceding the claim.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">9. Termination</h2>
            <p className="text-sm leading-relaxed">Either party may terminate this agreement at any time. Upon termination, your access to the Service will cease. TenantTrack may retain your data for a reasonable period to comply with legal obligations.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">10. Contact</h2>
            <p className="text-sm leading-relaxed">For questions about these Terms, contact us at support@tenant-track.com or call (503) 380-6482.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
