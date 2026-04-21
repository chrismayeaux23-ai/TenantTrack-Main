import { useState, useCallback, useRef } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/use-subscription";
import {
  useVendors, useCreateVendor, useUpdateVendor,
  useArchiveVendor, useDeleteVendor, useVendorStats, useVendorReviews,
  useDiscoverVendors, useAddDiscoveredVendor, type DiscoveryResult,
} from "@/hooks/use-vendors";
import type { Vendor } from "@shared/schema";
import { TRADE_CATEGORIES } from "@shared/schema";
import {
  Briefcase, Plus, Search, Star, Phone, Mail, MapPin,
  Edit2, Trash2, Archive, CheckCircle2, Loader2, ChevronDown,
  ChevronUp, Shield, FileText, X, ShieldCheck, Zap, AlertTriangle, Clock,
  Upload, Download, AlertCircle, Check, Lock, ArrowLeft, Globe, Sparkles,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import * as XLSX from "xlsx";

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

// ── Vendor Import Dialog ──────────────────────────────────────────────────────
type ParsedRow = {
  name: string;
  companyName: string;
  tradeCategory: string;
  phone: string;
  email: string;
  city: string;
  serviceArea: string;
  notes: string;
  preferredVendor: boolean;
  emergencyAvailable: boolean;
  licenseInfo: string;
  insuranceInfo: string;
  status: "valid" | "invalid" | "duplicate";
  errors: string[];
  selected: boolean;
};

const TEMPLATE_HEADERS = [
  "Name", "Company Name", "Trade Category", "Phone", "Email", "City",
  "Service Area", "Notes", "Preferred (yes/no)", "Emergency Available (yes/no)",
  "License Info", "Insurance Info",
];

type StringField = "name" | "companyName" | "tradeCategory" | "phone" | "email" | "city" | "serviceArea" | "notes" | "licenseInfo" | "insuranceInfo";
type BoolField = "preferredVendor" | "emergencyAvailable";
type MappableField = StringField | BoolField;

const STRING_FIELDS: ReadonlySet<string> = new Set<string>(["name", "companyName", "tradeCategory", "phone", "email", "city", "serviceArea", "notes", "licenseInfo", "insuranceInfo"]);
const BOOL_FIELDS: ReadonlySet<string> = new Set<string>(["preferredVendor", "emergencyAvailable"]);

const HEADER_MAP: Record<string, MappableField> = {
  "name": "name",
  "contact name": "name",
  "company name": "companyName",
  "company": "companyName",
  "trade category": "tradeCategory",
  "trade": "tradeCategory",
  "category": "tradeCategory",
  "phone": "phone",
  "phone number": "phone",
  "email": "email",
  "email address": "email",
  "city": "city",
  "service area": "serviceArea",
  "notes": "notes",
  "preferred (yes/no)": "preferredVendor",
  "preferred": "preferredVendor",
  "emergency available (yes/no)": "emergencyAvailable",
  "emergency available": "emergencyAvailable",
  "emergency": "emergencyAvailable",
  "license info": "licenseInfo",
  "license": "licenseInfo",
  "insurance info": "insuranceInfo",
  "insurance": "insuranceInfo",
};

function parseBoolean(val: unknown): boolean {
  if (typeof val === "boolean") return val;
  const s = String(val).toLowerCase().trim();
  return s === "yes" || s === "true" || s === "1" || s === "y";
}

function VendorImportDialog({ open, onOpenChange, existingVendors }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingVendors: Vendor[];
}) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  function downloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, [
      "Carlos Ruiz", "Ruiz Plumbing LLC", "Plumbing", "503-555-0001",
      "carlos@example.com", "Portland", "Metro Portland",
      "Reliable, always on time", "yes", "no", "OR #PL-44821", "Fully insured",
    ]]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vendors");
    XLSX.writeFile(wb, "vendor-import-template.csv");
  }

  function parseFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });

        if (jsonRows.length === 0) {
          toast({ title: "Empty file", description: "No data rows found in the file.", variant: "destructive" });
          return;
        }

        const headers = Object.keys(jsonRows[0]);
        const colMap: Record<string, keyof ParsedRow> = {};
        for (const h of headers) {
          const normalized = h.toLowerCase().trim();
          if (HEADER_MAP[normalized]) colMap[h] = HEADER_MAP[normalized];
        }

        if (!Object.values(colMap).includes("name")) {
          toast({ title: "Missing column", description: "Could not find a 'Name' column. Please use the template.", variant: "destructive" });
          return;
        }

        const existingSet = new Set(
          existingVendors.map(v => `${v.name.toLowerCase()}|${v.tradeCategory.toLowerCase()}`)
        );
        const fileSet = new Set<string>();

        const parsed: ParsedRow[] = jsonRows.map(row => {
          const r: ParsedRow = {
            name: "", companyName: "", tradeCategory: "", phone: "", email: "",
            city: "", serviceArea: "", notes: "", preferredVendor: false,
            emergencyAvailable: false, licenseInfo: "", insuranceInfo: "",
            status: "valid", errors: [], selected: true,
          };

          for (const [col, field] of Object.entries(colMap)) {
            const val = row[col];
            if (BOOL_FIELDS.has(field)) {
              r[field as BoolField] = parseBoolean(val);
            } else if (STRING_FIELDS.has(field)) {
              r[field as StringField] = String(val || "").trim();
            }
          }

          if (!r.name) {
            r.status = "invalid";
            r.errors.push("Name is required");
          }
          if (!r.tradeCategory) {
            r.status = "invalid";
            r.errors.push("Trade Category is required");
          } else if (!(TRADE_CATEGORIES as readonly string[]).includes(r.tradeCategory)) {
            const match = TRADE_CATEGORIES.find(t => t.toLowerCase() === r.tradeCategory.toLowerCase());
            if (match) {
              r.tradeCategory = match;
            } else {
              r.status = "invalid";
              r.errors.push(`Invalid trade category "${r.tradeCategory}". Valid: ${TRADE_CATEGORIES.join(", ")}`);
            }
          }

          if (r.status === "valid") {
            const key = `${r.name.toLowerCase()}|${r.tradeCategory.toLowerCase()}`;
            if (existingSet.has(key)) {
              r.status = "duplicate";
              r.errors.push("Vendor with same name and trade already exists");
              r.selected = false;
            } else if (fileSet.has(key)) {
              r.status = "duplicate";
              r.errors.push("Duplicate row within this file");
              r.selected = false;
            }
            fileSet.add(key);
          }

          return r;
        });

        setRows(parsed);
        setStep("preview");
      } catch {
        toast({ title: "Parse error", description: "Could not read the file. Please check the format.", variant: "destructive" });
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv" && ext !== "xlsx" && ext !== "xls") {
      toast({ title: "Invalid file type", description: "Please upload a .csv or .xlsx file.", variant: "destructive" });
      return;
    }
    parseFile(file);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [existingVendors]);

  async function handleImport() {
    const toImport = rows.filter(r => r.selected && r.status !== "invalid");
    if (toImport.length === 0) return;

    setImporting(true);
    try {
      const vendorData = toImport.map(({ status, errors, selected, ...v }) => v);
      const res = await fetch("/api/vendors/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ vendors: vendorData }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Import failed");
      }
      const result = await res.json();
      const { queryClient } = await import("@/lib/queryClient");
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });

      const parts = [`${result.imported} vendor${result.imported !== 1 ? "s" : ""} imported`];
      if (result.failed > 0) parts.push(`${result.failed} skipped`);
      if (result.errors?.length > 0) {
        parts.push("\n" + result.errors.slice(0, 5).join("\n"));
        if (result.errors.length > 5) parts.push(`...and ${result.errors.length - 5} more`);
      }
      toast({
        title: result.failed > 0 ? "Import complete with issues" : "Import complete",
        description: parts.join(", "),
        variant: result.failed > 0 ? "destructive" : "default",
      });

      onOpenChange(false);
      setRows([]);
      setStep("upload");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Import failed";
      toast({ title: "Import failed", description: message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  }

  function toggleRow(idx: number) {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, selected: !r.selected } : r));
  }

  function toggleAll(selected: boolean) {
    setRows(prev => prev.map(r => r.status !== "invalid" ? { ...r, selected } : r));
  }

  const validCount = rows.filter(r => r.status === "valid" && r.selected).length;
  const dupCount = rows.filter(r => r.status === "duplicate" && r.selected).length;
  const invalidCount = rows.filter(r => r.status === "invalid").length;
  const selectedCount = rows.filter(r => r.selected && r.status !== "invalid").length;

  function reset() {
    setRows([]);
    setStep("upload");
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-display font-bold flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" /> Import Vendors
          </h2>
          <button onClick={() => { reset(); onOpenChange(false); }} className="p-1 rounded-lg hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === "upload" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload a CSV or Excel file to bulk-import your vendor network. Use our template to make sure your columns match.
            </p>

            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium"
              data-testid="button-download-template"
            >
              <Download className="h-4 w-4" /> Download CSV Template
            </button>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors
                ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
              data-testid="dropzone-vendor-import"
            >
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium text-foreground">Drop your file here or click to browse</p>
              <p className="text-sm text-muted-foreground mt-1">Supports .csv and .xlsx files</p>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
              data-testid="input-vendor-file"
            />

            <div className="bg-card border border-border rounded-xl p-4 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground text-sm mb-2">Column Guide</p>
              <p><span className="text-primary font-medium">Required:</span> Name, Trade Category</p>
              <p><span className="text-foreground font-medium">Optional:</span> Company Name, Phone, Email, City, Service Area, Notes, Preferred (yes/no), Emergency Available (yes/no), License Info, Insurance Info</p>
              <p className="mt-2">Valid trade categories: {TRADE_CATEGORIES.join(", ")}</p>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className="bg-green-500/10 text-green-400 border-green-400/20">{validCount} valid</Badge>
              {dupCount > 0 && <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-400/20">{dupCount + rows.filter(r => r.status === "duplicate" && !r.selected).length} duplicate{dupCount !== 1 ? "s" : ""}</Badge>}
              {invalidCount > 0 && <Badge className="bg-red-500/10 text-red-400 border-red-400/20">{invalidCount} invalid</Badge>}
              <span className="text-sm text-muted-foreground ml-auto">{selectedCount} selected for import</span>
            </div>

            <div className="max-h-72 overflow-y-auto border border-border rounded-xl">
              <table className="w-full text-sm" data-testid="table-vendor-preview">
                <thead className="sticky top-0 bg-card border-b border-border">
                  <tr>
                    <th className="p-2 text-left w-8">
                      <input
                        type="checkbox"
                        checked={rows.filter(r => r.status !== "invalid").every(r => r.selected)}
                        onChange={(e) => toggleAll(e.target.checked)}
                        className="accent-primary"
                        data-testid="checkbox-select-all"
                      />
                    </th>
                    <th className="p-2 text-left text-muted-foreground font-medium">Status</th>
                    <th className="p-2 text-left text-muted-foreground font-medium">Name</th>
                    <th className="p-2 text-left text-muted-foreground font-medium">Trade</th>
                    <th className="p-2 text-left text-muted-foreground font-medium hidden sm:table-cell">Company</th>
                    <th className="p-2 text-left text-muted-foreground font-medium hidden md:table-cell">Phone</th>
                    <th className="p-2 text-left text-muted-foreground font-medium hidden md:table-cell">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr
                      key={i}
                      className={`border-b border-border/50 ${r.status === "invalid" ? "opacity-50" : ""}`}
                      data-testid={`row-vendor-import-${i}`}
                    >
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={r.selected}
                          disabled={r.status === "invalid"}
                          onChange={() => toggleRow(i)}
                          className="accent-primary"
                        />
                      </td>
                      <td className="p-2">
                        {r.status === "valid" && <Check className="h-4 w-4 text-green-400" />}
                        {r.status === "invalid" && (
                          <div className="group relative">
                            <AlertCircle className="h-4 w-4 text-red-400" />
                            <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-50 bg-card border border-border rounded-lg p-2 text-xs text-red-400 whitespace-nowrap shadow-lg">
                              {r.errors.join("; ")}
                            </div>
                          </div>
                        )}
                        {r.status === "duplicate" && (
                          <div className="group relative">
                            <AlertTriangle className="h-4 w-4 text-yellow-400" />
                            <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-50 bg-card border border-border rounded-lg p-2 text-xs text-yellow-400 whitespace-nowrap shadow-lg">
                              {r.errors.join("; ")}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="p-2 font-medium text-foreground">{r.name || "—"}</td>
                      <td className="p-2 text-muted-foreground">{r.tradeCategory || "—"}</td>
                      <td className="p-2 text-muted-foreground hidden sm:table-cell">{r.companyName || "—"}</td>
                      <td className="p-2 text-muted-foreground hidden md:table-cell">{r.phone || "—"}</td>
                      <td className="p-2 text-muted-foreground hidden md:table-cell">{r.email || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2">
              <Button onClick={reset} variant="outline" className="gap-2" data-testid="button-import-back">
                <ArrowLeft className="h-4 w-4" /> Choose Different File
              </Button>
              <Button
                onClick={handleImport}
                disabled={selectedCount === 0 || importing}
                className="flex-1 gap-2"
                data-testid="button-confirm-import"
              >
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {importing ? "Importing..." : `Import ${selectedCount} Vendor${selectedCount !== 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}

// ── Find Vendors Dialog ────────────────────────────────────────────────────────
function FindVendorsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { toast } = useToast();
  const [tradeCategory, setTradeCategory] = useState("Plumbing");
  const [location, setLocation] = useState("");
  const [results, setResults] = useState<DiscoveryResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const discover = useDiscoverVendors();
  const addVendor = useAddDiscoveredVendor();

  function reset() {
    setResults([]);
    setSearched(false);
    setLocation("");
    setTradeCategory("Plumbing");
  }

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!location.trim()) {
      toast({ title: "Location required", description: "Enter a city or ZIP code to search.", variant: "destructive" });
      return;
    }
    try {
      const found = await discover.mutateAsync({ tradeCategory, location: location.trim() });
      setResults(found);
      setSearched(true);
    } catch (err: any) {
      toast({ title: "Search failed", description: err.message, variant: "destructive" });
    }
  }

  async function handleAdd(r: DiscoveryResult) {
    setAddingId(r.externalSourceId);
    try {
      await addVendor.mutateAsync({
        externalSourceId: r.externalSourceId,
        name: r.name,
        companyName: r.companyName,
        tradeCategory: r.tradeCategory,
        phone: r.phone,
        city: r.city,
        serviceArea: r.serviceArea,
        externalRating: r.externalRating,
        externalReviewCount: r.externalReviewCount,
        externalSourceUrl: r.externalSourceUrl,
        seedTrustScore: r.seedTrustScore,
        address: r.address,
      });
      setResults(prev => prev.map(x => x.externalSourceId === r.externalSourceId ? { ...x, alreadyInNetwork: true } : x));
      toast({ title: "Added to network", description: `${r.name} is now in your vendor network.` });
    } catch (err: any) {
      toast({ title: "Could not add", description: err.message, variant: "destructive" });
    } finally {
      setAddingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-display font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Find Vendors
          </h2>
          <button onClick={() => { reset(); onOpenChange(false); }} className="p-1 rounded-lg hover:bg-muted" data-testid="button-close-find-vendors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Search public business directories for licensed contractors near your properties. Trust scores are pre-seeded from real public reviews.
        </p>

        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-[180px_1fr_auto] gap-2 mb-5">
          <Select
            value={tradeCategory}
            onChange={(e) => setTradeCategory(e.target.value)}
            options={TRADE_CATEGORIES.map(t => ({ label: t, value: t }))}
            data-testid="select-discover-trade"
          />
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City or ZIP (e.g. Portland, OR or 97214)"
            data-testid="input-discover-location"
          />
          <Button type="submit" disabled={discover.isPending} className="gap-2" data-testid="button-discover-search">
            {discover.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {discover.isPending ? "Searching..." : "Search"}
          </Button>
        </form>

        {!searched && !discover.isPending && (
          <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center">
            <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Globe className="h-7 w-7 text-primary" />
            </div>
            <p className="font-medium text-foreground mb-1">Pick a trade and a location</p>
            <p className="text-sm text-muted-foreground">We'll show top-rated local contractors with trust scores already calculated.</p>
          </div>
        )}

        {searched && results.length === 0 && !discover.isPending && (
          <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="font-medium text-foreground mb-1">No results found</p>
            <p className="text-sm text-muted-foreground">Try a broader location or a different trade.</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1" data-testid="list-discovery-results">
            {results.map((r) => (
              <div
                key={r.externalSourceId}
                className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row gap-3 sm:items-center"
                data-testid={`card-discovery-${r.externalSourceId}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1 flex-wrap">
                    <p className="font-semibold text-foreground truncate">{r.name}</p>
                    <TrustScore score={r.seedTrustScore} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5 flex-wrap">
                    {r.externalRating !== null && r.externalReviewCount !== null && r.externalReviewCount > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                        <span className="text-foreground font-medium">{(r.externalRating / 10).toFixed(1)}</span>
                        <span>· {r.externalReviewCount} review{r.externalReviewCount !== 1 ? "s" : ""}</span>
                      </span>
                    ) : (
                      <span>No public reviews yet</span>
                    )}
                    {r.externalSourceUrl && (
                      <a
                        href={r.externalSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                        data-testid={`link-discovery-source-${r.externalSourceId}`}
                      >
                        <ExternalLink className="h-3 w-3" /> View on Google
                      </a>
                    )}
                  </div>
                  {r.address && (
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0" /> {r.address}
                    </p>
                  )}
                  {r.phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3 shrink-0" /> {r.phone}
                    </p>
                  )}
                </div>
                <div className="shrink-0">
                  {r.alreadyInNetwork ? (
                    <Badge className="bg-green-500/10 text-green-400 border-green-400/20 gap-1">
                      <Check className="h-3 w-3" /> In your network
                    </Badge>
                  ) : (
                    <Button
                      onClick={() => handleAdd(r)}
                      disabled={addingId === r.externalSourceId}
                      className="gap-2"
                      data-testid={`button-add-discovered-${r.externalSourceId}`}
                    >
                      {addingId === r.externalSourceId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Add to network
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Dialog>
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
  const { can } = useSubscription();

  const [search, setSearch] = useState("");
  const [tradeFilter, setTradeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [preferredOnly, setPreferredOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showFindModal, setShowFindModal] = useState(false);
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
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            {can("vendorImport") ? (
              <Button variant="outline" onClick={() => setShowFindModal(true)} className="gap-2" data-testid="button-find-vendors">
                <Sparkles className="h-4 w-4" /> Find Vendors
              </Button>
            ) : (
              <Button variant="outline" onClick={() => toast({ title: "Upgrade Required", description: "Vendor discovery is available on Growth and Pro plans." })} className="gap-2 opacity-70" data-testid="button-find-vendors-locked">
                <Lock className="h-4 w-4" /> Find Vendors
              </Button>
            )}
            {can("vendorImport") ? (
              <Button variant="outline" onClick={() => setShowImportModal(true)} className="gap-2" data-testid="button-import-vendors">
                <Upload className="h-4 w-4" /> Import Vendors
              </Button>
            ) : (
              <Button variant="outline" onClick={() => toast({ title: "Upgrade Required", description: "Vendor import is available on Growth and Pro plans." })} className="gap-2 opacity-70" data-testid="button-import-vendors-locked">
                <Lock className="h-4 w-4" /> Import Vendors
              </Button>
            )}
            <Button onClick={() => setShowAddModal(true)} className="gap-2" data-testid="button-add-vendor">
              <Plus className="h-4 w-4" /> Add Vendor
            </Button>
          </div>
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
                Add contractors you already trust. TenantTrack tracks their reliability, job history, and ratings — automatically building their trust score over time.
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

      {/* Import Vendors Modal */}
      <VendorImportDialog
        open={showImportModal}
        onOpenChange={setShowImportModal}
        existingVendors={vendors}
      />

      {/* Find Vendors Modal */}
      <FindVendorsDialog open={showFindModal} onOpenChange={setShowFindModal} />
    </AppLayout>
  );
}
