import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProperties } from "@/hooks/use-properties";
import { useUpdateRequestStatus } from "@/hooks/use-requests";
import { useVendors, useVendorAssignment, useAssignVendor, useClearVendorAssignment, useMarkVendorContacted } from "@/hooks/use-vendors";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/NativeSelect";
import { apiRequest } from "@/lib/queryClient";
import {
  ChevronLeft, ShieldCheck, Phone, Mail, MapPin, AlertTriangle,
  CheckCircle2, Clock, Zap, Calendar, DollarSign, MessageSquare,
  Star, Loader2, X, Briefcase, FileText, PenLine, CheckSquare,
  Send, Circle, Hash, Sparkles, Link2, Copy
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

const URGENCY_CONFIG: Record<string, { label: string; variant: string }> = {
  Emergency: { label: "Emergency", variant: "destructive" },
  High:      { label: "High",      variant: "warning" },
  Medium:    { label: "Medium",    variant: "default" },
  Low:       { label: "Low",       variant: "outline" },
};

const STATUS_OPTIONS = ["New", "In-Progress", "Completed", "Cancelled"];

const JOB_STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  "needs-dispatch":   { label: "Needs Dispatch",   color: "text-red-400 bg-red-400/10 border-red-400/20",        icon: AlertTriangle },
  "assigned":         { label: "Vendor Assigned",   color: "text-blue-400 bg-blue-400/10 border-blue-400/20",     icon: Briefcase },
  "contacted":        { label: "Vendor Contacted",  color: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20", icon: Phone },
  "scheduled":        { label: "Scheduled",          color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20", icon: Calendar },
  "in-progress":      { label: "In Progress",        color: "text-orange-400 bg-orange-400/10 border-orange-400/20", icon: Zap },
  "waiting-on-parts": { label: "Waiting on Parts",  color: "text-purple-400 bg-purple-400/10 border-purple-400/20", icon: Clock },
  "completed":        { label: "Job Completed",      color: "text-green-400 bg-green-400/10 border-green-400/20",  icon: CheckCircle2 },
  "cancelled":        { label: "Cancelled",          color: "text-muted-foreground bg-muted border-border",        icon: X },
};

function TrustBadge({ score }: { score: number }) {
  const color = score >= 80 ? "text-green-400" : score >= 60 ? "text-yellow-400" : "text-red-400";
  return <span className={`text-xs font-bold flex items-center gap-0.5 ${color}`}><ShieldCheck className="h-3 w-3" />{score}</span>;
}

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const requestId = Number(id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: properties = [] } = useProperties();
  const { data: vendors = [] } = useVendors();
  const { data: assignmentData, isLoading: assignmentLoading } = useVendorAssignment(requestId);
  const assignVendor = useAssignVendor(requestId);
  const clearAssignment = useClearVendorAssignment(requestId);
  const markContacted = useMarkVendorContacted(requestId);
  const updateStatus = useUpdateRequestStatus();

  const { data: request, isLoading } = useQuery<any>({
    queryKey: ["/api/requests", requestId],
    queryFn: async () => {
      const res = await fetch(`/api/requests/${requestId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  const { data: notes = [] } = useQuery<any[]>({
    queryKey: ["/api/notes", requestId],
    queryFn: async () => {
      const res = await fetch(`/api/notes/${requestId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!requestId,
  });

  const { data: costs = [] } = useQuery<any[]>({
    queryKey: ["/api/costs", requestId],
    queryFn: async () => {
      const res = await fetch(`/api/costs/${requestId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!requestId,
  });

  const { data: activity = [] } = useQuery<any[]>({
    queryKey: ["/api/activity", requestId],
    queryFn: async () => {
      const res = await fetch(`/api/requests/${requestId}/activity`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!requestId,
  });

  const { data: escalations = [] } = useQuery<any[]>({
    queryKey: ["/api/requests", requestId, "escalations"],
    queryFn: async () => {
      const res = await fetch(`/api/requests/${requestId}/escalations`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!requestId,
  });

  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["/api/requests", requestId, "notifications"],
    queryFn: async () => {
      const res = await fetch(`/api/requests/${requestId}/notifications`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!requestId,
  });

  const { data: messages = [] } = useQuery<any[]>({
    queryKey: ["/api/messages", requestId],
    queryFn: async () => {
      const res = await fetch(`/api/messages/${requestId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!requestId,
  });

  const [newNote, setNewNote] = useState("");
  const addNote = useMutation({
    mutationFn: async () => apiRequest("POST", `/api/notes/${requestId}`, { content: newNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes", requestId] });
      setNewNote("");
    },
    onError: () => toast({ title: "Failed to add note", variant: "destructive" }),
  });

  const [newMessage, setNewMessage] = useState("");
  const sendMessage = useMutation({
    mutationFn: async () => apiRequest("POST", `/api/messages/${requestId}`, { content: newMessage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", requestId] });
      setNewMessage("");
    },
    onError: () => toast({ title: "Failed to send", variant: "destructive" }),
  });

  // Dispatch state
  const [showPicker, setShowPicker] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [assignNotes, setAssignNotes] = useState("");
  const [showDispatchEdit, setShowDispatchEdit] = useState(false);
  const [showProof, setShowProof] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [arrivalWindow, setArrivalWindow] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [materialsUsed, setMaterialsUsed] = useState("");
  const [finalCost, setFinalCost] = useState("");
  const [magicLinkUrl, setMagicLinkUrl] = useState("");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedModalDate, setSchedModalDate] = useState("");
  const [schedModalWindow, setSchedModalWindow] = useState("");
  const [schedModalDuration, setSchedModalDuration] = useState("2");
  const [schedModalNotes, setSchedModalNotes] = useState("");

  const { data: recommendations = [] } = useQuery<any[]>({
    queryKey: ["/api/vendors/recommendations", request?.issueType],
    queryFn: async () => {
      const res = await fetch(`/api/vendors/recommendations?tradeCategory=${encodeURIComponent(request?.issueType || "")}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: showPicker && !!request?.issueType,
  });

  const autoDispatch = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/requests/${requestId}/auto-dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "auto-assign" }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Auto-dispatch failed");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests", requestId] });
      queryClient.invalidateQueries({ queryKey: ["/api/requests", requestId, "vendor-assignment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dispatch-board"] });
      const vendorName = data.assigned ? "vendor" : "vendor";
      toast({ title: "Auto-dispatch completed" });
    },
    onError: () => toast({ title: "No eligible vendors found", variant: "destructive" }),
  });

  const { data: dispatchRec } = useQuery<any>({
    queryKey: ["/api/requests", requestId, "dispatch-recommendation"],
    queryFn: async () => {
      const res = await fetch(`/api/requests/${requestId}/dispatch-recommendation`, { credentials: "include" });
      if (!res.ok) return null;
      const scores = await res.json();
      if (Array.isArray(scores) && scores.length > 0) {
        return { recommendation: scores[0] };
      }
      return null;
    },
    enabled: !assignmentData?.assignment,
  });

  const generateMagicLink = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/requests/${requestId}/generate-magic-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urgency: request?.urgency }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (data) => {
      const baseUrl = window.location.origin;
      setMagicLinkUrl(`${baseUrl}/vendor-portal/${data.magicToken}`);
      toast({ title: "Magic link generated" });
    },
    onError: () => toast({ title: "Failed to generate link", variant: "destructive" }),
  });

  const revokeMagicLink = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/requests/${requestId}/revoke-magic-link`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests", requestId, "vendor-assignment"] });
      setMagicLinkUrl("");
      toast({ title: "Link revoked" });
    },
    onError: () => toast({ title: "Failed to revoke link", variant: "destructive" }),
  });

  const scheduleJob = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/requests/${requestId}/schedule`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data), credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests", requestId, "vendor-assignment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/schedule"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dispatch-board"] });
      setShowScheduleModal(false);
      toast({ title: "Schedule updated" });
    },
    onError: () => toast({ title: "Failed to update schedule", variant: "destructive" }),
  });

  const updateDispatch = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/requests/${requestId}/dispatch`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data), credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests", requestId] });
      queryClient.invalidateQueries({ queryKey: ["/api/requests", requestId, "vendor-assignment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dispatch-board"] });
      queryClient.invalidateQueries({ queryKey: ["/api/schedule"] });
      setShowDispatchEdit(false);
      setShowProof(false);
    },
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!request) {
    return (
      <AppLayout>
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">Request not found</p>
          <Link href="/"><Button variant="outline" className="mt-4">Back to Dashboard</Button></Link>
        </div>
      </AppLayout>
    );
  }

  const property = properties.find((p: any) => p.id === request.propertyId);
  const urgencyCfg = URGENCY_CONFIG[request.urgency] || URGENCY_CONFIG.Medium;
  const assignment = assignmentData?.assignment;
  const assignedVendor = assignmentData?.vendor;
  const jobStatus = assignment?.jobStatus || "assigned";
  const jobCfg = JOB_STATUS_CONFIG[jobStatus] || JOB_STATUS_CONFIG["assigned"];
  const JobIcon = jobCfg.icon;
  const totalCost = costs.reduce((sum: number, c: any) => sum + c.amount, 0);
  const activeVendors = vendors.filter((v: any) => v.status === "active");

  const handleAssign = async () => {
    if (!selectedVendorId) return;
    await assignVendor.mutateAsync({ vendorId: Number(selectedVendorId), priority, assignmentNotes: assignNotes || undefined, jobStatus: "assigned" });
    setShowPicker(false);
    setSelectedVendorId("");
    setAssignNotes("");
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
    await updateStatus.mutateAsync({ id: requestId, status: "Completed" });
    setCompletionNotes("");
    setInvoiceNumber("");
    setMaterialsUsed("");
    setFinalCost("");
  };

  return (
    <AppLayout>
      <div className="max-w-4xl space-y-6">
        {/* Back */}
        <Link href="/">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-back-dashboard">
            <ChevronLeft className="h-4 w-4" />Back to Requests
          </button>
        </Link>

        {/* Header Card */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <Badge variant={urgencyCfg.variant as any}>{urgencyCfg.label}</Badge>
                <Badge variant="outline">{request.issueType}</Badge>
                <Select
                  value={request.status}
                  onChange={e => updateStatus.mutateAsync({ id: requestId, status: e.target.value })}
                  options={STATUS_OPTIONS.map(s => ({ label: s, value: s }))}
                  className="h-8 text-sm w-36"
                />
              </div>
              <h1 className="text-xl font-display font-bold text-foreground">
                {request.issueType} — Unit {request.unitNumber}
              </h1>
              {property && (
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />{property.name} · {property.address}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Hash className="h-3 w-3" />Tracking: {request.trackingCode}
                <span className="mx-2">·</span>
                <Clock className="h-3 w-3" />{formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
              </p>
            </div>
            {!assignmentLoading && !assignment && (
              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <Button className="gap-2 text-sm shadow-lg shadow-primary/20" onClick={() => autoDispatch.mutate()} disabled={autoDispatch.isPending} data-testid="button-header-auto-dispatch">
                  {autoDispatch.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Auto-Dispatch
                </Button>
                <Button variant="outline" className="gap-2 text-sm" onClick={() => setShowPicker(true)} data-testid="button-header-manual-assign">
                  <ShieldCheck className="h-4 w-4 text-primary" />Assign Vendor
                </Button>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-foreground leading-relaxed">{request.description}</p>
          </div>

          {/* Tenant Info */}
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Tenant</p>
              <p className="font-medium text-foreground">{request.tenantName}</p>
            </div>
            {request.tenantPhone && (
              <a href={`tel:${request.tenantPhone}`} className="flex items-center gap-1.5 text-primary hover:underline">
                <Phone className="h-3.5 w-3.5" />{request.tenantPhone}
              </a>
            )}
            {request.tenantEmail && (
              <a href={`mailto:${request.tenantEmail}`} className="flex items-center gap-1.5 text-primary hover:underline truncate">
                <Mail className="h-3.5 w-3.5" />{request.tenantEmail}
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left column — Dispatch + Notes */}
          <div className="lg:col-span-3 space-y-6">
            {/* Vendor Dispatch Panel */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-foreground">Vendor Dispatch</h2>
              </div>

              {assignmentLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />Loading…
                </div>
              ) : assignment && assignedVendor ? (
                <div className="space-y-3">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${jobCfg.color}`}>
                    <JobIcon className="h-3 w-3" />{jobCfg.label}
                  </div>

                  <div className="bg-muted/50 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link href={`/vendors/${assignedVendor.id}`}>
                            <p className="font-bold text-foreground hover:text-primary cursor-pointer transition-colors">{assignedVendor.name}</p>
                          </Link>
                          {assignedVendor.preferredVendor && (
                            <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                          )}
                        </div>
                        {assignedVendor.companyName && <p className="text-sm text-muted-foreground">{assignedVendor.companyName}</p>}
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          <Badge variant="outline" className="text-[10px]">{assignedVendor.tradeCategory}</Badge>
                          {assignment.priority !== "Normal" && (
                            <Badge variant={assignment.priority === "Emergency" ? "destructive" : "warning"} className="text-[10px]">{assignment.priority}</Badge>
                          )}
                          {assignment.contactedVendor && (
                            <span className="text-[10px] text-green-400 flex items-center gap-0.5"><CheckCircle2 className="h-2.5 w-2.5" />Contacted</span>
                          )}
                        </div>
                        {assignedVendor.phone && (
                          <a href={`tel:${assignedVendor.phone}`} className="text-sm text-primary hover:underline flex items-center gap-1 mt-1">
                            <Phone className="h-3.5 w-3.5" />{assignedVendor.phone}
                          </a>
                        )}
                        {assignment.scheduledDate && (
                          <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />{format(new Date(assignment.scheduledDate), 'EEE, MMM d · h:mm a')}
                            {assignment.arrivalWindow && ` (${assignment.arrivalWindow})`}
                          </p>
                        )}
                        {assignment.assignmentNotes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">"{assignment.assignmentNotes}"</p>
                        )}
                      </div>
                      <button onClick={() => clearAssignment.mutate()} className="text-muted-foreground hover:text-red-400 transition-colors p-1">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Completion summary */}
                  {assignment.jobStatus === "completed" && (
                    <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3">
                      <p className="text-xs font-semibold text-green-400 mb-1.5 flex items-center gap-1"><CheckSquare className="h-3 w-3" />Completion Summary</p>
                      {assignment.completionNotes && <p className="text-sm text-muted-foreground">{assignment.completionNotes}</p>}
                      <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                        {assignment.invoiceNumber && <span className="flex items-center gap-1"><FileText className="h-3 w-3" />Invoice #{assignment.invoiceNumber}</span>}
                        {assignment.finalCost && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />${(assignment.finalCost / 100).toLocaleString()}</span>}
                        {assignment.materialsUsed && <span>Materials: {assignment.materialsUsed}</span>}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    {!assignment.contactedVendor && (
                      <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => markContacted.mutate(true)}>
                        <CheckCircle2 className="h-3.5 w-3.5" />Mark Contacted
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => {
                      setShowDispatchEdit(true);
                      setDispatchStatus(assignment.jobStatus || "");
                      setScheduledDate(assignment.scheduledDate ? new Date(assignment.scheduledDate).toISOString().slice(0,16) : "");
                      setArrivalWindow(assignment.arrivalWindow || "");
                    }}>
                      Update Status
                    </Button>
                    {assignment.jobStatus !== "completed" && (
                      <Button size="sm" className="h-8 text-xs gap-1" onClick={() => setShowProof(true)}>
                        <CheckSquare className="h-3.5 w-3.5" />Mark Complete
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground" onClick={() => {
                      setShowPicker(true);
                      setSelectedVendorId(String(assignment.vendorId));
                      setPriority(assignment.priority || "Normal");
                    }}>
                      Reassign
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => generateMagicLink.mutate()} disabled={generateMagicLink.isPending} data-testid="button-magic-link">
                      {generateMagicLink.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
                      {assignment.magicToken ? "Regenerate Link" : "Magic Link"}
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => {
                      setShowScheduleModal(true);
                      setSchedModalDate(assignment.scheduledDate ? new Date(assignment.scheduledDate).toISOString().slice(0,16) : "");
                      setSchedModalWindow(assignment.arrivalWindow || "");
                      setSchedModalDuration(String(assignment.estimatedDuration || 2));
                      setSchedModalNotes(assignment.schedulingNotes || "");
                    }} data-testid="button-schedule-from-detail">
                      <Calendar className="h-3.5 w-3.5" />
                      {assignment.scheduledDate ? "Reschedule" : "Schedule"}
                    </Button>
                  </div>

                  {/* Magic Link Status */}
                  {(magicLinkUrl || assignment.magicToken) && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-primary flex items-center gap-1"><Link2 className="h-3 w-3" />Vendor Portal Link</p>
                        {assignment.magicToken && (() => {
                          const isExpired = assignment.magicTokenExpiresAt && new Date(assignment.magicTokenExpiresAt) < new Date();
                          const isUsed = assignment.vendorResponseStatus && assignment.vendorResponseStatus !== "pending-response" && assignment.vendorResponseStatus !== "no-response";
                          const statusLabel = isUsed ? "Used" : isExpired ? "Expired" : "Active";
                          const statusColor = isUsed ? "text-green-400 bg-green-500/10 border-green-500/20" : isExpired ? "text-red-400 bg-red-500/10 border-red-500/20" : "text-blue-400 bg-blue-500/10 border-blue-500/20";
                          return <Badge variant="outline" className={`text-[10px] ${statusColor}`} data-testid="badge-link-status">{statusLabel}</Badge>;
                        })()}
                      </div>
                      {magicLinkUrl && (
                        <div className="flex items-center gap-2">
                          <input className="flex-1 bg-background border border-border rounded px-2 py-1 text-xs text-foreground" value={magicLinkUrl} readOnly data-testid="input-magic-link" />
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => {
                            navigator.clipboard.writeText(magicLinkUrl);
                            toast({ title: "Link copied!" });
                          }} data-testid="button-copy-magic-link">
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        {assignment.vendorLinkSentAt && <span>Sent {formatDistanceToNow(new Date(assignment.vendorLinkSentAt), { addSuffix: true })}</span>}
                        {assignment.magicTokenExpiresAt && <span>&middot; Expires {format(new Date(assignment.magicTokenExpiresAt), "MMM d, h:mm a")}</span>}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-red-400" onClick={() => revokeMagicLink.mutate()} disabled={revokeMagicLink.isPending} data-testid="button-revoke-link">
                          {revokeMagicLink.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                          Revoke
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Vendor Response Info */}
                  {assignment.vendorResponseStatus && assignment.vendorResponseStatus !== "pending-response" && (
                    <div className={`rounded-lg p-3 border ${
                      assignment.vendorResponseStatus === "accepted" ? "bg-green-500/5 border-green-500/20" :
                      assignment.vendorResponseStatus === "declined" ? "bg-red-500/5 border-red-500/20" :
                      assignment.vendorResponseStatus === "proposed-new-time" ? "bg-blue-500/5 border-blue-500/20" :
                      "bg-muted/30 border-border"
                    }`}>
                      <p className="text-xs font-medium mb-1 flex items-center gap-1">
                        {assignment.vendorResponseStatus === "accepted" && <><CheckCircle2 className="h-3.5 w-3.5 text-green-400" /><span className="text-green-400">Vendor Accepted</span></>}
                        {assignment.vendorResponseStatus === "declined" && <><X className="h-3.5 w-3.5 text-red-400" /><span className="text-red-400">Vendor Declined</span></>}
                        {assignment.vendorResponseStatus === "proposed-new-time" && <><Clock className="h-3.5 w-3.5 text-blue-400" /><span className="text-blue-400">New Time Proposed</span></>}
                      </p>
                      {assignment.vendorRespondedAt && (
                        <p className="text-[10px] text-muted-foreground">Responded {formatDistanceToNow(new Date(assignment.vendorRespondedAt), { addSuffix: true })}</p>
                      )}
                      {assignment.vendorNotes && (
                        <div className="mt-2 bg-background/50 rounded p-2">
                          <p className="text-[10px] text-muted-foreground mb-0.5">Vendor Notes:</p>
                          <p className="text-xs text-foreground">{assignment.vendorNotes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Proposed Time Approval */}
                  {assignment.vendorResponseStatus === "proposed-new-time" && assignment.proposedTime && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 space-y-2">
                      <p className="text-sm font-medium text-blue-400 flex items-center gap-1">
                        <Clock className="h-4 w-4" />Vendor Proposed: {format(new Date(assignment.proposedTime), "MMM d, h:mm a")}
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" className="h-8 text-xs flex-1" onClick={() => {
                          scheduleJob.mutate({ scheduledDate: assignment.proposedTime });
                        }} disabled={scheduleJob.isPending} data-testid="button-approve-proposed-time">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Accept Time
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs flex-1" onClick={() => {
                          setShowScheduleModal(true);
                          setSchedModalDate("");
                        }} data-testid="button-counter-propose">
                          Counter-Propose
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Quick Schedule Modal */}
                  {showScheduleModal && (
                    <div className="bg-muted/30 rounded-xl p-3 space-y-3 border border-border">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground flex items-center gap-1"><Calendar className="h-4 w-4 text-primary" />Schedule Job</p>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowScheduleModal(false)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Date & Time</label>
                        <Input type="datetime-local" value={schedModalDate} onChange={e => setSchedModalDate(e.target.value)} className="h-9 text-sm" data-testid="input-schedule-date-detail" />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-[10px] text-muted-foreground">Arrival Window</label>
                          <Input value={schedModalWindow} onChange={e => setSchedModalWindow(e.target.value)} placeholder="e.g. 9-11 AM" className="h-9 text-sm" />
                        </div>
                        <div className="w-24">
                          <label className="text-[10px] text-muted-foreground">Duration (hrs)</label>
                          <Input type="number" value={schedModalDuration} onChange={e => setSchedModalDuration(e.target.value)} className="h-9 text-sm" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="h-8 text-xs flex-1" onClick={() => {
                          scheduleJob.mutate({
                            scheduledDate: schedModalDate || null,
                            arrivalWindow: schedModalWindow || undefined,
                            estimatedDuration: parseInt(schedModalDuration) || undefined,
                            schedulingNotes: schedModalNotes || undefined,
                          });
                        }} disabled={scheduleJob.isPending} data-testid="button-save-schedule-detail">
                          {scheduleJob.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
                        </Button>
                        {assignment.scheduledDate && (
                          <Button size="sm" variant="outline" className="h-8 text-xs text-red-400 border-red-500/30" onClick={() => {
                            scheduleJob.mutate({ scheduledDate: null });
                          }} disabled={scheduleJob.isPending} data-testid="button-unschedule-detail">
                            Unschedule
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dispatch edit form */}
                  {showDispatchEdit && (
                    <div className="bg-muted/30 rounded-xl p-3 space-y-2">
                      <Select value={dispatchStatus} onChange={e => setDispatchStatus(e.target.value)}
                        options={[
                          { label: "Select status…", value: "" },
                          { label: "Vendor Assigned", value: "assigned" },
                          { label: "Vendor Contacted", value: "contacted" },
                          { label: "Scheduled", value: "scheduled" },
                          { label: "In Progress", value: "in-progress" },
                          { label: "Waiting on Parts", value: "waiting-on-parts" },
                          { label: "Cancelled", value: "cancelled" },
                        ]} className="h-9 text-sm" />
                      <div className="flex gap-2">
                        <Input type="datetime-local" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="h-9 text-sm flex-1" />
                        <Input value={arrivalWindow} onChange={e => setArrivalWindow(e.target.value)} className="h-9 text-sm w-28" placeholder="9–11 AM" />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="h-8 text-xs" onClick={handleDispatchSave} disabled={updateDispatch.isPending}>
                          {updateDispatch.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowDispatchEdit(false)}>Cancel</Button>
                      </div>
                    </div>
                  )}

                  {/* Proof form */}
                  {showProof && (
                    <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 space-y-3">
                      <p className="text-sm font-semibold text-green-400 flex items-center gap-1"><CheckSquare className="h-4 w-4" />Record Proof of Completion</p>
                      <textarea
                        className="w-full bg-background border border-border rounded-lg p-3 text-sm resize-none h-20 focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="What was done? Outcome, tenant confirmation..."
                        value={completionNotes}
                        onChange={e => setCompletionNotes(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="h-9 text-sm flex-1" placeholder="Invoice # (optional)" />
                        <Input type="number" step="0.01" value={finalCost} onChange={e => setFinalCost(e.target.value)} className="h-9 text-sm w-28" placeholder="Final $" />
                      </div>
                      <Input value={materialsUsed} onChange={e => setMaterialsUsed(e.target.value)} className="h-9 text-sm" placeholder="Materials used" />
                      <div className="flex gap-2">
                        <Button size="sm" className="h-9 flex-1 text-xs" onClick={handleProofSave} disabled={updateDispatch.isPending}>
                          {updateDispatch.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Record Completion"}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-9 text-xs" onClick={() => setShowProof(false)}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : !showPicker ? (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <Briefcase className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">No vendor assigned yet.</p>
                    <div className="flex flex-col gap-2 items-center">
                      <Button className="gap-2 text-sm" onClick={() => autoDispatch.mutate()} disabled={autoDispatch.isPending} data-testid="button-auto-dispatch">
                        {autoDispatch.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        Auto-Dispatch Best Vendor
                      </Button>
                      <Button variant="outline" className="gap-2 text-sm" onClick={() => setShowPicker(true)} data-testid="button-manual-dispatch">
                        <ShieldCheck className="h-4 w-4 text-primary" />Manual Assign
                      </Button>
                    </div>
                  </div>

                  {dispatchRec?.recommendation && (
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                      <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />AI Recommendation
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{dispatchRec.recommendation.vendor?.name}</p>
                          <p className="text-xs text-muted-foreground">{dispatchRec.recommendation.vendor?.tradeCategory}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">{dispatchRec.recommendation.score}</p>
                          <p className="text-[10px] text-muted-foreground">dispatch score</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{dispatchRec.recommendation.reason}</p>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Vendor Picker */}
              {showPicker && (
                <div className="space-y-3 mt-2 bg-muted/30 rounded-xl p-4">
                  {recommendations.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-400" />Best match for {request.issueType}
                      </p>
                      <div className="space-y-1">
                        {recommendations.slice(0, 3).map((v: any) => (
                          <button key={v.id} onClick={() => setSelectedVendorId(String(v.id))}
                            className={`w-full text-left flex items-center justify-between gap-2 px-3 py-2 rounded-xl border transition-colors text-sm ${selectedVendorId === String(v.id) ? "bg-primary/10 border-primary/40 text-foreground" : "border-border hover:bg-muted/60 text-muted-foreground"}`}>
                            <div className="flex items-center gap-2 min-w-0">
                              {v.preferredVendor && <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400 shrink-0" />}
                              <span className="font-medium text-foreground truncate">{v.name}</span>
                              {v.companyName && <span className="text-muted-foreground truncate text-xs">· {v.companyName}</span>}
                            </div>
                            <TrustBadge score={v.trustScore} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <Select value={selectedVendorId} onChange={e => setSelectedVendorId(e.target.value)}
                    options={[{ label: "Or pick any vendor…", value: "" }, ...activeVendors.map((v: any) => ({ label: `${v.name} — ${v.tradeCategory}`, value: String(v.id) }))]}
                    className="h-10 text-sm" />
                  <div className="flex gap-2">
                    <Select value={priority} onChange={e => setPriority(e.target.value)}
                      options={[{ label: "Normal", value: "Normal" }, { label: "High", value: "High" }, { label: "Emergency", value: "Emergency" }]}
                      className="h-10 text-sm flex-1" />
                    <Button className="h-10 px-4 text-sm" onClick={handleAssign} disabled={!selectedVendorId || assignVendor.isPending}>
                      {assignVendor.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Dispatch"}
                    </Button>
                    <Button variant="ghost" className="h-10 px-3" onClick={() => setShowPicker(false)}><X className="h-4 w-4" /></Button>
                  </div>
                  <Input value={assignNotes} onChange={e => setAssignNotes(e.target.value)} className="h-9 text-sm" placeholder="Dispatch notes (optional)" />
                </div>
              )}
            </div>

            {/* Internal Notes */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <PenLine className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-foreground">Internal Notes</h2>
              </div>
              {notes.length === 0 ? (
                <p className="text-sm text-muted-foreground mb-3">No notes yet. Add private notes for your team.</p>
              ) : (
                <div className="space-y-3 mb-4">
                  {notes.map((n: any) => (
                    <div key={n.id} className="bg-muted/40 rounded-xl px-4 py-3">
                      <p className="text-sm text-foreground">{n.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">{n.authorName} · {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input value={newNote} onChange={e => setNewNote(e.target.value)}
                  placeholder="Add an internal note…"
                  className="h-10 text-sm flex-1"
                  onKeyDown={e => e.key === "Enter" && newNote.trim() && addNote.mutate()}
                  data-testid="input-new-note" />
                <Button size="sm" className="h-10 px-4 text-sm" onClick={() => addNote.mutate()} disabled={!newNote.trim() || addNote.isPending}>
                  {addNote.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                </Button>
              </div>
            </div>

            {/* Tenant Messages */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-foreground">Tenant Messages</h2>
              </div>
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground mb-3">No messages yet.</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {messages.map((m: any) => (
                    <div key={m.id} className={`flex ${m.senderType === "landlord" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm ${m.senderType === "landlord" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                        <p>{m.content}</p>
                        <p className={`text-[10px] mt-1 ${m.senderType === "landlord" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {m.senderName} · {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                  placeholder="Message tenant…"
                  className="h-10 text-sm flex-1"
                  onKeyDown={e => e.key === "Enter" && newMessage.trim() && sendMessage.mutate()}
                  data-testid="input-new-message" />
                <Button size="sm" className="h-10 px-4" onClick={() => sendMessage.mutate()} disabled={!newMessage.trim() || sendMessage.isPending}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Right column — SLA + Costs + Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* SLA & Dispatch Info */}
            {assignment && (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold text-foreground">SLA & Dispatch</h2>
                </div>

                {assignment.dispatchMode && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Dispatch Mode</span>
                    <Badge variant="outline" className="text-[10px]">
                      {assignment.dispatchMode === "auto" ? "Auto-Dispatch" : "Manual"}
                    </Badge>
                  </div>
                )}

                {assignment.responseDeadline && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Response Deadline</span>
                    {(() => {
                      const deadline = new Date(assignment.responseDeadline);
                      const now = new Date();
                      const isOverdue = deadline < now && assignment.vendorResponseStatus === "pending-response";
                      const isUpcoming = deadline > now && deadline.getTime() - now.getTime() < 2 * 60 * 60 * 1000;
                      return (
                        <span className={`text-xs font-medium ${isOverdue ? "text-red-400" : isUpcoming ? "text-yellow-400" : "text-foreground"}`} data-testid="text-response-deadline">
                          {isOverdue ? "OVERDUE — " : ""}{formatDistanceToNow(deadline, { addSuffix: true })}
                        </span>
                      );
                    })()}
                  </div>
                )}

                {assignment.dispatchScore && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Dispatch Score</span>
                    <span className="text-foreground font-bold">{assignment.dispatchScore} pts</span>
                  </div>
                )}

                {escalations.length > 0 && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />Escalation History
                    </p>
                    <div className="space-y-2">
                      {escalations.map((esc: any) => (
                        <div key={esc.id} className="bg-red-500/5 border border-red-500/15 rounded-lg p-2.5">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline" className="text-[10px] text-red-400 border-red-500/30">
                              {esc.escalationType.replace(/-/g, " ")}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(esc.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{esc.reason}</p>
                          {esc.suggestedVendorName && (
                            <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                              <Sparkles className="h-3 w-3 text-primary" />
                              <span className="text-foreground">Suggested: <strong>{esc.suggestedVendorName}</strong></span>
                              {esc.suggestedScore && <span className="text-muted-foreground">({esc.suggestedScore} pts)</span>}
                              <Button size="sm" variant="ghost" className="h-5 px-1.5 text-[10px] text-primary ml-auto" onClick={() => {
                                setSelectedVendorId(String(esc.suggestedVendorId));
                                setShowPicker(true);
                              }} data-testid={`button-reassign-suggested-${esc.id}`}>
                                Reassign
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {notifications.length > 0 && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                      <Mail className="h-3 w-3" />Notification Log
                    </p>
                    <div className="space-y-1">
                      {notifications.slice(0, 5).map((n: any) => (
                        <div key={n.id} className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground capitalize">{n.notificationType} via {n.channel}</span>
                          <span className="text-muted-foreground">{formatDistanceToNow(new Date(n.sentAt), { addSuffix: true })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cost Summary */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-foreground">Costs</h2>
                {totalCost > 0 && (
                  <span className="ml-auto text-sm font-semibold text-foreground">${(totalCost / 100).toLocaleString()}</span>
                )}
              </div>
              {costs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No costs logged yet.</p>
              ) : (
                <div className="space-y-2">
                  {costs.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground truncate">{c.description}</p>
                        {c.vendor && <p className="text-xs text-muted-foreground">{c.vendor}</p>}
                      </div>
                      <span className="font-medium text-foreground ml-3 shrink-0">${(c.amount / 100).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-border">
                <Link href="/costs">
                  <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground h-8">Manage Costs →</Button>
                </Link>
              </div>
            </div>

            {/* Activity Timeline */}
            {activity.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold text-foreground">Activity</h2>
                </div>
                <div className="relative pl-4">
                  <div className="absolute left-1.5 top-0 bottom-0 w-px bg-border" />
                  <div className="space-y-3">
                    {activity.map((a: any) => (
                      <div key={a.id} className="relative">
                        <div className="absolute -left-2.5 top-1.5 w-2 h-2 rounded-full bg-primary/40 border border-primary/60" />
                        <p className="text-sm font-medium text-foreground">{a.eventLabel}</p>
                        {a.details && <p className="text-xs text-muted-foreground">{a.details}</p>}
                        <p className="text-[10px] text-muted-foreground mt-0.5">{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Info */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3 text-sm">
              <h2 className="font-semibold text-foreground">Details</h2>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline">{request.status}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Urgency</span>
                <Badge variant={urgencyCfg.variant as any}>{urgencyCfg.label}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="text-foreground font-medium">{request.issueType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Unit</span>
                <span className="text-foreground font-medium">{request.unitNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Submitted</span>
                <span className="text-foreground">{format(new Date(request.createdAt), 'MMM d, yyyy')}</span>
              </div>
              <div className="pt-2 border-t border-border">
                <a href={`/track/${request.trackingCode}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />Tenant tracking page →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
