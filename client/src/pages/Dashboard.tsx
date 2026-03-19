import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useRequests } from "@/hooks/use-requests";
import { useProperties } from "@/hooks/use-properties";
import { useStaff, useAssignRequest } from "@/hooks/use-staff";
import { Badge } from "@/components/ui/Badge";
import { format } from "date-fns";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useUpdateRequestStatus } from "@/hooks/use-requests";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, AlertCircle, Phone, Mail, MapPin, Search, UserCheck, MessageSquare, Send, ClipboardList, AlertTriangle, CheckCircle2, Clock, DollarSign, Trash2, ChevronDown, ChevronUp, Briefcase, X, Star, Calendar, Zap, ShieldCheck, ThumbsUp, CheckSquare, ChevronRight, Circle } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { useVendors, useVendorAssignment, useAssignVendor, useClearVendorAssignment, useMarkVendorContacted } from "@/hooks/use-vendors";

interface DashboardStats {
  totalRequests: number;
  newRequests: number;
  inProgress: number;
  completed: number;
  emergencies: number;
  totalProperties: number;
  needsDispatch: number;
  scheduledToday: number;
  completedThisWeek: number;
  openEmergencies: number;
  avgVendorRating: number | null;
  topVendors: any[];
}

const JOB_STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  "needs-dispatch": { label: "Needs Dispatch", color: "text-red-400 bg-red-400/10 border-red-400/20", icon: AlertTriangle },
  "assigned": { label: "Vendor Assigned", color: "text-blue-400 bg-blue-400/10 border-blue-400/20", icon: Briefcase },
  "contacted": { label: "Vendor Contacted", color: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20", icon: Phone },
  "scheduled": { label: "Scheduled", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20", icon: Calendar },
  "in-progress": { label: "In Progress", color: "text-orange-400 bg-orange-400/10 border-orange-400/20", icon: Zap },
  "waiting-on-parts": { label: "Waiting on Parts", color: "text-purple-400 bg-purple-400/10 border-purple-400/20", icon: Clock },
  "completed": { label: "Job Completed", color: "text-green-400 bg-green-400/10 border-green-400/20", icon: CheckCircle2 },
  "cancelled": { label: "Cancelled", color: "text-muted-foreground bg-muted border-border", icon: X },
};

function TrustScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "text-green-400" : score >= 60 ? "text-yellow-400" : "text-red-400";
  return (
    <span className={`text-xs font-bold flex items-center gap-0.5 ${color}`}>
      <ShieldCheck className="h-3 w-3" /> {score}
    </span>
  );
}

function DispatchPanel({ requestId, issueType }: { requestId: number; issueType: string }) {
  const queryClient = useQueryClient();
  const { data: vendors = [] } = useVendors();
  const { data: assignmentData, isLoading } = useVendorAssignment(requestId);
  const assignVendor = useAssignVendor(requestId);
  const clearAssignment = useClearVendorAssignment(requestId);
  const markContacted = useMarkVendorContacted(requestId);

  const [showPicker, setShowPicker] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [notes, setNotes] = useState("");
  const [showDispatchEdit, setShowDispatchEdit] = useState(false);
  const [showProof, setShowProof] = useState(false);

  // Dispatch state
  const [dispatchStatus, setDispatchStatus] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [arrivalWindow, setArrivalWindow] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [materialsUsed, setMaterialsUsed] = useState("");
  const [finalCost, setFinalCost] = useState("");

  const { data: recommendations = [] } = useQuery<any[]>({
    queryKey: ["/api/vendors/recommendations", issueType],
    queryFn: async () => {
      const res = await fetch(`/api/vendors/recommendations?tradeCategory=${encodeURIComponent(issueType)}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: showPicker,
  });

  const updateDispatch = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/requests/${requestId}/dispatch`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-assignment", requestId] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setShowDispatchEdit(false);
      setShowProof(false);
    },
  });

  const assignment = assignmentData?.assignment;
  const assignedVendor = assignmentData?.vendor;
  const activeVendors = vendors.filter((v: any) => v.status === "active");

  const handleAssign = async () => {
    if (!selectedVendorId) return;
    await assignVendor.mutateAsync({ vendorId: Number(selectedVendorId), priority, assignmentNotes: notes || undefined, jobStatus: "assigned" });
    setShowPicker(false);
    setSelectedVendorId("");
    setNotes("");
  };

  const handleDispatchSave = async () => {
    const data: any = {};
    if (dispatchStatus) data.jobStatus = dispatchStatus;
    if (scheduledDate) data.scheduledDate = new Date(scheduledDate).toISOString();
    if (arrivalWindow) data.arrivalWindow = arrivalWindow;
    await updateDispatch.mutateAsync(data);
    setDispatchStatus("");
    setScheduledDate("");
    setArrivalWindow("");
  };

  const handleProofSave = async () => {
    const data: any = { jobStatus: "completed", completedAt: new Date().toISOString() };
    if (completionNotes) data.completionNotes = completionNotes;
    if (invoiceNumber) data.invoiceNumber = invoiceNumber;
    if (materialsUsed) data.materialsUsed = materialsUsed;
    if (finalCost) data.finalCost = Math.round(parseFloat(finalCost) * 100);
    await updateDispatch.mutateAsync(data);
    setCompletionNotes("");
    setInvoiceNumber("");
    setMaterialsUsed("");
    setFinalCost("");
  };

  const jobStatus = assignment?.jobStatus || "assigned";
  const jobConfig = JOB_STATUS_CONFIG[jobStatus] || JOB_STATUS_CONFIG["assigned"];
  const JobIcon = jobConfig.icon;

  if (isLoading) return null;

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vendor Dispatch</span>
      </div>

      {assignment && assignedVendor ? (
        <div className="space-y-2" data-testid={`vendor-assignment-${requestId}`}>
          {/* Job Status Badge */}
          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-medium ${jobConfig.color}`}>
            <JobIcon className="h-3 w-3" />
            {jobConfig.label}
          </div>

          {/* Vendor Card */}
          <div className="bg-muted/50 rounded-xl p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold">{assignedVendor.name}</p>
                  {assignedVendor.preferredVendor && (
                    <span className="text-[10px] text-yellow-400 flex items-center gap-0.5">
                      <Star className="h-2.5 w-2.5 fill-yellow-400" /> Preferred
                    </span>
                  )}
                </div>
                {assignedVendor.companyName && <p className="text-xs text-muted-foreground">{assignedVendor.companyName}</p>}
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <Badge variant="outline" className="text-[10px] px-1.5">{assignedVendor.tradeCategory}</Badge>
                  {assignment.priority && assignment.priority !== "Normal" && (
                    <Badge variant={assignment.priority === "Emergency" ? "destructive" : "warning"} className="text-[10px] px-1.5">{assignment.priority}</Badge>
                  )}
                  {assignment.contactedVendor && (
                    <span className="text-[10px] text-green-400 flex items-center gap-0.5">
                      <CheckCircle2 className="h-2.5 w-2.5" /> Contacted
                    </span>
                  )}
                </div>
                {assignment.scheduledDate && (
                  <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(assignment.scheduledDate), 'EEE MMM d')}
                    {assignment.arrivalWindow && ` · ${assignment.arrivalWindow}`}
                  </p>
                )}
                {assignment.assignmentNotes && (
                  <p className="text-xs text-muted-foreground mt-1 italic">"{assignment.assignmentNotes}"</p>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                {!assignment.contactedVendor && (
                  <Button size="sm" variant="outline" className="h-7 px-2 text-[10px]"
                    onClick={() => markContacted.mutate(true)} disabled={markContacted.isPending}
                    data-testid={`button-mark-contacted-${requestId}`}>
                    Mark Contacted
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400"
                  onClick={() => clearAssignment.mutate()} disabled={clearAssignment.isPending}
                  data-testid={`button-clear-vendor-${requestId}`}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Proof of Completion (if completed) */}
          {assignment.jobStatus === "completed" && (assignment.completionNotes || assignment.invoiceNumber || assignment.materialsUsed) && (
            <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3">
              <p className="text-xs font-semibold text-green-400 mb-1 flex items-center gap-1">
                <CheckSquare className="h-3 w-3" /> Completion Summary
              </p>
              {assignment.completionNotes && <p className="text-xs text-muted-foreground">{assignment.completionNotes}</p>}
              <div className="flex gap-3 mt-1 flex-wrap">
                {assignment.invoiceNumber && <p className="text-[10px] text-muted-foreground">Invoice: {assignment.invoiceNumber}</p>}
                {assignment.materialsUsed && <p className="text-[10px] text-muted-foreground">Materials: {assignment.materialsUsed}</p>}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-1.5 flex-wrap">
            {!showDispatchEdit && !showProof && (
              <>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px] text-muted-foreground"
                  onClick={() => { setShowPicker(true); setSelectedVendorId(String(assignment.vendorId)); setPriority(assignment.priority || "Normal"); setNotes(assignment.assignmentNotes || ""); }}
                  data-testid={`button-reassign-vendor-${requestId}`}>
                  Reassign
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px] text-muted-foreground"
                  onClick={() => { setShowDispatchEdit(true); setDispatchStatus(assignment.jobStatus || ""); setScheduledDate(assignment.scheduledDate ? new Date(assignment.scheduledDate).toISOString().slice(0,16) : ""); setArrivalWindow(assignment.arrivalWindow || ""); }}>
                  Update Status
                </Button>
                {assignment.jobStatus !== "completed" && (
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px] text-green-400 hover:text-green-300"
                    onClick={() => setShowProof(true)}>
                    Mark Complete
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Dispatch Update Form */}
          {showDispatchEdit && (
            <div className="bg-muted/30 rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-foreground">Update Dispatch Status</p>
              <Select
                value={dispatchStatus}
                onChange={e => setDispatchStatus(e.target.value)}
                options={[
                  { label: "-- Select status --", value: "" },
                  { label: "Vendor Assigned", value: "assigned" },
                  { label: "Vendor Contacted", value: "contacted" },
                  { label: "Scheduled", value: "scheduled" },
                  { label: "In Progress", value: "in-progress" },
                  { label: "Waiting on Parts", value: "waiting-on-parts" },
                  { label: "Cancelled", value: "cancelled" },
                ]}
                className="h-9 text-sm"
                data-testid={`select-job-status-${requestId}`}
              />
              <div className="flex gap-2">
                <Input type="datetime-local" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="h-8 text-xs flex-1" placeholder="Scheduled date/time" data-testid={`input-scheduled-date-${requestId}`} />
                <Input value={arrivalWindow} onChange={e => setArrivalWindow(e.target.value)} className="h-8 text-xs w-28" placeholder="e.g. 9–11 AM" data-testid={`input-arrival-window-${requestId}`} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="h-8 px-3 text-xs" onClick={handleDispatchSave} disabled={updateDispatch.isPending}>
                  {updateDispatch.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                </Button>
                <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setShowDispatchEdit(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Proof of Completion Form */}
          {showProof && (
            <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-green-400 flex items-center gap-1">
                <CheckSquare className="h-3 w-3" /> Record Proof of Completion
              </p>
              <textarea
                className="w-full bg-background border border-border rounded-lg p-2 text-xs resize-none h-16 focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Completion notes — what was done, outcome, tenant confirmation..."
                value={completionNotes}
                onChange={e => setCompletionNotes(e.target.value)}
                data-testid={`input-completion-notes-${requestId}`}
              />
              <div className="flex gap-2">
                <Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="h-8 text-xs flex-1" placeholder="Invoice # (optional)" data-testid={`input-invoice-${requestId}`} />
                <Input type="number" step="0.01" value={finalCost} onChange={e => setFinalCost(e.target.value)} className="h-8 text-xs w-24" placeholder="Final $" data-testid={`input-final-cost-${requestId}`} />
              </div>
              <Input value={materialsUsed} onChange={e => setMaterialsUsed(e.target.value)} className="h-8 text-xs" placeholder="Materials used (optional)" data-testid={`input-materials-${requestId}`} />
              <div className="flex gap-2">
                <Button size="sm" className="h-8 px-3 text-xs bg-green-500 hover:bg-green-600 text-white" onClick={handleProofSave} disabled={updateDispatch.isPending}>
                  {updateDispatch.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Record Completion"}
                </Button>
                <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setShowProof(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        !showPicker && (
          <Button size="sm" variant="outline" className="h-8 px-3 text-xs gap-1.5 w-full"
            onClick={() => setShowPicker(true)}
            data-testid={`button-assign-vendor-${requestId}`}>
            <ShieldCheck className="h-3.5 w-3.5" /> Assign & Dispatch Vendor
          </Button>
        )
      )}

      {/* Vendor Picker */}
      {showPicker && (
        <div className="mt-2 space-y-2 bg-muted/30 rounded-xl p-3" data-testid={`vendor-picker-${requestId}`}>
          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <Star className="h-2.5 w-2.5 text-yellow-400" /> Recommended for {issueType}
              </p>
              <div className="space-y-1">
                {recommendations.slice(0, 3).map((v: any) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVendorId(String(v.id))}
                    className={`w-full text-left flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border transition-colors text-xs ${selectedVendorId === String(v.id) ? "bg-primary/10 border-primary/40 text-foreground" : "border-border hover:bg-muted/50 text-muted-foreground"}`}
                    data-testid={`rec-vendor-${v.id}-${requestId}`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {v.preferredVendor && <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 shrink-0" />}
                      <span className="font-medium text-foreground truncate">{v.name}</span>
                      {v.companyName && <span className="text-muted-foreground truncate">· {v.companyName}</span>}
                    </div>
                    <TrustScoreBadge score={v.trustScore} />
                  </button>
                ))}
              </div>
            </div>
          )}

          <Select
            value={selectedVendorId}
            onChange={e => setSelectedVendorId(e.target.value)}
            options={[
              { label: "Or pick any vendor...", value: "" },
              ...activeVendors.map((v: any) => ({ label: `${v.name}${v.companyName ? ` (${v.companyName})` : ""} — ${v.tradeCategory}`, value: String(v.id) })),
            ]}
            className="h-9 text-sm py-1"
            data-testid={`select-vendor-${requestId}`}
          />
          <div className="flex gap-2">
            <Select
              value={priority}
              onChange={e => setPriority(e.target.value)}
              options={[
                { label: "Normal", value: "Normal" },
                { label: "High", value: "High" },
                { label: "Emergency", value: "Emergency" },
              ]}
              className="h-9 text-sm py-1 flex-1"
              data-testid={`select-vendor-priority-${requestId}`}
            />
            <Button size="sm" className="h-9 px-3 text-xs"
              onClick={handleAssign} disabled={!selectedVendorId || assignVendor.isPending}
              data-testid={`button-confirm-vendor-${requestId}`}>
              {assignVendor.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Dispatch"}
            </Button>
            <Button size="sm" variant="ghost" className="h-9 px-2" onClick={() => setShowPicker(false)} data-testid={`button-cancel-vendor-${requestId}`}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Dispatch notes (optional)"
            className="h-8 text-xs" data-testid={`input-vendor-notes-${requestId}`} />
        </div>
      )}
    </div>
  );
}

function ActivityTimeline({ requestId }: { requestId: number }) {
  const { data: activity = [] } = useQuery<any[]>({
    queryKey: ["/api/activity", requestId],
    queryFn: async () => {
      const res = await fetch(`/api/requests/${requestId}/activity`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  if (activity.length === 0) return null;

  const eventColors: Record<string, string> = {
    request_created: "bg-blue-400",
    vendor_assigned: "bg-primary",
    vendor_reassigned: "bg-primary",
    vendor_contacted: "bg-indigo-400",
    vendor_removed: "bg-red-400",
    job_scheduled: "bg-yellow-400",
    job_in_progress: "bg-orange-400",
    job_completed: "bg-green-400",
    job_cancelled: "bg-gray-400",
    job_waiting_on_parts: "bg-purple-400",
    vendor_reviewed: "bg-yellow-400",
  };

  const sorted = [...activity].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
        <Circle className="h-3 w-3" /> Activity
      </p>
      <div className="relative space-y-2 pl-4">
        <div className="absolute left-1.5 top-1 bottom-1 w-px bg-border" />
        {sorted.slice(0, 5).map((event: any) => (
          <div key={event.id} className="relative flex items-start gap-2">
            <div className={`absolute -left-2.5 mt-1 h-2 w-2 rounded-full ${eventColors[event.eventType] || "bg-muted-foreground"}`} />
            <div>
              <p className="text-xs font-medium text-foreground leading-tight">{event.eventLabel}</p>
              {event.details && <p className="text-[10px] text-muted-foreground">{event.details}</p>}
              <p className="text-[10px] text-muted-foreground">
                {event.createdAt ? format(new Date(event.createdAt), "MMM d, h:mm a") : ""}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RequestCosts({ requestId }: { requestId: number }) {
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [vendor, setVendor] = useState("");
  const queryClient = useQueryClient();
  const { data: costs, isLoading } = useQuery<any[]>({
    queryKey: ["/api/costs", requestId],
    queryFn: async () => {
      const res = await fetch(`/api/costs/${requestId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const addCost = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/costs/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc, amount: Math.round(parseFloat(amount) * 100), vendor: vendor || undefined }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      setDesc(""); setAmount(""); setVendor("");
      queryClient.invalidateQueries({ queryKey: ["/api/costs", requestId] });
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === "/api/costs/report" });
    },
  });

  const deleteCost = useMutation({
    mutationFn: async (costId: number) => {
      const res = await fetch(`/api/costs/${costId}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/costs", requestId] });
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === "/api/costs/report" });
    },
  });

  const totalCents = (costs || []).reduce((s: number, c: any) => s + c.amount, 0);
  const formatCents = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1">
        <DollarSign className="h-3 w-3" /> Costs {totalCents > 0 && <span className="text-primary ml-1">{formatCents(totalCents)}</span>}
      </p>
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <div className="space-y-2 max-h-32 overflow-y-auto mb-3">
          {(costs || []).length === 0 && <p className="text-xs text-muted-foreground">No costs logged</p>}
          {(costs || []).map((cost: any) => (
            <div key={cost.id} className="bg-muted/50 rounded-lg p-2 flex items-center justify-between gap-2" data-testid={`cost-entry-${cost.id}`}>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-foreground truncate">{cost.description}</p>
                <p className="text-xs text-muted-foreground">{cost.vendor && <>{cost.vendor} &middot; </>}{formatCents(cost.amount)}</p>
              </div>
              <button onClick={() => deleteCost.mutate(cost.id)} className="text-muted-foreground hover:text-red-400 p-1 shrink-0" data-testid={`button-delete-cost-${cost.id}`}>
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2 flex-wrap">
        <Input placeholder="Description" className="text-sm h-8 bg-muted/50 flex-1 min-w-[100px]" value={desc} onChange={(e) => setDesc(e.target.value)} data-testid={`input-cost-desc-${requestId}`} />
        <Input placeholder="$0.00" type="number" step="0.01" min="0" className="text-sm h-8 bg-muted/50 w-20" value={amount} onChange={(e) => setAmount(e.target.value)} data-testid={`input-cost-amount-${requestId}`} />
        <Input placeholder="Vendor" className="text-sm h-8 bg-muted/50 w-24" value={vendor} onChange={(e) => setVendor(e.target.value)} data-testid={`input-cost-vendor-${requestId}`} />
        <Button size="sm" className="h-8 px-3" disabled={!desc.trim() || !amount || parseFloat(amount) <= 0 || addCost.isPending} onClick={() => addCost.mutate()} data-testid={`button-add-cost-${requestId}`}>
          <DollarSign className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function RequestNotes({ requestId }: { requestId: number }) {
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();
  const { data: notes, isLoading } = useQuery<any[]>({
    queryKey: ["/api/notes", requestId],
    queryFn: async () => {
      const res = await fetch(`/api/notes/${requestId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const addNote = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/notes/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/notes", requestId] });
    },
  });

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1">
        <MessageSquare className="h-3 w-3" /> Notes
      </p>
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <div className="space-y-2 max-h-32 overflow-y-auto mb-3">
          {(notes || []).length === 0 && <p className="text-xs text-muted-foreground">No notes yet</p>}
          {(notes || []).map((note: any) => (
            <div key={note.id} className="bg-muted/50 rounded-lg p-2">
              <p className="text-xs text-foreground">{note.content}</p>
              <p className="text-xs text-muted-foreground mt-1">{note.authorName} &middot; {note.createdAt ? format(new Date(note.createdAt), "MMM d, h:mm a") : ""}</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input placeholder="Add a note..." className="text-sm h-9 bg-muted/50" value={content} onChange={(e) => setContent(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && content.trim()) addNote.mutate(); }} data-testid={`input-note-${requestId}`} />
        <Button size="sm" className="h-9 px-3" disabled={!content.trim() || addNote.isPending} onClick={() => addNote.mutate()} data-testid={`button-add-note-${requestId}`}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function RequestMessages({ requestId }: { requestId: number }) {
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();
  const { data: messages, isLoading } = useQuery<any[]>({
    queryKey: ["/api/messages", requestId],
    queryFn: async () => {
      const res = await fetch(`/api/messages/${requestId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 15000,
  });

  const sendMessage = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/messages/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages", requestId] });
    },
  });

  const tenantMessages = (messages || []).filter((m: any) => m.senderType === "tenant");

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1">
        <MessageSquare className="h-3 w-3" /> Tenant Messages
        {tenantMessages.length > 0 && <Badge variant="default" className="ml-1 text-[10px] px-1.5 py-0">{tenantMessages.length}</Badge>}
      </p>
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
          {(messages || []).length === 0 && <p className="text-xs text-muted-foreground">No messages yet. Send one to start a conversation with the tenant.</p>}
          {(messages || []).map((msg: any) => (
            <div key={msg.id} className={`rounded-lg p-2.5 max-w-[85%] ${msg.senderType === "landlord" ? "bg-primary/10 ml-auto text-right" : "bg-muted/50 mr-auto"}`} data-testid={`message-${msg.id}`}>
              <p className="text-xs text-foreground">{msg.content}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{msg.senderName} &middot; {msg.createdAt ? format(new Date(msg.createdAt), "MMM d, h:mm a") : ""}</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input placeholder="Message tenant..." className="text-sm h-9 bg-muted/50" value={content} onChange={(e) => setContent(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && content.trim()) sendMessage.mutate(); }} data-testid={`input-message-${requestId}`} />
        <Button size="sm" className="h-9 px-3" disabled={!content.trim() || sendMessage.isPending} onClick={() => sendMessage.mutate()} data-testid={`button-send-message-${requestId}`}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: requests, isLoading: reqLoading } = useRequests();
  const { data: properties, isLoading: propLoading } = useProperties();
  const { data: staffList } = useStaff();
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateRequestStatus();
  const { mutate: assignRequest } = useAssignRequest();
  const { data: stats } = useQuery<DashboardStats>({ queryKey: ["/api/dashboard/stats"] });
  const queryClient = useQueryClient();
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const deleteRequest = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/requests/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete request");
    },
    onSuccess: () => {
      setDeleteConfirm(null);
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  if (reqLoading || propLoading) {
    return (
      <AppLayout>
        <div className="h-[60vh] flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const getUrgencyBadge = (urgency: string) => {
    switch(urgency) {
      case 'Emergency': return <Badge variant="destructive">Emergency</Badge>;
      case 'Med':
      case 'Medium': return <Badge variant="warning">Medium</Badge>;
      default: return <Badge variant="default">Low</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Completed': return <Badge variant="success">Completed</Badge>;
      case 'In-Progress': return <Badge variant="warning">In Progress</Badge>;
      default: return <Badge variant="default">New</Badge>;
    }
  };

  const getPropertyName = (propId: number) => properties?.find(p => p.id === propId)?.name || 'Unknown Property';
  const getStaffName = (staffId: number | null) => {
    if (!staffId || !staffList) return null;
    return staffList.find(s => s.id === staffId)?.name || null;
  };

  const staffOptions = [
    { label: "Unassigned", value: "0" },
    ...(staffList || []).map(s => ({ label: s.name, value: String(s.id) })),
  ];

  let filteredRequests = requests || [];
  if (searchTerm) {
    filteredRequests = filteredRequests.filter(r => 
      r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.tenantName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  if (statusFilter !== "All") {
    filteredRequests = filteredRequests.filter(r => r.status === statusFilter);
  }

  const toggleCard = (id: number) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <AppLayout>
      {/* VendorTrust Dispatch Metrics */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-card rounded-2xl p-4 border border-border shadow-sm" data-testid="stat-needs-dispatch">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${(stats.needsDispatch || 0) > 0 ? "bg-red-500/10" : "bg-muted"}`}>
                <AlertTriangle className={`h-5 w-5 ${(stats.needsDispatch || 0) > 0 ? "text-red-400" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${(stats.needsDispatch || 0) > 0 ? "text-red-400" : ""}`}>{stats.needsDispatch ?? 0}</p>
                <p className="text-xs text-muted-foreground">Needs Dispatch</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border shadow-sm" data-testid="stat-scheduled">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.scheduledToday ?? 0}</p>
                <p className="text-xs text-muted-foreground">Scheduled Today</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border shadow-sm" data-testid="stat-completed-week">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completedThisWeek ?? 0}</p>
                <p className="text-xs text-muted-foreground">Done This Week</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border shadow-sm" data-testid="stat-avg-rating">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-yellow-400/10 flex items-center justify-center">
                <Star className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgVendorRating ? stats.avgVendorRating.toFixed(1) : "—"}</p>
                <p className="text-xs text-muted-foreground">Avg Vendor Rating</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Vendors Strip */}
      {stats?.topVendors && stats.topVendors.length > 0 && (
        <div className="mb-6 bg-card rounded-2xl border border-border p-4 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Most Trusted Vendors
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {stats.topVendors.map((v: any) => (
              <div key={v.id} className="flex-shrink-0 flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2 border border-border/50">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                  {v.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{v.name}</p>
                  <p className="text-[10px] text-muted-foreground">{v.tradeCategory}</p>
                </div>
                <TrustScoreBadge score={v.trustScore} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Dispatch Center</h1>
          <p className="text-muted-foreground mt-1">Assign vendors, track status, and verify completion.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Search tenant or issue..." className="pl-10 w-full sm:w-64 bg-card" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} data-testid="input-search-requests" />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { label: "All Statuses", value: "All" },
              { label: "New", value: "New" },
              { label: "In-Progress", value: "In-Progress" },
              { label: "Completed", value: "Completed" }
            ]}
            className="w-full sm:w-48 bg-card" data-testid="select-status-filter" />
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-3xl p-12 text-center flex flex-col items-center">
          <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold mb-2">No requests found</h3>
          <p className="text-muted-foreground max-w-md mx-auto">You're all caught up! No maintenance requests match your current filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((request) => {
            const isExpanded = expandedCards.has(request.id);
            const staffName = getStaffName(request.assignedTo);

            return (
              <div key={request.id} className="bg-card rounded-2xl border border-border shadow-sm transition-all" data-testid={`request-card-${request.id}`}>
                <button
                  className="w-full text-left p-4 md:p-5 flex items-center gap-4 cursor-pointer active:bg-muted/30 transition-colors rounded-2xl"
                  onClick={() => toggleCard(request.id)}
                  data-testid={`button-expand-request-${request.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {getStatusBadge(request.status)}
                      {getUrgencyBadge(request.urgency)}
                      <Badge variant="outline" className="text-xs">{request.issueType}</Badge>
                      {staffName && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1 ml-1">
                          <UserCheck className="h-3 w-3 text-primary" /> {staffName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <h3 className="text-sm md:text-base font-bold truncate">{getPropertyName(request.propertyId)}</h3>
                      <span className="text-xs text-muted-foreground flex items-center gap-0.5 shrink-0">
                        <MapPin className="h-3 w-3" /> Unit {request.unitNumber}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{request.description}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:block whitespace-nowrap">
                      {request.createdAt ? format(new Date(request.createdAt), 'MMM d') : ''}
                    </span>
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 md:px-5 pb-5 border-t border-border pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between mb-4 text-xs text-muted-foreground">
                      <span>Submitted {request.createdAt ? format(new Date(request.createdAt), 'MMM d, yyyy — h:mm a') : ''}</span>
                      {request.trackingCode && (
                        <span className="flex items-center gap-1">
                          Tracking: <code className="font-mono text-primary font-bold">{request.trackingCode}</code>
                        </span>
                      )}
                    </div>

                    <div className="bg-muted/50 rounded-xl p-4 mb-4">
                      <p className="text-sm text-foreground">{request.description}</p>
                    </div>

                    {request.photoUrls && request.photoUrls.length > 0 && (
                      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                        {request.photoUrls.map((url, idx) => (
                          <img key={idx} src={url} alt="Issue" className="h-20 w-20 rounded-lg object-cover cursor-pointer border border-border hover:opacity-80 transition-opacity flex-shrink-0"
                            onClick={() => setSelectedImage(url)} data-testid={`img-photo-${request.id}-${idx}`} />
                        ))}
                      </div>
                    )}

                    <div className="border-t border-border pt-4 mb-4">
                      <p className="text-sm font-bold">{request.tenantName}</p>
                      <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                        <a href={`tel:${request.tenantPhone}`} className="flex items-center gap-1 hover:text-primary" data-testid={`link-phone-${request.id}`}>
                          <Phone className="h-3 w-3"/>{request.tenantPhone}
                        </a>
                        <a href={`mailto:${request.tenantEmail}`} className="flex items-center gap-1 hover:text-primary" data-testid={`link-email-${request.id}`}>
                          <Mail className="h-3 w-3"/> Email
                        </a>
                      </div>
                    </div>

                    <div className="flex gap-2 mb-4">
                      <Select value={request.status} onChange={(e) => updateStatus({ id: request.id, data: { status: e.target.value } })}
                        disabled={isUpdating} className="h-10 text-sm py-1 bg-muted border-none flex-1"
                        options={[
                          { label: "Mark New", value: "New" },
                          { label: "Mark In-Progress", value: "In-Progress" },
                          { label: "Mark Completed", value: "Completed" }
                        ]}
                        data-testid={`select-status-${request.id}`} />
                      {staffList && staffList.length > 0 && (
                        <Select value={String(request.assignedTo || 0)}
                          onChange={(e) => assignRequest({ requestId: request.id, staffId: parseInt(e.target.value) })}
                          className="h-10 text-sm py-1 bg-muted border-none flex-1"
                          options={staffOptions} data-testid={`select-assign-${request.id}`} />
                      )}
                    </div>

                    <DispatchPanel requestId={request.id} issueType={request.issueType} />
                    <ActivityTimeline requestId={request.id} />
                    <RequestMessages requestId={request.id} />
                    <RequestNotes requestId={request.id} />
                    <RequestCosts requestId={request.id} />

                    <div className="mt-4 pt-4 border-t border-border flex justify-end">
                      {deleteConfirm === request.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-400">Delete this request and all its data?</span>
                          <Button variant="destructive" size="sm" className="h-8 px-3 text-xs"
                            onClick={() => deleteRequest.mutate(request.id)} disabled={deleteRequest.isPending}
                            data-testid={`button-confirm-delete-${request.id}`}>
                            {deleteRequest.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes, Delete"}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 px-3 text-xs" onClick={() => setDeleteConfirm(null)} data-testid={`button-cancel-delete-${request.id}`}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-8 px-3 text-xs text-muted-foreground hover:text-red-400 gap-1"
                          onClick={() => setDeleteConfirm(request.id)} data-testid={`button-delete-request-${request.id}`}>
                          <Trash2 className="h-3 w-3" /> Delete Request
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)} className="max-w-4xl p-2 bg-transparent border-0 shadow-none">
        {selectedImage && <img src={selectedImage} alt="Full size" className="w-full h-auto max-h-[85vh] object-contain rounded-xl shadow-2xl" />}
      </Dialog>
    </AppLayout>
  );
}
