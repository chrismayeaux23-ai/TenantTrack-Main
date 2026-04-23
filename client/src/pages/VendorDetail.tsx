import { useState } from "react";
import { useParams, Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/NativeSelect";
import { Dialog } from "@/components/ui/SimpleDialog";
import { useVendors, useUpdateVendor, useVendorStats, useVendorReviews } from "@/hooks/use-vendors";
import { TRADE_CATEGORIES } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import {
  ChevronLeft, ShieldCheck, Phone, Mail, MapPin, FileText, Star,
  Briefcase, CheckCircle2, AlertTriangle, Clock, Zap, Calendar,
  DollarSign, Edit2, Loader2, X, Award, BarChart2, ThumbsUp
} from "lucide-react";
import { format } from "date-fns";

const JOB_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  "needs-dispatch": { label: "Needs Dispatch", color: "text-red-400 bg-red-400/10 border-red-400/20" },
  "assigned":       { label: "Assigned",        color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  "contacted":      { label: "Contacted",        color: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20" },
  "scheduled":      { label: "Scheduled",        color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  "in-progress":    { label: "In Progress",      color: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
  "waiting-on-parts": { label: "Waiting on Parts", color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  "completed":      { label: "Completed",        color: "text-green-400 bg-green-400/10 border-green-400/20" },
  "cancelled":      { label: "Cancelled",        color: "text-muted-foreground bg-muted border-border" },
};

function TrustMeter({ score }: { score: number }) {
  const tier = score >= 80 ? { label: "Excellent", color: "text-green-400", bar: "bg-green-400", bg: "bg-green-400/10", border: "border-green-400/20" }
    : score >= 60 ? { label: "Good", color: "text-yellow-400", bar: "bg-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20" }
    : { label: "At Risk", color: "text-red-400", bar: "bg-red-400", bg: "bg-red-400/10", border: "border-red-400/20" };

  return (
    <div className={`rounded-2xl border p-4 ${tier.bg} ${tier.border}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className={`h-4 w-4 ${tier.color}`} />
          <span className="text-sm font-semibold text-foreground">Trust Score</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-3xl font-display font-extrabold ${tier.color}`}>{score}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${tier.bg} ${tier.color} border ${tier.border}`}>{tier.label}</span>
        </div>
      </div>
      <div className="h-2.5 bg-black/20 rounded-full overflow-hidden">
        <div className={`h-2.5 rounded-full ${tier.bar} transition-all duration-700`} style={{ width: `${score}%` }} />
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground/50">
        <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
      </div>
    </div>
  );
}

function StarDisplay({ rating }: { rating: number | null }) {
  if (rating === null) return <span className="text-xs text-muted-foreground">No rating</span>;
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`h-3.5 w-3.5 ${i <= Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`} />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

function StarPicker({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="flex gap-1">
        {[1,2,3,4,5].map(n => (
          <button key={n} type="button" onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)} onClick={() => onChange(n)}>
            <Star className={`h-6 w-6 transition-colors ${n <= (hovered || value) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function VendorDetail() {
  const { id } = useParams<{ id: string }>();
  const vendorId = Number(id);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateVendor = useUpdateVendor();

  const { data: vendors = [] } = useVendors();
  const vendor = vendors.find((v: any) => v.id === vendorId);

  const { data: stats, isLoading: statsLoading } = useVendorStats(vendorId);
  const { data: reviews = [] } = useVendorReviews(vendorId);

  const { data: jobs = [], isLoading: jobsLoading } = useQuery<any[]>({
    queryKey: ["/api/vendors", vendorId, "jobs"],
    queryFn: async () => {
      const res = await fetch(`/api/vendors/${vendorId}/jobs`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!vendorId,
  });

  // Edit form state
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);

  const openEdit = () => {
    if (!vendor) return;
    setEditForm({
      name: vendor.name || "",
      companyName: vendor.companyName || "",
      tradeCategory: vendor.tradeCategory || "",
      phone: vendor.phone || "",
      email: vendor.email || "",
      city: vendor.city || "",
      serviceArea: vendor.serviceArea || "",
      notes: vendor.notes || "",
      licenseInfo: vendor.licenseInfo || "",
      insuranceInfo: vendor.insuranceInfo || "",
      preferredVendor: vendor.preferredVendor || false,
      emergencyAvailable: vendor.emergencyAvailable || false,
      status: vendor.status || "active",
    });
    setShowEdit(true);
  };

  const saveEdit = async () => {
    if (!editForm) return;
    try {
      await updateVendor.mutateAsync({ id: vendorId, ...editForm });
      setShowEdit(false);
      toast({ title: "Vendor updated" });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    }
  };

  // Review form state
  const [showReview, setShowReview] = useState<number | null>(null);
  const [reviewForm, setReviewForm] = useState({ quality: 0, speed: 0, communication: 0, price: 0, overall: 0, notes: "" });

  const submitReview = useMutation({
    mutationFn: async (requestId: number) => {
      return apiRequest("POST", `/api/requests/${requestId}/vendor-review`, {
        qualityRating: reviewForm.quality || undefined,
        speedRating: reviewForm.speed || undefined,
        communicationRating: reviewForm.communication || undefined,
        priceRating: reviewForm.price || undefined,
        overallRating: reviewForm.overall,
        reviewNotes: reviewForm.notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId, "stats"] });
      setShowReview(null);
      setReviewForm({ quality: 0, speed: 0, communication: 0, price: 0, overall: 0, notes: "" });
      toast({ title: "Review submitted" });
    },
    onError: () => toast({ title: "Failed to submit review", variant: "destructive" }),
  });

  if (!vendor) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const trustScore = stats?.trustScore ?? 50;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Back nav */}
        <Link href="/vendors">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-back-vendors">
            <ChevronLeft className="h-4 w-4" />
            Vendor Network
          </button>
        </Link>

        {/* Profile Header */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-start gap-5 flex-wrap">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-display font-extrabold text-2xl shrink-0">
              {vendor.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-display font-bold text-foreground">{vendor.name}</h1>
                {vendor.preferredVendor && (
                  <Badge variant="warning" className="text-xs flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" /> Preferred Vendor
                  </Badge>
                )}
                {vendor.emergencyAvailable && (
                  <Badge variant="destructive" className="text-xs flex items-center gap-1">
                    <Zap className="h-3 w-3" /> Emergency Available
                  </Badge>
                )}
                {vendor.status === "archived" && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">Archived</Badge>
                )}
              </div>
              {vendor.companyName && <p className="text-muted-foreground mt-0.5">{vendor.companyName}</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="text-xs">{vendor.tradeCategory}</Badge>
                {vendor.phone && (
                  <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{vendor.phone}</span>
                )}
                {vendor.email && (
                  <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{vendor.email}</span>
                )}
                {vendor.city && (
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{vendor.city}</span>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={openEdit} data-testid="button-edit-vendor" className="shrink-0">
              <Edit2 className="h-4 w-4 mr-1.5" />Edit
            </Button>
          </div>

          {/* Trust Score Meter */}
          <div className="mt-5 pt-5 border-t border-border">
            <TrustMeter score={trustScore} />
          </div>

          {/* License / Insurance / Notes */}
          {(vendor.licenseInfo || vendor.insuranceInfo || vendor.serviceArea) && (
            <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              {vendor.licenseInfo && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><FileText className="h-3 w-3" />License</p>
                  <p className="text-foreground">{vendor.licenseInfo}</p>
                </div>
              )}
              {vendor.insuranceInfo && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><ShieldCheck className="h-3 w-3" />Insurance</p>
                  <p className="text-foreground">{vendor.insuranceInfo}</p>
                </div>
              )}
              {vendor.serviceArea && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1"><MapPin className="h-3 w-3" />Service Area</p>
                  <p className="text-foreground">{vendor.serviceArea}</p>
                </div>
              )}
            </div>
          )}
          {vendor.notes && (
            <div className="mt-3 bg-muted/40 rounded-xl px-4 py-3 text-sm text-muted-foreground italic">
              "{vendor.notes}"
            </div>
          )}
        </div>

        {/* Performance Stats */}
        {statsLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
            <Loader2 className="h-4 w-4 animate-spin" />Loading stats…
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Jobs", value: stats.totalJobs, icon: Briefcase },
              { label: "Completed", value: stats.completedJobs, icon: CheckCircle2 },
              { label: "Avg Rating", value: stats.avgOverallRating !== null ? `${stats.avgOverallRating.toFixed(1)}/5` : "—", icon: Star },
              { label: "Total Spent", value: stats.totalSpent > 0 ? `$${(stats.totalSpent / 100).toLocaleString()}` : "—", icon: DollarSign },
            ].map(s => (
              <div key={s.label} className="bg-card border border-border rounded-2xl p-4 text-center">
                <s.icon className="h-5 w-5 text-primary mx-auto mb-1.5" />
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Job History Timeline */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-foreground">Job History</h2>
            <span className="ml-auto text-xs text-muted-foreground">{jobs.length} total</span>
          </div>

          {jobsLoading ? (
            <div className="px-6 py-10 flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />Loading jobs…
            </div>
          ) : jobs.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <Briefcase className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No jobs assigned to this vendor yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Jobs will appear here once assigned from the dashboard.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {jobs.map((job: any) => {
                const statusCfg = JOB_STATUS_CONFIG[job.jobStatus || "assigned"] || JOB_STATUS_CONFIG["assigned"];
                const hasReview = !!job.review;
                return (
                  <div key={job.id} className="px-6 py-4" data-testid={`row-job-${job.id}`}>
                    <div className="flex items-start gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-foreground">
                            {job.request?.issueType || "Maintenance"} — Unit {job.request?.unitNumber || "?"}
                          </p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[10px] font-medium ${statusCfg.color}`}>
                            {statusCfg.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 truncate">{job.property?.name || ""}</p>
                        {job.request?.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{job.request.description}</p>
                        )}
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                          {job.assignedAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />Assigned {format(new Date(job.assignedAt), 'MMM d, yyyy')}
                            </span>
                          )}
                          {job.completedAt && (
                            <span className="flex items-center gap-1 text-green-400">
                              <CheckCircle2 className="h-3 w-3" />Done {format(new Date(job.completedAt), 'MMM d, yyyy')}
                            </span>
                          )}
                          {job.finalCost && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />${(job.finalCost / 100).toLocaleString()}
                            </span>
                          )}
                          {job.invoiceNumber && (
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />Inv #{job.invoiceNumber}
                            </span>
                          )}
                        </div>
                        {job.completionNotes && (
                          <p className="text-xs text-muted-foreground mt-1.5 bg-muted/40 rounded-lg px-3 py-1.5 italic">"{job.completionNotes}"</p>
                        )}
                        {/* Review display */}
                        {hasReview && (
                          <div className="mt-2 flex items-center gap-3 flex-wrap">
                            <span className="text-xs text-muted-foreground">Your review:</span>
                            <StarDisplay rating={job.review.overallRating} />
                            {job.review.reviewNotes && (
                              <span className="text-xs text-muted-foreground italic">"{job.review.reviewNotes}"</span>
                            )}
                          </div>
                        )}
                      </div>
                      {/* Review CTA */}
                      {job.jobStatus === "completed" && !hasReview && (
                        <Button size="sm" variant="outline" className="h-8 text-xs shrink-0"
                          onClick={() => { setShowReview(job.requestId); setReviewForm({ quality: 0, speed: 0, communication: 0, price: 0, overall: 0, notes: "" }); }}
                          data-testid={`button-review-job-${job.id}`}>
                          <ThumbsUp className="h-3.5 w-3.5 mr-1" />Rate Job
                        </Button>
                      )}
                      <Link href={`/requests/${job.requestId}`}>
                        <Button size="sm" variant="ghost" className="h-8 text-xs shrink-0 text-muted-foreground">
                          View Request
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-foreground">Performance Reviews</h2>
            </div>
            <div className="divide-y divide-border">
              {reviews.map((r: any) => (
                <div key={r.id} className="px-6 py-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <StarDisplay rating={r.overallRating} />
                        <span className="text-xs text-muted-foreground">{format(new Date(r.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        {r.qualityRating && <span>Quality: {r.qualityRating}/5</span>}
                        {r.speedRating && <span>Speed: {r.speedRating}/5</span>}
                        {r.communicationRating && <span>Communication: {r.communicationRating}/5</span>}
                        {r.priceRating && <span>Price: {r.priceRating}/5</span>}
                      </div>
                      {r.reviewNotes && <p className="text-sm text-muted-foreground mt-1.5 italic">"{r.reviewNotes}"</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Vendor Dialog */}
      {showEdit && editForm && (
        <Dialog open={showEdit} onOpenChange={setShowEdit}>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold">Edit Vendor</h3>
                <button onClick={() => setShowEdit(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Name *</label>
                    <Input value={editForm.name} onChange={e => setEditForm((f: any) => ({ ...f, name: e.target.value }))} className="h-10" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Company</label>
                    <Input value={editForm.companyName} onChange={e => setEditForm((f: any) => ({ ...f, companyName: e.target.value }))} className="h-10" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Trade Category *</label>
                  <Select value={editForm.tradeCategory} onChange={e => setEditForm((f: any) => ({ ...f, tradeCategory: e.target.value }))}
                    options={TRADE_CATEGORIES.map(c => ({ label: c, value: c }))} className="h-10" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Phone</label>
                    <Input value={editForm.phone} onChange={e => setEditForm((f: any) => ({ ...f, phone: e.target.value }))} className="h-10" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Email</label>
                    <Input value={editForm.email} onChange={e => setEditForm((f: any) => ({ ...f, email: e.target.value }))} className="h-10" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">City</label>
                    <Input value={editForm.city} onChange={e => setEditForm((f: any) => ({ ...f, city: e.target.value }))} className="h-10" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Service Area</label>
                    <Input value={editForm.serviceArea} onChange={e => setEditForm((f: any) => ({ ...f, serviceArea: e.target.value }))} className="h-10" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">License Info</label>
                  <Input value={editForm.licenseInfo} onChange={e => setEditForm((f: any) => ({ ...f, licenseInfo: e.target.value }))} className="h-10" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Insurance Info</label>
                  <Input value={editForm.insuranceInfo} onChange={e => setEditForm((f: any) => ({ ...f, insuranceInfo: e.target.value }))} className="h-10" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                  <textarea
                    className="w-full h-20 bg-background border border-border rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                    value={editForm.notes}
                    onChange={e => setEditForm((f: any) => ({ ...f, notes: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={editForm.preferredVendor}
                      onChange={e => setEditForm((f: any) => ({ ...f, preferredVendor: e.target.checked }))}
                      className="accent-primary w-4 h-4" />
                    Preferred Vendor
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={editForm.emergencyAvailable}
                      onChange={e => setEditForm((f: any) => ({ ...f, emergencyAvailable: e.target.checked }))}
                      className="accent-primary w-4 h-4" />
                    Emergency Available
                  </label>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <Button className="flex-1" onClick={saveEdit} disabled={updateVendor.isPending}>
                  {updateVendor.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </Dialog>
      )}

      {/* Rate Job Dialog */}
      {showReview !== null && (
        <Dialog open={showReview !== null} onOpenChange={() => setShowReview(null)}>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold">Rate This Job</h3>
                <button onClick={() => setShowReview(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <StarPicker value={reviewForm.quality} onChange={v => setReviewForm(f => ({ ...f, quality: v }))} label="Quality of Work" />
                  <StarPicker value={reviewForm.speed} onChange={v => setReviewForm(f => ({ ...f, speed: v }))} label="Speed / Timeliness" />
                  <StarPicker value={reviewForm.communication} onChange={v => setReviewForm(f => ({ ...f, communication: v }))} label="Communication" />
                  <StarPicker value={reviewForm.price} onChange={v => setReviewForm(f => ({ ...f, price: v }))} label="Price Fairness" />
                </div>
                <StarPicker value={reviewForm.overall} onChange={v => setReviewForm(f => ({ ...f, overall: v }))} label="Overall Rating *" />
                <textarea
                  className="w-full h-20 bg-background border border-border rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Private notes about this vendor's performance on this job..."
                  value={reviewForm.notes}
                  onChange={e => setReviewForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 mt-5">
                <Button className="flex-1" disabled={reviewForm.overall === 0 || submitReview.isPending}
                  onClick={() => showReview !== null && submitReview.mutate(showReview)}>
                  {submitReview.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Review"}
                </Button>
                <Button variant="outline" onClick={() => setShowReview(null)}>Cancel</Button>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </AppLayout>
  );
}
