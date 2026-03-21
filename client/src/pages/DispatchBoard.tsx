import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Clock, User, MapPin, Wrench, ChevronRight, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface DispatchCard {
  requestId: number;
  column: string;
  property: { id: number; name: string } | null;
  unitNumber: string;
  issueType: string;
  urgency: string;
  tenantName: string;
  status: string;
  createdAt: string;
  vendor: { id: number; name: string; companyName: string | null } | null;
  assignment: {
    id: number;
    jobStatus: string;
    scheduledDate: string | null;
    vendorResponseStatus: string | null;
    arrivalWindow: string | null;
    dispatchScore: number | null;
  } | null;
}

const COLUMNS = [
  { key: "needs-dispatch", label: "Needs Dispatch", color: "bg-red-500" },
  { key: "awaiting-response", label: "Awaiting Response", color: "bg-yellow-500" },
  { key: "scheduled", label: "Scheduled", color: "bg-blue-500" },
  { key: "in-progress", label: "In Progress", color: "bg-orange-500" },
  { key: "waiting-on-parts", label: "Waiting on Parts", color: "bg-purple-500" },
  { key: "completed", label: "Completed", color: "bg-green-500" },
];

const URGENCY_COLORS: Record<string, string> = {
  Emergency: "border-red-500/30 text-red-400",
  High: "border-orange-500/30 text-orange-400",
  Medium: "border-yellow-500/30 text-yellow-400",
  Low: "border-border text-muted-foreground",
};

function DispatchCardItem({ card }: { card: DispatchCard }) {
  const [, navigate] = useLocation();
  const daysOld = Math.floor((Date.now() - new Date(card.createdAt).getTime()) / 86400000);

  return (
    <Card
      className="cursor-pointer hover:border-primary/30 transition-colors"
      onClick={() => navigate(`/requests/${card.requestId}`)}
      data-testid={`dispatch-card-${card.requestId}`}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate max-w-[120px]">{card.property?.name}</span>
            <span className="text-foreground font-medium">#{card.unitNumber}</span>
          </div>
          <Badge variant="outline" className={`text-[10px] px-1.5 ${URGENCY_COLORS[card.urgency] || ""}`}>
            {card.urgency}
          </Badge>
        </div>

        <div className="flex items-center gap-1.5">
          <Wrench className="h-3.5 w-3.5 text-primary" />
          <span className="text-sm font-medium text-foreground truncate">{card.issueType}</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          <span>{card.tenantName}</span>
        </div>

        {card.vendor && (
          <div className="flex items-center gap-1.5 text-xs">
            <Zap className="h-3 w-3 text-primary" />
            <span className="text-foreground">{card.vendor.name}</span>
            {card.assignment?.dispatchScore && (
              <Badge variant="outline" className="text-[9px] px-1 ml-auto">{card.assignment.dispatchScore}pts</Badge>
            )}
          </div>
        )}

        {card.assignment?.scheduledDate && (
          <div className="flex items-center gap-1.5 text-xs text-blue-400">
            <Clock className="h-3 w-3" />
            <span>{new Date(card.assignment.scheduledDate).toLocaleDateString()}</span>
            {card.assignment.arrivalWindow && <span className="text-muted-foreground">({card.assignment.arrivalWindow})</span>}
          </div>
        )}

        {card.assignment?.vendorResponseStatus && card.assignment.vendorResponseStatus !== "accepted" && (
          <Badge variant="outline" className="text-[10px]">{card.assignment.vendorResponseStatus}</Badge>
        )}

        {daysOld > 7 && card.column !== "completed" && (
          <div className="flex items-center gap-1 text-[10px] text-red-400">
            <AlertTriangle className="h-3 w-3" />
            <span>{daysOld}d old</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DispatchBoard() {
  const { data: cards, isLoading } = useQuery<DispatchCard[]>({
    queryKey: ["/api/dispatch-board"],
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const grouped = COLUMNS.map(col => ({
    ...col,
    cards: (cards || []).filter(c => c.column === col.key),
  }));

  return (
    <AppLayout>
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground" data-testid="text-dispatch-title">Dispatch Board</h1>
            <p className="text-sm text-muted-foreground">{cards?.length || 0} total requests</p>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "calc(100vh - 200px)" }}>
          {grouped.map(col => (
            <div key={col.key} className="min-w-[280px] max-w-[320px] flex-shrink-0" data-testid={`column-${col.key}`}>
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
                <h3 className="text-sm font-medium text-foreground">{col.label}</h3>
                <Badge variant="outline" className="text-xs ml-auto">{col.cards.length}</Badge>
              </div>
              <div className="space-y-2">
                {col.cards.map(card => (
                  <DispatchCardItem key={card.requestId} card={card} />
                ))}
                {col.cards.length === 0 && (
                  <div className="border border-dashed border-border rounded-lg p-4 text-center text-xs text-muted-foreground">
                    No requests
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
