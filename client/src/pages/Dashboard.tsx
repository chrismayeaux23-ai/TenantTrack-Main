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
import { Loader2, AlertCircle, Phone, Mail, MapPin, Search, UserCheck, MessageSquare, Send, ClipboardList, AlertTriangle, CheckCircle2, Clock, DollarSign, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface DashboardStats {
  totalRequests: number;
  newRequests: number;
  inProgress: number;
  completed: number;
  emergencies: number;
  totalProperties: number;
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
        body: JSON.stringify({
          description: desc,
          amount: Math.round(parseFloat(amount) * 100),
          vendor: vendor || undefined,
        }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      setDesc("");
      setAmount("");
      setVendor("");
      queryClient.invalidateQueries({ queryKey: ["/api/costs", requestId] });
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === "/api/costs/report" });
    },
  });

  const deleteCost = useMutation({
    mutationFn: async (costId: number) => {
      const res = await fetch(`/api/costs/${costId}`, {
        method: "DELETE",
        credentials: "include",
      });
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
          {(costs || []).length === 0 && (
            <p className="text-xs text-muted-foreground">No costs logged</p>
          )}
          {(costs || []).map((cost: any) => (
            <div key={cost.id} className="bg-muted/50 rounded-lg p-2 flex items-center justify-between gap-2" data-testid={`cost-entry-${cost.id}`}>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-foreground truncate">{cost.description}</p>
                <p className="text-xs text-muted-foreground">
                  {cost.vendor && <>{cost.vendor} &middot; </>}
                  {formatCents(cost.amount)}
                </p>
              </div>
              <button
                onClick={() => deleteCost.mutate(cost.id)}
                className="text-muted-foreground hover:text-red-400 p-1 shrink-0"
                data-testid={`button-delete-cost-${cost.id}`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder="Description"
          className="text-sm h-8 bg-muted/50 flex-1 min-w-[100px]"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          data-testid={`input-cost-desc-${requestId}`}
        />
        <Input
          placeholder="$0.00"
          type="number"
          step="0.01"
          min="0"
          className="text-sm h-8 bg-muted/50 w-20"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          data-testid={`input-cost-amount-${requestId}`}
        />
        <Input
          placeholder="Vendor"
          className="text-sm h-8 bg-muted/50 w-24"
          value={vendor}
          onChange={(e) => setVendor(e.target.value)}
          data-testid={`input-cost-vendor-${requestId}`}
        />
        <Button
          size="sm"
          className="h-8 px-3"
          disabled={!desc.trim() || !amount || parseFloat(amount) <= 0 || addCost.isPending}
          onClick={() => addCost.mutate()}
          data-testid={`button-add-cost-${requestId}`}
        >
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
          {(notes || []).length === 0 && (
            <p className="text-xs text-muted-foreground">No notes yet</p>
          )}
          {(notes || []).map((note: any) => (
            <div key={note.id} className="bg-muted/50 rounded-lg p-2">
              <p className="text-xs text-foreground">{note.content}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {note.authorName} &middot; {note.createdAt ? format(new Date(note.createdAt), "MMM d, h:mm a") : ""}
              </p>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          placeholder="Add a note..."
          className="text-sm h-9 bg-muted/50"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && content.trim()) addNote.mutate(); }}
          data-testid={`input-note-${requestId}`}
        />
        <Button
          size="sm"
          className="h-9 px-3"
          disabled={!content.trim() || addNote.isPending}
          onClick={() => addNote.mutate()}
          data-testid={`button-add-note-${requestId}`}
        >
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
  const hasUnread = tenantMessages.length > 0;

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1">
        <MessageSquare className="h-3 w-3" /> Tenant Messages
        {hasUnread && (
          <Badge variant="default" className="ml-1 text-[10px] px-1.5 py-0">{tenantMessages.length}</Badge>
        )}
      </p>
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
          {(messages || []).length === 0 && (
            <p className="text-xs text-muted-foreground">No messages yet. Send one to start a conversation with the tenant.</p>
          )}
          {(messages || []).map((msg: any) => (
            <div
              key={msg.id}
              className={`rounded-lg p-2.5 max-w-[85%] ${
                msg.senderType === "landlord"
                  ? "bg-primary/10 ml-auto text-right"
                  : "bg-muted/50 mr-auto"
              }`}
              data-testid={`message-${msg.id}`}
            >
              <p className="text-xs text-foreground">{msg.content}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {msg.senderName} &middot; {msg.createdAt ? format(new Date(msg.createdAt), "MMM d, h:mm a") : ""}
              </p>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          placeholder="Message tenant..."
          className="text-sm h-9 bg-muted/50"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && content.trim()) sendMessage.mutate(); }}
          data-testid={`input-message-${requestId}`}
        />
        <Button
          size="sm"
          className="h-9 px-3"
          disabled={!content.trim() || sendMessage.isPending}
          onClick={() => sendMessage.mutate()}
          data-testid={`button-send-message-${requestId}`}
        >
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
      const res = await fetch(`/api/requests/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
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
      case 'Med': return <Badge variant="warning">Medium</Badge>;
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

  const getPropertyName = (propId: number) => {
    return properties?.find(p => p.id === propId)?.name || 'Unknown Property';
  };

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
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-2xl p-4 border border-border shadow-sm" data-testid="stat-total">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalRequests}</p>
                <p className="text-xs text-muted-foreground">Total Requests</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border shadow-sm" data-testid="stat-new">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.newRequests}</p>
                <p className="text-xs text-muted-foreground">New</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border shadow-sm" data-testid="stat-progress">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border shadow-sm" data-testid="stat-completed">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Maintenance Requests</h1>
          <p className="text-muted-foreground mt-2">Manage and track issues across your properties.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search tenant or issue..." 
              className="pl-10 w-full sm:w-64 bg-card"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-requests"
            />
          </div>
          <Select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { label: "All Statuses", value: "All" },
              { label: "New", value: "New" },
              { label: "In-Progress", value: "In-Progress" },
              { label: "Completed", value: "Completed" }
            ]}
            className="w-full sm:w-48 bg-card"
            data-testid="select-status-filter"
          />
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-3xl p-12 text-center flex flex-col items-center">
          <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold mb-2">No requests found</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            You're all caught up! There are no maintenance requests matching your current filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((request) => {
            const isExpanded = expandedCards.has(request.id);
            const staffName = getStaffName(request.assignedTo);

            return (
              <div
                key={request.id}
                className="bg-card rounded-2xl border border-border shadow-sm transition-all"
                data-testid={`request-card-${request.id}`}
              >
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
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 md:px-5 pb-5 border-t border-border pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between mb-4 text-xs text-muted-foreground">
                      <span>
                        Submitted {request.createdAt ? format(new Date(request.createdAt), 'MMM d, yyyy — h:mm a') : ''}
                      </span>
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
                      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                        {request.photoUrls.map((url, idx) => (
                          <img 
                            key={idx} 
                            src={url} 
                            alt="Issue" 
                            className="h-20 w-20 rounded-lg object-cover cursor-pointer border border-border hover:opacity-80 transition-opacity flex-shrink-0"
                            onClick={() => setSelectedImage(url)}
                            data-testid={`img-photo-${request.id}-${idx}`}
                          />
                        ))}
                      </div>
                    )}

                    <div className="border-t border-border pt-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
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
                      </div>
                    </div>

                    <div className="flex gap-2 mb-4">
                      <Select 
                        value={request.status}
                        onChange={(e) => updateStatus({ id: request.id, data: { status: e.target.value } })}
                        disabled={isUpdating}
                        className="h-10 text-sm py-1 bg-muted border-none flex-1"
                        options={[
                          { label: "Mark New", value: "New" },
                          { label: "Mark In-Progress", value: "In-Progress" },
                          { label: "Mark Completed", value: "Completed" }
                        ]}
                        data-testid={`select-status-${request.id}`}
                      />
                      {staffList && staffList.length > 0 && (
                        <Select
                          value={String(request.assignedTo || 0)}
                          onChange={(e) => {
                            const staffId = parseInt(e.target.value);
                            assignRequest({ requestId: request.id, staffId });
                          }}
                          className="h-10 text-sm py-1 bg-muted border-none flex-1"
                          options={staffOptions}
                          data-testid={`select-assign-${request.id}`}
                        />
                      )}
                    </div>

                    <RequestMessages requestId={request.id} />
                    <RequestNotes requestId={request.id} />
                    <RequestCosts requestId={request.id} />

                    <div className="mt-4 pt-4 border-t border-border flex justify-end">
                      {deleteConfirm === request.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-400">Delete this request and all its data?</span>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-8 px-3 text-xs"
                            onClick={() => deleteRequest.mutate(request.id)}
                            disabled={deleteRequest.isPending}
                            data-testid={`button-confirm-delete-${request.id}`}
                          >
                            {deleteRequest.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes, Delete"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-xs"
                            onClick={() => setDeleteConfirm(null)}
                            data-testid={`button-cancel-delete-${request.id}`}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 text-xs text-muted-foreground hover:text-red-400 gap-1"
                          onClick={() => setDeleteConfirm(request.id)}
                          data-testid={`button-delete-request-${request.id}`}
                        >
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
        {selectedImage && (
          <img src={selectedImage} alt="Full size" className="w-full h-auto max-h-[85vh] object-contain rounded-xl shadow-2xl" />
        )}
      </Dialog>
    </AppLayout>
  );
}
