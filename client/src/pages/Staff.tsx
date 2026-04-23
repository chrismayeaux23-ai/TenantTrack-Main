import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useStaff, useCreateStaff, useDeleteStaff } from "@/hooks/use-staff";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/SimpleDialog";
import { Loader2, Plus, Users, Mail, Phone, Trash2, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/use-subscription";
import { Link } from "wouter";

export default function Staff() {
  const { data: staff, isLoading } = useStaff();
  const { mutate: createStaff, isPending: isCreating } = useCreateStaff();
  const { mutate: deleteStaff, isPending: isDeleting } = useDeleteStaff();
  const { toast } = useToast();
  const { limits, tierLabel } = useSubscription();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createStaff(
      { name: formData.name, email: formData.email, phone: formData.phone || undefined },
      {
        onSuccess: () => {
          setIsAddModalOpen(false);
          setFormData({ name: "", email: "", phone: "" });
          toast({ title: "Success", description: "Staff member added successfully!" });
        },
        onError: (err) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteStaff(id, {
      onSuccess: () => {
        setDeleteConfirmId(null);
        toast({ title: "Removed", description: "Staff member has been removed." });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      },
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="h-[60vh] flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!limits.staffAssignment) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-3">Staff Management</h2>
          <p className="text-muted-foreground mb-6">
            Add and manage maintenance staff members with the Growth plan or higher.
            Your current plan: <strong>{tierLabel}</strong>
          </p>
          <Link href="/pricing">
            <Button data-testid="button-upgrade-staff">Upgrade Your Plan</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground" data-testid="text-staff-title">
            Maintenance Staff
          </h1>
          <p className="text-muted-foreground mt-2">Manage your maintenance team members.</p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="shadow-lg shadow-primary/20"
          data-testid="button-add-staff"
        >
          <Plus className="mr-2 h-5 w-5" /> Add Staff
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {staff?.map((member) => (
          <div
            key={member.id}
            className="bg-card rounded-2xl p-6 border border-border shadow-sm hover-elevate flex flex-col"
            data-testid={`card-staff-${member.id}`}
          >
            <div className="flex items-start justify-between gap-2 mb-4">
              <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteConfirmId(member.id)}
                data-testid={`button-delete-staff-${member.id}`}
              >
                <Trash2 className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>
            <h3 className="text-xl font-bold mb-3" data-testid={`text-staff-name-${member.id}`}>
              {member.name}
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2" data-testid={`text-staff-email-${member.id}`}>
                <Mail className="h-4 w-4 shrink-0" />
                <span className="truncate">{member.email}</span>
              </p>
              {member.phone && (
                <p className="flex items-center gap-2" data-testid={`text-staff-phone-${member.id}`}>
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{member.phone}</span>
                </p>
              )}
            </div>
          </div>
        ))}

        {staff?.length === 0 && (
          <div className="col-span-full bg-card border-2 border-dashed border-border rounded-3xl p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">No staff members yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Add your first maintenance staff member to start assigning requests.
            </p>
            <Button onClick={() => setIsAddModalOpen(true)} data-testid="button-add-first-staff">
              Add Your First Staff Member
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <div>
          <h2 className="text-2xl font-display font-bold mb-6">Add Staff Member</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="staff-name">Full Name</Label>
              <Input
                id="staff-name"
                placeholder="e.g. John Smith"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-staff-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-email">Email Address</Label>
              <Input
                id="staff-email"
                type="email"
                placeholder="john@example.com"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                data-testid="input-staff-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-phone">Phone Number (optional)</Label>
              <Input
                id="staff-phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                data-testid="input-staff-phone"
              />
            </div>
            <Button
              type="submit"
              className="w-full mt-2"
              isLoading={isCreating}
              data-testid="button-submit-staff"
            >
              Add Staff Member
            </Button>
          </form>
        </div>
      </Dialog>

      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <div className="text-center">
          <div className="h-14 w-14 bg-destructive/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Trash2 className="h-7 w-7 text-destructive" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-2">Remove Staff Member</h2>
          <p className="text-muted-foreground mb-6">
            Are you sure you want to remove this staff member? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteConfirmId(null)}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              isLoading={isDeleting}
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              data-testid="button-confirm-delete"
            >
              Remove
            </Button>
          </div>
        </div>
      </Dialog>
    </AppLayout>
  );
}
