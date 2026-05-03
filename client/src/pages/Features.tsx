import { Link } from "wouter";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  QrCode, Smartphone, ShieldCheck, Mail, Phone,
  ArrowRight, Check, DollarSign, CalendarClock,
  Users, ClipboardList, Building2, Camera, BarChart3,
  FileDown, Bell, Search, MapPin, MessageSquare,
  Clock, Wrench, Receipt, TrendingUp, Star,
  Zap, Crown, Shield, Globe, Layers,
  X, AlertTriangle, ThumbsUp, Percent, Timer,
  HandCoins, Megaphone, Target, Lock, Send
} from "lucide-react";
import logoPng from "@assets/tenanttrack-final-logo.png";
import bgDashboard2 from "@assets/dashboardpreview2_1774750600094.jpg";
import bgMain3 from "@assets/main3_1774750600098.jpg";
import bgFeatures2 from "@assets/featurespricingsection2_1774750600095.jpg";

const HERO_FEATURES = [
  "QR code maintenance system",
  "No app download for tenants",
  "Real-time request tracking",
  "Cost tracking & CSV export",
  "Recurring maintenance scheduling",
  "Staff assignment & management",
  "Photo uploads with requests",
  "Tenant-landlord messaging",
  "Mobile-first dashboard",
];

const DETAILED_FEATURES = [
  {
    id: "qr-system",
    badge: "Core Feature",
    title: "QR Code Maintenance System",
    subtitle: "Your tenants scan. You relax.",
    description: "Each property gets a unique QR code you can print and post in common areas, on unit doors, or in welcome packets. When a tenant has an issue, they scan with their phone camera — no app download, no account signup, no friction. A mobile-optimized form opens instantly where they describe the problem, select urgency, snap up to 3 photos, and submit in under 60 seconds.",
    businessBenefit: "Eliminates the back-and-forth of phone calls, texts, and voicemails. Tenants report issues on their own schedule — at 2 AM if needed — and you get a structured, documented request instead of a vague text message. Every request includes the property, unit, urgency level, and photos from day one.",
    roiCallout: "Landlords report saving 3-5 hours per week previously spent fielding maintenance calls and texts.",
    icon: QrCode,
    color: "primary",
    highlights: [
      { icon: QrCode, text: "Unique QR code per property with printable flyers" },
      { icon: Globe, text: "Works on any smartphone — iPhone, Android, any browser" },
      { icon: Camera, text: "Tenants attach up to 3 photos per request" },
      { icon: MapPin, text: "Unit number captured automatically" },
      { icon: Timer, text: "60-second submission — no training needed" },
      { icon: Lock, text: "No tenant login or account required" },
    ],
    visual: "qr",
  },
  {
    id: "dashboard",
    badge: "Management",
    title: "Smart Landlord Dashboard",
    subtitle: "Every request, one screen. Zero chaos.",
    description: "See all maintenance requests across your entire portfolio in a single, filterable view. Color-coded status badges (red for emergencies, yellow for in-progress, green for completed) let you triage at a glance. Each request card shows tenant contact info, photos, urgency level, assigned staff, logged costs, and a full internal notes timeline.",
    businessBenefit: "No more spreadsheets, sticky notes, or trying to remember which tenant texted you about a leaky faucet. Every request is documented with a complete audit trail — who reported it, when, what photos they sent, who you assigned it to, how much it cost, and when it was resolved. This protects you in disputes and simplifies insurance claims.",
    roiCallout: "Property managers using TenantTrack resolve requests 40% faster with full documentation from start to finish.",
    icon: ClipboardList,
    color: "blue",
    highlights: [
      { icon: Search, text: "Search by tenant name, unit, or issue keyword" },
      { icon: BarChart3, text: "At-a-glance analytics: total, new, active, completed" },
      { icon: MessageSquare, text: "Internal notes per request (not visible to tenants)" },
      { icon: Bell, text: "Color-coded urgency: Emergency (red), Normal, Low" },
      { icon: Users, text: "One-click staff assignment on each request" },
      { icon: Shield, text: "Complete audit trail for legal protection" },
    ],
    visual: "dashboard",
  },
  {
    id: "request-tracking",
    badge: "Tenant Experience",
    title: "Tenant Request Tracking",
    subtitle: "Happy tenants. Fewer phone calls. Better reviews.",
    description: "After submitting a request, tenants receive a unique 8-character tracking code. They can check their request status anytime at your tracking page — no account or login needed. When you update a status from 'New' to 'In-Progress' to 'Completed', tenants see it immediately. The tracking page shows a clear visual timeline so tenants always know exactly where things stand.",
    businessBenefit: "The number one source of tenant frustration is feeling ignored. TenantTrack gives tenants visibility into their request status without requiring a single phone call from you. This dramatically reduces 'when is this getting fixed?' follow-ups and builds trust. Better maintenance communication is consistently cited as a top factor in lease renewals and positive reviews on rental platforms.",
    roiCallout: "Landlords see up to 90% fewer follow-up calls and texts after switching to TenantTrack's tracking system.",
    icon: Smartphone,
    color: "rose",
    highlights: [
      { icon: Shield, text: "Unique 8-character tracking code per request" },
      { icon: Clock, text: "Real-time status updates visible to tenants" },
      { icon: Smartphone, text: "Mobile-optimized tracking page" },
      { icon: ShieldCheck, text: "No tenant login or account required" },
      { icon: ThumbsUp, text: "Builds trust and improves tenant retention" },
      { icon: Megaphone, text: "Reduces follow-up calls by up to 90%" },
    ],
    visual: "tracking",
  },
  {
    id: "messaging",
    badge: "Communication",
    title: "Tenant-Landlord Messaging",
    subtitle: "Talk directly. No phone tag.",
    description: "Built-in messaging lets tenants and landlords communicate directly within each maintenance request — no phone calls, no texts lost in a thread. Tenants send messages from their tracking page using their tracking code (no login needed), and landlords reply from the dashboard. Every message is tied to the specific request, creating a complete conversation history.",
    businessBenefit: "Phone calls get missed. Texts get buried. Emails get ignored. TenantTrack messaging keeps every conversation attached to the specific maintenance request it's about. When you need to ask a tenant for clarification, schedule access, or confirm a repair was done right, it's all in one place. If a dispute arises, you have a timestamped record of every communication. This also means less context-switching — you handle messages right where you handle the request.",
    roiCallout: "Landlords report cutting back-and-forth communication time by 60% when messages are tied directly to each request.",
    icon: MessageSquare,
    color: "blue",
    highlights: [
      { icon: MessageSquare, text: "Two-way messaging per request" },
      { icon: ShieldCheck, text: "No tenant login — uses tracking code" },
      { icon: Clock, text: "Messages refresh automatically" },
      { icon: Shield, text: "Full conversation history for records" },
      { icon: Smartphone, text: "Works on any device, any browser" },
      { icon: Bell, text: "Landlord sees tenant message count" },
    ],
    visual: "messaging",
  },
  {
    id: "cost-tracking",
    badge: "Financial",
    title: "Repair Cost Tracking & Reports",
    subtitle: "Know what you spend. Prove it at tax time.",
    description: "Log the cost of every repair directly on the maintenance request — description, dollar amount, and vendor name. See spending summaries across your entire portfolio, filtered by date range and property. When tax season arrives, export everything to CSV with one click. Know exactly what you spent, where you spent it, who did the work, and which property it was for. No more digging through receipts or bank statements.",
    businessBenefit: "Maintenance is typically the largest operating expense for rental property owners, yet most landlords can't tell you what they spent last quarter. TenantTrack gives you instant visibility into your maintenance spending by property, by vendor, and by time period. This data helps you identify problem properties, negotiate better rates with vendors, budget accurately for the next year, and maximize your tax deductions with complete, exportable records.",
    roiCallout: "Landlords using cost tracking report finding an average of $1,200/year in previously undocumented tax-deductible repairs.",
    icon: DollarSign,
    color: "yellow",
    highlights: [
      { icon: Receipt, text: "Log cost, vendor, and description per repair" },
      { icon: TrendingUp, text: "Spending analytics per property and time period" },
      { icon: FileDown, text: "One-click CSV export for taxes and accounting" },
      { icon: BarChart3, text: "Average cost per request and per property" },
      { icon: HandCoins, text: "Identify high-cost properties and recurring issues" },
      { icon: Target, text: "Budget accurately with historical spending data" },
    ],
    visual: "costs",
  },
  {
    id: "scheduled-maintenance",
    badge: "Preventive",
    title: "Recurring Maintenance Scheduling",
    subtitle: "Stop waiting for things to break.",
    description: "Set up recurring tasks like HVAC filter changes, smoke detector battery replacements, gutter cleaning, pest control inspections, and fire extinguisher checks. Choose from six frequency options (weekly, biweekly, monthly, quarterly, biannually, annually) and TenantTrack automatically tracks when each task is due. Overdue tasks are highlighted in red, upcoming tasks in yellow, so nothing slips through the cracks.",
    businessBenefit: "Preventive maintenance costs a fraction of emergency repairs. A $30 HVAC filter change every 3 months prevents a $3,000 compressor replacement. A $15 smoke detector battery swap prevents code violations and liability. TenantTrack shifts your maintenance from reactive (expensive, stressful) to proactive (cheap, planned). It also demonstrates due diligence if you ever face a habitability complaint — you have documented proof that inspections and maintenance were performed on schedule.",
    roiCallout: "Proactive maintenance reduces emergency repair costs by up to 40% and extends the life of major systems by years.",
    icon: CalendarClock,
    color: "purple",
    highlights: [
      { icon: CalendarClock, text: "6 frequency options: weekly to annually" },
      { icon: Wrench, text: "Auto-calculates next due date on completion" },
      { icon: Bell, text: "Overdue (red) and upcoming (yellow) highlighting" },
      { icon: Building2, text: "Per-property task assignment" },
      { icon: Shield, text: "Documents compliance for inspections and audits" },
      { icon: Percent, text: "Reduces emergency repair costs by up to 40%" },
    ],
    visual: "scheduled",
  },
  {
    id: "staff-management",
    badge: "Team",
    title: "Maintenance Staff Management",
    subtitle: "Assign work. Track progress. Stay in control.",
    description: "Add your maintenance team — handymen, plumbers, electricians, HVAC techs, property managers — and assign incoming requests to the right person with one click. See who's handling what, how many open assignments each person has, and keep everyone accountable. No more group texts, missed messages, or 'I thought you were handling that' conversations.",
    businessBenefit: "As your portfolio grows, you can't do everything yourself. TenantTrack lets you delegate without losing visibility. Assign a leaky faucet to your plumber, an electrical issue to your electrician, and a general repair to your handyman — all from the same dashboard. Staff members are tied to your account, so you maintain full control over assignments and can reassign work instantly if someone is unavailable.",
    roiCallout: "Multi-property landlords save an average of 6 hours per week by streamlining staff coordination through TenantTrack.",
    icon: Users,
    color: "blue",
    highlights: [
      { icon: Users, text: "Add unlimited staff with role and contact info" },
      { icon: ClipboardList, text: "One-click assignment on any request" },
      { icon: BarChart3, text: "See active assignment count per staff member" },
      { icon: Layers, text: "Manage across all properties from one view" },
      { icon: ShieldCheck, text: "Full ownership control — reassign anytime" },
      { icon: Zap, text: "Eliminate group texts and miscommunication" },
    ],
    visual: "staff",
  },
];

const COMPARISON_ITEMS = [
  {
    category: "Tenant submits a request",
    old: "Tenant calls, texts, or emails. You get a vague message with no photos. You call back for details. Multiple rounds of back-and-forth.",
    tenanttrack: "Tenant scans a QR code, fills out a 60-second form with photos, urgency, and unit number. You get a complete, structured request instantly.",
  },
  {
    category: "Tracking repair status",
    old: "You try to remember which request is where. Tenants call repeatedly asking for updates. Details get lost in text threads.",
    tenanttrack: "Every request has a visual status pipeline. Tenants check their own tracking code — no calls needed. Full audit trail on every request.",
  },
  {
    category: "Logging repair costs",
    old: "Receipts pile up in a shoebox or a folder. At tax time, you dig through bank statements trying to match expenses to properties.",
    tenanttrack: "Costs are logged per repair with vendor and description. Filter by property and date. Export to CSV with one click for your accountant.",
  },
  {
    category: "Preventive maintenance",
    old: "You try to remember when you last changed the HVAC filter or checked smoke detectors. Things slip until they break.",
    tenanttrack: "Recurring tasks auto-track due dates. Overdue items are flagged in red. Mark complete and the next date is calculated automatically.",
  },
  {
    category: "Coordinating with staff",
    old: "Group texts, phone calls, 'I thought you were handling that.' No central record of who's doing what.",
    tenanttrack: "Assign requests to specific staff in one click. See everyone's workload. Full accountability with zero miscommunication.",
  },
];

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; lightBg: string }> = {
  primary: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20", lightBg: "bg-primary/5" },
  blue: { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20", lightBg: "bg-sky-500/5" },
  rose: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20", lightBg: "bg-rose-500/5" },
  yellow: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20", lightBg: "bg-yellow-500/5" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20", lightBg: "bg-purple-500/5" },
  orange: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20", lightBg: "bg-primary/5" },
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
        <p className="text-xs text-muted-foreground text-center">Tenant scans QR with phone camera — no app needed</p>
      </div>
    );
  }

  if (type === "dashboard") {
    return (
      <div className={`rounded-3xl ${c.lightBg} border ${c.border} p-6`}>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: "Total", value: "24", color: "text-foreground" },
            { label: "New", value: "8", color: "text-primary" },
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
            <p className="text-[10px] text-muted-foreground">Plumber scheduled for Tuesday</p>
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

  if (type === "messaging") {
    return (
      <div className={`rounded-3xl ${c.lightBg} border ${c.border} p-6`}>
        <div className="flex items-center gap-2 mb-4 px-1">
          <MessageSquare className={`h-4 w-4 ${c.text}`} />
          <span className="text-xs font-bold text-foreground">Messages</span>
          <Badge variant="outline" className="text-[10px] ml-auto">3</Badge>
        </div>
        <div className="space-y-3">
          <div className="bg-muted/50 rounded-xl p-3 max-w-[80%]">
            <p className="text-xs text-foreground">Hi, the kitchen faucet is still dripping after the repair. Can someone come back?</p>
            <p className="text-[10px] text-muted-foreground mt-1">Sarah T. &middot; Mar 2, 10:15 AM</p>
          </div>
          <div className="bg-primary/10 rounded-xl p-3 max-w-[80%] ml-auto">
            <p className="text-xs text-foreground">Sorry about that! I'll send the plumber back tomorrow between 9-11 AM. Will you be home?</p>
            <p className="text-[10px] text-muted-foreground mt-1">Chris M. &middot; Mar 2, 11:30 AM</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-3 max-w-[80%]">
            <p className="text-xs text-foreground">Yes, I'll be here. Thank you!</p>
            <p className="text-[10px] text-muted-foreground mt-1">Sarah T. &middot; Mar 2, 11:45 AM</p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <div className="flex-1 bg-card/80 border border-border rounded-lg px-3 py-2 text-xs text-muted-foreground">Type a message...</div>
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Send className="h-3.5 w-3.5 text-primary" />
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
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
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

      <section className="pt-32 pb-16 px-6 lg:pt-44 lg:pb-20 max-w-5xl mx-auto text-center relative">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <img src={bgDashboard2} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        </div>
        <Badge variant="outline" className="mb-6 text-sm px-4 py-1.5" data-testid="badge-features">All Features</Badge>
        <h1 className="text-4xl md:text-6xl font-display font-extrabold tracking-tight text-foreground leading-[1.1] mb-6" data-testid="text-features-title">
          Everything a landlord needs. <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-300">Nothing they don't.</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-6 leading-relaxed" data-testid="text-features-subtitle">
          TenantTrack replaces scattered texts, spreadsheets, and sticky notes with one organized system built specifically for independent landlords and small property managers. Here's exactly what you get.
        </p>
        <p className="text-base text-muted-foreground/80 max-w-2xl mx-auto mb-10 leading-relaxed">
          No bloated enterprise software. No features you'll never use. Just the tools that actually save you time, protect your investment, and keep tenants happy.
        </p>
        <div className="flex flex-wrap justify-center gap-3" data-testid="feature-chips">
          {HERO_FEATURES.map((f, i) => (
            <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border text-sm">
              <Check className="h-4 w-4 text-primary shrink-0" />
              <span className="text-foreground">{f}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 px-6 border-y border-border bg-card/30">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "60 sec", label: "Tenant submission time", icon: Timer },
              { value: "Zero", label: "App downloads required", icon: Smartphone },
              { value: "5 min", label: "Landlord setup time", icon: Zap },
              { value: "100%", label: "Of costs documented for tax", icon: DollarSign },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center gap-2" data-testid={`stat-${i}`}>
                <stat.icon className="h-5 w-5 text-primary" />
                <p className="text-2xl md:text-3xl font-display font-extrabold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 pb-12">
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
              <div className={`flex flex-col ${isReversed ? "lg:flex-row-reverse" : "lg:flex-row"} items-start gap-12 lg:gap-16`}>
                <div className="flex-1 w-full">
                  <Badge variant="outline" className={`mb-4 text-xs ${c.text} border-current`}>
                    {feature.badge}
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-display font-extrabold text-foreground mb-2">
                    {feature.title}
                  </h2>
                  <p className={`text-lg font-medium ${c.text} mb-4`}>{feature.subtitle}</p>
                  <p className="text-muted-foreground leading-relaxed mb-4">{feature.description}</p>

                  <div className={`rounded-2xl ${c.lightBg} border ${c.border} p-5 mb-6`}>
                    <h4 className={`text-sm font-bold ${c.text} mb-2 flex items-center gap-2`}>
                      <TrendingUp className="h-4 w-4" />
                      How This Benefits Your Business
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.businessBenefit}</p>
                  </div>

                  <div className={`rounded-xl bg-card border border-border p-4 mb-8 flex items-start gap-3`}>
                    <div className={`h-8 w-8 rounded-lg ${c.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <BarChart3 className={`h-4 w-4 ${c.text}`} />
                    </div>
                    <p className="text-sm font-medium text-foreground">{feature.roiCallout}</p>
                  </div>

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

                <div className="flex-1 w-full max-w-md lg:max-w-lg lg:sticky lg:top-28">
                  <FeatureVisual type={feature.visual} color={feature.color} />
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <section className="py-20 px-6 border-y border-border relative overflow-hidden" data-testid="section-comparison">
        <div className="absolute inset-0 -z-10">
          <img src={bgMain3} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-background/80" />
        </div>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 text-sm px-4 py-1.5">Why Switch</Badge>
            <h2 className="text-3xl md:text-4xl font-display font-extrabold text-foreground mb-4">
              TenantTrack vs. The Old Way
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Most landlords manage maintenance with phone calls, texts, and spreadsheets. Here's what changes when you switch to a purpose-built system.
            </p>
          </div>

          <div className="space-y-4">
            {COMPARISON_ITEMS.map((item, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden" data-testid={`comparison-${i}`}>
                <div className="px-5 py-3 border-b border-border bg-muted/30">
                  <h4 className="font-bold text-sm text-foreground">{item.category}</h4>
                </div>
                <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-6 w-6 rounded-full bg-red-500/10 flex items-center justify-center">
                        <X className="h-3.5 w-3.5 text-red-400" />
                      </div>
                      <span className="text-xs font-bold text-red-400 uppercase tracking-wide">Without TenantTrack</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.old}</p>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <Check className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="text-xs font-bold text-primary uppercase tracking-wide">With TenantTrack</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{item.tenanttrack}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6" data-testid="section-who-its-for">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 text-sm px-4 py-1.5">Built For You</Badge>
            <h2 className="text-3xl md:text-4xl font-display font-extrabold text-foreground mb-4">
              Who TenantTrack Is Built For
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We're not trying to be everything to everyone. TenantTrack is purpose-built for independent landlords and small property managers who want a simple, modern system without enterprise complexity.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Independent Landlords",
                desc: "Own 1-10 units? You don't need Buildium or AppFolio. You need a tool that handles maintenance requests without a learning curve, a monthly training session, or a 200-page manual.",
                icon: Building2,
              },
              {
                title: "Small Property Managers",
                desc: "Managing 10-50 units for yourself or clients? TenantTrack scales with you — add properties, assign staff, track costs, and keep every owner informed with exportable data.",
                icon: Layers,
              },
              {
                title: "Self-Managing Owners",
                desc: "Don't want to pay a property manager 8-10% of rent? TenantTrack gives you the organized system you need to self-manage professionally without the overhead.",
                icon: Crown,
              },
              {
                title: "Multi-Property Portfolios",
                desc: "Scattered across neighborhoods or cities? One dashboard shows maintenance across every property. No more switching between apps or losing track of which property has which issue.",
                icon: MapPin,
              },
              {
                title: "Landlords with Maintenance Staff",
                desc: "Have a handyman, plumber, or property manager on call? Assign requests to the right person without group texts. Everyone sees their assignments, you see everything.",
                icon: Users,
              },
              {
                title: "Tax-Conscious Investors",
                desc: "Every repair is a deductible expense — but only if it's documented. TenantTrack's cost tracking and CSV export means you never miss a deduction again.",
                icon: Receipt,
              },
            ].map((persona, i) => (
              <div key={i} className="p-6 rounded-2xl bg-card border border-border" data-testid={`persona-${i}`}>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <persona.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{persona.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{persona.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 border-y border-border bg-card/30" data-testid="section-differentiators">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 text-sm px-4 py-1.5">What Makes Us Different</Badge>
            <h2 className="text-3xl md:text-4xl font-display font-extrabold text-foreground mb-4">
              Why Landlords Choose TenantTrack
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Zero Tenant Friction",
                desc: "No app to download. No account to create. No password to remember. Tenants scan a QR code and submit — that's it. The lower the barrier, the faster you hear about problems before they get expensive.",
                icon: Zap,
              },
              {
                title: "Built for Mobile First",
                desc: "Every screen is designed for your phone. Thumb-friendly touch targets, swipeable cards, responsive layouts. Manage your properties from the job site, the grocery store, or your couch.",
                icon: Smartphone,
              },
              {
                title: "Transparent Pricing",
                desc: "No per-unit fees that punish growth. No hidden charges. Three simple tiers based on portfolio size. You always know what you're paying, and every plan includes a 14-day free trial.",
                icon: DollarSign,
              },
              {
                title: "Not Enterprise Software",
                desc: "We're not Yardi, Buildium, or AppFolio. Those platforms are built for property management companies with 500+ units and full-time staff. TenantTrack is built for you — the landlord who manages their own properties.",
                icon: Target,
              },
              {
                title: "Complete Documentation Trail",
                desc: "Every request, note, cost, and status change is logged with timestamps. This protects you in tenant disputes, insurance claims, and habitability complaints. Your records are always exportable.",
                icon: Shield,
              },
              {
                title: "5-Minute Setup",
                desc: "Sign up, add your first property, print the QR flyer, and you're live. No onboarding calls, no implementation fees, no waiting. Your tenants can start submitting requests today.",
                icon: Timer,
              },
            ].map((diff, i) => (
              <div key={i} className="p-6 rounded-2xl bg-card border border-border" data-testid={`differentiator-${i}`}>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <diff.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{diff.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{diff.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6" data-testid="section-stats">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-extrabold text-foreground mb-4">
              The Numbers Speak for Themselves
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Clock, stat: "75%", label: "Less time spent on maintenance coordination" },
              { icon: Phone, stat: "90%", label: "Fewer follow-up calls and texts from tenants" },
              { icon: DollarSign, stat: "$1,200", label: "Average undocumented repairs found per year" },
              { icon: Star, stat: "5 min", label: "From signup to your first live QR code" },
              { icon: AlertTriangle, stat: "40%", label: "Reduction in emergency repairs with scheduled maintenance" },
              { icon: TrendingUp, stat: "3-5 hrs", label: "Saved per week on maintenance coordination" },
              { icon: ThumbsUp, stat: "90%+", label: "Tenant satisfaction with self-service tracking" },
              { icon: FileDown, stat: "1 click", label: "To export all costs for your accountant" },
            ].map((item, i) => (
              <div key={i} className="text-center p-6 rounded-2xl bg-card border border-border" data-testid={`stat-card-${i}`}>
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

      <section className="py-16 px-6 max-w-5xl mx-auto relative" data-testid="section-pricing">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <img src={bgFeatures2} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/85 to-background" />
        </div>
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-extrabold text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">All plans include a 14-day free trial. No credit card required. No per-unit fees. No hidden charges.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: "Starter",
              price: 29,
              desc: "For landlords with 1-5 units",
              icon: Building2,
              features: [
                "QR code maintenance system",
                "Smart landlord dashboard",
                "Tenant request tracking",
                "Photo uploads (3 per request)",
                "Email notifications",
                "Internal notes per request",
              ],
            },
            {
              name: "Growth",
              price: 59,
              desc: "For landlords with 6-25 units",
              icon: Zap,
              highlight: true,
              features: [
                "Everything in Starter",
                "Staff management & assignment",
                "Priority request highlighting",
                "Full maintenance history",
                "Basic cost reporting",
                "Custom QR flyers per unit",
              ],
            },
            {
              name: "Pro",
              price: 99,
              desc: "For portfolios with 25+ units",
              icon: Crown,
              features: [
                "Everything in Growth",
                "Advanced cost tracking & reports",
                "One-click CSV export",
                "Recurring maintenance scheduling",
                "Overdue task alerts",
                "Priority support",
              ],
            },
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
              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.highlight ? "default" : "outline"}
                className="w-full rounded-xl"
                onClick={() => window.location.href = '/api/login'}
                data-testid={`button-plan-${plan.name.toLowerCase()}`}
              >
                Start 14-Day Free Trial
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-primary/10 to-blue-500/5 rounded-3xl p-12 md:p-16 border border-primary/20">
          <h2 className="text-3xl md:text-5xl font-display font-extrabold text-foreground mb-4" data-testid="text-cta-heading">
            Ready to get organized?
          </h2>
          <p className="text-lg text-muted-foreground mb-4 max-w-xl mx-auto">
            Set up your first property in under 5 minutes. Your tenants will thank you.
          </p>
          <p className="text-base text-muted-foreground/80 mb-8 max-w-lg mx-auto">
            Join landlords who've replaced scattered texts and spreadsheets with one clean system. No contracts, no setup fees, no learning curve.
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
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src={logoPng} alt="TenantTrack" className="h-10 w-10 rounded-lg" />
                <span className="font-display font-bold text-xl text-foreground">TenantTrack</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                The modern maintenance request system built for independent landlords and small property managers. QR-powered, mobile-first, and designed to save you time, money, and headaches.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-sm mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#qr-system" className="hover:text-primary transition-colors">QR Maintenance</a></li>
                <li><a href="#dashboard" className="hover:text-primary transition-colors">Dashboard</a></li>
                <li><a href="#cost-tracking" className="hover:text-primary transition-colors">Cost Tracking</a></li>
                <li><a href="#scheduled-maintenance" className="hover:text-primary transition-colors">Scheduled Maintenance</a></li>
                <li><a href="#staff-management" className="hover:text-primary transition-colors">Staff Management</a></li>
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
              <Link href="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link>
              <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
