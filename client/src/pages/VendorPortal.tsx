import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, XCircle, Clock, MapPin, AlertTriangle, Phone, Wrench, Navigation, Play, Flag, MessageSquare, Image } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import logoPng from "@assets/vendortrust-icon-nobg.png";

const RESPONSE_LABELS: Record<string, { label: string; color: string }> = {
  "pending-response": { label: "Awaiting Your Response", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  "accepted": { label: "Accepted", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  "declined": { label: "Declined", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  "proposed-new-time": { label: "New Time Proposed", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  "no-response": { label: "No Response", color: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const JOB_STATUS_LABELS: Record<string, string> = {
  "assigned": "Assigned",
  "scheduled": "Scheduled",
  "in-progress": "In Progress",
  "completed": "Completed",
  "waiting-on-parts": "Waiting on Parts",
  "needs-dispatch": "Needs Dispatch",
  "cancelled": "Cancelled",
};

export default function VendorPortal() {
  const [, params] = useRoute("/vendor-portal/:token");
  const token = params?.token;

  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [showProposeForm, setShowProposeForm] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [materialsUsed, setMaterialsUsed] = useState("");
  const [finalCost, setFinalCost] = useState("");
  const [proposedTime, setProposedTime] = useState("");
  const [vendorNotes, setVendorNotes] = useState("");
  const [showNotesForm, setShowNotesForm] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/vendor-portal", token],
    queryFn: () => fetch(`/api/vendor-portal/${token}`).then(r => {
      if (!r.ok) throw new Error(r.status === 410 ? "expired" : "Invalid link");
      return r.json();
    }),
    enabled: !!token,
  });

  const respondMutation = useMutation({
    mutationFn: (body: any) => apiRequest("POST", `/api/vendor-portal/${token}/respond`, body),
    onSuccess: () => refetch(),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    const isExpired = (error as Error)?.message === "expired";
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-display font-bold text-foreground mb-2">
              {isExpired ? "Link Expired" : "Invalid or Expired Link"}
            </h2>
            <p className="text-muted-foreground">
              {isExpired
                ? "This job link has expired. Please ask the property manager to resend a new link."
                : "This job link is no longer valid. Please contact the landlord for a new link."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { assignment, request, property, vendor } = data;
  const responseInfo = RESPONSE_LABELS[assignment.vendorResponseStatus] || RESPONSE_LABELS["pending-response"];
  const isCompleted = assignment.jobStatus === "completed";
  const isPending = assignment.vendorResponseStatus === "pending-response";
  const isAccepted = assignment.vendorResponseStatus === "accepted";
  const isInProgress = assignment.jobStatus === "in-progress";

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <img src={logoPng} alt="VendorTrust" className="h-8 w-8 rounded-md" />
          <span className="font-display font-bold text-foreground">VendorTrust</span>
          <span className="text-muted-foreground text-sm ml-auto">Vendor Portal</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground" data-testid="text-portal-title">Job Assignment</h1>
            <p className="text-sm text-muted-foreground">
              {vendor?.companyName ? `${vendor.companyName} — ` : ""}{vendor?.name}
            </p>
          </div>
          <Badge className={responseInfo.color} data-testid="badge-response-status">{responseInfo.label}</Badge>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              {request?.issueType}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Property</p>
                <p className="text-foreground font-medium">{property?.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Unit</p>
                <p className="text-foreground font-medium">{request?.unitNumber}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Urgency</p>
                <Badge variant="outline" className={
                  request?.urgency === "Emergency" ? "border-red-500/30 text-red-400" :
                  request?.urgency === "High" ? "border-orange-500/30 text-orange-400" :
                  "border-border text-muted-foreground"
                } data-testid="badge-urgency">{request?.urgency}</Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Priority</p>
                <p className="text-foreground font-medium">{assignment.priority}</p>
              </div>
            </div>

            <div>
              <p className="text-muted-foreground text-sm mb-1">Description</p>
              <p className="text-foreground text-sm bg-muted/30 p-3 rounded-lg">{request?.description}</p>
            </div>

            {request?.photoUrls && request.photoUrls.length > 0 && (
              <div className="border-t border-border pt-2">
                <p className="text-muted-foreground text-xs mb-2 flex items-center gap-1"><Image className="h-3 w-3" />Photos</p>
                <div className="flex gap-2 overflow-x-auto">
                  {request.photoUrls.map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} alt={`Photo ${i+1}`} className="h-20 w-20 rounded-lg object-cover border border-border" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {request?.tenantName && (
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <span className="text-muted-foreground">Tenant: </span>
                  <span className="text-foreground">{request.tenantName}</span>
                  {request.tenantPhone && (
                    <a href={`tel:${request.tenantPhone}`} className="text-primary ml-2 hover:underline">
                      {request.tenantPhone}
                    </a>
                  )}
                </div>
              </div>
            )}

            {property?.address && (
              <div className="flex items-center gap-3 border-t border-border pt-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-foreground">{property.address}</p>
              </div>
            )}

            {assignment.scheduledDate && (
              <div className="flex items-center gap-3 border-t border-border pt-2">
                <Clock className="h-4 w-4 text-primary" />
                <div className="text-sm">
                  <span className="text-muted-foreground">Scheduled: </span>
                  <span className="text-foreground font-medium">
                    {new Date(assignment.scheduledDate).toLocaleString()}
                    {assignment.arrivalWindow && ` (${assignment.arrivalWindow})`}
                  </span>
                </div>
              </div>
            )}

            {assignment.rescheduledTo && (
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-2 text-xs text-blue-400">
                Rescheduled from {new Date(assignment.rescheduledFrom).toLocaleDateString()} → {new Date(assignment.rescheduledTo).toLocaleDateString()}
              </div>
            )}

            {assignment.assignmentNotes && (
              <div className="border-t border-border pt-2">
                <p className="text-muted-foreground text-xs mb-1">Notes from landlord</p>
                <p className="text-sm text-foreground bg-primary/5 p-2 rounded-lg border border-primary/10">{assignment.assignmentNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Status: {JOB_STATUS_LABELS[assignment.jobStatus] || assignment.jobStatus}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isCompleted && (
              <div className="text-center py-4">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-2" />
                <p className="text-green-400 font-medium">Job Completed</p>
                <p className="text-muted-foreground text-sm">Thank you for your work!</p>
              </div>
            )}

            {isPending && !isCompleted && (
              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={() => respondMutation.mutate({ action: "accept" })}
                  disabled={respondMutation.isPending}
                  data-testid="button-accept-job"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept Job
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowProposeForm(!showProposeForm)}
                    disabled={respondMutation.isPending}
                    data-testid="button-propose-time"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Propose Time
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    onClick={() => respondMutation.mutate({ action: "decline" })}
                    disabled={respondMutation.isPending}
                    data-testid="button-decline-job"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Decline
                  </Button>
                </div>
              </div>
            )}

            {showProposeForm && isPending && (
              <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                <label className="text-xs text-muted-foreground">Proposed date and time</label>
                <Input
                  type="datetime-local"
                  value={proposedTime}
                  onChange={e => setProposedTime(e.target.value)}
                  data-testid="input-proposed-time"
                />
                <Textarea
                  value={vendorNotes}
                  onChange={e => setVendorNotes(e.target.value)}
                  placeholder="Reason for different time (optional)"
                  className="h-16"
                />
                <Button
                  className="w-full"
                  onClick={() => respondMutation.mutate({ action: "propose-time", proposedTime, vendorNotes: vendorNotes || undefined })}
                  disabled={!proposedTime || respondMutation.isPending}
                  data-testid="button-submit-proposed-time"
                >
                  Submit Proposed Time
                </Button>
              </div>
            )}

            {isAccepted && !isInProgress && !isCompleted && (
              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={() => respondMutation.mutate({ action: "en-route" })}
                  disabled={respondMutation.isPending}
                  data-testid="button-en-route"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  I'm En Route
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => respondMutation.mutate({ action: "started" })}
                  disabled={respondMutation.isPending}
                  data-testid="button-start-work"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Work
                </Button>
              </div>
            )}

            {isInProgress && !isCompleted && (
              <div className="space-y-2">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => setShowCompletionForm(!showCompletionForm)}
                  disabled={respondMutation.isPending}
                  data-testid="button-mark-complete"
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Mark as Complete
                </Button>
              </div>
            )}

            {showCompletionForm && (
              <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Completion Notes *</label>
                  <Textarea
                    value={completionNotes}
                    onChange={e => setCompletionNotes(e.target.value)}
                    placeholder="Describe what was done, tenant confirmation..."
                    data-testid="input-completion-notes"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Invoice #</label>
                    <Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="INV-001" data-testid="input-invoice" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Final Cost ($)</label>
                    <Input type="number" value={finalCost} onChange={e => setFinalCost(e.target.value)} placeholder="0.00" data-testid="input-final-cost" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Materials Used</label>
                  <Input value={materialsUsed} onChange={e => setMaterialsUsed(e.target.value)} placeholder="Parts, supplies..." data-testid="input-materials" />
                </div>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => respondMutation.mutate({
                    action: "completed",
                    completionNotes,
                    invoiceNumber,
                    materialsUsed,
                    finalCost: finalCost ? Math.round(parseFloat(finalCost) * 100) : undefined,
                  })}
                  disabled={respondMutation.isPending}
                  data-testid="button-submit-completion"
                >
                  {respondMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Submit Completion
                </Button>
              </div>
            )}

            {!isCompleted && (
              <div className="border-t border-border pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground"
                  onClick={() => setShowNotesForm(!showNotesForm)}
                  data-testid="button-toggle-notes"
                >
                  <MessageSquare className="h-3.5 w-3.5 mr-1" />
                  {assignment.vendorNotes ? "Update Notes" : "Add Notes"}
                </Button>
                {showNotesForm && (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      value={vendorNotes || assignment.vendorNotes || ""}
                      onChange={e => setVendorNotes(e.target.value)}
                      placeholder="Add notes about this job..."
                      className="h-20"
                      data-testid="input-vendor-notes"
                    />
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => respondMutation.mutate({ action: "accept", vendorNotes })}
                      disabled={respondMutation.isPending}
                      data-testid="button-save-notes"
                    >
                      Save Notes
                    </Button>
                  </div>
                )}
                {assignment.vendorNotes && !showNotesForm && (
                  <div className="mt-2 bg-muted/30 rounded-lg p-2">
                    <p className="text-xs text-muted-foreground mb-0.5">Your notes:</p>
                    <p className="text-sm text-foreground">{assignment.vendorNotes}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground pt-4 pb-8">
          Powered by VendorTrust &middot; This link is private to you
        </p>
      </div>
    </div>
  );
}
