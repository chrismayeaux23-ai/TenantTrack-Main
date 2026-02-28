import { Link } from "wouter";
import { Button } from "@/components/ui/Button";
import { Wrench, ShieldCheck, QrCode, Smartphone, Mail, Phone } from "lucide-react";
import logoPng from "@assets/file_000000001adc71f58731a09f21d2988d_1772208715788.png";
import heroPng from "@assets/ChatGPT_Image_Feb_27,_2026,_08_01_41_AM_1772208715787.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      <nav className="fixed top-0 w-full z-50 glass-panel border-b-0">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoPng} alt="TenantTrack Logo" className="h-10 w-10 object-contain rounded-lg" />
            <span className="font-display font-bold text-xl text-foreground">TenantTrack</span>
          </div>
          <Button onClick={() => window.location.href = '/api/login'} className="rounded-full shadow-lg shadow-primary/20">
            Landlord Login
          </Button>
        </div>
      </nav>

      <main className="pt-32 pb-16 px-6 lg:pt-48 lg:pb-32 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="text-left max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              The modern way to manage properties
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tight text-foreground leading-[1.1] mb-6">
              Maintenance Requests <br className="hidden md:block"/> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">Made Effortless.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
              Generate QR codes for your properties. Tenants scan, snap a photo, and report issues instantly without downloading an app. You manage everything from a beautiful dashboard.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button size="lg" className="w-full sm:w-auto rounded-full text-lg shadow-xl shadow-primary/20" onClick={() => window.location.href = '/api/login'}>
                Get Started for Free
              </Button>
              <a href="https://www.tenant-track.com" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-full text-lg border-border">
                  Visit tenant-track.com
                </Button>
              </a>
            </div>
          </div>
          
          <div className="flex-1 w-full max-w-2xl animate-in fade-in zoom-in duration-1000">
            <div className="relative p-2 bg-gradient-to-tr from-primary/20 to-emerald-400/10 rounded-[2.5rem] overflow-hidden">
              <img 
                src={heroPng} 
                alt="TenantTrack Dashboard Preview" 
                className="rounded-[2rem] shadow-2xl border border-white/10 w-full object-cover aspect-video lg:aspect-square"
              />
            </div>
          </div>
        </div>

        <div className="mt-32 grid md:grid-cols-3 gap-8">
          {[
            {
              icon: QrCode,
              title: "QR Code Powered",
              desc: "Print unique QR codes for each unit. Tenants scan to open a mobile-optimized reporting form instantly."
            },
            {
              icon: Smartphone,
              title: "Thumb-Friendly Forms",
              desc: "No app required. Tenants can easily upload photos and describe issues directly from their phone browser."
            },
            {
              icon: ShieldCheck,
              title: "Organized Dashboard",
              desc: "Track status, urgency, and tenant details all in one secure, beautifully designed landlord dashboard."
            }
          ].map((feature, i) => (
            <div key={i} className="p-8 rounded-3xl bg-card border border-border shadow-lg shadow-black/10 hover-elevate">
              <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center mb-6">
                <feature.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-border bg-card/50 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
            <div className="flex items-center gap-3">
              <img src={logoPng} alt="TenantTrack" className="h-10 w-10 rounded-lg" />
              <span className="font-display font-bold text-xl text-foreground">TenantTrack</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 text-sm text-muted-foreground">
              <a href="mailto:support@tenant-track.com" className="flex items-center gap-2 hover:text-primary transition-colors" data-testid="link-email">
                <Mail className="h-4 w-4" />
                support@tenant-track.com
              </a>
              <a href="tel:5033806482" className="flex items-center gap-2 hover:text-primary transition-colors" data-testid="link-phone">
                <Phone className="h-4 w-4" />
                (503) 380-6482
              </a>
              <a href="https://www.tenant-track.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors" data-testid="link-website">
                www.tenant-track.com
              </a>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} TenantTrack. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/terms" className="hover:text-primary transition-colors" data-testid="link-terms">Terms & Conditions</Link>
              <Link href="/privacy" className="hover:text-primary transition-colors" data-testid="link-privacy">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
