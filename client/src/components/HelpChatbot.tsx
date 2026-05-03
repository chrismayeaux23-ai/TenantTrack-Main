import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, BookOpen, ChevronRight } from "lucide-react";

interface Message {
  role: "user" | "bot";
  text: string;
}

const FAQ_DATA: { keywords: string[]; question: string; answer: string }[] = [
  {
    keywords: ["get started", "start", "sign up", "signup", "create account", "register", "begin", "new"],
    question: "How do I get started?",
    answer: "Go to tenanttrack.xyz and click 'Start Free Trial'. Sign up with your email or Google account. You'll be guided through adding your first property and vendor — it takes under 5 minutes. You get a full 14-day free trial, no credit card needed.",
  },
  {
    keywords: ["property", "add property", "properties", "new property"],
    question: "How do I add a property?",
    answer: "Go to Properties in the sidebar and click 'Add Property'. Enter the property name and address. Each property automatically gets its own unique QR code that tenants can scan to submit maintenance requests.",
  },
  {
    keywords: ["qr", "qr code", "scan", "flyer", "print"],
    question: "How do QR codes work?",
    answer: "Every property gets a unique QR code. Tenants scan it with their phone camera (no app needed) and a maintenance request form opens in their browser. You can print a professional flyer with the QR code by going to any property and clicking 'Print Flyer'. Post it in common areas for tenants to use.",
  },
  {
    keywords: ["tenant", "report", "submit", "request", "maintenance request", "issue"],
    question: "How do tenants report issues?",
    answer: "Tenants scan the QR code with their phone camera. A simple form opens where they enter their name, phone, unit, issue type, urgency, description, and can attach up to 3 photos. It's available in English and Spanish. They receive a tracking code to check status anytime — no app or account needed.",
  },
  {
    keywords: ["dispatch", "assign", "send", "vendor dispatch", "auto-dispatch", "auto dispatch", "recommend"],
    question: "How do I dispatch a vendor?",
    answer: "Open any maintenance request and click 'Assign Vendor'. You have three modes: Manual (pick any vendor), Recommend (system suggests the best fit based on scores), or Auto-Dispatch (automatically assigns the top-ranked vendor). Vendors are scored on trade match, trust score, availability, workload, and more.",
  },
  {
    keywords: ["magic link", "vendor respond", "vendor accept", "vendor portal", "vendor link", "vendor email"],
    question: "How do vendors respond to jobs?",
    answer: "When you dispatch a vendor, they receive an email with a secure magic link — no app or account needed. They click the link and can accept, decline, or propose a new time. They can also mark themselves as 'En Route' and 'Complete' the job with cost details and notes. You get email notifications at every step.",
  },
  {
    keywords: ["trust score", "score", "rating", "review", "rate vendor", "vendor score"],
    question: "How do trust scores work?",
    answer: "After each completed job, you rate the vendor on quality, speed, communication, and price. TenantTrack calculates a Trust Score (0-100) based on their full history. Higher-scoring vendors get prioritized in auto-dispatch. Vendors who no-show or get poor reviews see their score drop automatically.",
  },
  {
    keywords: ["schedule", "calendar", "scheduling", "conflict", "book"],
    question: "How does the scheduling calendar work?",
    answer: "Go to Schedule in the sidebar. You'll see all jobs on a calendar with week, day, and list views. You can schedule vendor visits with automatic conflict detection (no double-booking). Filter by vendor, property, or trade. Color-coded urgency indicators show what needs attention first.",
  },
  {
    keywords: ["dispatch board", "kanban", "pipeline", "drag", "board"],
    question: "What is the Dispatch Board?",
    answer: "The Dispatch Board is a visual Kanban-style pipeline showing all your work orders organized by status: Needs Dispatch, Awaiting Response, Scheduled, In Progress, and Completed. You can drag and drop requests between columns. Overdue jobs are highlighted automatically.",
  },
  {
    keywords: ["cost", "expense", "track cost", "csv", "export", "tax", "invoice"],
    question: "How do I track repair costs?",
    answer: "Inside any request, you can log repair costs with a description, amount, and vendor. You can also export your full cost history to CSV for tax purposes. Vendors can add cost details and invoice numbers when they complete jobs through their magic link portal.",
  },
  {
    keywords: ["recurring", "preventive", "scheduled maintenance", "hvac", "filter", "smoke detector"],
    question: "How do recurring tasks work?",
    answer: "Go to Recurring Tasks in the sidebar. Add preventive maintenance tasks like HVAC filter changes, smoke detector checks, pest control, etc. Choose a frequency (weekly, monthly, quarterly, etc.) and TenantTrack will flag overdue tasks in red so nothing slips through the cracks.",
  },
  {
    keywords: ["price", "pricing", "plan", "cost", "subscription", "billing", "pay", "upgrade", "trial"],
    question: "What are the pricing plans?",
    answer: "Starter ($29/mo) for 1-5 units, Growth ($59/mo) for 6-25 units with auto-dispatch and trust scores, and Pro ($99/mo) for 25+ units with analytics, cost tracking, and priority support. All plans include a 14-day free trial — no credit card required. Cancel anytime.",
  },
  {
    keywords: ["staff", "team", "employee", "member", "add staff"],
    question: "Can I add staff members?",
    answer: "Yes! On Growth and Pro plans, you can add staff members who can manage requests and dispatch vendors on your behalf. Go to Staff in the sidebar to add team members.",
  },
  {
    keywords: ["notification", "email", "alert", "notify"],
    question: "What notifications does TenantTrack send?",
    answer: "TenantTrack sends automated emails at every stage: new request alerts to you, dispatch confirmations to vendors, vendor response notifications (accept/decline/propose), tenant updates when a vendor is scheduled, 24-hour reminders to vendors before jobs, and SLA violation alerts if a vendor doesn't respond in time.",
  },
  {
    keywords: ["sla", "overdue", "deadline", "escalat", "late", "no response"],
    question: "What happens if a vendor doesn't respond?",
    answer: "TenantTrack monitors response deadlines automatically. If a vendor doesn't respond in time, the system escalates — it sends reminders, flags the request as overdue, and suggests the next best vendor for reassignment. You'll get an alert so nothing falls through the cracks.",
  },
  {
    keywords: ["bilingual", "spanish", "language", "espanol"],
    question: "Does TenantTrack support Spanish?",
    answer: "Yes! The tenant-facing request form and QR flyers support both English and Spanish. Tenants can choose their preferred language when submitting a maintenance request.",
  },
  {
    keywords: ["contact", "support", "help", "phone", "email support"],
    question: "How do I get support?",
    answer: "You can reach us at support@tenanttrack.xyz or call (503) 380-6482. You can also visit our step-by-step Guide at tenanttrack.xyz/guide for detailed walkthroughs of every feature.",
  },
];

const QUICK_ACTIONS = [
  "How do I get started?",
  "How do QR codes work?",
  "How do I dispatch a vendor?",
  "What are the pricing plans?",
];

function findAnswer(input: string): string {
  const q = input.toLowerCase().trim();

  if (!q || q.length < 2) {
    return "I can help you with TenantTrack! Try asking about properties, QR codes, vendor dispatch, scheduling, trust scores, billing, or any other feature.";
  }

  let bestMatch: typeof FAQ_DATA[0] | null = null;
  let bestScore = 0;

  for (const faq of FAQ_DATA) {
    let score = 0;
    for (const keyword of faq.keywords) {
      if (q.includes(keyword)) {
        score += keyword.length;
      }
    }
    if (faq.question.toLowerCase().includes(q) || q.includes(faq.question.toLowerCase().replace("?", ""))) {
      score += 10;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = faq;
    }
  }

  if (bestMatch && bestScore >= 3) {
    return bestMatch.answer;
  }

  return "I'm not sure about that one. Try asking about properties, QR codes, dispatching vendors, magic links, trust scores, scheduling, the dispatch board, costs, billing, or recurring tasks. You can also check out our full Guide page at /guide for step-by-step walkthroughs, or email us at support@tenanttrack.xyz.";
}

export function HelpChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Hi! I'm the TenantTrack assistant. How can I help you today? You can ask me about any feature, or pick a topic below." },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: "user", text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      const answer = findAnswer(text);
      setMessages(prev => [...prev, { role: "bot", text: answer }]);
    }, 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          data-testid="button-chatbot-open"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] h-[520px] max-h-[calc(100vh-80px)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200" data-testid="chatbot-panel">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
                <MessageCircle className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">TenantTrack Help</h3>
                <p className="text-xs text-muted-foreground">Ask me anything</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/guide"
                className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                title="Full Guide"
                data-testid="link-chatbot-guide"
              >
                <BookOpen className="h-4 w-4" />
              </a>
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-chatbot-close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}
                  data-testid={`chatbot-message-${msg.role}-${i}`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />

            {messages.length <= 1 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs text-muted-foreground font-medium px-1">Quick questions:</p>
                {QUICK_ACTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl bg-muted/50 border border-border text-sm text-foreground hover:bg-muted transition-colors flex items-center justify-between gap-2"
                    data-testid={`chatbot-quick-${q.slice(0, 20).replace(/\s/g, "-").toLowerCase()}`}
                  >
                    <span>{q}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-border bg-card">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 h-10 px-4 bg-muted border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                data-testid="input-chatbot-message"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 transition-colors shrink-0"
                data-testid="button-chatbot-send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
