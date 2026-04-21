import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Vendor, VendorAssignment, VendorReview } from "@shared/schema";

const VENDORS_KEY = "/api/vendors";

export function useVendors() {
  return useQuery<Vendor[]>({
    queryKey: [VENDORS_KEY],
    queryFn: async () => {
      const res = await fetch(VENDORS_KEY, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch vendors");
      return res.json();
    },
  });
}

export function useTopVendors() {
  return useQuery<Array<Vendor & { totalJobs: number; avgRating: number | null }>>({
    queryKey: ["/api/vendors/top"],
    queryFn: async () => {
      const res = await fetch("/api/vendors/top", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch top vendors");
      return res.json();
    },
  });
}

export function useVendorStats(vendorId: number) {
  return useQuery<{ totalJobs: number; avgOverallRating: number | null; lastAssignedAt: string | null }>({
    queryKey: ["/api/vendors", vendorId, "stats"],
    queryFn: async () => {
      const res = await fetch(`/api/vendors/${vendorId}/stats`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch vendor stats");
      return res.json();
    },
    enabled: !!vendorId,
  });
}

export function useVendorReviews(vendorId: number) {
  return useQuery<VendorReview[]>({
    queryKey: ["/api/vendors", vendorId, "reviews"],
    queryFn: async () => {
      const res = await fetch(`/api/vendors/${vendorId}/reviews`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return res.json();
    },
    enabled: !!vendorId,
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Vendor>) => {
      const res = await fetch(VENDORS_KEY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create vendor");
      }
      return res.json() as Promise<Vendor>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [VENDORS_KEY] }),
  });
}

export function useUpdateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Vendor> }) => {
      const res = await fetch(`/api/vendors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update vendor");
      }
      return res.json() as Promise<Vendor>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [VENDORS_KEY] }),
  });
}

export function useArchiveVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/vendors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "archived" }),
      });
      if (!res.ok) throw new Error("Failed to archive vendor");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [VENDORS_KEY] }),
  });
}

export function useDeleteVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/vendors/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete vendor");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [VENDORS_KEY] }),
  });
}

export function useVendorAssignment(requestId: number) {
  return useQuery<{ assignment: VendorAssignment; vendor: Vendor } | null>({
    queryKey: ["/api/requests", requestId, "vendor-assignment"],
    queryFn: async () => {
      const res = await fetch(`/api/requests/${requestId}/vendor-assignment`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch assignment");
      return res.json();
    },
    enabled: !!requestId,
  });
}

export function useAssignVendor(requestId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { vendorId: number; priority?: string; assignmentNotes?: string; targetCompletionDate?: string | null }) => {
      const res = await fetch(`/api/requests/${requestId}/vendor-assignment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to assign vendor");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests", requestId, "vendor-assignment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/requests", requestId, "activity"] });
    },
  });
}

export function useClearVendorAssignment(requestId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/requests/${requestId}/vendor-assignment`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to clear assignment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests", requestId, "vendor-assignment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/requests", requestId, "activity"] });
    },
  });
}

export function useMarkVendorContacted(requestId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contacted: boolean) => {
      const res = await fetch(`/api/requests/${requestId}/vendor-contacted`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ contacted }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests", requestId, "vendor-assignment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/requests", requestId, "activity"] });
    },
  });
}

export function useVendorReviewForRequest(requestId: number) {
  return useQuery<VendorReview | null>({
    queryKey: ["/api/requests", requestId, "vendor-review"],
    queryFn: async () => {
      const res = await fetch(`/api/requests/${requestId}/vendor-review`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch review");
      return res.json();
    },
    enabled: !!requestId,
  });
}

export function useSubmitVendorReview(requestId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { overallRating: number; qualityRating?: number; speedRating?: number; communicationRating?: number; priceRating?: number; reviewNotes?: string }) => {
      const res = await fetch(`/api/requests/${requestId}/vendor-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to submit review");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests", requestId, "vendor-review"] });
      queryClient.invalidateQueries({ queryKey: [VENDORS_KEY] });
    },
  });
}

export interface DiscoveryResult {
  externalSourceId: string;
  name: string;
  companyName: string | null;
  tradeCategory: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  serviceArea: string | null;
  externalRating: number | null;
  externalReviewCount: number | null;
  externalSourceUrl: string | null;
  seedTrustScore: number;
  address: string | null;
  website: string | null;
  alreadyInNetwork: boolean;
}

export function useDiscoverVendors() {
  return useMutation({
    mutationFn: async (data: { tradeCategory: string; location: string }) => {
      const res = await fetch("/api/vendors/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to search for vendors");
      }
      const json = await res.json() as { results: DiscoveryResult[] };
      return json.results;
    },
  });
}

export function useAddDiscoveredVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<DiscoveryResult, "alreadyInNetwork" | "email" | "website">) => {
      const res = await fetch("/api/vendors/discover/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to add vendor");
      }
      return res.json() as Promise<Vendor>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [VENDORS_KEY] }),
  });
}

export function useVendorActivity(requestId: number) {
  return useQuery<Array<{ id: number; eventType: string; eventLabel: string; details: string | null; createdAt: string }>>({
    queryKey: ["/api/requests", requestId, "activity"],
    queryFn: async () => {
      const res = await fetch(`/api/requests/${requestId}/activity`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch activity");
      return res.json();
    },
    enabled: !!requestId,
  });
}
