import { useState } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/hooks/use-toast";
import {
  useVendors, useCreateVendor, useUpdateVendor,
  useArchiveVendor, useDeleteVendor, useVendorStats, useVendorReviews,
} from "@/hooks/use-vendors";
import type { Vendor } from "@shared/schema";
import { TRADE_CATEGORIES } from "@shared/schema";
import {
  Briefcase, Plus, Search, Star, Phone, Mail, MapPin,
  Edit2, Trash2, Archive, CheckCircle2, Loader2, ChevronDown,
  ChevronUp, Shield, FileText, X, ShieldCheck, Zap, AlertTriangle, Clock,
} from "lucide-react";
import { format } from "date-fns";

function TrustScore({ score }: { score: number }) {
  const color = score >= 80 ? "text-green-400 bg-green-400/10 border-green-400/20"
    : score >= 60 ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"
    : "text-red-400 bg-red-400/10 border-red-400/20";
  const label = score >= 80 ? "High Trust" : score >= 60 ? "Medium" : "Low";
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-xs font-bold ${color}`}>
      <ShieldCheck className="h-3 w-3" />
      {score} <span className="font-normal opacity-70">· {label}</span>
    </div>
  );
}

// ── Star Rating Display ────────────────────────────────────────────────────────
function StarRow({ rating, max = 5 }: { rating: number | null; max?: number }) {
  if (rating === null) return <span className="text-xs text-muted-foreground">No rating</span>;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

// ── Interactive Star Picker ────────────────────────────────────────────────────
function StarPicker({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(n)}
          >
            <Star
              className={`h-6 w-6 transition-colors ${n <= (hovered || value) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Vendor Form ────────────────────────────────────────────────────────────────
const BLANK_FORM = {
  name: "", companyName: "", tradeCategory: "", phone: "", email: "",
  city: "", serviceArea: "", notes: "", licenseInfo: "", insuranceInfo: "",
  preferredVendor: false,
};

function VendorForm({ initial, onSubmit, onClose, isPending }: {
  initial?: Partial<Vendor>;
  onSubmit: (data: typeof BLANK_FORM) => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState({ ...BLANK_FORM, ...initial });
  const set = (k: keyof typeof BLANK_FORM, v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">Contact Name *</label>
          <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Carlos Ruiz" className="mt-1" data-testid="input-vendor-name" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Company Name</label>
          <Input value={form.companyName} onChange={e => set("companyName", e.target.value)} placeholder="Ruiz Plumbing LLC" className="mt-1" data-testid="input-vendor-company" />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Trade / Category *</label>
        <Select
          value={form.tradeCategory}
          onChange={e => set("tradeCategory", e.target.value)}
          className="mt-1"
          data-testid="select-vendor-trade"
          options={[
            { label: "Select trade...", value: "" },
            ...TRADE_CATEGORIES.map(c => ({ label: c, value: c })),
          ]}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">Phone</label>
          <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="503-555-0100" className="mt-1" data-testid="input-vendor-phone" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Email</label>
          <Input value={form.email} onChange={e => set("email", e.target.value)} placeholder="vendor@example.com" type="email" className="mt-1" data-testid="input-vendor-email" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">City</label>
          <Input value={form.city} onChange={e => set("city", e.target.value)} placeholder="Portland" className="mt-1" data-testid="input-vendor-city" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Service Area</label>
          <Input value={form.serviceArea} onChange={e => set("serviceArea", e.target.value)} placeholder="Metro Portland" className="mt-1" data-testid="input-vendor-service-area" />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">License Info</label>
        <Input value={form.licenseInfo} onChange={e => set("licenseInfo", e.target.value)} placeholder="OR Plumber #PL-44821" className="mt-1" />
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Insurance Info</label>
        <Input value={form.insuranceInfo} onChange={e => set("insuranceInfo", e.target.value)} placeholder="Fully insured, $2M liability" className="mt-1" />
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Private Notes</label>
        <textarea
          value={form.notes}
          onChange={e => set("notes", e.target.value)}
          placeholder="Reliable, calls back within the hour..."
          rows={3}
          className="mt-1 w-full rounded-xl bg-muted border border-border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          data-testid="textarea-vendor-notes"
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer" data-testid="checkbox-preferred-vendor">
        <div
          className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${form.preferredVendor ? "bg-primary border-primary" : "border-border"}`}
          onClick={() => set("preferredVendor", !form.preferredVendor)}
        >
          {form.preferredVendor && <CheckCircle2 className="h-3 w-3 text-white" />}
        </div>
        <span className="text-sm font-medium">Mark as Preferred Vendor</span>
      </label>

      <div className="flex gap-2 pt-2">
        <Button
          className="flex-1"
          onClick={() => onSubmit(form)}
          isLoading={isPending}
          disabled={!form.name.trim() || !form.tradeCategory}
          data-testid="button-save-vendor"
        >
          Save Vendor
        </Button>
        <Button variant="outline" onClick={onClose} data-testid="button-cancel-vendor">
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ── Vendor Detail Panel ────────────────────────────────────────────────────────
function VendorDetail({ vendor, onClose }: { vendor: Vendor; onClose: () => void }) {
  const { data: stats } = useVendorStats(vendor.id);
  const { data: reviews } = useVendorReviews(vendor.id);

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 font-display font-extrabold text-primary text-xl">
          {vendor.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-lg">{vendor.name}</h3>
            {vendor.preferredVendor && <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs">⭐ Preferred</Badge>}
          </div>
          {vendor.companyName && <p className="text-sm text-muted-foreground">{vendor.companyName}</p>}
          <Badge variant="outline" className="text-xs mt-1">{vendor.tradeCategory}</Badge>
        </div>
      </div>

      {stats && (
        <div className="space-y-3">
          {(stats as any).trustScore !== undefined && (() => {
            const sc = (stats as any).trustScore;
            const tier = sc >= 80
              ? { label: "Excellent", color: "text-green-400", bar: "bg-green-400", bg: "bg-green-400/10 border-green-400/20" }
              : sc >= 60
              ? { label: "Good", color: "text-yellow-400", bar: "bg-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" }
              : { label: "At Risk", color: "text-red-400", bar: "bg-red-400", bg: "bg-red-400/10 border-red-400/20" };
            return (
            <div className={`rounded-2xl border p-3 ${tier.bg}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className={`h-4 w-4 ${tier.color}`} />
                  <span className="text-xs font-semibold text-foreground">Trust Score</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-2xl font-display font-extrabold ${tier.color}`}>{sc}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${tier.color} bg-black/10`}>{tier.label}</span>
                </div>
              </div>
              <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                <div className={`h-2 rounded-full ${tier.bar} transition-all duration-700`} style={{ width: `${sc}%` }} />
              </div>
              <div className="flex justify-between mt-1 text-[9px] text-muted-foreground/40">
                <span>0</span><span>50</span><span>100</span>
              </div>
            </div>
            );
          })()}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Jobs Done", val: stats.totalJobs },
              { label: "Avg Rating", val: stats.avgOverallRating ? `${stats.avgOverallRating.toFixed(1)}/5` : "N/A" },
              { label: "Last Used", val: stats.lastAssignedAt ? format(new Date(stats.lastAssignedAt), "MMM d") : "Never" },
            ].map(s => (
              <div key={s.label} className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold">{s.val}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          {(vendor as any).noShowCount > 0 && (
            <div className="flex items-center gap-2 bg-red-500/5 border border-red-500/20 rounded-xl p-3">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-400">{(vendor as any).noShowCount} recorded no-show{(vendor as any).noShowCount !== 1 ? "s" : ""} — confirm arrival before committing</p>
            </div>
          )}
          {(vendor as any).emergencyAvailable && (
            <div className="flex items-center gap-2 text-xs text-green-400">
              <Zap className="h-3.5 w-3.5" /> Available for 24/7 emergency calls
            </div>
          )}
        </div>
      )}

      <div className="space-y-2 text-sm">
        {vendor.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground shrink-0" /><a href={`tel:${vendor.phone}`} className="hover:text-primary">{vendor.phone}</a></div>}
        {vendor.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground shrink-0" /><a href={`mailto:${vendor.email}`} className="hover:text-primary truncate">{vendor.email}</a></div>}
        {(vendor.city || vendor.serviceArea) && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>{[vendor.city, vendor.serviceArea].filter(Boolean).join(" · ")}</span>
          </div>
        )}
        {vendor.licenseInfo && <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-muted-foreground shrink-0" /><span>{vendor.licenseInfo}</span></div>}
        {vendor.insuranceInfo && <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground shrink-0" /><span>{vendor.insuranceInfo}</span></div>}
      </div>

      {vendor.notes && (
        <div className="bg-muted/50 rounded-xl p-3">
          <p className="text-xs text-muted-foreground mb-1">Private Notes</p>
          <p className="text-sm">{vendor.notes}</p>
        </div>
      )}

      {reviews && reviews.length > 0 && (
        <div>
          <p className="text-xs font-bold text-muted-foreground mb-2">JOB REVIEWS</p>
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="bg-muted/40 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <StarRow rating={r.overallRating} />
                  <span className="text-xs text-muted-foreground">{r.createdAt ? format(new Date(r.createdAt), "MMM d, yyyy") : ""}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground mb-2">
                  {r.qualityRating && <span>Quality: {r.qualityRating}/5</span>}
                  {r.speedRating && <span>Speed: {r.speedRating}/5</span>}
                  {r.communicationRating && <span>Comms: {r.communicationRating}/5</span>}
                  {r.priceRating && <span>Price: {r.priceRating}/5</span>}
                </div>
                {r.reviewNotes && <p className="text-sm italic">"{r.reviewNotes}"</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
    </div>
  );
}

// ── Vendor Card ────────────────────────────────────────────────────────────────
function VendorCard({
  vendor,
  onEdit,
  onArchive,
  onDelete,
  onViewDetail,
}: {
  vendor: Vendor;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onViewDetail: () => void;
}) {
  const { data: stats } = useVendorStats(vendor.id);
  const [showActions, setShowActions] = useState(false);
  const isArchived = vendor.status === "archived";

  return (
    <div className={`bg-card border border-border rounded-2xl p-4 flex flex-col gap-3 transition-opacity ${isArchived ? "opacity-60" : ""}`} data-testid={`vendor-card-${vendor.id}`}>
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 font-display font-extrabold text-primary text-sm">
          {vendor.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold truncate">{vendor.name}</p>
            {vendor.preferredVendor && !isArchived && (
              <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-[10px] px-1.5">⭐ Preferred</Badge>
            )}
            {isArchived && <Badge variant="outline" className="text-[10px] text-muted-foreground">Archived</Badge>}
          </div>
          {vendor.companyName && <p className="text-xs text-muted-foreground truncate">{vendor.companyName}</p>}
        </div>
        <button
          onClick={() => setShowActions(!showActions)}
          className="shrink-0 p-1.5 rounded-lg hover:bg-muted transition-colors"
          data-testid={`button-vendor-menu-${vendor.id}`}
        >
          {showActions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="text-xs">{vendor.tradeCategory}</Badge>
        {(vendor as any).emergencyAvailable && (
          <span className="text-[10px] text-red-400 flex items-center gap-0.5 font-medium">
            <Zap className="h-2.5 w-2.5" /> 24/7 Emergency
          </span>
        )}
        {vendor.city && (
          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
            <MapPin className="h-3 w-3" />{vendor.city}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {vendor.phone && (
          <a href={`tel:${vendor.phone}`} className="flex items-center gap-1 hover:text-primary" data-testid={`link-vendor-phone-${vendor.id}`}>
            <Phone className="h-3 w-3" />{vendor.phone}
          </a>
        )}
        {vendor.email && (
          <a href={`mailto:${vendor.email}`} className="flex items-center gap-1 hover:text-primary truncate" data-testid={`link-vendor-email-${vendor.id}`}>
            <Mail className="h-3 w-3" />Email
          </a>
        )}
      </div>

      {stats && (
        <div className="space-y-1.5 pt-1 border-t border-border">
          {(stats as any).trustScore !== undefined && (
            <TrustScore score={(stats as any).trustScore} />
          )}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <StarRow rating={stats.avgOverallRating} />
            </div>
            <span className="text-xs text-muted-foreground">
              {stats.totalJobs} job{stats.totalJobs !== 1 ? "s" : ""}
            </span>
            {(vendor as any).noShowCount > 0 && (
              <span className="text-[10px] text-red-400 flex items-center gap-0.5">
                <AlertTriangle className="h-2.5 w-2.5" /> {(vendor as any).noShowCount} no-show{(vendor as any).noShowCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      )}

      {showActions && (
        <div className="flex gap-2 pt-1 border-t border-border animate-in fade-in duration-150">
          <Button size="sm" variant="outline" className="flex-1 h-8 text-xs gap-1" onClick={onViewDetail} data-testid={`button-vendor-detail-${vendor.id}`}>
            Quick View
          </Button>
          <Link href={`/vendors/${vendor.id}`}>
            <Button size="sm" variant="default" className="h-8 text-xs gap-1" data-testid={`button-view-vendor-${vendor.id}`}>
              Full Profile
            </Button>
          </Link>
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={onEdit} data-testid={`button-vendor-edit-${vendor.id}`}>
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1 text-muted-foreground" onClick={onArchive} data-testid={`button-vendor-archive-${vendor.id}`}>
            <Archive className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs gap-1 text-red-400 hover:text-red-400 hover:bg-red-500/10" onClick={onDelete} data-testid={`button-vendor-delete-${vendor.id}`}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function Vendors() {
  const { data: vendors = [], isLoading } = useVendors();
  const createVendor = useCreateVendor();
  const updateVendor = useUpdateVendor();
  const archiveVendor = useArchiveVendor();
  const deleteVendor = useDeleteVendor();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [tradeFilter, setTradeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [preferredOnly, setPreferredOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [detailVendor, setDetailVendor] = useState<Vendor | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const filtered = vendors.filter(v => {
    if (statusFilter === "active" && v.status !== "active") return false;
    if (statusFilter === "archived" && v.status !== "archived") return false;
    if (preferredOnly && !v.preferredVendor) return false;
    if (tradeFilter !== "all" && v.tradeCategory !== tradeFilter) return false;
    const q = search.toLowerCase();
    if (q && !v.name.toLowerCase().includes(q) && !(v.companyName?.toLowerCase().includes(q)) && !v.tradeCategory.toLowerCase().includes(q) && !(v.city?.toLowerCase().includes(q))) return false;
    return true;
  });

  const activeCount = vendors.filter(v => v.status === "active").length;
  const preferredCount = vendors.filter(v => v.preferredVendor && v.status === "active").length;
  const tradeOptions = ["all", ...Array.from(new Set(vendors.map(v => v.tradeCategory))).sort()];

  async function handleCreate(form: typeof BLANK_FORM) {
    try {
      await createVendor.mutateAsync(form as any);
      setShowAddModal(false);
      toast({ title: "Vendor added", description: `${form.name} has been added to your network.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }

  async function handleEdit(form: typeof BLANK_FORM) {
    if (!editVendor) return;
    try {
      await updateVendor.mutateAsync({ id: editVendor.id, data: form as any });
      setEditVendor(null);
      toast({ title: "Vendor updated" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }

  async function handleArchive(id: number, name: string) {
    try {
      await archiveVendor.mutateAsync(id);
      toast({ title: "Vendor archived", description: `${name} is now archived.` });
    } catch {
      toast({ title: "Error", description: "Failed to archive vendor", variant: "destructive" });
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteVendor.mutateAsync(id);
      setDeleteConfirm(null);
      toast({ title: "Vendor deleted" });
    } catch {
      toast({ title: "Error", description: "Failed to delete vendor", variant: "destructive" });
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-extrabold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-7 w-7 text-primary" /> Vendor Network
            </h1>
            <p className="text-muted-foreground mt-1">Trusted contractors, scored by performance. Smart dispatch starts here.</p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="shrink-0 gap-2" data-testid="button-add-vendor">
            <Plus className="h-4 w-4" /> Add Vendor
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Active Vendors", val: activeCount, icon: Briefcase, color: "text-primary" },
            { label: "Preferred", val: preferredCount, icon: Star, color: "text-yellow-400" },
            { label: "24/7 Emergency", val: vendors.filter(v => (v as any).emergencyAvailable && v.status === "active").length, icon: Zap, color: "text-red-400" },
            { label: "Trade Types", val: new Set(vendors.filter(v => v.status === "active").map(v => v.tradeCategory)).size, icon: ShieldCheck, color: "text-green-400" },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-2xl p-4 text-center">
              <s.icon className={`h-5 w-5 mx-auto mb-1 ${s.color}`} />
              <p className="text-2xl font-display font-extrabold text-foreground">{s.val}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search vendors by name, company, or trade..."
              className="pl-9"
              data-testid="input-vendor-search"
            />
          </div>
          <Select
            value={tradeFilter}
            onChange={e => setTradeFilter(e.target.value)}
            options={tradeOptions.map(t => ({ label: t === "all" ? "All Trades" : t, value: t }))}
            className="sm:w-44"
            data-testid="select-trade-filter"
          />
          <Select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            options={[
              { label: "Active", value: "active" },
              { label: "Archived", value: "archived" },
              { label: "All", value: "all" },
            ]}
            className="sm:w-36"
            data-testid="select-status-filter"
          />
          <Button
            variant={preferredOnly ? "default" : "outline"}
            onClick={() => setPreferredOnly(!preferredOnly)}
            className="gap-1.5 shrink-0"
            data-testid="button-preferred-filter"
          >
            <Star className={`h-4 w-4 ${preferredOnly ? "fill-current" : ""}`} />
            Preferred
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : vendors.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-3xl p-10">
            <div className="text-center mb-8">
              <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">Build your vendor network</h3>
              <p className="text-muted-foreground max-w-sm mx-auto text-sm">
                Add contractors you already trust. VendorTrust tracks their reliability, job history, and ratings — automatically building their trust score over time.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto mb-6">
              {[
                { icon: "🔧", label: "Plumber", sub: "Water & pipe issues" },
                { icon: "⚡", label: "Electrician", sub: "Wiring & panels" },
                { icon: "❄️", label: "HVAC Tech", sub: "Heating & cooling" },
              ].map(v => (
                <div key={v.label} className="bg-muted/50 border border-border rounded-xl p-3 text-center">
                  <div className="text-2xl mb-1">{v.icon}</div>
                  <div className="text-sm font-semibold text-foreground">{v.label}</div>
                  <div className="text-xs text-muted-foreground">{v.sub}</div>
                </div>
              ))}
            </div>
            <div className="text-center">
              <Button onClick={() => setShowAddModal(true)} className="gap-2 rounded-xl" data-testid="button-add-first-vendor">
                <Plus className="h-4 w-4" /> Add Your First Vendor
              </Button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
            <div className="h-12 w-12 bg-muted rounded-xl flex items-center justify-center mx-auto mb-4">
              <X className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-bold mb-1">No vendors match your filters</h3>
            <p className="text-sm text-muted-foreground mb-3">Try adjusting your search or trade filter.</p>
            <button onClick={() => setShowAddModal(true)} className="text-sm text-primary hover:underline font-medium">
              + Add a new vendor
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map(v => (
              <VendorCard
                key={v.id}
                vendor={v}
                onEdit={() => setEditVendor(v)}
                onArchive={() => handleArchive(v.id, v.name)}
                onDelete={() => setDeleteConfirm(v.id)}
                onViewDetail={() => setDetailVendor(v)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Vendor Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-display font-bold">Add Vendor</h2>
            <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg hover:bg-muted"><X className="h-5 w-5" /></button>
          </div>
          <VendorForm
            onSubmit={handleCreate}
            onClose={() => setShowAddModal(false)}
            isPending={createVendor.isPending}
          />
        </div>
      </Dialog>

      {/* Edit Vendor Modal */}
      <Dialog open={!!editVendor} onOpenChange={() => setEditVendor(null)}>
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-display font-bold">Edit Vendor</h2>
            <button onClick={() => setEditVendor(null)} className="p-1 rounded-lg hover:bg-muted"><X className="h-5 w-5" /></button>
          </div>
          {editVendor && (
            <VendorForm
              initial={editVendor}
              onSubmit={handleEdit}
              onClose={() => setEditVendor(null)}
              isPending={updateVendor.isPending}
            />
          )}
        </div>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={!!detailVendor} onOpenChange={() => setDetailVendor(null)}>
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-bold">Vendor Details</h2>
            <button onClick={() => setDetailVendor(null)} className="p-1 rounded-lg hover:bg-muted"><X className="h-5 w-5" /></button>
          </div>
          {detailVendor && <VendorDetail vendor={detailVendor} onClose={() => setDetailVendor(null)} />}
        </div>
      </Dialog>

      {/* Delete Confirm Modal */}
      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <div className="text-center space-y-4">
          <div className="h-14 w-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
            <Trash2 className="h-7 w-7 text-red-400" />
          </div>
          <h2 className="text-lg font-bold">Delete Vendor?</h2>
          <p className="text-sm text-muted-foreground">This will permanently delete this vendor and all their assignment history. This cannot be undone.</p>
          <div className="flex gap-2">
            <Button variant="destructive" className="flex-1" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} isLoading={deleteVendor.isPending} data-testid="button-confirm-delete-vendor">
              Delete
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>
    </AppLayout>
  );
}
