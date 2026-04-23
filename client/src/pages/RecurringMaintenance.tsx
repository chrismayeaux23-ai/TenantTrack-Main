import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProperties } from "@/hooks/use-properties";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/NativeSelect";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/SimpleDialog";
import { Loader2, CalendarClock, Plus, CheckCircle2, Trash2, AlertTriangle, Clock, Building2 } from "lucide-react";
import { format, isPast, addDays, isBefore } from "date-fns";
import { useSubscription } from "@/hooks/use-subscription";
import { UpgradeBanner } from "@/components/UpgradeGate";

interface RecurringTask {
  id: number;
  landlordId: string;
  propertyId: number;
  title: string;
  description: string | null;
  frequency: string;
  nextDueDate: string;
  lastCompletedDate: string | null;
  isActive: boolean;
  createdAt: string;
}

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Biweekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  biannually: "Biannually",
  annually: "Annually",
};

export default function RecurringMaintenance() {
  const { tier } = useSubscription();
  const queryClient = useQueryClient();
  const { data: properties } = useProperties();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: tasks, isLoading } = useQuery<RecurringTask[]>({
    queryKey: ["/api/recurring"],
  });

  const createTask = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: Number(propertyId),
          title,
          description: description || undefined,
          frequency,
          nextDueDate: new Date(startDate).toISOString(),
        }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recurring"] });
      setShowAddDialog(false);
      resetForm();
    },
  });

  const completeTask = useMutation({
    mutationFn: async (taskId: number) => {
      const res = await fetch(`/api/recurring/${taskId}/complete`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recurring"] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: number) => {
      const res = await fetch(`/api/recurring/${taskId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recurring"] });
      setDeleteId(null);
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPropertyId("");
    setFrequency("monthly");
    setStartDate(format(new Date(), "yyyy-MM-dd"));
  };

  const getPropertyName = (propId: number) => {
    return properties?.find(p => p.id === propId)?.name || "Unknown Property";
  };

  const getTaskStatus = (task: RecurringTask) => {
    const dueDate = new Date(task.nextDueDate);
    const now = new Date();
    if (isPast(dueDate)) return "overdue";
    if (isBefore(dueDate, addDays(now, 7))) return "upcoming";
    return "future";
  };

  const sortedTasks = [...(tasks || [])].sort((a, b) => {
    const statusOrder = { overdue: 0, upcoming: 1, future: 2 };
    const aStatus = getTaskStatus(a);
    const bStatus = getTaskStatus(b);
    if (statusOrder[aStatus] !== statusOrder[bStatus]) {
      return statusOrder[aStatus] - statusOrder[bStatus];
    }
    return new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime();
  });

  const propertyOptions = (properties || []).map(p => ({ label: p.name, value: String(p.id) }));

  const frequencyOptions = [
    { label: "Weekly", value: "weekly" },
    { label: "Biweekly", value: "biweekly" },
    { label: "Monthly", value: "monthly" },
    { label: "Quarterly", value: "quarterly" },
    { label: "Biannually", value: "biannually" },
    { label: "Annually", value: "annually" },
  ];

  return (
    <AppLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground" data-testid="text-scheduled-title">Scheduled Maintenance</h1>
          <p className="text-muted-foreground mt-2">Set up recurring tasks to stay on top of preventive maintenance.</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2" data-testid="button-add-task">
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>

      <UpgradeBanner feature="Scheduled Maintenance" requiredPlan="pro" currentPlan={tier as any} />

      {isLoading ? (
        <div className="h-[40vh] flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : sortedTasks.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-3xl p-12 text-center flex flex-col items-center">
          <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-6">
            <CalendarClock className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold mb-2">No scheduled tasks</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Create recurring maintenance tasks to stay proactive — like HVAC filter changes, smoke detector checks, and more.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sortedTasks.map((task) => {
            const status = getTaskStatus(task);
            const borderColor = status === "overdue" ? "border-red-500/50" : status === "upcoming" ? "border-yellow-500/50" : "border-border";
            const bgHighlight = status === "overdue" ? "bg-red-500/5" : status === "upcoming" ? "bg-yellow-500/5" : "";

            return (
              <div
                key={task.id}
                className={`bg-card rounded-2xl p-5 shadow-sm border ${borderColor} ${bgHighlight} flex flex-col`}
                data-testid={`task-card-${task.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant={status === "overdue" ? "destructive" : status === "upcoming" ? "warning" : "default"}>
                      {status === "overdue" ? "Overdue" : status === "upcoming" ? "Due Soon" : "Scheduled"}
                    </Badge>
                    <Badge variant="outline">{FREQUENCY_LABELS[task.frequency] || task.frequency}</Badge>
                  </div>
                </div>

                <h3 className="text-lg font-bold mb-1">{task.title}</h3>
                {task.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span>{getPropertyName(task.propertyId)}</span>
                </div>

                <div className="flex items-center gap-2 text-sm mb-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className={status === "overdue" ? "text-red-400 font-semibold" : "text-foreground"}>
                    Due: {format(new Date(task.nextDueDate), "MMM d, yyyy")}
                  </span>
                </div>

                {task.lastCompletedDate && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span>Last done: {format(new Date(task.lastCompletedDate), "MMM d, yyyy")}</span>
                  </div>
                )}

                <div className="mt-auto pt-4 border-t border-border flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={() => completeTask.mutate(task.id)}
                    disabled={completeTask.isPending}
                    data-testid={`button-complete-${task.id}`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Mark Complete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => setDeleteId(task.id)}
                    data-testid={`button-delete-${task.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog} className="max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6">Add Scheduled Task</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Property</label>
              <Select
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                options={[{ label: "Select property...", value: "" }, ...propertyOptions]}
                className="bg-muted"
                data-testid="select-task-property"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Task Title</label>
              <Input
                placeholder="e.g. HVAC Filter Change"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-muted"
                data-testid="input-task-title"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Description (optional)</label>
              <Input
                placeholder="Additional details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-muted"
                data-testid="input-task-description"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Frequency</label>
              <Select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                options={frequencyOptions}
                className="bg-muted"
                data-testid="select-task-frequency"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">First Due Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-muted"
                data-testid="input-task-date"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="outline" className="flex-1" onClick={() => { setShowAddDialog(false); resetForm(); }} data-testid="button-cancel-task">
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={!title.trim() || !propertyId || createTask.isPending}
              onClick={() => createTask.mutate()}
              data-testid="button-save-task"
            >
              {createTask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Task"}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)} className="max-w-sm">
        <div className="p-6 text-center">
          <div className="h-14 w-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-7 w-7 text-red-400" />
          </div>
          <h3 className="text-lg font-bold mb-2">Delete Task?</h3>
          <p className="text-sm text-muted-foreground mb-6">This will permanently remove this scheduled task. This action cannot be undone.</p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)} data-testid="button-cancel-delete">
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => deleteId && deleteTask.mutate(deleteId)}
              disabled={deleteTask.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteTask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </Button>
          </div>
        </div>
      </Dialog>
    </AppLayout>
  );
}
