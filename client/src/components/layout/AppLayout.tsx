import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Building2, ClipboardList, LogOut, Menu, X, CreditCard, Users, UserCircle, Receipt, DollarSign, CalendarClock, Briefcase, ShieldCheck } from "lucide-react";
import { Button } from "../ui/Button";
import logoPng from "@assets/file_000000001adc71f58731a09f21d2988d_1772208715788.png";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navigation = [
    { name: "Requests", href: "/", icon: ClipboardList },
    { name: "Properties", href: "/properties", icon: Building2 },
    { name: "Tenants", href: "/tenants", icon: UserCircle },
    { name: "Staff", href: "/staff", icon: Users },
    { name: "Vendors", href: "/vendors", icon: Briefcase },
    { name: "Costs", href: "/costs", icon: DollarSign },
    { name: "Scheduled", href: "/scheduled", icon: CalendarClock },
    { name: "Billing", href: "/billing", icon: Receipt },
    { name: "Pricing", href: "/pricing", icon: CreditCard },
  ];

  const bottomNav = [
    { name: "Requests", href: "/", icon: ClipboardList },
    { name: "Properties", href: "/properties", icon: Building2 },
    { name: "Vendors", href: "/vendors", icon: Briefcase },
    { name: "More", href: "__menu__", icon: Menu },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <div className="md:hidden flex items-center justify-between p-4 bg-card border-b border-border sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2" data-testid="link-mobile-home">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">VendorTrust</span>
        </Link>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2" data-testid="button-mobile-menu">
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <aside className={`
        fixed inset-y-0 left-0 z-30 w-72 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-in-out md:static md:translate-x-0
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="hidden md:flex items-center gap-3 p-6 border-b border-border/50">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <span className="font-display font-bold text-xl text-foreground tracking-tight block">VendorTrust</span>
            <span className="text-xs text-muted-foreground">Vendor Coordination</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 md:py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200
                  ${isActive 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }
                `}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          <Link
            href="/profile"
            className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl cursor-pointer hover:bg-accent transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
            data-testid="link-profile"
          >
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'L'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.firstName || 'Landlord'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </Link>
          <Button variant="outline" className="w-full justify-start" onClick={() => logout()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-4 md:p-8 lg:p-10 pb-24 md:pb-10 max-w-7xl mx-auto w-full">
        {children}
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border md:hidden" data-testid="nav-bottom-bar">
        <div className="flex items-center justify-around py-2">
          {bottomNav.map((item) => {
            if (item.href === "__menu__") {
              return (
                <button
                  key={item.name}
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="flex flex-col items-center gap-1 px-3 py-1 text-muted-foreground"
                  data-testid="button-bottom-more"
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-xs">{item.name}</span>
                </button>
              );
            }
            const isActive = location === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-1 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                data-testid={`button-bottom-${item.name.toLowerCase()}`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
