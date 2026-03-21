import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Calendar, Clock, MapPin, User, ChevronLeft, ChevronRight, Wrench, AlertTriangle, List, CalendarDays, X, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ScheduleItem {
  assignment: any;
  request: any;
  vendor: any;
  property: any;
}

const JOB_STATUS_COLORS: Record<string, string> = {
  "assigned": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "scheduled": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  "in-progress": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "waiting-on-parts": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "completed": "bg-green-500/10 text-green-400 border-green-500/20",
  "needs-dispatch": "bg-red-500/10 text-red-400 border-red-500/20",
};

const URGENCY_COLORS: Record<string, string> = {
  Emergency: "text-red-400",
  High: "text-orange-400",
  Medium: "text-yellow-400",
  Low: "text-muted-foreground",
};

function getWeekDays(date: Date): Date[] {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function Schedule() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"week" | "day" | "list">(window.innerWidth < 768 ? "day" : "week");
  const [filterVendor, setFilterVendor] = useState("all");
  const [filterProperty, setFilterProperty] = useState("all");
  const [filterTrade, setFilterTrade] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterUrgency, setFilterUrgency] = useState("all");

  const [scheduleModal, setScheduleModal] = useState<ScheduleItem | null>(null);
  const [modalDate, setModalDate] = useState("");
  const [modalWindow, setModalWindow] = useState("");
  const [modalDuration, setModalDuration] = useState("2");
  const [modalNotes, setModalNotes] = useState("");
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [conflictChecked, setConflictChecked] = useState(false);

  const { data: items, isLoading } = useQuery<ScheduleItem[]>({
    queryKey: ["/api/schedule"],
  });

  const scheduleMutation = useMutation({
    mutationFn: async (data: { requestId: number; scheduledDate: string | null; arrivalWindow?: string; estimatedDuration?: number; schedulingNotes?: string }) =>
      apiRequest("PATCH", `/api/requests/${data.requestId}/schedule`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedule"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dispatch-board"] });
      setScheduleModal(null);
      toast({ title: "Schedule updated" });
    },
    onError: () => toast({ title: "Failed to update schedule", variant: "destructive" }),
  });

  const checkConflicts = async (vendorId: number, scheduledDate: string, duration: number) => {
    try {
      const res = await fetch("/api/schedule/check-conflicts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId, scheduledDate, duration }),
        credentials: "include",
      });
      const data = await res.json();
      setConflicts(data.conflicts || []);
      setConflictChecked(true);
    } catch {
      setConflicts([]);
      setConflictChecked(true);
    }
  };

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  const vendors = useMemo(() => {
    if (!items) return [];
    const map = new Map<number, string>();
    items.forEach(i => { if (i.vendor) map.set(i.vendor.id, i.vendor.name); });
    return Array.from(map.entries()).map(([id, name]) => ({ id: String(id), name }));
  }, [items]);

  const allProperties = useMemo(() => {
    if (!items) return [];
    const map = new Map<number, string>();
    items.forEach(i => { if (i.property) map.set(i.property.id, i.property.name); });
    return Array.from(map.entries()).map(([id, name]) => ({ id: String(id), name }));
  }, [items]);

  const trades = useMemo(() => {
    if (!items) return [];
    const set = new Set<string>();
    items.forEach(i => { if (i.vendor?.tradeCategory) set.add(i.vendor.tradeCategory); });
    return Array.from(set);
  }, [items]);

  const filtered = useMemo(() => {
    if (!items) return [];
    return items.filter(i => {
      if (filterVendor !== "all" && String(i.vendor?.id) !== filterVendor) return false;
      if (filterProperty !== "all" && String(i.property?.id) !== filterProperty) return false;
      if (filterTrade !== "all" && i.vendor?.tradeCategory !== filterTrade) return false;
      if (filterStatus !== "all" && i.assignment?.jobStatus !== filterStatus) return false;
      if (filterUrgency !== "all" && i.request?.urgency !== filterUrgency) return false;
      return true;
    });
  }, [items, filterVendor, filterProperty, filterTrade, filterStatus, filterUrgency]);

  const getItemsForDay = (day: Date) =>
    filtered.filter(i => {
      if (!i.assignment?.scheduledDate) return false;
      return sameDay(new Date(i.assignment.scheduledDate), day);
    });

  const unscheduled = filtered.filter(i => !i.assignment?.scheduledDate);
  const scheduled = filtered.filter(i => !!i.assignment?.scheduledDate);

  const navigateWeek = (dir: number) => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + (dir * (view === "week" ? 7 : 1)));
    setCurrentDate(next);
  };

  const openScheduleModal = (item: ScheduleItem) => {
    setScheduleModal(item);
    setModalDate(item.assignment?.scheduledDate ? new Date(item.assignment.scheduledDate).toISOString().slice(0, 16) : "");
    setModalWindow(item.assignment?.arrivalWindow || "");
    setModalDuration(String(item.assignment?.estimatedDuration || 2));
    setModalNotes(item.assignment?.schedulingNotes || "");
    setConflicts([]);
    setConflictChecked(false);
  };

  const handleScheduleSave = () => {
    if (!scheduleModal) return;
    scheduleMutation.mutate({
      requestId: scheduleModal.request.id,
      scheduledDate: modalDate || null,
      arrivalWindow: modalWindow || undefined,
      estimatedDuration: parseInt(modalDuration) || undefined,
      schedulingNotes: modalNotes || undefined,
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const ScheduleCard = ({ item, compact = false }: { item: ScheduleItem; compact?: boolean }) => (
    <Card className="cursor-pointer hover:border-primary/30 transition-colors group" data-testid={`schedule-item-${item.assignment.id}`}>
      <CardContent className={compact ? "p-2 space-y-1" : "p-3 space-y-1.5"}>
        <div className="flex items-center gap-1">
          <Wrench className="h-3 w-3 text-primary shrink-0" />
          <span className={`${compact ? "text-xs" : "text-sm"} font-medium text-foreground truncate flex-1`} onClick={() => navigate(`/requests/${item.request?.id}`)}>
            {item.request?.issueType}
          </span>
          {!compact && (
            <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px] opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); openScheduleModal(item); }} data-testid={`button-schedule-${item.assignment.id}`}>
              <Clock className="h-3 w-3" />
            </Button>
          )}
        </div>
        {item.vendor && <p className={`${compact ? "text-[10px]" : "text-xs"} text-muted-foreground truncate`}>{item.vendor.name}</p>}
        {item.property && <p className={`${compact ? "text-[10px]" : "text-xs"} text-muted-foreground truncate`}>{item.property.name} #{item.request?.unitNumber}</p>}
        <div className="flex items-center gap-1">
          <Badge variant="outline" className={`${compact ? "text-[9px]" : "text-[10px]"} ${JOB_STATUS_COLORS[item.assignment.jobStatus] || ""}`}>
            {item.assignment.jobStatus}
          </Badge>
          {item.request?.urgency && (
            <span className={`${compact ? "text-[9px]" : "text-[10px]"} font-medium ${URGENCY_COLORS[item.request.urgency] || ""}`}>
              {item.request.urgency}
            </span>
          )}
        </div>
        {!compact && item.assignment.arrivalWindow && (
          <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{item.assignment.arrivalWindow}</p>
        )}
        {item.assignment.vendorResponseStatus === "proposed-new-time" && item.assignment.proposedTime && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded px-1.5 py-0.5 text-[10px] text-blue-400">
            Proposed: {new Date(item.assignment.proposedTime).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground" data-testid="text-schedule-title">Schedule</h1>
            <p className="text-sm text-muted-foreground">{scheduled.length} scheduled &middot; {unscheduled.length} unscheduled</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateWeek(-1)} data-testid="button-prev">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} data-testid="button-today">Today</Button>
            <Button variant="outline" size="icon" onClick={() => navigateWeek(1)} data-testid="button-next">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Select value={view} onValueChange={(v: any) => setView(v)}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="list">List</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={filterVendor} onValueChange={setFilterVendor}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Vendor" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vendors</SelectItem>
              {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterProperty} onValueChange={setFilterProperty}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Property" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              {allProperties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterTrade} onValueChange={setFilterTrade}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Trade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trades</SelectItem>
              {trades.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="waiting-on-parts">Waiting</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterUrgency} onValueChange={setFilterUrgency}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Urgency" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Urgency</SelectItem>
              <SelectItem value="Emergency">Emergency</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {view === "week" && (
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, i) => {
              const dayItems = getItemsForDay(day);
              const isToday = sameDay(day, new Date());
              return (
                <div key={i} className={`min-h-[200px] rounded-lg border ${isToday ? "border-primary/30 bg-primary/5" : "border-border"} p-2`}>
                  <div className="text-center mb-2">
                    <p className="text-[10px] text-muted-foreground uppercase">{day.toLocaleDateString("en", { weekday: "short" })}</p>
                    <p className={`text-lg font-display font-bold ${isToday ? "text-primary" : "text-foreground"}`}>{day.getDate()}</p>
                  </div>
                  <div className="space-y-1.5">
                    {dayItems.map(item => <ScheduleCard key={item.assignment.id} item={item} compact />)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {view === "day" && (
          <div className="space-y-2">
            <h2 className="text-lg font-display font-bold text-foreground">
              {currentDate.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}
            </h2>
            {getItemsForDay(currentDate).map(item => (
              <Card
                key={item.assignment.id}
                className="cursor-pointer hover:border-primary/30 group"
                data-testid={`schedule-day-item-${item.assignment.id}`}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1" onClick={() => navigate(`/requests/${item.request?.id}`)}>
                    <div className="flex items-center gap-2 mb-1">
                      <Wrench className="h-4 w-4 text-primary" />
                      <span className="font-medium text-foreground">{item.request?.issueType}</span>
                      <Badge variant="outline" className={JOB_STATUS_COLORS[item.assignment.jobStatus] || ""}>{item.assignment.jobStatus}</Badge>
                      <span className={`text-xs font-medium ${URGENCY_COLORS[item.request?.urgency] || ""}`}>{item.request?.urgency}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {item.property && <span><MapPin className="h-3 w-3 inline mr-1" />{item.property.name} #{item.request?.unitNumber}</span>}
                      {item.vendor && <span><User className="h-3 w-3 inline mr-1" />{item.vendor.name}</span>}
                      {item.assignment.arrivalWindow && <span><Clock className="h-3 w-3 inline mr-1" />{item.assignment.arrivalWindow}</span>}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100" onClick={() => openScheduleModal(item)} data-testid={`button-reschedule-${item.assignment.id}`}>
                    Reschedule
                  </Button>
                </CardContent>
              </Card>
            ))}
            {getItemsForDay(currentDate).length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No jobs scheduled for this day</p>
              </div>
            )}
          </div>
        )}

        {view === "list" && (
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">Scheduled Jobs ({scheduled.length})</h2>
            {scheduled
              .sort((a, b) => new Date(a.assignment.scheduledDate).getTime() - new Date(b.assignment.scheduledDate).getTime())
              .map(item => (
              <Card key={item.assignment.id} className="cursor-pointer hover:border-primary/30 group" data-testid={`schedule-list-item-${item.assignment.id}`}>
                <CardContent className="p-3 flex items-center gap-4">
                  <div className="w-20 text-center shrink-0">
                    <p className="text-xs text-muted-foreground">{new Date(item.assignment.scheduledDate).toLocaleDateString("en", { month: "short", day: "numeric" })}</p>
                    <p className="text-sm font-medium text-foreground">{new Date(item.assignment.scheduledDate).toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" })}</p>
                    {item.assignment.arrivalWindow && <p className="text-[10px] text-muted-foreground">{item.assignment.arrivalWindow}</p>}
                  </div>
                  <div className="flex-1 min-w-0" onClick={() => navigate(`/requests/${item.request?.id}`)}>
                    <div className="flex items-center gap-2">
                      <Wrench className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="text-sm font-medium text-foreground truncate">{item.request?.issueType}</span>
                      <Badge variant="outline" className={`text-[10px] ${JOB_STATUS_COLORS[item.assignment.jobStatus] || ""}`}>{item.assignment.jobStatus}</Badge>
                      <span className={`text-[10px] font-medium ${URGENCY_COLORS[item.request?.urgency] || ""}`}>{item.request?.urgency}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      {item.property && <span>{item.property.name} #{item.request?.unitNumber}</span>}
                      {item.vendor && <span>{item.vendor.name}</span>}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 shrink-0" onClick={() => openScheduleModal(item)}>
                    <Clock className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {unscheduled.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Unscheduled Jobs ({unscheduled.length})</h3>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {unscheduled.map(item => (
                <Card key={item.assignment.id} className="cursor-pointer hover:border-primary/30 group" data-testid={`unscheduled-${item.assignment.id}`}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Wrench className="h-3.5 w-3.5 text-primary" />
                      <span className="text-sm font-medium text-foreground flex-1 truncate" onClick={() => navigate(`/requests/${item.request?.id}`)}>{item.request?.issueType}</span>
                      <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] opacity-0 group-hover:opacity-100" onClick={() => openScheduleModal(item)} data-testid={`button-schedule-unscheduled-${item.assignment.id}`}>
                        Schedule
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.property?.name} #{item.request?.unitNumber}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {item.vendor && <span className="text-xs text-muted-foreground">{item.vendor.name}</span>}
                      <span className={`text-[10px] font-medium ${URGENCY_COLORS[item.request?.urgency] || ""}`}>{item.request?.urgency}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <Dialog open={!!scheduleModal} onOpenChange={(open) => !open && setScheduleModal(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                {scheduleModal?.assignment?.scheduledDate ? "Reschedule Job" : "Schedule Job"}
              </DialogTitle>
            </DialogHeader>
            {scheduleModal && (
              <div className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-3 text-sm">
                  <p className="font-medium text-foreground">{scheduleModal.request?.issueType}</p>
                  <p className="text-xs text-muted-foreground">{scheduleModal.property?.name} #{scheduleModal.request?.unitNumber}</p>
                  {scheduleModal.vendor && <p className="text-xs text-muted-foreground">Vendor: {scheduleModal.vendor.name}</p>}
                </div>

                {scheduleModal.assignment?.vendorResponseStatus === "proposed-new-time" && scheduleModal.assignment?.proposedTime && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm">
                    <p className="text-xs font-medium text-blue-400 mb-1">Vendor Proposed Time</p>
                    <p className="text-foreground">{new Date(scheduleModal.assignment.proposedTime).toLocaleString()}</p>
                    {scheduleModal.assignment.vendorNotes && <p className="text-xs text-muted-foreground mt-1">{scheduleModal.assignment.vendorNotes}</p>}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 text-xs"
                      onClick={() => setModalDate(new Date(scheduleModal.assignment.proposedTime).toISOString().slice(0, 16))}
                      data-testid="button-use-proposed-time"
                    >
                      Use This Time
                    </Button>
                  </div>
                )}

                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={modalDate}
                    onChange={e => { setModalDate(e.target.value); setConflictChecked(false); }}
                    data-testid="input-schedule-date"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Arrival Window</label>
                    <Input value={modalWindow} onChange={e => setModalWindow(e.target.value)} placeholder="e.g. 9-11 AM" data-testid="input-arrival-window" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Duration (hours)</label>
                    <Input type="number" value={modalDuration} onChange={e => { setModalDuration(e.target.value); setConflictChecked(false); }} placeholder="2" data-testid="input-duration" />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Scheduling Notes</label>
                  <Textarea value={modalNotes} onChange={e => setModalNotes(e.target.value)} placeholder="Notes about this schedule..." className="h-16" data-testid="input-scheduling-notes" />
                </div>

                {modalDate && scheduleModal.vendor && !conflictChecked && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => checkConflicts(scheduleModal.vendor.id, modalDate, parseInt(modalDuration) || 2)}
                    data-testid="button-check-conflicts"
                  >
                    Check for Conflicts
                  </Button>
                )}

                {conflictChecked && conflicts.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3" data-testid="conflict-warning">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <p className="text-sm font-medium text-red-400">Schedule Conflict Detected</p>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">This vendor has {conflicts.length} overlapping job(s):</p>
                    {conflicts.map((c: any) => (
                      <div key={c.id} className="text-xs text-muted-foreground">
                        {c.scheduledDate ? new Date(c.scheduledDate).toLocaleString() : "Unknown time"} — Job #{c.requestId}
                      </div>
                    ))}
                    <p className="text-[10px] text-muted-foreground mt-2">You can still save — the schedule will be created with the conflict noted.</p>
                  </div>
                )}

                {conflictChecked && conflicts.length === 0 && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 text-xs text-green-400 flex items-center gap-1" data-testid="no-conflict">
                    <CheckCircle className="h-3.5 w-3.5" />No conflicts found
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="flex gap-2">
              {scheduleModal?.assignment?.scheduledDate && (
                <Button
                  variant="outline"
                  className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                  onClick={() => {
                    if (scheduleModal) {
                      scheduleMutation.mutate({ requestId: scheduleModal.request.id, scheduledDate: null });
                    }
                  }}
                  disabled={scheduleMutation.isPending}
                  data-testid="button-unschedule"
                >
                  Unschedule
                </Button>
              )}
              <Button onClick={handleScheduleSave} disabled={!modalDate || scheduleMutation.isPending} data-testid="button-save-schedule">
                {scheduleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {scheduleModal?.assignment?.scheduledDate ? "Reschedule" : "Schedule"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
