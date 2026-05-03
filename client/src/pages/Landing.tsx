import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { 
  QrCode, ShieldCheck, Mail, Phone, 
  ArrowRight, Check, DollarSign, CalendarClock, 
  Users, ClipboardList, Building2, Zap, Crown,
  Star, FileDown, X,
  LogIn, ChevronLeft, ChevronRight,
  Camera, Bell, Wrench, BarChart2, Printer,
  Sparkles, Link2, Calendar, Columns3, Globe, Send
} from "lucide-react";
import logoPng from "@assets/tenanttrack-final-logo.png";
import logoWide from "@assets/tenanttrack-wide-logo.png";
import bgGeo from "@assets/I_need_a_navy_blue,_white,_and_grey_background_image_of_geo-me_1774148774611.jpg";
import bgBuildings from "@assets/I_need_a_navy_blue,_white,_and_grey_background_image_of_rental_1774148774612.jpg";
import bgHeroTop from "@assets/homepagetop1_1774750600097.jpg";
import bgHomepage2 from "@assets/homepage2_1774750600096.jpg";
import bgFeatures1 from "@assets/featurespricingsection1_1774750600095.jpg";
import bgFeatures2 from "@assets/featurespricingsection2_1774750600095.jpg";
import bgFeatures3 from "@assets/featurespricingsection3_1774750600096.jpg";
import bgDashboard1 from "@assets/dashboard_preview1_1774750600094.jpg";
import bgMain1 from "@assets/main1_1774750600097.jpg";
import bgMain4 from "@assets/main4_1774750600099.jpg";
import bgSaas from "@assets/A_dark,_high-end_SaaS_background_with_a_deep_navy_blue_to_blac_1774750600093.jpg";

const PLANS = [
  {
    tier: "starter",
    name: "Starter",
    description: "For small landlords (1–5 units)",
    price: 29,
    icon: Building2,
    features: [
      "QR maintenance system",
      "Vendor dispatch & tracking",
      "TenantTrack scores (0–100)",
      "Vendor magic link portal",
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
      "Auto-dispatch engine",
      "Scheduling calendar",
      "Job status pipeline",
      "Proof of completion capture",
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
      "Advanced vendor analytics",
      "Cost tracking & CSV export",
      "Dispatch board (Kanban)",
      "Bilingual tenant UI",
      "Priority support",
    ],
  },
];

const SLIDES = [
  // ── HOW IT WORKS ──────────────────────────────────────
  {
    section: "How It Works",
    stepLabel: "Step 1 of 9",
    tabLabel: "Add Properties",
    title: "Sign Up & Add Your Properties",
    description: "Create your account in seconds. Add your rental properties with name and address — each one instantly gets its own unique QR code.",
    bullets: ["Takes under 5 minutes to set up", "Add unlimited units per property", "No technical knowledge needed"],
    accent: "from-orange-500/15 to-primary/10",
    visual: "add-property",
  },
  {
    section: "How It Works",
    stepLabel: "Step 2 of 9",
    tabLabel: "QR Codes",
    title: "Get a Unique QR Code for Every Property",
    description: "Each property and unit gets its own scannable QR code. Print it, laminate it, and stick it near the door. Your tenants will always know where to report issues.",
    bullets: ["Print-ready flyer included, one click", "Works with iPhone and Android camera", "Each unit can have its own separate code"],
    accent: "from-orange-500/20 to-primary/10",
    visual: "qr-code",
  },
  {
    section: "How It Works",
    stepLabel: "Step 3 of 9",
    tabLabel: "Tenant Reports",
    title: "Tenants Report Issues in Under 60 Seconds",
    description: "No app to download. No account to create. Tenants open their phone camera, point it at the QR code, and a simple form opens instantly in their browser.",
    bullets: ["Select issue type & describe the problem", "Upload photos right from their phone", "Pick urgency: Low, Medium, High, or Emergency"],
    accent: "from-violet-500/20 to-primary/10",
    visual: "tenant-form",
  },
  {
    section: "How It Works",
    stepLabel: "Step 4 of 9",
    tabLabel: "Instant Alerts",
    title: "You're Notified the Moment It's Submitted",
    description: "The instant a tenant submits a request, you receive an email with every detail — property, unit, issue type, urgency level, description, tenant contact, and photos.",
    bullets: ["Instant email with full details", "Tenant receives a unique tracking code", "No more missed texts or voicemails"],
    accent: "from-yellow-500/20 to-primary/10",
    visual: "notification",
  },
  {
    section: "How It Works",
    stepLabel: "Step 5 of 9",
    tabLabel: "Auto-Dispatch",
    title: "Smart Vendor Dispatch — Manual, Recommend, or Auto",
    description: "Choose how you want to assign jobs. TenantTrack's dispatch engine scores every vendor based on trade match, trust score, emergency availability, workload, and more — then recommends the best fit or assigns them automatically.",
    bullets: [
      "Vendors ranked by trust score, trade match & availability",
      "Auto-assign mode dispatches your top vendor instantly",
      "See the full scoring breakdown — why each vendor was picked",
      "Preferred vendors get priority; no-shows get penalized",
    ],
    accent: "from-primary/20 to-yellow-500/10",
    visual: "auto-dispatch",
  },
  {
    section: "How It Works",
    stepLabel: "Step 6 of 9",
    tabLabel: "Vendor Portal",
    title: "Vendors Accept Jobs via Secure Magic Link",
    description: "When you dispatch a vendor, they receive an email with a one-click magic link — no login, no app. They can accept, decline, propose a new time, add notes, and mark jobs complete — all from their phone.",
    bullets: [
      "One-click magic link — no vendor account needed",
      "Vendor can accept, decline, or propose a new time",
      "Add job notes and mark work as complete",
      "Links expire after 7 days; revoke or regenerate anytime",
    ],
    accent: "from-orange-500/20 to-amber-500/10",
    visual: "vendor-portal",
  },
  {
    section: "How It Works",
    stepLabel: "Step 7 of 9",
    tabLabel: "Scheduling",
    title: "Visual Scheduling Calendar with Conflict Detection",
    description: "Schedule vendor visits on a full calendar view — week, day, or list. TenantTrack automatically detects scheduling conflicts and shows urgency at a glance so you never double-book a vendor.",
    bullets: [
      "Week, day, and list views for full visibility",
      "Drag-and-drop scheduling with conflict warnings",
      "Urgency color coding: emergency, high, medium, low",
      "Reschedule or unschedule jobs with one click",
    ],
    accent: "from-green-500/20 to-primary/10",
    visual: "scheduling",
  },
  {
    section: "How It Works",
    stepLabel: "Step 8 of 9",
    tabLabel: "Dashboard",
    title: "Track Every Job from One Command Center",
    description: "Your dispatch board shows every open request with real-time status, vendor assignment, and a full activity timeline. Move jobs through the pipeline and capture proof of completion — all without leaving the dashboard.",
    bullets: ["Job pipeline: Assigned → Scheduled → In-Progress → Completed", "Full activity timeline with timestamps on every action", "Proof of completion with invoice, notes, and materials"],
    accent: "from-orange-500/20 to-primary/10",
    visual: "dashboard",
  },
  {
    section: "How It Works",
    stepLabel: "Step 9 of 9",
    tabLabel: "Costs & Reports",
    title: "Track Repair Costs & Stay Ahead of Maintenance",
    description: "Log the cost of every repair with vendor details. Set up recurring tasks — HVAC filters, smoke detector checks, fire extinguisher inspections — so nothing falls through the cracks. Export everything to CSV at tax time.",
    bullets: ["Log costs per repair with vendor info", "Recurring reminders for preventive tasks", "Export full cost history as CSV for taxes"],
    accent: "from-orange-500/20 to-primary/10",
    visual: "costs",
  },
  // ── WHY TENANTTRACK ───────────────────────────────────
  {
    section: "Why TenantTrack?",
    stepLabel: "The Problem",
    tabLabel: "The Problem",
    title: "Vendor Chaos Is Silently Costing You",
    description: "Most landlords dispatch vendors by memory, gut feel, and whoever picks up the phone. No records, no scores, no visibility. A bad contractor costs more than their invoice — in time, repeat trips, and tenant churn.",
    bullets: [
      "No-shows with no paper trail to defend yourself",
      "Repeating the same bad contractor because you forgot",
      "Zero visibility once a job is \"assigned\"",
      "Invoices and completion records scattered everywhere",
    ],
    accent: "from-red-500/15 to-red-900/5",
    visual: "why-pains",
  },
  {
    section: "Why TenantTrack?",
    stepLabel: "The Solution",
    tabLabel: "The Solution",
    title: "Know Who to Call. Know When It's Done.",
    description: "TenantTrack gives every contractor a performance score based on ratings, completion rate, and job history. Dispatch smarter, track every status change, and capture proof of completion — all in one place.",
    bullets: [
      "TenantTrack scores eliminate the guesswork",
      "Auto-dispatch assigns your top vendor in seconds",
      "Vendors respond via magic link — no app needed",
      "Full activity log on every request — complete paper trail",
    ],
    accent: "from-primary/15 to-indigo-900/15",
    visual: "why-comparison",
  },
  {
    section: "Why TenantTrack?",
    stepLabel: "Real Results",
    tabLabel: "Real Results",
    title: "Landlords Who Switch Don't Go Back",
    description: "Once your vendor network is scored and your dispatch is automated, you stop firefighting and start scaling. TenantTrack pays for itself the first time you avoid a bad contractor repeat.",
    bullets: [
      "Set up in under 5 minutes, no IT help needed",
      "Tenants love it — scan, report, track",
      "Vendor scorecards protect your time and money",
      "14-day free trial, cancel anytime",
    ],
    accent: "from-violet-500/15 to-primary/10",
    visual: "why-results",
  },
  // ── PRICING ───────────────────────────────────────────
  {
    section: "Start Today",
    stepLabel: "Choose a Plan",
    tabLabel: "Pricing",
    title: "Simple Pricing, No Surprises",
    description: "All plans include a 14-day free trial — no credit card required to start. Pick the plan that fits your portfolio size, and upgrade anytime as you grow.",
    bullets: [
      "No setup fees, no contracts, cancel anytime",
      "Upgrade or downgrade at any time",
      "All plans include QR codes, dashboard & email alerts",
    ],
    accent: "from-orange-500/15 to-orange-400/10",
    visual: "pricing",
  },
];

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "TenantTrack Scores",
    desc: "Every vendor gets a 0–100 trust score based on ratings, completion rate, no-show history, and job tenure. Know who's reliable before you call.",
  },
  {
    icon: QrCode,
    title: "QR Maintenance Requests",
    desc: "Tenants scan a property QR code and submit an issue in 60 seconds — with photos, urgency, and contact info. No app, no account required.",
  },
  {
    icon: Sparkles,
    title: "Auto-Dispatch Engine",
    desc: "Score vendors on trade match, trust score, workload, emergency availability, and service area. Recommend the best or auto-assign them instantly.",
  },
  {
    icon: Link2,
    title: "Vendor Portal & Magic Links",
    desc: "Vendors receive a secure one-click link to accept, decline, or propose a new time. No login needed — works on any phone.",
  },
  {
    icon: Calendar,
    title: "Scheduling Calendar",
    desc: "Visual week, day, and list views with conflict detection. Schedule vendor visits, see urgency at a glance, and reschedule with one click.",
  },
  {
    icon: ClipboardList,
    title: "Job Status Pipeline",
    desc: "Track every job from New → Assigned → Scheduled → In-Progress → Completed. Full visibility with activity timeline and timestamps.",
  },
  {
    icon: Columns3,
    title: "Dispatch Board",
    desc: "Kanban-style dispatch board shows all requests by status. Drag jobs through the pipeline, assign vendors, and track progress visually.",
  },
  {
    icon: Send,
    title: "Email Notifications",
    desc: "Automated emails to landlords, vendors, and tenants at every stage — new requests, dispatch confirmations, vendor responses, and completions.",
  },
  {
    icon: Check,
    title: "Proof of Completion",
    desc: "Capture completion notes, invoice numbers, materials used, and vendor photos when a job is done. Full paper trail on every request.",
  },
  {
    icon: DollarSign,
    title: "Cost Tracking & Export",
    desc: "Log repair costs per request with vendor details. Export your full cost history to CSV at tax time — your accountant will love you.",
  },
  {
    icon: Globe,
    title: "Bilingual Tenant UI",
    desc: "Tenant-facing forms support English and Spanish out of the box. Tenants choose their language — no extra setup needed.",
  },
  {
    icon: CalendarClock,
    title: "Scheduled Maintenance",
    desc: "Set up recurring tasks like HVAC filter changes, smoke detector checks, and fire extinguisher inspections. Never miss preventive maintenance.",
  },
];

const TESTIMONIALS = [
  {
    quote: "The vendor trust scores changed everything. I used to just call whoever picked up. Now I dispatch the highest-rated plumber in under a minute.",
    name: "Property Manager",
    role: "12 units in Portland, OR",
    stars: 5,
  },
  {
    quote: "I had a contractor no-show twice before TenantTrack flagged his record. That alone saved me from a third bad experience.",
    name: "Independent Landlord",
    role: "18 units in Austin, TX",
    stars: 5,
  },
  {
    quote: "Proof of completion with invoice numbers — my accountant called me a changed man. Everything is just there when I need it.",
    name: "Real Estate Investor",
    role: "22 units in Denver, CO",
    stars: 5,
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card">
      <button
        className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(o => !o)}
        data-testid={`faq-toggle-${question.slice(0, 20).replace(/\s/g, "-").toLowerCase()}`}
      >
        <span className="font-semibold text-foreground text-sm md:text-base">{question}</span>
        <span className={`shrink-0 h-5 w-5 flex items-center justify-center rounded-full border border-border transition-transform ${open ? "rotate-180" : ""}`}>
          <svg className="h-3 w-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="px-6 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
          {answer}
        </div>
      )}
    </div>
  );
}

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
        <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <QrCode className="h-4 w-4 text-primary" />
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
            { unit: "12C", issue: "HVAC", urgency: "Medium", status: "Completed", color: "text-emerald-400", bg: "bg-emerald-500/10" },
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

  if (type === "auto-dispatch") return (
    <div className="space-y-2.5 w-full max-w-sm mx-auto">
      <div className="bg-card rounded-2xl border border-border p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold">Dispatch Recommendation</p>
            <p className="text-[10px] text-muted-foreground">Unit 3A — Plumbing</p>
          </div>
          <div className="ml-auto px-2 h-5 rounded-full bg-primary/10 text-[9px] text-primary font-bold flex items-center">Auto</div>
        </div>
        <div className="space-y-2">
          {[
            { name: "Portland Plumbing Co", score: 92, badge: "Best Match", top: true, reasons: ["Trade match", "Trust: 94", "Low workload"] },
            { name: "QuickFix Contractors", score: 78, badge: "", top: false, reasons: ["Trade match", "Trust: 82", "2 active jobs"] },
            { name: "AllPro Maintenance", score: 61, badge: "", top: false, reasons: ["General trade", "Trust: 70", "No-show: -8"] },
          ].map((v, i) => (
            <div key={i} className={`p-2.5 rounded-xl border ${v.top ? "bg-primary/5 border-primary/30" : "bg-muted/30 border-border"}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold ${v.top ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {i + 1}
                </div>
                <span className="text-xs font-medium flex-1">{v.name}</span>
                <span className={`text-xs font-bold ${v.top ? "text-primary" : "text-muted-foreground"}`}>{v.score}</span>
              </div>
              <div className="flex flex-wrap gap-1 ml-7">
                {v.reasons.map(r => (
                  <span key={r} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{r}</span>
                ))}
              </div>
              {v.top && (
                <div className="mt-2 ml-7 h-7 bg-primary rounded-lg flex items-center justify-center gap-1 text-[10px] font-semibold text-primary-foreground">
                  <Zap className="h-3 w-3" /> Auto-Assign Top Vendor
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border p-3 flex items-center gap-2.5">
        <div className="h-6 w-6 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
          <Check className="h-3 w-3 text-green-500" />
        </div>
        <p className="text-[10px] text-muted-foreground"><span className="font-medium text-foreground">Scoring factors:</span> trade, trust, workload, area, emergency, preferred, no-shows</p>
      </div>
    </div>
  );

  if (type === "vendor-portal") return (
    <div className="space-y-2.5 w-full max-w-sm mx-auto">
      <div className="bg-card rounded-2xl border border-border p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Link2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold">Vendor Job Portal</p>
            <p className="text-[10px] text-muted-foreground">Secure magic link — no login needed</p>
          </div>
        </div>
        <div className="bg-muted/50 rounded-xl p-3 mb-3 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-foreground">Job Details</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 font-bold">High Urgency</span>
          </div>
          <div className="space-y-1 text-[10px] text-muted-foreground">
            <div className="flex gap-2"><span className="font-medium text-foreground w-14 shrink-0">Property:</span><span>Sunset Apartments</span></div>
            <div className="flex gap-2"><span className="font-medium text-foreground w-14 shrink-0">Unit:</span><span>3A</span></div>
            <div className="flex gap-2"><span className="font-medium text-foreground w-14 shrink-0">Issue:</span><span>Plumbing — Kitchen faucet leak</span></div>
            <div className="flex gap-2"><span className="font-medium text-foreground w-14 shrink-0">Scheduled:</span><span>Tomorrow, 10:00 AM</span></div>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="h-9 bg-green-600 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold text-white">
            <Check className="h-3.5 w-3.5" /> Accept Job
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="h-8 bg-muted border border-border rounded-lg flex items-center justify-center gap-1 text-[10px] font-medium text-muted-foreground">
              <CalendarClock className="h-3 w-3" /> Propose Time
            </div>
            <div className="h-8 bg-muted border border-border rounded-lg flex items-center justify-center gap-1 text-[10px] font-medium text-muted-foreground">
              <X className="h-3 w-3" /> Decline
            </div>
          </div>
        </div>
      </div>
      <div className="bg-card rounded-xl border border-primary/20 p-3 flex items-center gap-2.5">
        <div className="h-6 w-6 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
          <ShieldCheck className="h-3 w-3 text-primary" />
        </div>
        <p className="text-[10px] text-muted-foreground"><span className="font-medium text-foreground">Secure link</span> — expires in 7 days, revoke or regenerate anytime</p>
      </div>
    </div>
  );

  if (type === "scheduling") return (
    <div className="space-y-2.5 w-full max-w-sm mx-auto">
      <div className="bg-card rounded-2xl border border-border p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold">This Week</span>
          </div>
          <div className="flex gap-1">
            {["Week", "Day", "List"].map(v => (
              <div key={v} className={`px-2 h-5 rounded-full text-[10px] flex items-center font-medium ${v === "Week" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{v}</div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-5 gap-1">
          {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, di) => (
            <div key={day} className="text-center">
              <p className="text-[9px] text-muted-foreground mb-1">{day}</p>
              <div className="space-y-1 min-h-[80px]">
                {di === 0 && (
                  <div className="p-1 rounded bg-red-500/15 border border-red-500/20">
                    <p className="text-[8px] font-bold text-red-400 truncate">Electrical</p>
                    <p className="text-[7px] text-muted-foreground">9 AM</p>
                  </div>
                )}
                {di === 1 && (
                  <>
                    <div className="p-1 rounded bg-orange-500/15 border border-orange-500/20">
                      <p className="text-[8px] font-bold text-orange-400 truncate">Plumbing</p>
                      <p className="text-[7px] text-muted-foreground">10 AM</p>
                    </div>
                    <div className="p-1 rounded bg-slate-500/15 border border-slate-500/20">
                      <p className="text-[8px] font-bold text-slate-400 truncate">HVAC</p>
                      <p className="text-[7px] text-muted-foreground">2 PM</p>
                    </div>
                  </>
                )}
                {di === 3 && (
                  <div className="p-1 rounded bg-yellow-500/15 border border-yellow-500/20">
                    <p className="text-[8px] font-bold text-yellow-400 truncate">General</p>
                    <p className="text-[7px] text-muted-foreground">11 AM</p>
                  </div>
                )}
                {di === 4 && (
                  <div className="p-1 rounded bg-green-500/15 border border-green-500/20">
                    <p className="text-[8px] font-bold text-green-400 truncate">Painting</p>
                    <p className="text-[7px] text-muted-foreground">1 PM</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-yellow-950/30 rounded-xl border border-yellow-500/20 p-2.5 flex items-center gap-2">
        <div className="h-5 w-5 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0 text-yellow-500 text-[9px] font-bold">!</div>
        <p className="text-[10px] text-yellow-400"><span className="font-bold">Conflict detected:</span> Portland Plumbing already booked Tue 10 AM</p>
      </div>
    </div>
  );

  if (type === "costs") return (
    <div className="space-y-2.5 w-full max-w-sm mx-auto">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Total Spent", val: "$600", icon: DollarSign, color: "text-primary bg-primary/10" },
          { label: "Avg/Request", val: "$150", icon: BarChart2, color: "text-primary bg-primary/10" },
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

  if (type === "why-pains") return (
    <div className="space-y-2.5 w-full max-w-sm mx-auto">
      <div className="bg-red-950/40 rounded-2xl border border-red-500/20 p-4">
        <p className="text-xs font-bold text-red-400 mb-3 flex items-center gap-1.5">
          <span className="h-4 w-4 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-[9px]">!</span>
          The Old Way — What Most Landlords Deal With
        </p>
        <div className="space-y-2">
          {[
            { time: "2:14 AM", msg: "Hey the toilet is overflowing AGAIN call me", urgent: true },
            { time: "Yesterday", msg: "Did you get my message about the heater?", urgent: false },
            { time: "Mon", msg: "AC broken unit 7B urgent please respond", urgent: true },
          ].map((t, i) => (
            <div key={i} className={`flex items-start gap-2 p-2.5 rounded-xl text-xs ${t.urgent ? "bg-red-500/10 border border-red-500/20" : "bg-muted/40 border border-border"}`}>
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">?</div>
              <div className="flex-1 min-w-0">
                <p className={`truncate ${t.urgent ? "text-red-300" : "text-muted-foreground"}`}>{t.msg}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">{t.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { icon: "📋", label: "Sticky Notes", sub: "Requests get lost" },
          { icon: "💸", label: "Shoebox Receipts", sub: "Tax time chaos" },
          { icon: "📅", label: "Missed Inspections", sub: "Liability risk" },
          { icon: "😤", label: "Angry Tenants", sub: "No status updates" },
        ].map(p => (
          <div key={p.label} className="bg-red-950/30 border border-red-500/15 rounded-xl p-3 text-center">
            <p className="text-lg mb-1">{p.icon}</p>
            <p className="text-[10px] font-bold text-red-300">{p.label}</p>
            <p className="text-[9px] text-muted-foreground">{p.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );

  if (type === "why-comparison") return (
    <div className="w-full max-w-sm mx-auto space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-red-950/30 border border-red-500/20 rounded-2xl p-3">
          <p className="text-[10px] font-bold text-red-400 mb-2.5 flex items-center gap-1">
            <X className="h-3 w-3" /> Without
          </p>
          <ul className="space-y-1.5">
            {[
              "Random texts & calls",
              "Dispatch by gut feel",
              "No vendor accountability",
              "Excel for costs (maybe)",
              "Missed maintenance",
              "Tenant frustration",
            ].map(t => (
              <li key={t} className="flex items-center gap-1.5 text-[10px] text-red-300/80">
                <X className="h-2.5 w-2.5 text-red-500 shrink-0" /> {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-primary/10 border border-primary/30 rounded-2xl p-3">
          <p className="text-[10px] font-bold text-primary mb-2.5 flex items-center gap-1">
            <Check className="h-3 w-3" /> With TenantTrack
          </p>
          <ul className="space-y-1.5">
            {[
              "QR scan, instant form",
              "Auto-dispatch engine",
              "Vendor trust scores",
              "Magic link portal",
              "Scheduling calendar",
              "Full activity timeline",
            ].map(t => (
              <li key={t} className="flex items-center gap-1.5 text-[10px] text-primary/90">
                <Check className="h-2.5 w-2.5 text-primary shrink-0" /> {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
          <DollarSign className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs font-bold">Pays for itself at tax time</p>
          <p className="text-[10px] text-muted-foreground">Cost reports save landlords 4+ hours per year</p>
        </div>
      </div>
    </div>
  );

  if (type === "why-results") return (
    <div className="w-full max-w-sm mx-auto space-y-2.5">
      <div className="grid grid-cols-2 gap-2">
        {[
          { val: "< 5 min", label: "Setup time", color: "text-primary" },
          { val: "60 sec", label: "Tenant report time", color: "text-primary" },
          { val: "0", label: "Apps for tenants", color: "text-green-400" },
          { val: "100%", label: "Mobile friendly", color: "text-violet-400" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-3 text-center">
            <p className={`text-xl font-display font-extrabold ${s.color}`}>{s.val}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex gap-1 mb-2">
          {[1,2,3,4,5].map(i => <Star key={i} className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />)}
        </div>
        <p className="text-xs text-foreground leading-relaxed mb-2">"I used to get random texts at 2 AM about leaky faucets. Now tenants scan the QR code and I see everything organized in my dashboard."</p>
        <div>
          <p className="text-[10px] font-bold">Property Manager</p>
          <p className="text-[10px] text-muted-foreground">12 units in Portland, OR</p>
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
          <Check className="h-3.5 w-3.5 text-green-400" />
        </div>
        <p className="text-[10px] text-muted-foreground"><span className="font-bold text-foreground">14-day free trial</span> · No credit card required · Cancel anytime</p>
      </div>
    </div>
  );

  if (type === "pricing") return (
    <div className="w-full max-w-sm mx-auto space-y-2">
      {[
        {
          name: "Starter", price: "$29", desc: "1–5 units", highlight: false,
          icon: Building2, iconColor: "text-muted-foreground",
          features: ["QR maintenance system", "Trust scores (0–100)", "Vendor magic links", "Email notifications"],
        },
        {
          name: "Growth", price: "$59", desc: "6–25 units", highlight: true,
          icon: Zap, iconColor: "text-primary",
          features: ["Everything in Starter", "Auto-dispatch engine", "Scheduling calendar", "Staff assignment"],
        },
        {
          name: "Pro", price: "$99", desc: "25+ units", highlight: false,
          icon: Crown, iconColor: "text-yellow-400",
          features: ["Everything in Growth", "Dispatch board", "Cost tracking & CSV", "Bilingual tenant UI"],
        },
      ].map(plan => (
        <div key={plan.name} className={`rounded-2xl border p-3.5 flex items-center gap-3 ${plan.highlight ? "bg-primary/10 border-primary/40 ring-1 ring-primary/20" : "bg-card border-border"}`}>
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${plan.highlight ? "bg-primary/20" : "bg-muted"}`}>
            <plan.icon className={`h-4 w-4 ${plan.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-bold">{plan.name}</p>
              {plan.highlight && <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-bold">Popular</span>}
              <p className="text-xs text-muted-foreground">{plan.desc}</p>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
              {plan.features.map(f => (
                <span key={f} className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Check className="h-2.5 w-2.5 text-primary shrink-0" />{f}
                </span>
              ))}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className={`text-lg font-display font-extrabold ${plan.highlight ? "text-primary" : "text-foreground"}`}>{plan.price}</p>
            <p className="text-[9px] text-muted-foreground">/mo</p>
          </div>
        </div>
      ))}
      <div className="bg-card border border-border rounded-xl p-3 text-center">
        <p className="text-xs text-muted-foreground">14-day free trial · No credit card · <span className="text-primary font-medium">Get started in 5 minutes</span></p>
      </div>
    </div>
  );

  return null;
}

export default function Landing() {
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

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      <nav className="fixed top-0 w-full z-50 glass-panel border-b-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <img src={logoPng} alt="TenantTrack Logo" className="h-8 w-8 sm:h-10 sm:w-10 object-contain rounded-lg" />
            <span className="font-display font-bold text-lg sm:text-xl text-foreground">TenantTrack</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <Link href="/features" className="hover:text-foreground transition-colors" data-testid="nav-features">Features</Link>
            <button onClick={() => scrollTo("how-it-works")} className="hover:text-foreground transition-colors" data-testid="nav-how-it-works">How It Works</button>
            <button onClick={() => scrollTo("pricing")} className="hover:text-foreground transition-colors" data-testid="nav-pricing">Pricing</button>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link href="/guide" className="hidden md:inline-flex">
              <Button variant="ghost" className="rounded-full text-muted-foreground hover:text-foreground" data-testid="button-nav-guide">
                Guide
              </Button>
            </Link>
            <Button onClick={() => window.location.href = '/login'} variant="outline" className="rounded-full border-primary/30 text-primary hover:bg-primary/10 text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-10 whitespace-nowrap" data-testid="button-nav-login">
              <LogIn className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
              Log In
            </Button>
            <Button onClick={() => window.location.href = '/login?signup=1'} className="rounded-full shadow-lg shadow-primary/20 text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-10 whitespace-nowrap" data-testid="button-nav-signup">
              Start Free Trial
            </Button>
          </div>
        </div>
      </nav>

      <section className="pt-24 pb-16 px-4 sm:px-6 sm:pt-32 lg:pt-48 lg:pb-32 max-w-7xl mx-auto relative">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <img src={bgHeroTop} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
        </div>
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
              Vendor Dispatch <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-300">Built on Trust.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
              Score every contractor. Auto-dispatch the best one. Track the job from assignment to completion. TenantTrack replaces spreadsheets, texts, and guesswork with a real dispatch command center.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button size="lg" className="w-full sm:w-auto rounded-full text-lg shadow-xl shadow-primary/20 gap-2" onClick={() => window.location.href = '/login?signup=1'} data-testid="button-get-started">
                Start Free Trial
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="lg" className="w-full sm:w-auto rounded-full text-lg text-muted-foreground hover:text-foreground" onClick={() => window.location.href = '/guide'} data-testid="button-see-guide">
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

          <div className="flex-1 w-full max-w-2xl animate-in fade-in zoom-in duration-1000 flex items-center justify-center">
              <img
                src={logoPng}
                alt="TenantTrack"
                className="w-full max-w-sm drop-shadow-2xl rounded-3xl"
              />
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

      <section id="how-it-works" className="py-24 px-4 md:px-6 max-w-7xl mx-auto relative">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <img src={bgHomepage2} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
        </div>
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 text-sm px-4 py-1">How It Works</Badge>
          <h2 className="text-4xl md:text-5xl font-display font-extrabold text-foreground mb-4">
            The Full Picture
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            How it works, why landlords switch, and what it costs — everything you need to decide in one place.
          </p>
        </div>

        <div
          className="relative bg-card border border-border rounded-3xl overflow-hidden shadow-2xl shadow-black/20"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          data-testid="slideshow-container"
        >
          <div className={`bg-gradient-to-br ${SLIDES[slide].accent} absolute inset-0 transition-all duration-700 pointer-events-none`} />

          <div className="relative z-10 flex flex-col lg:flex-row min-h-[560px]">
            <div className="flex-1 flex flex-col justify-center p-8 lg:p-12">
              <div className="flex items-center gap-2 mb-5">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-muted text-muted-foreground border border-border">
                  {SLIDES[slide].section}
                </span>
                <span className="text-xs text-muted-foreground">{SLIDES[slide].stepLabel}</span>
              </div>

              <h3
                className={`text-2xl md:text-3xl font-display font-extrabold text-foreground mb-4 transition-all duration-200 ${animating ? (direction === "next" ? "-translate-x-4 opacity-0" : "translate-x-4 opacity-0") : "translate-x-0 opacity-100"}`}
              >
                {SLIDES[slide].title}
              </h3>
              <p
                className={`text-muted-foreground text-base leading-relaxed mb-6 transition-all duration-200 delay-75 ${animating ? "opacity-0" : "opacity-100"}`}
              >
                {SLIDES[slide].description}
              </p>

              <ul className={`space-y-2.5 mb-8 transition-all duration-200 delay-100 ${animating ? "opacity-0" : "opacity-100"}`}>
                {SLIDES[slide].bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-foreground">{b}</span>
                  </li>
                ))}
              </ul>

              {SLIDES[slide].visual === "pricing" && (
                <div className={`transition-all duration-200 delay-150 ${animating ? "opacity-0" : "opacity-100"}`}>
                  <button
                    onClick={() => window.location.href = '/login'}
                    className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
                    data-testid="button-slideshow-cta"
                  >
                    Start Free Trial <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-3 mt-auto pt-4">
                <button
                  onClick={() => goTo(slide - 1, "prev")}
                  className="h-10 w-10 rounded-full border border-border bg-card/80 hover:bg-card flex items-center justify-center transition-colors"
                  data-testid="button-slide-prev"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="flex gap-1.5">
                  {SLIDES.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goTo(i, i > slide ? "next" : "prev")}
                      className={`rounded-full transition-all duration-300 ${i === slide ? "w-6 h-2 bg-primary" : "w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"}`}
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
                  {paused ? "⏸ Paused" : "▶ Auto-playing"}
                </span>
              </div>
            </div>

            <div className={`flex-1 flex items-center justify-center p-6 lg:p-10 lg:border-l border-border transition-all duration-300 ${animating ? (direction === "next" ? "translate-x-6 opacity-0" : "-translate-x-6 opacity-0") : "translate-x-0 opacity-100"}`}>
              <SlideVisual type={SLIDES[slide].visual} />
            </div>
          </div>

          {/* Tab bar — grouped by section */}
          <div className="relative z-10 border-t border-border bg-card/40 px-4 py-3 flex items-center gap-1 overflow-x-auto scrollbar-none">
            {SLIDES.map((s, i) => {
              const prevSection = i > 0 ? SLIDES[i - 1].section : null;
              const showDivider = prevSection && prevSection !== s.section;
              return (
                <div key={i} className="flex items-center gap-1 shrink-0">
                  {showDivider && <div className="h-5 w-px bg-border mx-1" />}
                  <button
                    onClick={() => goTo(i, i > slide ? "next" : "prev")}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${i === slide ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                    data-testid={`button-slide-tab-${i}`}
                  >
                    {s.tabLabel}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-10 px-6 border-y border-border bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm text-muted-foreground">
            {[
              "Built for independent landlords",
              "No enterprise complexity",
              "Replaces spreadsheets and text chaos",
              "No app required for tenants",
              "Secure and reliable",
            ].map(item => (
              <div key={item} className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Check className="h-2.5 w-2.5 text-primary" />
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-24 px-6 border-y border-border relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={bgFeatures1} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-background/70" />
        </div>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-sm px-4 py-1">Everything You Get</Badge>
            <h2 className="text-4xl md:text-5xl font-display font-extrabold text-foreground mb-4">
              One Platform. Every Feature You Need.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From QR tenant requests to auto-dispatch, vendor portals, scheduling calendars, and automated notifications — TenantTrack covers the full maintenance lifecycle.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {FEATURES.map((feature, i) => (
              <div key={i} className="p-6 rounded-2xl bg-card border border-border shadow-lg shadow-black/10 hover-elevate group transition-all" data-testid={`feature-card-${i}`}>
                <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4 group-hover:bg-primary/25 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 max-w-7xl mx-auto relative">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <img src={bgMain1} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/85 to-background" />
        </div>
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
                "Dispatching contractors by memory or gut feel",
                "No-shows with no record to reference",
                "\"Job done\" with no proof, no invoice, no notes",
                "Vendors ghosting with zero accountability",
                "No visibility between assigned and completed",
                "Scheduling conflicts and double-bookings",
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
                "Auto-dispatch engine picks the best vendor for you",
                "Trust scores with no-show tracking and penalty",
                "Magic links let vendors accept, decline, or reschedule",
                "Visual scheduling calendar with conflict detection",
                "Full job pipeline with activity timeline and timestamps",
                "Automated email notifications at every stage",
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

      <section className="py-24 px-6 border-y border-border relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={bgDashboard1} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-background/75" />
        </div>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-sm px-4 py-1">Testimonials</Badge>
            <h2 className="text-4xl md:text-5xl font-display font-extrabold text-foreground mb-4">
              Landlords Trust TenantTrack
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

      <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto relative">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <img src={bgFeatures2} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
        </div>
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

      {/* FAQ */}
      <section className="py-24 px-6 border-y border-border relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={bgFeatures3} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-background/75" />
        </div>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 text-sm px-4 py-1">FAQ</Badge>
            <h2 className="text-3xl md:text-4xl font-display font-extrabold text-foreground">
              Common Questions
            </h2>
          </div>
          <div className="space-y-4">
            {[
              {
                q: "Do tenants need to download an app?",
                a: "No. Tenants scan the QR code with their phone camera and submit a request in a plain browser — no app, no account, no friction.",
              },
              {
                q: "Can I use my existing vendors and contractors?",
                a: "Yes. Add any contractor you already work with. TenantTrack will start tracking their reliability and building their trust score from the first job.",
              },
              {
                q: "How does the vendor trust score work?",
                a: "Each vendor gets a score from 0–100 based on ratings, job completion rate, no-show history, and tenure. The higher the score, the more reliable the vendor has proven to be.",
              },
              {
                q: "What is auto-dispatch and how does it work?",
                a: "Auto-dispatch scores every vendor in your network using trade match, trust score, workload, emergency availability, service area, and preferred status. You can let TenantTrack recommend the best vendor, or auto-assign them instantly. The vendor gets a magic link to accept, decline, or propose a new time — no app or login required.",
              },
              {
                q: "Do vendors need to create an account?",
                a: "No. When you dispatch a vendor, they receive an email with a secure magic link. One tap and they see the job details, can accept or decline, and mark the job complete — all from their phone browser. The link expires after 7 days.",
              },
              {
                q: "What happens after the 14-day trial?",
                a: "You'll be prompted to choose a plan. If you don't subscribe, your account is paused — your data is never deleted. No credit card is required to start the trial.",
              },
              {
                q: "Is TenantTrack for large property companies?",
                a: "Not at all. TenantTrack is designed for independent landlords managing 1 to 100+ units. No IT setup, no enterprise contracts — just log in and go.",
              },
            ].map((item, i) => (
              <FaqItem key={i} question={item.q} answer={item.a} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 relative overflow-hidden" id="about" data-testid="section-about">
        <div className="absolute inset-0 -z-10">
          <img src={bgMain4} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/85 to-background" />
        </div>
        <div className="max-w-3xl mx-auto">
          <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="shrink-0">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">About the Founder</p>
                <h2 className="text-2xl md:text-3xl font-display font-extrabold text-foreground mb-4">
                  Why I Built TenantTrack
                </h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    I'm Christopher Mayeaux, and TenantTrack was born from a problem I kept hearing about over and over again. Every landlord and property manager I talked to said the same thing: <span className="text-foreground font-medium">maintenance is the most painful and expensive part of the job.</span>
                  </p>
                  <p>
                    But when I dug deeper, the real headache wasn't the maintenance itself — it was the <span className="text-foreground font-medium">vendor coordination.</span> Dispatching the right contractor, chasing down progress updates, waiting on completion proof, tracking invoices — it was all scattered across texts, phone calls, emails, and spreadsheets. Things fell through the cracks constantly.
                  </p>
                  <p>
                    So I built TenantTrack to fix exactly that. One place to dispatch vendors, track every job from start to finish, and hold contractors accountable with trust scores — no more guesswork, no more chasing. Just a clean, simple system that actually works.
                  </p>
                </div>
                <p className="mt-6 text-sm font-semibold text-foreground">— Christopher Mayeaux, Founder</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={bgSaas} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-background/60" />
        </div>
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-primary/10 to-orange-500/5 rounded-3xl p-12 md:p-16 border border-primary/20">
          <h2 className="text-3xl md:text-5xl font-display font-extrabold text-foreground mb-4">
            Stop chasing vendors.<br className="hidden sm:block" /> Start managing maintenance.
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Set up your first property in under 5 minutes. No credit card. No IT team. No chaos.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="rounded-full text-lg shadow-xl shadow-primary/20 gap-2 px-8" onClick={() => window.location.href = '/login?signup=1'} data-testid="button-cta-final">
              Start Free Trial
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="rounded-full text-lg border-border" onClick={() => window.location.href = '/guide'} data-testid="button-cta-guide">
              Read the Guide
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
                The smart maintenance platform for landlords. QR-powered requests, vendor trust scores, and full job dispatch — all in one place.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-sm mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/features" className="hover:text-primary transition-colors">All Features</Link></li>
                <li><button onClick={() => scrollTo("pricing")} className="hover:text-primary transition-colors">Pricing</button></li>
                <li><button onClick={() => scrollTo("how-it-works")} className="hover:text-primary transition-colors">How It Works</button></li>
                <li><Link href="/guide" className="hover:text-primary transition-colors">Step-by-Step Guide</Link></li>
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
