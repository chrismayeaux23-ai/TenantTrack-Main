import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Clock, User, MapPin, Wrench, Zap, Sparkles, Calendar, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

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
    responseDeadline: string | null;
  } | null;
}

const COLUMNS = [
  { key: "needs-dispatch", label: "Needs Dispatch", color: "bg-red-500", targetStatus: "assigned" },
  { key: "awaiting-response", label: "Awaiting Response", color: "bg-yellow-500", targetStatus: "assigned" },
  { key: "scheduled", label: "Scheduled", color: "bg-blue-500", targetStatus: "scheduled" },
  { key: "in-progress", label: "In Progress", color: "bg-orange-500", targetStatus: "in-progress" },
  { key: "waiting-on-parts", label: "Waiting on Parts", color: "bg-purple-500", targetStatus: "waiting-on-parts" },
  { key: "completed", label: "Completed", color: "bg-green-500", targetStatus: "completed" },
];

const URGENCY_COLORS: Record<string, string> = {
  Emergency: "border-red-500/30 text-red-400",
  High: "border-orange-500/30 text-orange-400",
  Medium: "border-yellow-500/30 text-yellow-400",
  Low: "border-border text-muted-foreground",
};

function DispatchCardItem({ card, onDragStart }: { card: DispatchCard; onDragStart: (e: React.DragEvent, card: DispatchCard) => void }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const daysOld = Math.floor((Date.now() - new Date(card.createdAt).getTime()) / 86400000);
  const isOverdue = card.assignment?.responseDeadline &&
    new Date(card.assignment.responseDeadline) < new Date() &&
    card.assignment.vendorResponseStatus === "pending-response";

  const autoDispatch = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/requests/${card.requestId}/auto-dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "auto-assign" }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dispatch-board"] });
      toast({ title: "Vendor auto-dispatched" });
    },
    onError: () => toast({ title: "No eligible vendors found", variant: "destructive" }),
  });

  return (
    <Card
      className={`cursor-grab active:cursor-grabbing hover:border-primary/30 transition-colors ${isOverdue ? "border-red-500/40 bg-red-500/5" : ""}`}
      draggable
      onDragStart={e => onDragStart(e, card)}
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
          <Badge variant="outline" className={`text-[10px] ${
            card.assignment.vendorResponseStatus === "declined" ? "text-red-400 border-red-500/30" :
            card.assignment.vendorResponseStatus === "no-response" ? "text-red-400 border-red-500/30" :
            card.assignment.vendorResponseStatus === "proposed-new-time" ? "text-blue-400 border-blue-500/30" :
            ""
          }`}>{card.assignment.vendorResponseStatus.replace(/-/g, " ")}</Badge>
        )}

        {isOverdue && (
          <div className="flex items-center gap-1 text-[10px] text-red-400 font-medium">
            <AlertTriangle className="h-3 w-3" />
            <span>SLA overdue</span>
          </div>
        )}

        {daysOld > 3 && card.column !== "completed" && !isOverdue && (
          <div className="flex items-center gap-1 text-[10px] text-yellow-400">
            <Clock className="h-3 w-3" />
            <span>{daysOld}d old</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 pt-1 border-t border-border/50">
          {card.column === "needs-dispatch" && (
            <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-primary gap-1"
              onClick={e => { e.stopPropagation(); autoDispatch.mutate(); }}
              disabled={autoDispatch.isPending}
              data-testid={`button-auto-dispatch-${card.requestId}`}>
              {autoDispatch.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              Auto
            </Button>
          )}
          {card.column !== "completed" && card.vendor && (
            <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] gap-1"
              onClick={e => { e.stopPropagation(); navigate(`/requests/${card.requestId}`); }}
              data-testid={`button-schedule-${card.requestId}`}>
              <Calendar className="h-3 w-3" />
              {card.assignment?.scheduledDate ? "Resched" : "Schedule"}
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] gap-1 ml-auto"
            onClick={e => { e.stopPropagation(); navigate(`/requests/${card.requestId}`); }}
            data-testid={`button-open-${card.requestId}`}>
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DispatchBoard() {
  const { toast } = useToast();
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const { data: cards, isLoading } = useQuery<DispatchCard[]>({
    queryKey: ["/api/dispatch-board"],
  });

  const moveCard = useMutation({
    mutationFn: async ({ requestId, targetStatus }: { requestId: number; targetStatus: string }) => {
      await apiRequest("PATCH", `/api/requests/${requestId}/dispatch`, { jobStatus: targetStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dispatch-board"] });
    },
    onError: () => toast({ title: "Failed to move card", variant: "destructive" }),
  });

  const handleDragStart = useCallback((e: React.DragEvent, card: DispatchCard) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ requestId: card.requestId, fromColumn: card.column }));
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(colKey);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverCol(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetCol: typeof COLUMNS[0]) => {
    e.preventDefault();
    setDragOverCol(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      if (data.fromColumn === targetCol.key) return;
      if (targetCol.key === "needs-dispatch") return;
      moveCard.mutate({ requestId: data.requestId, targetStatus: targetCol.targetStatus });
    } catch {}
  }, [moveCard]);

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
    cards: (cards || []).filter(c => c.column === col.key)
      .sort((a, b) => {
        const urgencyOrder: Record<string, number> = { Emergency: 0, High: 1, Medium: 2, Low: 3 };
        return (urgencyOrder[a.urgency] ?? 2) - (urgencyOrder[b.urgency] ?? 2);
      }),
  }));

  const totalCards = cards?.length || 0;
  const urgentCount = cards?.filter(c => (c.urgency === "Emergency" || c.urgency === "High") && c.column !== "completed").length || 0;

  return (
    <AppLayout>
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground" data-testid="text-dispatch-title">Dispatch Board</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-muted-foreground">{totalCards} total requests</span>
              {urgentCount > 0 && (
                <Badge variant="destructive" className="text-[10px]" data-testid="badge-urgent-count">
                  <AlertTriangle className="h-3 w-3 mr-1" />{urgentCount} urgent
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "calc(100vh - 200px)" }}>
          {grouped.map(col => (
            <div
              key={col.key}
              className={`min-w-[280px] max-w-[320px] flex-shrink-0 transition-colors rounded-xl ${
                dragOverCol === col.key ? "bg-primary/5 ring-2 ring-primary/20" : ""
              }`}
              onDragOver={e => handleDragOver(e, col.key)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, col)}
              data-testid={`column-${col.key}`}
            >
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
                <h3 className="text-sm font-medium text-foreground">{col.label}</h3>
                <Badge variant="outline" className="text-xs ml-auto">{col.cards.length}</Badge>
              </div>
              <div className="space-y-2 min-h-[100px]">
                {col.cards.map(card => (
                  <DispatchCardItem key={card.requestId} card={card} onDragStart={handleDragStart} />
                ))}
                {col.cards.length === 0 && (
                  <div className="border border-dashed border-border rounded-lg p-6 text-center text-xs text-muted-foreground">
                    {dragOverCol === col.key ? "Drop here" : "No requests"}
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
