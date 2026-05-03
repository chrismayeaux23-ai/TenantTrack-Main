import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type MaintenanceRequestInput, type UpdateRequestStatusInput } from "@shared/routes";
import { trackEvent } from "@/lib/analytics";

export function useRequests() {
  return useQuery({
    queryKey: [api.requests.list.path],
    queryFn: async () => {
      const res = await fetch(api.requests.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch requests");
      return api.requests.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: MaintenanceRequestInput) => {
      const res = await fetch(api.requests.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include", // Even for public forms, include in case they are authenticated
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create request");
      }
      return api.requests.create.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      trackEvent("request_created", {
        urgency: data.urgency,
        issue_type: data.issueType,
        source: typeof window !== "undefined" && window.location.pathname.startsWith("/report/") ? "tenant_qr" : "landlord",
      });
      queryClient.invalidateQueries({ queryKey: [api.requests.list.path] });
    },
  });
}

export function useUpdateRequestStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateRequestStatusInput }) => {
      const url = api.requests.updateStatus.path.replace(":id", id.toString());
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update status");
      return api.requests.updateStatus.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.requests.list.path] }),
  });
}
