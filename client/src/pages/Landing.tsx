import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { 
  QrCode, Smartphone, ShieldCheck, Mail, Phone, 
  ArrowRight, Check, DollarSign, CalendarClock, 
  Users, ClipboardList, Building2, Zap, Crown,
  ChevronDown, Star, BarChart3, FileDown, X, MessageSquare,
  LogIn, Eye, EyeOff, ChevronLeft, ChevronRight,
  Camera, Bell, Wrench, BarChart2, MapPin, Printer
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

const SLIDES = [
  {
    step: "01",
    title: "Sign Up & Add Your Properties",
    description: "Create your account in seconds. Add your rental properties with name and address — each one instantly gets its own unique QR code.",
    bullets: ["Takes under 5 minutes to set up", "Add unlimited units per property", "No technical knowledge needed"],
    accent: "from-emerald-500/20 to-primary/10",
    visual: "add-property",
  },
  {
    step: "02",
    title: "Print & Post Your QR Code",
    description: "Download and print a QR flyer for each property or unit. Stick it near the front door, mailbox, or anywhere tenants will see it.",
    bullets: ["Print-ready PDF flyer included", "Works with any phone camera", "No tenant account or app required"],
    accent: "from-blue-500/20 to-primary/10",
    visual: "qr-code",
  },
  {
    step: "03",
    title: "Tenant Scans & Reports in 60 Seconds",
    description: "Tenants point their phone camera at the QR code — a simple form opens in their browser instantly. No app download, no account creation.",
    bullets: ["Works on iOS and Android", "Upload photos of the issue", "Choose urgency level"],
    accent: "from-violet-500/20 to-primary/10",
    visual: "tenant-form",
  },
  {
    step: "04",
    title: "You Get Notified Instantly",
    description: "The moment a tenant submits a request, you get an email with every detail — issue type, urgency, unit number, and photos attached.",
    bullets: ["Instant email notification", "Tenant gets a tracking code", "Full details in one place"],
    accent: "from-yellow-500/20 to-primary/10",
    visual: "notification",
  },
  {
    step: "05",
    title: "Manage Everything from Your Dashboard",
    description: "See all requests organized by status and urgency. Update status, add notes, assign to your maintenance staff, and keep tenants informed.",
    bullets: ["Filter by property, status, urgency", "Assign to staff in one click", "Two-way tenant messaging"],
    accent: "from-orange-500/20 to-primary/10",
    visual: "dashboard",
  },
  {
    step: "06",
    title: "Track Costs & Schedule Preventive Maintenance",
    description: "Log repair costs per request with vendor info. Set up recurring tasks like HVAC filter changes. Export cost reports for tax time.",
    bullets: ["Cost reports exportable to CSV", "Recurring maintenance reminders", "Full spending history per property"],
    accent: "from-rose-500/20 to-primary/10",
    visual: "costs",
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
  {
    icon: MessageSquare,
    title: "Tenant Messaging",
    desc: "Two-way messaging tied to each request. Tenants message from their tracking page, landlords reply from the dashboard. No phone tag.",
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

function SlideVisual({ type }: { type: string }) {
  if (type === "add-property") return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-xl w-full max-w-sm mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <Building2 className="h-4 w-4 text-primary" />
        </div>
        <span className="font-bold text-sm">Add New Property</span>
      </div>
      <div className="space-y-3">
        <div>
          <div className="text-xs text-muted-foreground mb-1">Property Name</div>
          <div className="h-9 bg-muted rounded-lg px-3 flex items-center text-sm text-foreground border border-border">Sunset Apartments</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Address</div>
          <div className="h-9 bg-muted rounded-lg px-3 flex items-center text-sm text-foreground border border-border">450 Sunset Blvd, Portland, OR</div>
        </div>
        <div className="pt-2">
          <div className="h-10 bg-primary rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-primary-foreground">
            <Check className="h-4 w-4" /> Save Property & Get QR Code
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          {["Riverside Condos", "Oak View Apts"].map(name => (
            <div key={name} className="p-3 rounded-xl bg-muted/60 border border-border flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-xs truncate font-medium">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (type === "qr-code") return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-xl w-full max-w-sm mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-bold text-sm">Sunset Apartments</p>
          <p className="text-xs text-muted-foreground">Unit 3A — QR Code</p>
        </div>
        <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
          <QrCode className="h-4 w-4 text-blue-500" />
        </div>
      </div>
      <div className="bg-white rounded-2xl p-4 flex items-center justify-center mb-4">
        <svg viewBox="0 0 100 100" className="h-36 w-36" fill="none">
          {[0,1,2,3,4,5,6].map(r => [0,1,2,3,4,5,6].map(c => {
            const edge = (r < 2 && c < 2) || (r < 2 && c > 4) || (r > 4 && c < 2);
            const inner = !edge && Math.random() > 0.45;
            return edge || inner ? <rect key={`${r}-${c}`} x={c*14+1} y={r*14+1} width={12} height={12} rx={2} fill="#111" /> : null;
          }))}
          <rect x="1" y="1" width="40" height="40" rx="4" fill="none" stroke="#111" strokeWidth="4" />
          <rect x="59" y="1" width="40" height="40" rx="4" fill="none" stroke="#111" strokeWidth="4" />
          <rect x="1" y="59" width="40" height="40" rx="4" fill="none" stroke="#111" strokeWidth="4" />
          <rect x="11" y="11" width="20" height="20" rx="2" fill="#111" />
          <rect x="69" y="11" width="20" height="20" rx="2" fill="#111" />
          <rect x="11" y="69" width="20" height="20" rx="2" fill="#111" />
        </svg>
      </div>
      <div className="text-center mb-4">
        <p className="text-xs text-muted-foreground">Scan with any phone camera to report maintenance</p>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 h-9 rounded-xl bg-primary flex items-center justify-center gap-1.5 text-xs font-semibold text-primary-foreground">
          <Printer className="h-3.5 w-3.5" /> Print Flyer
        </div>
        <div className="flex-1 h-9 rounded-xl bg-muted border border-border flex items-center justify-center gap-1.5 text-xs font-medium">
          <FileDown className="h-3.5 w-3.5 text-muted-foreground" /> Download PDF
        </div>
      </div>
    </div>
  );

  if (type === "tenant-form") return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xl w-full max-w-xs mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-7 w-7 rounded-lg bg-green-600/20 flex items-center justify-center">
          <Wrench className="h-3.5 w-3.5 text-green-700" />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-900">Sunset Apartments — Unit 3A</p>
          <p className="text-xs text-gray-500">Report a Maintenance Issue</p>
        </div>
      </div>
      <div className="space-y-2.5">
        <div>
          <p className="text-xs text-gray-500 mb-1">Issue Type</p>
          <div className="h-8 bg-gray-100 rounded-lg border border-gray-200 px-2.5 flex items-center text-xs text-gray-800">Plumbing</div>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Describe the problem</p>
          <div className="h-14 bg-gray-100 rounded-lg border border-gray-200 p-2 text-xs text-gray-800">Kitchen faucet leaking constantly under the sink...</div>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Urgency</p>
          <div className="flex gap-1.5">
            {["Low","Medium","High"].map(u => (
              <div key={u} className={`flex-1 h-7 rounded-lg text-xs flex items-center justify-center font-medium border ${u === "High" ? "bg-orange-100 border-orange-300 text-orange-700" : "bg-gray-100 border-gray-200 text-gray-500"}`}>{u}</div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg border border-gray-200 border-dashed">
          <Camera className="h-4 w-4 text-gray-400" />
          <span className="text-xs text-gray-500">Tap to add photos (optional)</span>
        </div>
        <div className="h-9 bg-green-600 rounded-xl flex items-center justify-center text-xs font-bold text-white gap-1">
          <ArrowRight className="h-3.5 w-3.5" /> Submit Request
        </div>
      </div>
    </div>
  );

  if (type === "notification") return (
    <div className="space-y-3 w-full max-w-sm mx-auto">
      <div className="bg-card rounded-2xl border border-border p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-yellow-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <Bell className="h-4 w-4 text-yellow-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold">New Maintenance Request</p>
              <span className="text-xs text-muted-foreground">just now</span>
            </div>
            <p className="text-xs text-muted-foreground">From: Maria Garcia — Unit 3A</p>
            <p className="text-xs text-foreground mt-1">Plumbing · <span className="text-orange-400 font-medium">High urgency</span></p>
          </div>
        </div>
      </div>
      <div className="bg-card rounded-2xl border border-primary/30 p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-bold text-primary">New Request — Sunset Apartments</span>
        </div>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex gap-2"><span className="font-medium text-foreground w-16 shrink-0">Unit:</span><span>3A</span></div>
          <div className="flex gap-2"><span className="font-medium text-foreground w-16 shrink-0">Issue:</span><span>Plumbing — Kitchen faucet leaking</span></div>
          <div className="flex gap-2"><span className="font-medium text-foreground w-16 shrink-0">Tenant:</span><span>Maria Garcia · 503-555-0101</span></div>
        </div>
        <div className="mt-3 h-8 bg-primary rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold text-primary-foreground">
          View Request <ArrowRight className="h-3 w-3" />
        </div>
      </div>
      <div className="bg-card rounded-2xl border border-border p-3 flex items-center gap-3">
        <div className="h-7 w-7 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
          <Check className="h-3.5 w-3.5 text-green-500" />
        </div>
        <div>
          <p className="text-xs font-medium">Tenant notified</p>
          <p className="text-xs text-muted-foreground">Tracking code TT-A4F2 sent to maria.g@email.com</p>
        </div>
      </div>
    </div>
  );

  if (type === "dashboard") return (
    <div className="space-y-2.5 w-full max-w-sm mx-auto">
      <div className="bg-card rounded-2xl border border-border p-3.5 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold">Maintenance Requests</span>
          <div className="ml-auto flex gap-1.5">
            {["All","New","In-Progress"].map(s => (
              <div key={s} className={`px-2 h-5 rounded-full text-[10px] flex items-center font-medium ${s === "All" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{s}</div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {[
            { unit: "3A", issue: "Plumbing", urgency: "High", status: "New", color: "text-orange-400", bg: "bg-orange-500/10" },
            { unit: "7B", issue: "Electrical", urgency: "Emergency", status: "In-Progress", color: "text-red-400", bg: "bg-red-500/10" },
            { unit: "12C", issue: "HVAC", urgency: "Medium", status: "Completed", color: "text-blue-400", bg: "bg-blue-500/10" },
          ].map(r => (
            <div key={r.unit} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/50 border border-border">
              <div className={`h-6 w-6 rounded-lg ${r.bg} flex items-center justify-center shrink-0`}>
                <Wrench className={`h-3 w-3 ${r.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">Unit {r.unit} — {r.issue}</p>
              </div>
              <div className={`px-1.5 h-4.5 rounded-full text-[9px] font-bold ${r.color} ${r.bg} flex items-center`}>{r.urgency}</div>
              <div className="text-[9px] text-muted-foreground">{r.status}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-card rounded-2xl border border-border p-3 flex items-center gap-3">
        <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
          <Users className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium">Assign to staff</p>
          <p className="text-xs text-muted-foreground">Mike Thompson · Plumber</p>
        </div>
        <div className="h-6 px-2 bg-primary rounded-lg flex items-center text-[10px] font-semibold text-primary-foreground">Assign</div>
      </div>
    </div>
  );

  if (type === "costs") return (
    <div className="space-y-2.5 w-full max-w-sm mx-auto">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Total Spent", val: "$600", icon: DollarSign, color: "text-primary bg-primary/10" },
          { label: "Avg/Request", val: "$150", icon: BarChart2, color: "text-blue-400 bg-blue-500/10" },
          { label: "Repairs", val: "4", icon: Wrench, color: "text-yellow-400 bg-yellow-500/10" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-2.5 text-center">
            <div className={`h-7 w-7 rounded-lg ${s.color} flex items-center justify-center mx-auto mb-1`}>
              <s.icon className="h-3.5 w-3.5" />
            </div>
            <p className="text-sm font-bold">{s.val}</p>
            <p className="text-[9px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-card rounded-2xl border border-border p-3.5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold">Repair Costs — Sunset Apts</span>
          <div className="flex items-center gap-1 px-2 h-5 rounded-full bg-primary/10 text-[9px] text-primary font-medium">
            <FileDown className="h-2.5 w-2.5" /> Export CSV
          </div>
        </div>
        <div className="space-y-2">
          {[
            { desc: "Plumber service call", vendor: "Portland Plumbing", amount: "$150" },
            { desc: "Replacement faucet", vendor: "Home Depot", amount: "$85" },
            { desc: "HVAC technician repair", vendor: "Cool Air Services", amount: "$320" },
          ].map(c => (
            <div key={c.desc} className="flex items-center gap-2 text-xs">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{c.desc}</p>
                <p className="text-muted-foreground text-[10px]">{c.vendor}</p>
              </div>
              <span className="font-bold text-primary shrink-0">{c.amount}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-card rounded-2xl border border-border p-3 flex items-center gap-3">
        <div className="h-7 w-7 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
          <CalendarClock className="h-3.5 w-3.5 text-yellow-500" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium">HVAC Filter Change</p>
          <p className="text-xs text-muted-foreground">Due in 15 days · Quarterly</p>
        </div>
        <div className="h-6 px-2 bg-muted border border-border rounded-lg flex items-center text-[10px] font-medium">Done</div>
      </div>
    </div>
  );

  return null;
}

export default function Landing() {
  const [showDemoLogin, setShowDemoLogin] = useState(() => window.location.search.includes("demo=1"));
  const [demoEmail, setDemoEmail] = useState("landlord@test.com");
  const [demoPassword, setDemoPassword] = useState("demo123");
  const [showPassword, setShowPassword] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState("");

  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (next: number, dir: "next" | "prev" = "next") => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setSlide((next + SLIDES.length) % SLIDES.length);
      setAnimating(false);
    }, 220);
  };

  useEffect(() => {
    if (paused) return;
    intervalRef.current = setInterval(() => goTo(slide + 1, "next"), 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [slide, paused, animating]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    setDemoError("");
    try {
      const res = await fetch("/api/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: demoEmail, password: demoPassword }),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        setDemoError(data.message || "Login failed");
        return;
      }
      window.location.href = "/";
    } catch {
      setDemoError("Connection failed. Please try again.");
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      {showDemoLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={() => setShowDemoLogin(false)}>
          <div className="bg-card border border-border rounded-2xl p-8 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-foreground">Try the Demo</h3>
                <p className="text-sm text-muted-foreground mt-1">Explore TenantTrack with sample data</p>
              </div>
              <button onClick={() => setShowDemoLogin(false)} className="text-muted-foreground hover:text-foreground p-1" data-testid="button-close-demo">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                <Input
                  type="email"
                  value={demoEmail}
                  onChange={e => setDemoEmail(e.target.value)}
                  className="h-12"
                  data-testid="input-demo-email"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={demoPassword}
                    onChange={e => setDemoPassword(e.target.value)}
                    className="h-12 pr-12"
                    data-testid="input-demo-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              {demoError && (
                <p className="text-sm text-red-400" data-testid="text-demo-error">{demoError}</p>
              )}
              <Button
                className="w-full h-12 rounded-xl text-base"
                onClick={handleDemoLogin}
                disabled={demoLoading}
                data-testid="button-demo-login"
              >
                {demoLoading ? "Logging in..." : "Log In to Demo"}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Demo credentials are pre-filled. Just click "Log In to Demo" to explore.
              </p>
            </div>
          </div>
        </div>
      )}

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
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setShowDemoLogin(true)} className="rounded-full border-primary/30 text-primary hover:bg-primary/10" data-testid="button-nav-demo">
              <LogIn className="h-4 w-4 mr-1.5" />
              Try Demo
            </Button>
            <Button onClick={() => window.location.href = '/login'} className="rounded-full shadow-lg shadow-primary/20" data-testid="button-nav-login">
              Landlord Login
            </Button>
          </div>
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
              <Button size="lg" className="w-full sm:w-auto rounded-full text-lg shadow-xl shadow-primary/20 gap-2" onClick={() => window.location.href = '/login'} data-testid="button-get-started">
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

      <section id="how-it-works" className="py-24 px-4 md:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 text-sm px-4 py-1">How It Works</Badge>
          <h2 className="text-4xl md:text-5xl font-display font-extrabold text-foreground mb-4">
            See It in Action
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From QR code to completed repair — here's exactly how TenantTrack works, step by step.
          </p>
        </div>

        <div
          className="relative bg-card border border-border rounded-3xl overflow-hidden shadow-2xl shadow-black/20"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          data-testid="slideshow-container"
        >
          <div className={`bg-gradient-to-br ${SLIDES[slide].accent} absolute inset-0 transition-all duration-700 pointer-events-none`} />

          <div className="relative z-10 flex flex-col lg:flex-row min-h-[520px]">
            <div className="flex-1 flex flex-col justify-center p-8 lg:p-12">
              <div className="inline-flex items-center gap-2 mb-6">
                <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center">
                  <span className="text-xs font-bold text-primary-foreground">{SLIDES[slide].step}</span>
                </div>
                <span className="text-sm font-semibold text-primary">Step {parseInt(SLIDES[slide].step)} of {SLIDES.length}</span>
              </div>

              <h3
                className={`text-2xl md:text-3xl font-display font-extrabold text-foreground mb-4 transition-all duration-200 ${animating ? (direction === "next" ? "-translate-x-4 opacity-0" : "translate-x-4 opacity-0") : "translate-x-0 opacity-100"}`}
              >
                {SLIDES[slide].title}
              </h3>
              <p
                className={`text-muted-foreground text-lg leading-relaxed mb-6 transition-all duration-200 delay-75 ${animating ? "opacity-0" : "opacity-100"}`}
              >
                {SLIDES[slide].description}
              </p>

              <ul className={`space-y-2.5 mb-8 transition-all duration-200 delay-100 ${animating ? "opacity-0" : "opacity-100"}`}>
                {SLIDES[slide].bullets.map((b, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm">
                    <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-foreground">{b}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => goTo(slide - 1, "prev")}
                  className="h-10 w-10 rounded-full border border-border bg-card/80 hover:bg-card flex items-center justify-center transition-colors"
                  data-testid="button-slide-prev"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="flex gap-2">
                  {SLIDES.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goTo(i, i > slide ? "next" : "prev")}
                      className={`rounded-full transition-all duration-300 ${i === slide ? "w-8 h-2.5 bg-primary" : "w-2.5 h-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"}`}
                      data-testid={`button-slide-dot-${i}`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => goTo(slide + 1, "next")}
                  className="h-10 w-10 rounded-full border border-border bg-card/80 hover:bg-card flex items-center justify-center transition-colors"
                  data-testid="button-slide-next"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                <span className="ml-auto text-xs text-muted-foreground hidden sm:block">
                  {paused ? "Paused" : "Auto-advancing"}
                </span>
              </div>
            </div>

            <div className={`flex-1 flex items-center justify-center p-6 lg:p-10 lg:border-l border-border transition-all duration-300 ${animating ? (direction === "next" ? "translate-x-6 opacity-0" : "-translate-x-6 opacity-0") : "translate-x-0 opacity-100"}`}>
              <SlideVisual type={SLIDES[slide].visual} />
            </div>
          </div>

          <div className="relative z-10 border-t border-border bg-card/30 px-8 py-4 flex items-center gap-2 overflow-x-auto scrollbar-none">
            {SLIDES.map((s, i) => (
              <button
                key={i}
                onClick={() => goTo(i, i > slide ? "next" : "prev")}
                className={`shrink-0 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 whitespace-nowrap ${i === slide ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                data-testid={`button-slide-tab-${i}`}
              >
                {s.step}. {s.title.split(" ").slice(0, 3).join(" ")}…
              </button>
            ))}
          </div>
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
                  onClick={() => window.location.href = '/login'}
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
            <Button size="lg" className="rounded-full text-lg shadow-xl shadow-primary/20 gap-2 px-8" onClick={() => window.location.href = '/login'} data-testid="button-cta-final">
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
