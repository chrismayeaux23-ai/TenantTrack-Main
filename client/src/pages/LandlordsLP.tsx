import { useEffect, useId, useState } from "react";
import { Link } from "wouter";
import {
  ShieldCheck, QrCode, Sparkles, Link2, Check,
  ArrowRight, Star, Mail,
} from "lucide-react";
import logoWide from "@assets/tenanttrack-wide-logo.png";
import { captureUtmsFromUrl, getCanonicalUtms } from "@/lib/analytics";

const LOOM_VIDEO_ID = (import.meta.env.VITE_LOOM_VIDEO_ID as string | undefined) || "";

const PAIN_BULLETS = [
  "No-shows with no paper trail",
  "Calling the same bad contractor because you forgot",
  "Tenants leaving over slow repairs",
  "Spending Sundays on the dispatch line",
];

const HOW_IT_WORKS = [
  {
    icon: QrCode,
    title: "Tenant scans a QR code",
    desc: "Sticker on the fridge. They report the issue with photos and urgency in 60 seconds. No app, no account.",
  },
  {
    icon: Sparkles,
    title: "You one-click dispatch the right vendor",
    desc: "Every vendor in your network has a trust score. Auto-dispatch picks the best one for the trade and texts them a magic link.",
  },
  {
    icon: Link2,
    title: "Vendor accepts, finishes, uploads invoice",
    desc: "All without an app or login. The full job — request to invoice — lives on one page. You get your nights and weekends back.",
  },
];

const TESTIMONIALS = [
  {
    quote: "The vendor trust scores changed everything. I used to call whoever picked up. Now I dispatch the highest-rated plumber in under a minute.",
    name: "Property Manager",
    role: "12 units · Portland, OR",
  },
  {
    quote: "I had a contractor no-show twice before TenantTrack flagged his record. That alone saved me from a third bad experience.",
    name: "Independent Landlord",
    role: "18 units · Austin, TX",
  },
  {
    quote: "Proof of completion with invoice numbers — my accountant called me a changed man.",
    name: "Real Estate Investor",
    role: "22 units · Denver, CO",
  },
];

const FAQS = [
  {
    q: "Do tenants need to download an app?",
    a: "No. They scan the QR code with their phone camera and a form opens in their browser. No app, no account, no password.",
  },
  {
    q: "What about my existing vendors?",
    a: "You add them once with their phone and email. They never need an account or app — they receive a magic link per job and respond from their phone.",
  },
  {
    q: "How long does setup take?",
    a: "About 5 minutes for your first property. On the white-glove call I'll add your first property + 3 vendors with you live so it's running before we hang up.",
  },
  {
    q: "What does it cost after the trial?",
    a: "$29/mo for 1–5 units, $59/mo for 6–25 units, $99/mo for 25+. No setup fees, cancel anytime, no card required to start the trial.",
  },
  {
    q: "Is my data safe?",
    a: "Yes. Encrypted at rest and in transit, isolated per account. We never share data with third parties or contractors outside your network.",
  },
];

// Anchor styled to look like a primary Button — single interactive element
// (avoids invalid nested <a><button> from wrapping <Button> inside wouter <Link>).
const ctaPrimaryClass =
  "inline-flex items-center justify-center rounded-2xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md h-14 px-8 text-lg active-elevate";
const ctaPrimarySmClass =
  "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border-2 border-input bg-transparent hover:bg-accent hover:text-accent-foreground h-9 px-4 text-sm active-elevate";

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const slug = q.slice(0, 20).replace(/\s/g, "-").toLowerCase();
  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card">
      <button
        type="button"
        className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        data-testid={`faq-toggle-${slug}`}
      >
        <span className="font-semibold text-foreground text-sm md:text-base">{q}</span>
        <span className={`shrink-0 h-5 w-5 flex items-center justify-center rounded-full border border-border transition-transform ${open ? "rotate-180" : ""}`}>
          <svg className="h-3 w-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={`faq-toggle-${slug}`}
        hidden={!open}
        className="px-6 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4"
        data-testid={`faq-answer-${slug}`}
      >
        {a}
      </div>
    </div>
  );
}

export default function LandlordsLP() {
  useEffect(() => {
    document.title = "Stop Chasing Vendors — TenantTrack for 10–50 Unit Landlords";
    captureUtmsFromUrl();

    const desc = "Built for self-managing landlords with 10–50 units. QR-code maintenance, vendor trust scoring, one-click dispatch. 14-day free trial — personally set up by the founder.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
  }, []);

  const utms = getCanonicalUtms();
  const ctaHref = Object.keys(utms).length
    ? `/login?${new URLSearchParams(utms).toString()}`
    : "/login";

  const loomEmbed = LOOM_VIDEO_ID
    ? `https://www.loom.com/embed/${LOOM_VIDEO_ID}?hideEmbedTopBar=true`
    : "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Minimal header — no nav distractions */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" data-testid="link-home">
            <img src={logoWide} alt="TenantTrack" className="h-8 w-auto" />
          </Link>
          <Link href={ctaHref} className={ctaPrimarySmClass} data-testid="link-header-cta">
            Start free trial
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 pt-12 pb-10 md:pt-20 md:pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6" data-testid="badge-hero">
            <Sparkles className="h-3.5 w-3.5" /> Built for landlords with 10–50 units
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5 font-heading" data-testid="text-hero-headline">
            Stop chasing vendors.<br />
            <span className="text-primary">Stop losing tenants over slow repairs.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8" data-testid="text-hero-subhead">
            TenantTrack is a QR-code maintenance system with vendor trust scoring and one-click dispatch — built specifically for self-managing landlords. 14-day free trial. I'll personally set up your first property on a 30-min call.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link href={ctaHref} className={ctaPrimaryClass} data-testid="link-hero-cta-primary">
              Start the 14-day trial <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-hero-how-it-works">
              or watch the 90-second demo ↓
            </a>
          </div>
          <p className="text-xs text-muted-foreground mt-4" data-testid="text-hero-trust">
            No credit card to start · Cancel anytime · Founder-led setup call included
          </p>
        </div>
      </section>

      {/* Loom demo */}
      <section id="how-it-works" className="px-4 pb-12 md:pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl overflow-hidden border border-border shadow-2xl bg-card">
            <div className="aspect-video bg-black flex items-center justify-center">
              {loomEmbed ? (
                <iframe
                  src={loomEmbed}
                  title="TenantTrack 90-second demo"
                  allowFullScreen
                  className="w-full h-full"
                  data-testid="iframe-loom-demo"
                />
              ) : (
                <div className="text-center p-8 text-muted-foreground" data-testid="text-loom-placeholder">
                  <div className="text-sm mb-2">90-second product demo</div>
                  <div className="text-xs">
                    Set <code className="px-1.5 py-0.5 bg-muted rounded text-foreground">VITE_LOOM_VIDEO_ID</code> to embed your Loom video here.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Pain section */}
      <section className="px-4 py-12 md:py-16 bg-card/30 border-y border-border/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 font-heading" data-testid="text-pain-headline">
              Sound familiar?
            </h2>
            <p className="text-muted-foreground" data-testid="text-pain-subhead">
              The hidden tax of self-managing — and what it actually costs you.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
            {PAIN_BULLETS.map((p, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border" data-testid={`pain-bullet-${i}`}>
                <div className="h-6 w-6 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-red-400 text-xs font-bold" aria-hidden="true">×</span>
                </div>
                <span className="text-sm text-foreground">{p}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-12 md:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 font-heading" data-testid="text-how-headline">
              How it works
            </h2>
            <p className="text-muted-foreground" data-testid="text-how-subhead">
              Three steps. No apps for tenants or vendors. Live in under 5 minutes.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {HOW_IT_WORKS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="p-6 rounded-2xl border border-border bg-card" data-testid={`how-step-${i}`}>
                  <div className="h-12 w-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-xs font-bold text-primary mb-2">STEP {i + 1}</div>
                  <h3 className="text-lg font-bold mb-2 font-heading">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Founder note — the white-glove differentiator */}
      <section className="px-4 py-12 md:py-16 bg-gradient-to-b from-primary/5 to-transparent border-y border-border/50">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-primary/30 bg-card p-6 md:p-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-bold text-sm" data-testid="text-founder-name">A note from the founder</div>
                <div className="text-xs text-muted-foreground">Solo-built · Replies personally</div>
              </div>
            </div>
            <div className="space-y-4 text-sm md:text-base text-foreground/90 leading-relaxed" data-testid="text-founder-note">
              <p>
                I built TenantTrack because I watched my parents lose two great tenants in one year over slow vendor response. They were doing everything right — but the system for getting a leak fixed at 9pm on a Sunday was a phone in one hand and a prayer in the other.
              </p>
              <p>
                When you start the trial, I'll personally jump on a 30-minute Zoom and set up your first property + three vendors with you, live. No upsell, no pitch — just the fastest path to actually using it.
              </p>
              <p className="text-muted-foreground italic">
                If you want to see if the demo is real before you sign up, just reply to my outreach or hit the trial button below — I read every email.
              </p>
            </div>
            <div className="mt-6">
              <Link href={ctaHref} className={ctaPrimaryClass} data-testid="link-founder-cta">
                Start the 14-day trial <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="px-4 py-12 md:py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 font-heading" data-testid="text-testimonials-headline">
            Landlords who switched
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="p-6 rounded-2xl border border-border bg-card" data-testid={`testimonial-${i}`}>
                <div className="flex gap-1 mb-3" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-primary text-primary" aria-hidden="true" />
                  ))}
                </div>
                <p className="text-sm text-foreground mb-4 leading-relaxed">"{t.quote}"</p>
                <div className="text-xs">
                  <div className="font-bold text-foreground">{t.name}</div>
                  <div className="text-muted-foreground">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="px-4 py-12 md:py-16 bg-card/30 border-y border-border/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 font-heading" data-testid="text-included-headline">
            What's included from day one
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              "QR codes for every property + printable flyers",
              "Tenant request portal (no app, bilingual EN/ES)",
              "Vendor trust scoring (0–100, transparent)",
              "Auto-dispatch by trade, score, and availability",
              "Magic-link vendor portal (no app)",
              "Scheduling calendar with conflict detection",
              "Repair cost tracking + CSV export for taxes",
              "Recurring maintenance (filters, inspections)",
              "Founder-led setup call",
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-2 p-3" data-testid={`included-${i}`}>
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-12 md:py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 font-heading" data-testid="text-faq-headline">
            Common questions
          </h2>
          <div className="space-y-3">
            {FAQS.map(f => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-16 md:py-24 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="max-w-3xl mx-auto text-center">
          <ShieldCheck className="h-12 w-12 text-primary mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-3xl md:text-5xl font-bold mb-4 font-heading" data-testid="text-final-cta-headline">
            Get your nights and weekends back.
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto" data-testid="text-final-cta-subhead">
            14 days free. No card. Personally set up by the founder. If it's not a fit, you walk away with a clean dispatch process either way.
          </p>
          <Link href={ctaHref} className={`${ctaPrimaryClass} px-10`} data-testid="link-final-cta">
            Start the 14-day trial <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Minimal footer */}
      <footer className="border-t border-border px-4 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src={logoWide} alt="TenantTrack" className="h-6 w-auto opacity-80" />
            <span>© {new Date().getFullYear()} TenantTrack</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/terms" className="hover:text-foreground transition-colors" data-testid="link-footer-terms">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors" data-testid="link-footer-privacy">Privacy</Link>
            <Link href="/" className="hover:text-foreground transition-colors" data-testid="link-footer-home">Main site</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
