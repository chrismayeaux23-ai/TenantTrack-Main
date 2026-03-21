import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Building2, ClipboardList, LogOut, Menu, X, Users, UserCircle,
  Receipt, DollarSign, CalendarClock, Briefcase, BarChart2,
  ChevronRight, Columns3, Calendar
} from "lucide-react";
import logoIcon from "@assets/vendortrust-icon-nobg.png";
import { Button } from "../ui/Button";
import { TrialBanner } from "@/components/TrialBanner";

const NAV_GROUPS = [
  {
    items: [
      { name: "Work Orders", href: "/", icon: ClipboardList },
    ],
  },
  {
    label: "Dispatch",
    items: [
      { name: "Dispatch Board", href: "/dispatch", icon: Columns3 },
      { name: "Schedule", href: "/schedule", icon: Calendar },
    ],
  },
  {
    label: "Operations",
    items: [
      { name: "Properties", href: "/properties", icon: Building2 },
      { name: "Tenants", href: "/tenants", icon: UserCircle },
      { name: "Staff", href: "/staff", icon: Users },
    ],
  },
  {
    label: "Vendor Intelligence",
    items: [
      { name: "Vendor Network", href: "/vendors", icon: Briefcase },
      { name: "Analytics", href: "/analytics", icon: BarChart2 },
    ],
  },
  {
    label: "Business",
    items: [
      { name: "Cost Tracking", href: "/costs", icon: DollarSign },
      { name: "Scheduled Jobs", href: "/scheduled", icon: CalendarClock },
      { name: "Billing & Plan", href: "/billing", icon: Receipt },
    ],
  },
];

const BOTTOM_NAV = [
  { name: "Orders", href: "/", icon: ClipboardList },
  { name: "Dispatch", href: "/dispatch", icon: Columns3 },
  { name: "Schedule", href: "/schedule", icon: Calendar },
  { name: "More", href: "__menu__", icon: Menu },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const isActive = (href: string) => {
    if (href === "/") return location === "/" || location === "/dashboard";
    return location === href || location.startsWith(href + "/");
  };

  const initials = user?.firstName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "L";
  const displayName = user?.firstName ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}` : "Landlord";

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2.5" data-testid="link-mobile-home">
          <img src={logoIcon} alt="VendorTrust" className="h-8 w-8 rounded-lg object-contain" />
          <span className="font-display font-bold text-lg tracking-tight">VendorTrust</span>
        </Link>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          data-testid="button-mobile-menu"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 flex flex-col transition-transform duration-300 ease-in-out md:static md:translate-x-0
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}
        style={{ background: "hsl(226 34% 4%)", borderRight: "1px solid hsl(226 22% 12%)" }}
      >
        {/* Logo */}
        <div className="hidden md:flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: "hsl(226 22% 12%)" }}>
          <img src={logoIcon} alt="VendorTrust" className="h-9 w-9 rounded-lg object-contain" />
          <div>
            <span className="font-display font-bold text-base text-foreground tracking-tight block leading-tight">VendorTrust</span>
            <span className="text-[10px] text-muted-foreground/70 font-medium tracking-wide">PROPERTY MAINTENANCE OS</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} className={gi > 0 ? "mt-5" : ""}>
              {group.label && (
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40 px-3 mb-2">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`
                        relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                        ${active
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground/80"
                        }
                      `}
                      style={active ? {
                        background: "linear-gradient(90deg, hsl(24 95% 55% / 0.12) 0%, hsl(24 95% 55% / 0.04) 100%)",
                        borderLeft: "2px solid hsl(24 95% 55%)",
                        marginLeft: "2px",
                        paddingLeft: "10px",
                      } : {
                        marginLeft: "2px",
                        paddingLeft: "10px",
                      }}
                      onClick={() => setIsMobileMenuOpen(false)}
                      data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <item.icon className={`h-4 w-4 flex-shrink-0 ${active ? "text-primary" : ""}`} />
                      <span className="flex-1">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t" style={{ borderColor: "hsl(226 22% 11%)" }}>
          <Link
            href="/profile"
            className="flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl cursor-pointer transition-colors group"
            style={{ hover: undefined }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "hsl(226 22% 10%)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            onClick={() => setIsMobileMenuOpen(false)}
            data-testid="link-profile"
          >
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0 ring-2 ring-primary/20">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate leading-tight">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors shrink-0" />
          </Link>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-muted-foreground/60 hover:text-muted-foreground hover:bg-white/5 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Content area (right of sidebar) */}
      <div className="flex-1 min-w-0 flex flex-col">
        <TrialBanner />
        <main className="p-4 md:p-7 lg:p-9 pb-24 md:pb-9 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden" data-testid="nav-bottom-bar">
        <div className="backdrop-blur-xl border-t border-border flex items-center justify-around py-1.5 px-2"
          style={{ background: "hsl(226 30% 6% / 0.97)" }}>
          {BOTTOM_NAV.map((item) => {
            if (item.href === "__menu__") {
              return (
                <button
                  key={item.name}
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-bottom-more"
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{item.name}</span>
                </button>
              );
            }
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors"
                data-testid={`button-bottom-${item.name.toLowerCase()}`}
              >
                <div className={`relative ${active ? "text-primary" : "text-muted-foreground"}`}>
                  <item.icon className="h-5 w-5" />
                  {active && <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full shadow-sm shadow-primary/50" />}
                </div>
                <span className={`text-[10px] font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
