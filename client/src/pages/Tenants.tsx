import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { Loader2, Users, Phone, Mail, Building2, Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { useState } from "react";
import { format } from "date-fns";

interface Tenant {
  name: string;
  email: string;
  phone: string;
  requestCount: number;
  properties: string[];
  lastRequest: string | null;
}

export default function Tenants() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: tenants, isLoading } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"],
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="h-[60vh] flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  let filtered = tenants || [];
  if (searchTerm) {
    filtered = filtered.filter(
      (t) =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.phone.includes(searchTerm)
    );
  }

  return (
    <AppLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Tenant Directory</h1>
          <p className="text-muted-foreground mt-2">
            All tenants who have submitted maintenance requests.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search tenants..."
            className="pl-10 w-full sm:w-64 bg-card"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search-tenants"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-3xl p-12 text-center flex flex-col items-center">
          <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-6">
            <Users className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold mb-2">No tenants yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Tenant information will appear here once they submit maintenance requests through your QR codes.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((tenant, idx) => (
            <div
              key={`${tenant.email}-${idx}`}
              className="bg-card rounded-2xl p-6 shadow-sm border border-border hover-elevate transition-all"
              data-testid={`card-tenant-${idx}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold text-lg">
                      {tenant.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg" data-testid={`text-tenant-name-${idx}`}>
                      {tenant.name}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {tenant.requestCount} request{tenant.requestCount !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <a
                  href={`mailto:${tenant.email}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  data-testid={`link-tenant-email-${idx}`}
                >
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{tenant.email}</span>
                </a>
                <a
                  href={`tel:${tenant.phone}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  data-testid={`link-tenant-phone-${idx}`}
                >
                  <Phone className="h-4 w-4" />
                  {tenant.phone}
                </a>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4 shrink-0" />
                  <span className="truncate">{tenant.properties.join(", ")}</span>
                </div>
              </div>

              {tenant.lastRequest && (
                <p className="text-xs text-muted-foreground mt-4 pt-3 border-t border-border">
                  Last request: {format(new Date(tenant.lastRequest), "MMM d, yyyy")}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
