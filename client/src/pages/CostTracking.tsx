import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useProperties } from "@/hooks/use-properties";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Loader2, DollarSign, TrendingUp, Wrench, Download, Building2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CostReportData {
  totalSpent: number;
  averagePerRequest: number;
  numberOfRepairs: number;
  byProperty: {
    propertyName: string;
    costs: {
      id: number;
      requestId: number;
      description: string;
      amount: number;
      vendor: string | null;
      createdAt: string;
      unitNumber: string;
      issueType: string;
      requestDescription: string;
    }[];
    total: number;
  }[];
}

export default function CostTracking() {
  const now = new Date();
  const [startDate, setStartDate] = useState(format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(now, "yyyy-MM-dd"));
  const [propertyFilter, setPropertyFilter] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const { data: properties } = useProperties();
  const { toast } = useToast();

  const queryParams = new URLSearchParams();
  if (startDate) queryParams.set("startDate", startDate);
  if (endDate) queryParams.set("endDate", endDate);
  if (propertyFilter) queryParams.set("propertyId", propertyFilter);

  const { data: report, isLoading } = useQuery<CostReportData>({
    queryKey: ["/api/costs/report", startDate, endDate, propertyFilter],
    queryFn: async () => {
      const res = await fetch(`/api/costs/report?${queryParams.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const deleteCost = useMutation({
    mutationFn: async (costId: number) => {
      const res = await apiRequest("DELETE", `/api/costs/${costId}`);
      if (!res.ok) throw new Error("Failed to delete cost");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => {
        const key = query.queryKey[0];
        return typeof key === "string" && (key.startsWith("/api/costs") || key === "/api/requests");
      }});
      setDeleteConfirm(null);
      toast({ title: "Deleted", description: "Cost entry removed." });
    },
  });

  const handleExport = () => {
    const url = `/api/costs/export?${queryParams.toString()}`;
    window.open(url, "_blank");
  };

  const formatCents = (cents: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
  };

  const propertyOptions = [
    { label: "All Properties", value: "" },
    ...(properties || []).map(p => ({ label: p.name, value: String(p.id) })),
  ];

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground" data-testid="text-cost-title">Cost Tracking</h1>
        <p className="text-muted-foreground mt-2">Track repair costs and generate reports for tax deductions.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-2 flex-1">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">From</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-card"
              data-testid="input-start-date"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">To</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-card"
              data-testid="input-end-date"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 sm:w-48">
            <label className="text-xs text-muted-foreground mb-1 block">Property</label>
            <Select
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              options={propertyOptions}
              className="bg-card"
              data-testid="select-property-filter"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleExport} variant="outline" className="h-10 gap-2" data-testid="button-export-csv">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[40vh] flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm" data-testid="stat-total-spent">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCents(report?.totalSpent || 0)}</p>
                  <p className="text-xs text-muted-foreground">Total Spent</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm" data-testid="stat-avg-cost">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCents(report?.averagePerRequest || 0)}</p>
                  <p className="text-xs text-muted-foreground">Avg per Request</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm" data-testid="stat-repairs">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                  <Wrench className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{report?.numberOfRepairs || 0}</p>
                  <p className="text-xs text-muted-foreground">Repairs Logged</p>
                </div>
              </div>
            </div>
          </div>

          {(!report?.byProperty || report.byProperty.length === 0) ? (
            <div className="bg-card border border-border border-dashed rounded-3xl p-12 text-center flex flex-col items-center">
              <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-6">
                <DollarSign className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">No costs logged yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Start logging repair costs on your maintenance requests to see spending reports here.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {report.byProperty.map((group) => (
                <div key={group.propertyName} className="bg-card rounded-2xl border border-border overflow-hidden">
                  <div className="flex items-center justify-between p-5 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-primary" />
                      <h3 className="font-bold text-lg">{group.propertyName}</h3>
                    </div>
                    <Badge variant="default" className="text-sm">{formatCents(group.total)}</Badge>
                  </div>
                  <div className="divide-y divide-border">
                    {group.costs.map((cost) => (
                      <div key={cost.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4" data-testid={`cost-item-${cost.id}`}>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{cost.description}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Unit {cost.unitNumber} &middot; {cost.issueType}
                            {cost.vendor && <> &middot; {cost.vendor}</>}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-muted-foreground text-xs">
                            {cost.createdAt ? format(new Date(cost.createdAt), "MMM d, yyyy") : ""}
                          </span>
                          <span className="font-bold text-primary">{formatCents(cost.amount)}</span>
                          {deleteConfirm === cost.id ? (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteCost.mutate(cost.id)}
                                disabled={deleteCost.isPending}
                                data-testid={`button-confirm-delete-cost-${cost.id}`}
                              >
                                {deleteCost.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeleteConfirm(null)}
                                data-testid={`button-cancel-delete-cost-${cost.id}`}
                              >
                                No
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirm(cost.id)}
                              className="text-muted-foreground hover:text-red-400"
                              data-testid={`button-delete-cost-${cost.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}
