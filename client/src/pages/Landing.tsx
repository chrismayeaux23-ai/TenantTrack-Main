import { Link } from "wouter";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { 
  QrCode, Smartphone, ShieldCheck, Mail, Phone, 
  ArrowRight, Check, DollarSign, CalendarClock, 
  Users, ClipboardList, Building2, Zap, Crown,
  ChevronDown, Star, BarChart3, FileDown, X
} from "lucide-react";
import logoPng from "@assets/file_000000001adc71f58731a09f21d2988d_1772208715788.png";
import heroPng from "@assets/ChatGPT_Image_Feb_27,_2026,_08_01_41_AM_1772208715787.png";

const PLANS = [
  {
    tier: "starter",
    name: "Starter",
    description: "For small landlords (1–5 units)",
    price: 29,
    icon: Building2,
    features: [
      "QR maintenance system",
      "Basic dashboard",
      "Email notifications",
      "Photo uploads",
    ],
  },
  {
    tier: "growth",
    name: "Growth",
    description: "For 6–25 units",
    price: 59,
    icon: Zap,
    highlight: true,
    features: [
      "Everything in Starter",
      "Priority request highlighting",
      "Maintenance history tracking",
      "Basic reporting",
      "Custom QR per unit",
      "Staff assignment",
    ],
  },
  {
    tier: "pro",
    name: "Pro",
    description: "For 25+ units",
    price: 99,
    icon: Crown,
    features: [
      "Everything in Growth",
      "Advanced reporting",
      "CSV export",
      "Cost tracking & reports",
      "Scheduled maintenance",
      "Priority support",
    ],
  },
];

const STEPS = [
  {
    number: "01",
    title: "Add Your Properties",
    description: "Sign up and add your rental properties. Each one gets a unique QR code you can print and post on-site.",
  },
  {
    number: "02",
    title: "Tenants Scan & Report",
    description: "Tenants scan the QR code with their phone camera — no app download needed. They fill out a simple form with photos and details.",
  },
  {
    number: "03",
    title: "You Manage Everything",
    description: "Track requests, assign staff, log repair costs, and schedule preventive maintenance — all from one dashboard.",
  },
];

const FEATURES = [
  {
    icon: QrCode,
    title: "QR Code System",
    desc: "Print unique QR codes for each property or unit. Tenants scan with their phone camera to open an instant reporting form.",
  },
  {
    icon: Smartphone,
    title: "No App Required",
    desc: "Tenants report issues from any phone browser. Upload photos, describe the problem, and submit in under 60 seconds.",
  },
  {
    icon: ClipboardList,
    title: "Smart Dashboard",
    desc: "See all requests at a glance with status badges, urgency levels, tenant info, and real-time analytics.",
  },
  {
    icon: Users,
    title: "Staff Assignment",
    desc: "Add your maintenance team and assign requests directly. Everyone stays in the loop without group texts.",
  },
  {
    icon: DollarSign,
    title: "Cost Tracking",
    desc: "Log repair costs per request with vendor details. Generate reports and export to CSV for tax time.",
  },
  {
    icon: CalendarClock,
    title: "Scheduled Maintenance",
    desc: "Set up recurring tasks like HVAC filter changes and smoke detector checks. Never miss preventive maintenance again.",
  },
];

const TESTIMONIALS = [
  {
    quote: "I used to get random texts at 2 AM about leaky faucets. Now tenants scan the QR code and I see everything organized in my dashboard.",
    name: "Property Manager",
    role: "12 units in Portland, OR",
    stars: 5,
  },
  {
    quote: "The cost tracking alone pays for itself at tax time. I used to keep receipts in a shoebox — now everything is exported to CSV in one click.",
    name: "Independent Landlord",
    role: "6 units in Austin, TX",
    stars: 5,
  },
  {
    quote: "My tenants love it. No app to download, no account to create. They scan, report, and get a tracking code. Simple.",
    name: "Real Estate Investor",
    role: "22 units in Denver, CO",
    stars: 5,
  },
];

export default function Landing() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      <nav className="fixed top-0 w-full z-50 glass-panel border-b-0">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoPng} alt="TenantTrack Logo" className="h-10 w-10 object-contain rounded-lg" />
            <span className="font-display font-bold text-xl text-foreground">TenantTrack</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <Link href="/features" className="hover:text-foreground transition-colors" data-testid="nav-features">Features</Link>
            <button onClick={() => scrollTo("how-it-works")} className="hover:text-foreground transition-colors" data-testid="nav-how-it-works">How It Works</button>
            <button onClick={() => scrollTo("pricing")} className="hover:text-foreground transition-colors" data-testid="nav-pricing">Pricing</button>
          </div>
          <Button onClick={() => window.location.href = '/api/login'} className="rounded-full shadow-lg shadow-primary/20" data-testid="button-nav-login">
            Landlord Login
          </Button>
        </div>
      </nav>

      <section className="pt-32 pb-16 px-6 lg:pt-48 lg:pb-32 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="text-left max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              14-day free trial &middot; No credit card required
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tight text-foreground leading-[1.1] mb-6">
              Maintenance Requests <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">Made Effortless.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
              Generate QR codes for your properties. Tenants scan, snap a photo, and report issues instantly — no app download needed. You manage everything from one beautiful dashboard.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button size="lg" className="w-full sm:w-auto rounded-full text-lg shadow-xl shadow-primary/20 gap-2" onClick={() => window.location.href = '/api/login'} data-testid="button-get-started">
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-full text-lg border-border" onClick={() => scrollTo("how-it-works")} data-testid="button-see-how">
                See How It Works
              </Button>
            </div>
            <div className="flex items-center gap-6 mt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-primary" />
                <span>Free 14-day trial</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-primary" />
                <span>No app for tenants</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <Check className="h-4 w-4 text-primary" />
                <span>Setup in 5 minutes</span>
              </div>
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
      </section>

      <section className="py-12 border-y border-border bg-card/30">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl md:text-4xl font-display font-extrabold text-foreground">60s</p>
              <p className="text-sm text-muted-foreground mt-1">Tenant report time</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-display font-extrabold text-foreground">0</p>
              <p className="text-sm text-muted-foreground mt-1">Apps to download</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-display font-extrabold text-primary">100%</p>
              <p className="text-sm text-muted-foreground mt-1">Mobile friendly</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-display font-extrabold text-foreground">24/7</p>
              <p className="text-sm text-muted-foreground mt-1">Request submissions</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 text-sm px-4 py-1">How It Works</Badge>
          <h2 className="text-4xl md:text-5xl font-display font-extrabold text-foreground mb-4">
            Three Steps to Sanity
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Stop chasing down maintenance issues through texts and voicemails. Get organized in minutes.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <div key={i} className="relative p-8 rounded-3xl bg-card border border-border shadow-lg shadow-black/10">
              <div className="text-6xl font-display font-extrabold text-primary/10 absolute top-4 right-6">{step.number}</div>
              <div className="h-12 w-12 rounded-2xl bg-primary/15 flex items-center justify-center mb-6">
                <span className="text-xl font-bold text-primary">{step.number}</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute -right-5 top-1/2 -translate-y-1/2 z-10">
                  <ArrowRight className="h-6 w-6 text-primary/30" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="py-24 px-6 bg-card/30 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-sm px-4 py-1">Features</Badge>
            <h2 className="text-4xl md:text-5xl font-display font-extrabold text-foreground mb-4">
              Everything You Need to Manage Properties
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From QR-powered requests to cost reports for tax season — TenantTrack handles it all.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <div key={i} className="p-8 rounded-3xl bg-card border border-border shadow-lg shadow-black/10 hover-elevate group transition-all" data-testid={`feature-card-${i}`}>
                <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center mb-6 group-hover:bg-primary/25 transition-colors">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 text-sm px-4 py-1">For Landlords</Badge>
          <h2 className="text-4xl md:text-5xl font-display font-extrabold text-foreground mb-4">
            The Problem We Solve
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="p-8 rounded-3xl bg-red-500/5 border border-red-500/20">
            <h3 className="text-xl font-bold mb-4 text-red-400">Without TenantTrack</h3>
            <ul className="space-y-3">
              {[
                "Random texts and calls at all hours",
                "Forgotten requests and angry tenants",
                "No record of repair costs for taxes",
                "Missed preventive maintenance deadlines",
                "No way to track what staff is doing",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <X className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-8 rounded-3xl bg-primary/5 border border-primary/20">
            <h3 className="text-xl font-bold mb-4 text-primary">With TenantTrack</h3>
            <ul className="space-y-3">
              {[
                "Organized requests with photos and details",
                "Real-time status tracking for tenants",
                "Cost reports exportable for tax deductions",
                "Automated recurring maintenance reminders",
                "Staff assignment with full accountability",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-card/30 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-sm px-4 py-1">Testimonials</Badge>
            <h2 className="text-4xl md:text-5xl font-display font-extrabold text-foreground mb-4">
              Landlords Love TenantTrack
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="p-6 rounded-2xl bg-card border border-border" data-testid={`testimonial-${i}`}>
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-4">"{t.quote}"</p>
                <div>
                  <p className="text-sm font-bold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 text-sm px-4 py-1">Pricing</Badge>
          <h2 className="text-4xl md:text-5xl font-display font-extrabold text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            All plans include a 14-day free trial. No credit card required to start.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.tier}
                className={`relative bg-card rounded-2xl p-6 border flex flex-col ${
                  plan.highlight
                    ? "border-primary shadow-xl shadow-primary/10 ring-2 ring-primary/20"
                    : "border-border shadow-sm"
                }`}
                data-testid={`card-plan-${plan.tier}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs font-bold">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <div className="mb-6">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 ${plan.highlight ? "bg-primary/10" : "bg-muted"}`}>
                    <Icon className={`h-6 w-6 ${plan.highlight ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-display font-extrabold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full rounded-xl"
                  variant={plan.highlight ? "default" : "outline"}
                  size="lg"
                  onClick={() => window.location.href = '/api/login'}
                  data-testid={`button-plan-${plan.tier}`}
                >
                  Start Free Trial
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-primary/10 to-emerald-400/5 rounded-3xl p-12 md:p-16 border border-primary/20">
          <h2 className="text-3xl md:text-5xl font-display font-extrabold text-foreground mb-4">
            Ready to simplify maintenance?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Join landlords who've stopped chasing maintenance requests and started managing them. Set up in under 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="rounded-full text-lg shadow-xl shadow-primary/20 gap-2 px-8" onClick={() => window.location.href = '/api/login'} data-testid="button-cta-final">
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">14-day free trial &middot; No credit card &middot; Cancel anytime</p>
        </div>
      </section>

      <footer className="border-t border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src={logoPng} alt="TenantTrack" className="h-10 w-10 rounded-lg" />
                <span className="font-display font-bold text-xl text-foreground">TenantTrack</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                The modern maintenance request system for rental property owners. QR-powered, mobile-first, and built for landlords who want to stay organized.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-sm mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/features" className="hover:text-primary transition-colors">All Features</Link></li>
                <li><button onClick={() => scrollTo("pricing")} className="hover:text-primary transition-colors">Pricing</button></li>
                <li><button onClick={() => scrollTo("how-it-works")} className="hover:text-primary transition-colors">How It Works</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-sm mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="mailto:support@tenant-track.com" className="flex items-center gap-2 hover:text-primary transition-colors" data-testid="link-email">
                    <Mail className="h-4 w-4" />
                    support@tenant-track.com
                  </a>
                </li>
                <li>
                  <a href="tel:5033806482" className="flex items-center gap-2 hover:text-primary transition-colors" data-testid="link-phone">
                    <Phone className="h-4 w-4" />
                    (503) 380-6482
                  </a>
                </li>
              </ul>
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
