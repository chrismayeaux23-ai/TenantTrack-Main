import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/Button";
import {
  ArrowRight, ArrowLeft, Search, ChevronDown, Check,
  Building2, QrCode, Smartphone,
  Wrench, Calendar,
  Star, CalendarClock, DollarSign, BarChart3,
  Users, Mail, Phone, BookOpen,
} from "lucide-react";
import logoPng from "@assets/tenanttrack-final-logo.png";
import bgMain2 from "@assets/main2_1774750600098.jpg";
import bgSaas from "@assets/A_dark,_high-end_SaaS_background_with_a_deep_navy_blue_to_blac_1774750600093.jpg";

const GUIDE_SECTIONS = [
  {
    id: "getting-started",
    category: "Getting Started",
    icon: Building2,
    color: "text-primary bg-primary/10",
    steps: [
      {
        title: "1. Create Your Account",
        content: [
          'Go to tenant-track.com and click "Start Free Trial"',
          "Sign up with your email and password, or use Google sign-in",
          "You get a full 14-day free trial — no credit card needed",
        ],
      },
      {
        title: "2. Complete Onboarding",
        content: [
          "Add your first property (name + address)",
          "Add your first vendor/contractor (name, trade, phone, email)",
          "That's it — you're in!",
        ],
      },
    ],
  },
  {
    id: "properties",
    category: "Setting Up Properties",
    icon: QrCode,
    color: "text-violet-400 bg-violet-400/10",
    steps: [
      {
        title: "3. Add Properties",
        content: [
          "Go to Properties in the sidebar",
          'Click "Add Property" — enter the name and address',
          "Each property automatically gets its own unique QR code",
        ],
      },
      {
        title: "4. Print the QR Flyer",
        content: [
          'On any property, click "Print Flyer"',
          "This generates a professional printable flyer with your QR code and instructions in English and Spanish",
          "Post it in common areas, laundry rooms, or hand it directly to tenants",
        ],
      },
    ],
  },
  {
    id: "tenant-requests",
    category: "How Tenants Report Issues",
    icon: Smartphone,
    color: "text-green-400 bg-green-400/10",
    steps: [
      {
        title: "5. Tenant Scans the QR Code",
        content: [
          "The tenant opens their phone camera and scans the QR code",
          "No app download needed — it opens a simple web form right in their browser",
          "They fill in their name, phone, unit number, issue type, urgency level, description, and can attach up to 3 photos",
          "Available in English and Spanish — tenants choose their language",
          "They receive a tracking code to check their request status anytime",
        ],
      },
    ],
  },
  {
    id: "managing-requests",
    category: "Managing Requests",
    icon: Wrench,
    color: "text-yellow-400 bg-yellow-400/10",
    steps: [
      {
        title: "6. View Incoming Requests",
        content: [
          "Go to your Dashboard — all requests appear here with color-coded status badges",
          "Filter by status (New, Assigned, Scheduled, In-Progress, Completed), urgency, or property",
          "Click any request to see full details including tenant info, photos, and activity log",
        ],
      },
      {
        title: "7. Add Notes & Track Costs",
        content: [
          "Inside any request, add internal notes to track what's happening",
          "Log repair costs (description, amount, vendor) for your records",
          "Export your full cost history to CSV at tax time",
        ],
      },
    ],
  },
  {
    id: "vendors",
    category: "Working with Vendors",
    icon: Users,
    color: "text-primary bg-primary/10",
    steps: [
      {
        title: "8. Build Your Vendor Network",
        content: [
          "Go to Vendors in the sidebar",
          "Add your contractors with their trade, contact info, service area, and license/insurance details",
          'Mark favorites as "Preferred" — they get priority in dispatch recommendations',
          "Flag vendors who are available for emergency calls",
        ],
      },
      {
        title: "9. Dispatch a Vendor",
        content: [
          'Open a maintenance request and click "Assign Vendor"',
          "Manual — Pick any vendor yourself",
          "Recommend — TenantTrack scores every vendor and suggests the best fit",
          "Auto-Dispatch — The system assigns your top-ranked vendor automatically",
          "Vendors are scored on trade match, trust score, emergency availability, current workload, and more",
        ],
      },
      {
        title: "10. Vendor Responds via Magic Link",
        content: [
          "When you dispatch a vendor, they receive an email with a secure magic link",
          "No app to download, no account to create — it works on any phone",
          "The vendor clicks the link and can: Accept, Decline, or Propose a different time",
          'Mark themselves as "En Route" when heading to the property',
          'Mark the job "Complete" with notes, cost details, and invoice number',
          "You get an email notification at every step so you always know the status",
        ],
      },
    ],
  },
  {
    id: "scheduling",
    category: "Scheduling & Dispatch Board",
    icon: Calendar,
    color: "text-emerald-400 bg-emerald-400/10",
    steps: [
      {
        title: "11. Use the Scheduling Calendar",
        content: [
          "Go to Schedule in the sidebar to see all jobs on a calendar view",
          "Switch between week, day, and list views",
          "Schedule vendor visits with automatic conflict detection — never double-book",
          "Filter by vendor, property, or trade",
          "Color-coded urgency indicators show what needs attention first",
        ],
      },
      {
        title: "12. Dispatch Board (Kanban View)",
        content: [
          "Go to Dispatch Board for a visual pipeline of all your work orders",
          "See your requests organized into columns: Needs Dispatch, Awaiting Response, Scheduled, In Progress, Completed",
          "Drag and drop requests between columns to update status",
          "Overdue jobs are highlighted automatically so nothing falls through the cracks",
        ],
      },
    ],
  },
  {
    id: "trust-scores",
    category: "Vendor Trust Scores",
    icon: Star,
    color: "text-amber-400 bg-amber-400/10",
    steps: [
      {
        title: "13. Rate Vendors After Each Job",
        content: [
          "When a job is completed, leave a review rating: Quality, Speed, Communication, and Price",
          "TenantTrack automatically calculates a Trust Score from 0 to 100 for each vendor",
          "Higher-scoring vendors get prioritized in auto-dispatch — your best vendors naturally get more work",
          "Vendors who no-show or get poor reviews see their score drop",
        ],
      },
    ],
  },
  {
    id: "recurring",
    category: "Recurring Maintenance",
    icon: CalendarClock,
    color: "text-teal-400 bg-teal-400/10",
    steps: [
      {
        title: "14. Set Up Preventive Tasks",
        content: [
          "Go to Recurring Tasks in the sidebar",
          "Add tasks like: HVAC filter changes, smoke detector checks, fire extinguisher inspections, pest control, gutter cleaning",
          "Choose a frequency: weekly, biweekly, monthly, quarterly, biannually, or annually",
          "Overdue tasks are flagged in red so nothing slips through the cracks",
        ],
      },
    ],
  },
  {
    id: "billing",
    category: "Billing & Plans",
    icon: DollarSign,
    color: "text-pink-400 bg-pink-400/10",
    steps: [
      {
        title: "15. Choose a Plan When You're Ready",
        content: [
          "Starter ($29/mo) — For 1–5 units: QR system, vendor dispatch, email alerts, photo uploads",
          "Growth ($59/mo) — For 6–25 units: Everything in Starter + auto-dispatch, scheduling, trust scores, staff assignment",
          "Pro ($99/mo) — For 25+ units: Everything in Growth + analytics, cost tracking, CSV export, dispatch board, bilingual UI, priority support",
          "All plans include a 14-day free trial — no credit card required",
        ],
      },
    ],
  },
  {
    id: "pro-tips",
    category: "Pro Tips",
    icon: BarChart3,
    color: "text-indigo-400 bg-indigo-400/10",
    steps: [
      {
        title: "Get the Most Out of TenantTrack",
        content: [
          "Analytics page — See spending trends, average response times, and vendor performance charts over time",
          "Tenant Directory — Automatically builds from submitted requests, no manual data entry needed",
          "Activity Log — Every request has a full timestamped log for disputes or insurance claims",
          "SLA monitoring — The system watches response deadlines and alerts you if a vendor hasn't responded in time",
          "No vendor accounts needed — Everything works through magic links in their email",
          "Overdue alerts — Requests open for more than 7 days without resolution are flagged on your dashboard",
          "Staff accounts — On Growth and Pro plans, add staff members to help manage requests",
        ],
      },
    ],
  },
];

function AccordionSection({ section, isOpen, onToggle, searchQuery }: {
  section: typeof GUIDE_SECTIONS[0];
  isOpen: boolean;
  onToggle: () => void;
  searchQuery: string;
}) {
  const Icon = section.icon;
  const highlightText = (text: string) => {
    if (!searchQuery) return text;
    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase()
        ? <mark key={i} className="bg-primary/30 text-foreground rounded px-0.5">{part}</mark>
        : part
    );
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden transition-all" data-testid={`guide-section-${section.id}`}>
      <button
        className="w-full text-left px-6 py-5 flex items-center gap-4 hover:bg-muted/30 transition-colors"
        onClick={onToggle}
        data-testid={`guide-toggle-${section.id}`}
      >
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${section.color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-foreground">{highlightText(section.category)}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {section.steps.length} step{section.steps.length !== 1 ? "s" : ""}
          </p>
        </div>
        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="px-6 pb-6 space-y-5 border-t border-border pt-5">
          {section.steps.map((step, i) => (
            <div key={i}>
              <h4 className="font-semibold text-foreground mb-3 text-sm">{highlightText(step.title)}</h4>
              <ul className="space-y-2">
                {step.content.map((item, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{highlightText(item)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Guide() {
  const [search, setSearch] = useState("");
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["getting-started"]));

  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const expandAll = () => setOpenSections(new Set(GUIDE_SECTIONS.map(s => s.id)));
  const collapseAll = () => setOpenSections(new Set());

  const filteredSections = search.trim()
    ? GUIDE_SECTIONS.filter(section => {
        const q = search.toLowerCase();
        if (section.category.toLowerCase().includes(q)) return true;
        return section.steps.some(step =>
          step.title.toLowerCase().includes(q) ||
          step.content.some(c => c.toLowerCase().includes(q))
        );
      })
    : GUIDE_SECTIONS;

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute top-0 left-0 right-0 h-[500px] -z-10 overflow-hidden">
        <img src={bgMain2} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/70 to-background" />
      </div>
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src={logoPng} alt="TenantTrack" className="h-8 w-8 rounded-lg object-contain" />
            <span className="font-display font-bold text-lg text-foreground">TenantTrack</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => window.location.href = "/"}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Home
            </Button>
            <Button size="sm" className="rounded-full gap-1" onClick={() => window.location.href = "/login?signup=1"} data-testid="button-guide-signup">
              Start Free Trial
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            <BookOpen className="h-4 w-4" />
            Step-by-Step Guide
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-extrabold text-foreground mb-4" data-testid="text-guide-title">
            How to Use TenantTrack
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Everything you need to know to set up your properties, dispatch vendors, and manage maintenance like a pro.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 mb-8">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                if (e.target.value.trim()) expandAll();
              }}
              placeholder="Search guide... (e.g. QR code, dispatch, billing)"
              className="w-full h-11 pl-10 pr-4 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
              data-testid="input-guide-search"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={expandAll} data-testid="button-expand-all">
              Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll} data-testid="button-collapse-all">
              Collapse All
            </Button>
          </div>
        </div>

        {filteredSections.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl">
            <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium">No results found</p>
            <p className="text-sm text-muted-foreground mt-1">Try a different search term</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSections.map(section => (
              <AccordionSection
                key={section.id}
                section={section}
                isOpen={openSections.has(section.id)}
                onToggle={() => toggleSection(section.id)}
                searchQuery={search.trim()}
              />
            ))}
          </div>
        )}

        <div className="mt-16 bg-gradient-to-br from-primary/10 to-orange-500/5 rounded-3xl p-10 border border-primary/20 text-center relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <img src={bgSaas} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15 rounded-3xl" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-display font-bold text-foreground mb-3">
              Ready to get started?
            </h2>
            <p className="text-muted-foreground mb-6">
              Set up your first property in under 5 minutes. No credit card required.
            </p>
            <Button size="lg" className="rounded-full gap-2 px-8 shadow-lg shadow-primary/20" onClick={() => window.location.href = "/login?signup=1"} data-testid="button-guide-cta">
              Start Free Trial
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="mt-12 text-center space-y-3">
          <p className="text-sm text-muted-foreground font-medium">Still have questions?</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted-foreground">
            <a href="mailto:support@tenant-track.com" className="flex items-center gap-2 hover:text-primary transition-colors" data-testid="link-guide-email">
              <Mail className="h-4 w-4" />
              support@tenant-track.com
            </a>
            <a href="tel:5033806482" className="flex items-center gap-2 hover:text-primary transition-colors" data-testid="link-guide-phone">
              <Phone className="h-4 w-4" />
              (503) 380-6482
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
