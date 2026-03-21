import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Calendar, Clock, MapPin, User, ChevronLeft, ChevronRight, Wrench } from "lucide-react";
import { useLocation } from "wouter";

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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"week" | "day">(window.innerWidth < 768 ? "day" : "week");
  const [filterVendor, setFilterVendor] = useState("all");
  const [filterProperty, setFilterProperty] = useState("all");
  const [filterTrade, setFilterTrade] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: items, isLoading } = useQuery<ScheduleItem[]>({
    queryKey: ["/api/schedule"],
  });

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
      return true;
    });
  }, [items, filterVendor, filterProperty, filterTrade, filterStatus]);

  const getItemsForDay = (day: Date) =>
    filtered.filter(i => {
      if (!i.assignment?.scheduledDate) return false;
      return sameDay(new Date(i.assignment.scheduledDate), day);
    });

  const unscheduled = filtered.filter(i => !i.assignment?.scheduledDate);

  const navigateWeek = (dir: number) => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + (dir * (view === "week" ? 7 : 1)));
    setCurrentDate(next);
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

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground" data-testid="text-schedule-title">Schedule</h1>
            <p className="text-sm text-muted-foreground">{filtered.length} jobs &middot; {unscheduled.length} unscheduled</p>
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
        </div>

        {view === "week" ? (
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
                    {dayItems.map(item => (
                      <Card
                        key={item.assignment.id}
                        className="cursor-pointer hover:border-primary/30"
                        onClick={() => navigate(`/requests/${item.request?.id}`)}
                        data-testid={`schedule-item-${item.assignment.id}`}
                      >
                        <CardContent className="p-2 space-y-1">
                          <div className="flex items-center gap-1">
                            <Wrench className="h-3 w-3 text-primary shrink-0" />
                            <span className="text-xs font-medium text-foreground truncate">{item.request?.issueType}</span>
                          </div>
                          {item.vendor && <p className="text-[10px] text-muted-foreground truncate">{item.vendor.name}</p>}
                          {item.property && <p className="text-[10px] text-muted-foreground truncate">{item.property.name} #{item.request?.unitNumber}</p>}
                          <Badge variant="outline" className={`text-[9px] ${JOB_STATUS_COLORS[item.assignment.jobStatus] || ""}`}>
                            {item.assignment.jobStatus}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            <h2 className="text-lg font-display font-bold text-foreground">
              {currentDate.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}
            </h2>
            {getItemsForDay(currentDate).map(item => (
              <Card
                key={item.assignment.id}
                className="cursor-pointer hover:border-primary/30"
                onClick={() => navigate(`/requests/${item.request?.id}`)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Wrench className="h-4 w-4 text-primary" />
                      <span className="font-medium text-foreground">{item.request?.issueType}</span>
                      <Badge variant="outline" className={JOB_STATUS_COLORS[item.assignment.jobStatus] || ""}>{item.assignment.jobStatus}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {item.property && <span><MapPin className="h-3 w-3 inline mr-1" />{item.property.name} #{item.request?.unitNumber}</span>}
                      {item.vendor && <span><User className="h-3 w-3 inline mr-1" />{item.vendor.name}</span>}
                      {item.assignment.arrivalWindow && <span><Clock className="h-3 w-3 inline mr-1" />{item.assignment.arrivalWindow}</span>}
                    </div>
                  </div>
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

        {unscheduled.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Unscheduled Jobs ({unscheduled.length})</h3>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {unscheduled.slice(0, 12).map(item => (
                <Card
                  key={item.assignment.id}
                  className="cursor-pointer hover:border-primary/30"
                  onClick={() => navigate(`/requests/${item.request?.id}`)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Wrench className="h-3.5 w-3.5 text-primary" />
                      <span className="text-sm font-medium text-foreground">{item.request?.issueType}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.property?.name} #{item.request?.unitNumber}</p>
                    {item.vendor && <p className="text-xs text-muted-foreground">{item.vendor.name}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
