import { Link } from "wouter";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  QrCode, Smartphone, ShieldCheck, Mail, Phone,
  ArrowRight, Check, DollarSign, CalendarClock,
  Users, ClipboardList, Building2, Camera, BarChart3,
  FileDown, Bell, Search, MapPin, MessageSquare,
  Clock, Wrench, Receipt, TrendingUp, Star,
  Zap, Crown, Shield, Globe, Layers
} from "lucide-react";
import logoPng from "@assets/file_000000001adc71f58731a09f21d2988d_1772208715788.png";

const HERO_FEATURES = [
  "QR code maintenance system",
  "No app download for tenants",
  "Real-time request tracking",
  "Cost tracking & CSV export",
  "Recurring maintenance scheduling",
  "Staff assignment & management",
];

const DETAILED_FEATURES = [
  {
    id: "qr-system",
    badge: "Core Feature",
    title: "QR Code Maintenance System",
    subtitle: "Your tenants scan. You relax.",
    description: "Each property gets a unique QR code you can print and post in common areas, on doors, or in welcome packets. When a tenant has an issue, they scan with their phone camera — no app needed. A mobile-optimized form opens instantly where they describe the problem, select urgency, and snap photos.",
    icon: QrCode,
    color: "primary",
    highlights: [
      { icon: QrCode, text: "Unique QR code per property" },
      { icon: Globe, text: "Works on any phone with a camera" },
      { icon: Camera, text: "Photo uploads (up to 3 per request)" },
      { icon: MapPin, text: "Unit number auto-tagged" },
    ],
    visual: "qr",
  },
  {
    id: "dashboard",
    badge: "Management",
    title: "Smart Landlord Dashboard",
    subtitle: "Every request, one screen.",
    description: "See all maintenance requests across your entire portfolio in a single view. Filter by status (New, In-Progress, Completed), search by tenant or issue, and get real-time analytics. Each request card shows tenant contact info, photos, urgency badges, and a full communication timeline.",
    icon: ClipboardList,
    color: "blue",
    highlights: [
      { icon: Search, text: "Search and filter requests instantly" },
      { icon: BarChart3, text: "Analytics: total, new, in-progress, completed" },
      { icon: MessageSquare, text: "Internal notes per request" },
      { icon: Bell, text: "Status badges with color coding" },
    ],
    visual: "dashboard",
  },
  {
    id: "tenant-tracking",
    badge: "Tenant Experience",
    title: "Tenant Request Tracking",
    subtitle: "Happy tenants, fewer phone calls.",
    description: "After submitting a request, tenants receive a unique tracking code. They can check the status of their request anytime at your tracking page — no account or login needed. When you update a status from 'New' to 'In-Progress' to 'Completed', tenants see it immediately. No more 'when is this getting fixed?' calls.",
    icon: Smartphone,
    color: "emerald",
    highlights: [
      { icon: Shield, text: "Unique 8-character tracking code" },
      { icon: Clock, text: "Real-time status updates" },
      { icon: Smartphone, text: "Mobile-friendly tracking page" },
      { icon: ShieldCheck, text: "No login or account required" },
    ],
    visual: "tracking",
  },
  {
    id: "cost-tracking",
    badge: "Financial",
    title: "Repair Cost Tracking & Reports",
    subtitle: "Tax season? Handled.",
    description: "Log the cost of every repair directly on the request — description, amount, and vendor. See spending summaries across your entire portfolio, filtered by date range and property. When tax season comes, export everything to CSV with one click. Know exactly what you spent, where you spent it, and who did the work.",
    icon: DollarSign,
    color: "yellow",
    highlights: [
      { icon: Receipt, text: "Log costs per repair with vendor details" },
      { icon: TrendingUp, text: "Spending analytics per property" },
      { icon: FileDown, text: "One-click CSV export for taxes" },
      { icon: BarChart3, text: "Average cost per request tracking" },
    ],
    visual: "costs",
  },
  {
    id: "scheduled-maintenance",
    badge: "Preventive",
    title: "Recurring Maintenance Scheduling",
    subtitle: "From reactive to proactive.",
    description: "Stop waiting for things to break. Set up recurring tasks like HVAC filter changes, smoke detector battery replacements, gutter cleaning, and pest control. Choose the frequency (weekly to annually), and TenantTrack automatically tracks when each task is due. Overdue tasks are highlighted in red so nothing slips through the cracks.",
    icon: CalendarClock,
    color: "purple",
    highlights: [
      { icon: CalendarClock, text: "6 frequency options (weekly to annually)" },
      { icon: Wrench, text: "Auto-calculates next due date" },
      { icon: Bell, text: "Overdue task highlighting" },
      { icon: Building2, text: "Per-property task assignment" },
    ],
    visual: "scheduled",
  },
  {
    id: "staff-management",
    badge: "Team",
    title: "Maintenance Staff Management",
    subtitle: "Assign work. Track progress.",
    description: "Add your maintenance team — handymen, plumbers, electricians, property managers — and assign incoming requests to the right person. See who's handling what, and keep everyone accountable without group texts or spreadsheets. Staff members are tied to your account so you stay in control.",
    icon: Users,
    color: "orange",
    highlights: [
      { icon: Users, text: "Unlimited staff members" },
      { icon: ClipboardList, text: "Assign requests to specific staff" },
      { icon: ShieldCheck, text: "Ownership verification on all actions" },
      { icon: Layers, text: "Manage across all properties" },
    ],
    visual: "staff",
  },
];

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; lightBg: string }> = {
  primary: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20", lightBg: "bg-primary/5" },
  blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", lightBg: "bg-blue-500/5" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", lightBg: "bg-emerald-500/5" },
  yellow: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20", lightBg: "bg-yellow-500/5" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20", lightBg: "bg-purple-500/5" },
  orange: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20", lightBg: "bg-orange-500/5" },
};

function FeatureVisual({ type, color }: { type: string; color: string }) {
  const c = COLOR_MAP[color];

  if (type === "qr") {
    return (
      <div className={`rounded-3xl ${c.lightBg} border ${c.border} p-8 flex flex-col items-center gap-4`}>
        <div className={`h-32 w-32 rounded-2xl ${c.bg} flex items-center justify-center`}>
          <QrCode className={`h-20 w-20 ${c.text}`} />
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-xs">Scan</Badge>
          <Badge variant="outline" className="text-xs">Report</Badge>
          <Badge variant="outline" className="text-xs">Done</Badge>
        </div>
        <p className="text-xs text-muted-foreground text-center">Tenant scans QR with phone camera</p>
      </div>
    );
  }

  if (type === "dashboard") {
    return (
      <div className={`rounded-3xl ${c.lightBg} border ${c.border} p-6`}>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: "Total", value: "24", color: "text-foreground" },
            { label: "New", value: "8", color: "text-blue-400" },
            { label: "Active", value: "12", color: "text-yellow-400" },
            { label: "Done", value: "4", color: "text-green-400" },
          ].map((s) => (
            <div key={s.label} className="bg-card/80 rounded-xl p-3 text-center border border-border">
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {["Leaky faucet — Unit 3A", "Broken AC — Unit 7B", "Door lock — Unit 1C"].map((item, i) => (
            <div key={i} className="bg-card/80 rounded-xl p-3 flex items-center justify-between border border-border">
              <span className="text-xs text-foreground truncate">{item}</span>
              <Badge variant={i === 0 ? "destructive" : i === 1 ? "warning" : "default"} className="text-[10px] shrink-0 ml-2">
                {i === 0 ? "Emergency" : i === 1 ? "In Progress" : "New"}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "tracking") {
    return (
      <div className={`rounded-3xl ${c.lightBg} border ${c.border} p-6 flex flex-col items-center gap-4`}>
        <div className="bg-card/80 rounded-2xl p-5 border border-border w-full max-w-xs">
          <p className="text-xs text-muted-foreground mb-1">Tracking Code</p>
          <p className="font-mono text-2xl font-bold text-primary tracking-wider text-center">A7F3B9E2</p>
        </div>
        <div className="flex items-center gap-3 w-full max-w-xs">
          <div className="flex flex-col items-center">
            <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center"><Check className="h-4 w-4 text-green-400" /></div>
            <div className="w-0.5 h-6 bg-green-500/30"></div>
          </div>
          <div>
            <p className="text-xs font-bold text-green-400">Submitted</p>
            <p className="text-[10px] text-muted-foreground">Mar 1, 9:30 AM</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full max-w-xs">
          <div className="flex flex-col items-center">
            <div className="h-8 w-8 rounded-full bg-yellow-500/20 flex items-center justify-center"><Clock className="h-4 w-4 text-yellow-400" /></div>
            <div className="w-0.5 h-6 bg-border"></div>
          </div>
          <div>
            <p className="text-xs font-bold text-yellow-400">In Progress</p>
            <p className="text-[10px] text-muted-foreground">Plumber scheduled</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full max-w-xs">
          <div className="flex flex-col items-center">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"><Check className="h-4 w-4 text-muted-foreground" /></div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Completed</p>
            <p className="text-[10px] text-muted-foreground">Pending</p>
          </div>
        </div>
      </div>
    );
  }

  if (type === "costs") {
    return (
      <div className={`rounded-3xl ${c.lightBg} border ${c.border} p-6`}>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: "Total Spent", value: "$2,450" },
            { label: "Avg/Request", value: "$175" },
            { label: "Repairs", value: "14" },
          ].map((s) => (
            <div key={s.label} className="bg-card/80 rounded-xl p-3 text-center border border-border">
              <p className="text-sm font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {[
            { desc: "Plumber — Kitchen faucet", cost: "$285", prop: "Oak St Apts" },
            { desc: "Electrician — Outlet repair", cost: "$150", prop: "Pine Villa" },
            { desc: "HVAC — Filter replacement", cost: "$95", prop: "Oak St Apts" },
          ].map((item, i) => (
            <div key={i} className="bg-card/80 rounded-xl p-3 flex items-center justify-between border border-border">
              <div className="min-w-0">
                <p className="text-xs text-foreground truncate">{item.desc}</p>
                <p className="text-[10px] text-muted-foreground">{item.prop}</p>
              </div>
              <span className="text-xs font-bold text-yellow-400 shrink-0 ml-2">{item.cost}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-center">
          <Badge variant="outline" className="text-xs gap-1"><FileDown className="h-3 w-3" /> Export CSV</Badge>
        </div>
      </div>
    );
  }

  if (type === "scheduled") {
    return (
      <div className={`rounded-3xl ${c.lightBg} border ${c.border} p-6`}>
        <div className="space-y-3">
          {[
            { title: "HVAC Filter Change", freq: "Monthly", due: "Mar 15", status: "upcoming" },
            { title: "Smoke Detector Check", freq: "Biannually", due: "Feb 28", status: "overdue" },
            { title: "Gutter Cleaning", freq: "Quarterly", due: "Apr 1", status: "future" },
          ].map((task, i) => (
            <div key={i} className={`bg-card/80 rounded-xl p-4 border ${
              task.status === "overdue" ? "border-red-500/30" : task.status === "upcoming" ? "border-yellow-500/30" : "border-border"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-foreground">{task.title}</p>
                <Badge variant={task.status === "overdue" ? "destructive" : task.status === "upcoming" ? "warning" : "default"} className="text-[10px]">
                  {task.status === "overdue" ? "Overdue" : task.status === "upcoming" ? "Due Soon" : "Scheduled"}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span>{task.freq}</span>
                <span>Due: {task.due}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "staff") {
    return (
      <div className={`rounded-3xl ${c.lightBg} border ${c.border} p-6`}>
        <div className="space-y-3">
          {[
            { name: "Mike R.", role: "Plumber", assigned: 3 },
            { name: "Sarah K.", role: "Electrician", assigned: 2 },
            { name: "James T.", role: "General", assigned: 5 },
          ].map((staff, i) => (
            <div key={i} className="bg-card/80 rounded-xl p-4 flex items-center gap-3 border border-border">
              <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 font-bold text-sm shrink-0">
                {staff.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">{staff.name}</p>
                <p className="text-[10px] text-muted-foreground">{staff.role}</p>
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0">{staff.assigned} active</Badge>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

export default function Features() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      <nav className="fixed top-0 w-full z-50 glass-panel border-b-0">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" data-testid="link-home">
            <img src={logoPng} alt="TenantTrack Logo" className="h-10 w-10 object-contain rounded-lg" />
            <span className="font-display font-bold text-xl text-foreground">TenantTrack</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-back-home">
              Home
            </Link>
            <Button onClick={() => window.location.href = '/api/login'} className="rounded-full shadow-lg shadow-primary/20" data-testid="button-nav-login">
              Get Started Free
            </Button>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-16 px-6 lg:pt-44 lg:pb-20 max-w-5xl mx-auto text-center">
        <Badge variant="outline" className="mb-6 text-sm px-4 py-1.5">Features</Badge>
        <h1 className="text-4xl md:text-6xl font-display font-extrabold tracking-tight text-foreground leading-[1.1] mb-6" data-testid="text-features-title">
          Everything a landlord needs. <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">Nothing they don't.</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          TenantTrack replaces scattered texts, spreadsheets, and sticky notes with one organized system. Here's exactly what you get.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {HERO_FEATURES.map((f, i) => (
            <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border text-sm">
              <Check className="h-4 w-4 text-primary shrink-0" />
              <span className="text-foreground">{f}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 pb-24">
        {DETAILED_FEATURES.map((feature, index) => {
          const c = COLOR_MAP[feature.color];
          const isReversed = index % 2 === 1;

          return (
            <section
              key={feature.id}
              id={feature.id}
              className="py-16 md:py-24"
              data-testid={`section-${feature.id}`}
            >
              <div className={`flex flex-col ${isReversed ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-12 lg:gap-16`}>
                <div className="flex-1 w-full">
                  <Badge variant="outline" className={`mb-4 text-xs ${c.text} border-current`}>
                    {feature.badge}
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-display font-extrabold text-foreground mb-2">
                    {feature.title}
                  </h2>
                  <p className={`text-lg font-medium ${c.text} mb-4`}>{feature.subtitle}</p>
                  <p className="text-muted-foreground leading-relaxed mb-8">{feature.description}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {feature.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                        <div className={`h-9 w-9 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
                          <h.icon className={`h-4 w-4 ${c.text}`} />
                        </div>
                        <span className="text-sm text-foreground">{h.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex-1 w-full max-w-md lg:max-w-lg">
                  <FeatureVisual type={feature.visual} color={feature.color} />
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <section className="py-16 px-6 border-y border-border bg-card/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-extrabold text-foreground mb-4">
              Why Landlords Switch to TenantTrack
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Clock, stat: "75%", label: "Less time on maintenance coordination" },
              { icon: Phone, stat: "90%", label: "Fewer tenant phone calls & texts" },
              { icon: DollarSign, stat: "100%", label: "Of repair costs documented for taxes" },
              { icon: Star, stat: "5 min", label: "Setup time from signup to first QR code" },
            ].map((item, i) => (
              <div key={i} className="text-center p-6 rounded-2xl bg-card border border-border">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-3xl font-display font-extrabold text-foreground mb-1">{item.stat}</p>
                <p className="text-sm text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-extrabold text-foreground mb-4">
            Plans That Grow With You
          </h2>
          <p className="text-muted-foreground">All plans include a 14-day free trial. No credit card required.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: "Starter", price: 29, desc: "1–5 units", icon: Building2, features: ["QR maintenance system", "Basic dashboard", "Email notifications", "Photo uploads"] },
            { name: "Growth", price: 59, desc: "6–25 units", icon: Zap, highlight: true, features: ["Everything in Starter", "Priority highlighting", "Maintenance history", "Basic reporting", "Custom QR per unit", "Staff assignment"] },
            { name: "Pro", price: 99, desc: "25+ units", icon: Crown, features: ["Everything in Growth", "Advanced reporting", "CSV export", "Cost tracking", "Scheduled maintenance", "Priority support"] },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-6 border flex flex-col ${
                plan.highlight
                  ? "border-primary shadow-xl shadow-primary/10 ring-2 ring-primary/20 bg-card"
                  : "border-border bg-card shadow-sm"
              }`}
              data-testid={`plan-${plan.name.toLowerCase()}`}
            >
              {plan.highlight && (
                <Badge className="bg-primary text-primary-foreground text-xs font-bold w-fit mb-4">Most Popular</Badge>
              )}
              <div className="mb-4">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.desc}</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-display font-extrabold">${plan.price}</span>
                <span className="text-muted-foreground">/mo</span>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.highlight ? "default" : "outline"}
                className="w-full rounded-xl"
                onClick={() => window.location.href = '/api/login'}
                data-testid={`button-plan-${plan.name.toLowerCase()}`}
              >
                Start Free Trial
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-primary/10 to-emerald-400/5 rounded-3xl p-12 md:p-16 border border-primary/20">
          <h2 className="text-3xl md:text-5xl font-display font-extrabold text-foreground mb-4">
            Ready to get organized?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Set up your first property in under 5 minutes. Your tenants will thank you.
          </p>
          <Button size="lg" className="rounded-full text-lg shadow-xl shadow-primary/20 gap-2 px-8" onClick={() => window.location.href = '/api/login'} data-testid="button-cta-final">
            Get Started Free
            <ArrowRight className="h-5 w-5" />
          </Button>
          <p className="text-sm text-muted-foreground mt-4">14-day free trial &middot; No credit card &middot; Cancel anytime</p>
        </div>
      </section>

      <footer className="border-t border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
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
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} TenantTrack. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link>
              <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
