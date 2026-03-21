import { randomBytes } from "crypto";
import { storage, computeTrustScore } from "./storage";
import type { Vendor, MaintenanceRequest, VendorAssignment } from "@shared/schema";

export interface DispatchScoreBreakdown {
  vendorId: number;
  vendorName: string;
  totalScore: number;
  tradeMatch: number;
  urgencyBonus: number;
  serviceAreaMatch: number;
  emergencyBonus: number;
  trustScoreComponent: number;
  noShowPenalty: number;
  workloadPenalty: number;
  preferredBonus: number;
  reason: string;
}

const SLA_THRESHOLDS: Record<string, number> = {
  "Emergency": 30 * 60 * 1000,
  "High": 4 * 60 * 60 * 1000,
  "Medium": 24 * 60 * 60 * 1000,
  "Low": 72 * 60 * 60 * 1000,
};

export function getSlaThreshold(urgency: string): number {
  return SLA_THRESHOLDS[urgency] || SLA_THRESHOLDS["Medium"];
}

export function generateMagicToken(): string {
  return randomBytes(16).toString("hex");
}

export async function scoreVendorsForRequest(
  request: MaintenanceRequest,
  landlordId: string
): Promise<DispatchScoreBreakdown[]> {
  const allVendors = await storage.getVendorsByLandlord(landlordId);
  const activeVendors = allVendors.filter(v => v.status === "active");

  const property = await storage.getProperty(request.propertyId);
  const propertyCity = property?.address?.split(",").map(s => s.trim()).find(s => s.length > 1) || "";

  const scored: DispatchScoreBreakdown[] = [];

  for (const vendor of activeVendors) {
    let totalScore = 0;
    const reasons: string[] = [];

    const tradeMatch = (vendor.tradeCategory === request.issueType || vendor.tradeCategory === "General Handyman") ? 25 : 0;
    totalScore += tradeMatch;
    if (tradeMatch > 0) reasons.push(`Trade match: ${vendor.tradeCategory}`);

    let urgencyBonus = 0;
    if (request.urgency === "Emergency" && vendor.emergencyAvailable) {
      urgencyBonus = 15;
      reasons.push("Emergency-available vendor");
    } else if (request.urgency === "High") {
      urgencyBonus = 5;
    }
    totalScore += urgencyBonus;

    let serviceAreaMatch = 0;
    if (vendor.city && propertyCity && vendor.city.toLowerCase().includes(propertyCity.toLowerCase())) {
      serviceAreaMatch = 10;
      reasons.push("Same city");
    } else if (vendor.serviceArea && propertyCity && vendor.serviceArea.toLowerCase().includes(propertyCity.toLowerCase())) {
      serviceAreaMatch = 7;
      reasons.push("Within service area");
    }
    totalScore += serviceAreaMatch;

    const emergencyBonus = (request.urgency === "Emergency" && vendor.emergencyAvailable) ? 10 : 0;
    totalScore += emergencyBonus;

    const stats = await storage.getVendorStats(vendor.id, landlordId);
    const trustScoreComponent = Math.round(stats.trustScore * 0.25);
    totalScore += trustScoreComponent;
    reasons.push(`Trust score: ${stats.trustScore}`);

    const noShowPenalty = Math.min((vendor.noShowCount || 0) * 8, 20);
    totalScore -= noShowPenalty;
    if (noShowPenalty > 0) reasons.push(`No-show penalty: -${noShowPenalty}`);

    const activeJobs = await storage.getActiveAssignmentsByVendor(vendor.id);
    const workloadPenalty = Math.min(activeJobs.length * 5, 20);
    totalScore -= workloadPenalty;
    if (workloadPenalty > 0) reasons.push(`Active workload (${activeJobs.length} jobs): -${workloadPenalty}`);

    const preferredBonus = vendor.preferredVendor ? 10 : 0;
    totalScore += preferredBonus;
    if (preferredBonus > 0) reasons.push("Preferred vendor");

    totalScore = Math.max(0, Math.min(100, totalScore));

    scored.push({
      vendorId: vendor.id,
      vendorName: vendor.name,
      totalScore,
      tradeMatch,
      urgencyBonus,
      serviceAreaMatch,
      emergencyBonus,
      trustScoreComponent,
      noShowPenalty,
      workloadPenalty,
      preferredBonus,
      reason: reasons.join("; "),
    });
  }

  return scored.sort((a, b) => b.totalScore - a.totalScore);
}

export async function autoDispatchRequest(
  requestId: number,
  landlordId: string,
  mode: "recommend" | "auto-assign"
): Promise<{ recommendation: DispatchScoreBreakdown[]; assigned?: VendorAssignment }> {
  const request = await storage.getRequest(requestId);
  if (!request) throw new Error("Request not found");

  const scores = await scoreVendorsForRequest(request, landlordId);
  if (scores.length === 0) {
    return { recommendation: [] };
  }

  if (mode === "recommend") {
    return { recommendation: scores };
  }

  const best = scores[0];
  const magicToken = generateMagicToken();
  const responseDeadline = new Date(Date.now() + getSlaThreshold(request.urgency));

  const assignment = await storage.assignVendorToRequest({
    requestId,
    vendorId: best.vendorId,
    landlordId,
    assignedBy: landlordId,
    dispatchMode: "auto-assign",
    dispatchScore: best.totalScore,
    dispatchReason: JSON.stringify(best),
    vendorResponseStatus: "pending-response",
    responseDeadline,
    magicToken,
    jobStatus: "assigned",
    priority: request.urgency === "Emergency" ? "Urgent" : "Normal",
  });

  await storage.createActivityLog({
    requestId,
    landlordId,
    eventType: "auto-dispatch",
    eventLabel: `Auto-dispatched to ${best.vendorName}`,
    details: `Score: ${best.totalScore}/100. ${best.reason}`,
  });

  return { recommendation: scores, assigned: assignment };
}
