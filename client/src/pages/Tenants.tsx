import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Loader2, Users, Phone, Mail, Building2, Search, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { useState } from "react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { toast } = useToast();
  const { data: tenants, isLoading } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"],
  });

  const deleteTenant = useMutation({
    mutationFn: async (tenant: { email: string; phone: string }) => {
      const res = await apiRequest("DELETE", "/api/tenants", tenant);
      if (!res.ok) throw new Error("Failed to delete tenant");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/costs/report"] });
      setDeleteConfirm(null);
      toast({ title: "Deleted", description: "Tenant and all their requests removed." });
    },
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
          {filtered.map((tenant, idx) => {
            const tenantKey = `${tenant.email.toLowerCase()}-${tenant.phone}`;
            return (
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
                  {deleteConfirm === tenantKey ? (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteTenant.mutate({ email: tenant.email, phone: tenant.phone })}
                        disabled={deleteTenant.isPending}
                        data-testid={`button-confirm-delete-tenant-${idx}`}
                      >
                        {deleteTenant.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirm(null)}
                        data-testid={`button-cancel-delete-tenant-${idx}`}
                      >
                        No
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirm(tenantKey)}
                      className="text-muted-foreground hover:text-red-400"
                      data-testid={`button-delete-tenant-${idx}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
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
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
