import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import logoPng from "@assets/tenanttrack-final-logo.png";

export default function Privacy() {
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
        <h1 className="text-3xl font-display font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: February 28, 2026</p>

        <div className="prose prose-invert max-w-none space-y-6 text-foreground/90">
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">1. Information We Collect</h2>
            <p className="text-sm leading-relaxed mb-3">We collect the following types of information:</p>
            <ul className="list-disc pl-6 text-sm space-y-2">
              <li><strong>Landlord Account Data:</strong> Name, email address, phone number, company name, and payment information through our secure payment processor (Stripe).</li>
              <li><strong>Tenant Submission Data:</strong> Name, phone number, email address, unit number, maintenance issue descriptions, and uploaded photos. Tenants do not need to create accounts.</li>
              <li><strong>Property Data:</strong> Property names and addresses added by landlords.</li>
              <li><strong>Usage Data:</strong> Log data, device information, and interaction patterns to improve the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-sm space-y-2">
              <li>To provide and maintain the TenantTrack Service</li>
              <li>To process maintenance requests and connect tenants with landlords</li>
              <li>To manage subscriptions and billing</li>
              <li>To send service-related communications and notifications</li>
              <li>To improve and optimize the Service</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">3. Data Storage and Security</h2>
            <p className="text-sm leading-relaxed">Your data is stored securely using industry-standard encryption and security practices. Photos uploaded by tenants are stored in secure cloud storage. Payment information is processed and stored by Stripe and never touches our servers directly. We implement appropriate technical and organizational measures to protect your personal data.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">4. Data Sharing</h2>
            <p className="text-sm leading-relaxed">We do not sell your personal data. We may share data with:</p>
            <ul className="list-disc pl-6 text-sm space-y-2 mt-2">
              <li><strong>Service Providers:</strong> Third-party services that help us operate (e.g., Stripe for payments, cloud hosting providers).</li>
              <li><strong>Landlord-Tenant Relationship:</strong> Tenant maintenance request data is shared with the landlord of the relevant property.</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">5. Tenant Privacy</h2>
            <p className="text-sm leading-relaxed">Tenant data is collected solely for facilitating maintenance requests. Tenants can track their request status using a unique tracking code without creating an account. Tenant contact information is only shared with the landlord of the property where the request was submitted.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">6. Data Retention</h2>
            <p className="text-sm leading-relaxed">We retain your data for as long as your account is active or as needed to provide the Service. After account termination, we may retain certain data for a reasonable period to comply with legal obligations, resolve disputes, and enforce our agreements.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">7. Your Rights</h2>
            <p className="text-sm leading-relaxed">You have the right to access, correct, or delete your personal data. You may request a copy of your data or ask us to delete your account by contacting us. Landlords are responsible for managing tenant data within their accounts in compliance with applicable laws.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">8. Cookies and Tracking</h2>
            <p className="text-sm leading-relaxed">We use session cookies to maintain your login state. We do not use third-party tracking cookies or advertising trackers. Essential cookies are required for the Service to function properly.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">9. Changes to This Policy</h2>
            <p className="text-sm leading-relaxed">We may update this Privacy Policy from time to time. We will notify users of significant changes via email or through the Service. Continued use after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">10. Contact Us</h2>
            <p className="text-sm leading-relaxed">If you have questions about this Privacy Policy or your data, contact us at:</p>
            <div className="mt-3 text-sm space-y-1">
              <p>Email: support@tenant-track.com</p>
              <p>Phone: (503) 380-6482</p>
              <p>Website: www.tenant-track.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
