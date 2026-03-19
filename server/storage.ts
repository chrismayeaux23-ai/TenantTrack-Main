import { randomBytes } from "crypto";
import { db } from "./db";
import {
  properties, maintenanceRequests, maintenanceStaff, requestNotes, repairCosts, recurringTasks, requestMessages,
  vendors, vendorAssignments, vendorReviews, maintenanceActivityLog,
  type Property, type InsertProperty,
  type MaintenanceRequest, type InsertMaintenanceRequest,
  type MaintenanceStaff, type InsertMaintenanceStaff,
  type RequestNote, type InsertRequestNote,
  type RepairCost, type InsertRepairCost,
  type RecurringTask, type InsertRecurringTask,
  type RequestMessage, type InsertRequestMessage,
  type Vendor, type InsertVendor,
  type VendorAssignment, type InsertVendorAssignment,
  type VendorReview, type InsertVendorReview,
  type ActivityLog, type InsertActivityLog,
} from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";

function generateTrackingCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

export interface IStorage {
  getProperties(landlordId: string): Promise<Property[]>;
  getProperty(id: number): Promise<Property | undefined>;
  createProperty(property: InsertProperty): Promise<Property>;
  deleteProperty(id: number): Promise<void>;

  getRequestsByLandlord(landlordId: string): Promise<MaintenanceRequest[]>;
  getRequest(id: number): Promise<MaintenanceRequest | undefined>;
  createRequest(request: InsertMaintenanceRequest): Promise<MaintenanceRequest>;
  updateRequestStatus(id: number, status: string): Promise<MaintenanceRequest>;

  deleteRequest(id: number): Promise<void>;
  deleteTenantRequests(landlordId: string, tenantEmail: string, tenantPhone: string): Promise<void>;

  getStaff(landlordId: string): Promise<MaintenanceStaff[]>;
  createStaff(staff: InsertMaintenanceStaff): Promise<MaintenanceStaff>;
  deleteStaff(id: number): Promise<void>;
  assignRequest(requestId: number, staffId: number): Promise<MaintenanceRequest>;
  unassignRequest(requestId: number): Promise<MaintenanceRequest>;
  getRequestByTrackingCode(code: string): Promise<MaintenanceRequest | undefined>;

  getNotesByRequest(requestId: number): Promise<RequestNote[]>;
  createNote(note: InsertRequestNote): Promise<RequestNote>;

  getCostsByRequest(requestId: number): Promise<RepairCost[]>;
  getCostsByLandlord(landlordId: string): Promise<RepairCost[]>;
  createCost(cost: InsertRepairCost): Promise<RepairCost>;
  deleteCost(id: number): Promise<void>;

  getMessagesByRequest(requestId: number): Promise<RequestMessage[]>;
  createMessage(message: InsertRequestMessage): Promise<RequestMessage>;

  getRecurringTasks(landlordId: string): Promise<RecurringTask[]>;
  getRecurringTask(id: number): Promise<RecurringTask | undefined>;
  createRecurringTask(task: InsertRecurringTask): Promise<RecurringTask>;
  updateRecurringTask(id: number, data: Partial<InsertRecurringTask>): Promise<RecurringTask>;
  completeRecurringTask(id: number, nextDueDate: Date): Promise<RecurringTask>;
  deleteRecurringTask(id: number): Promise<void>;

  // Vendors
  getVendorsByLandlord(landlordId: string): Promise<Vendor[]>;
  getVendor(id: number): Promise<Vendor | undefined>;
  createVendor(data: InsertVendor): Promise<Vendor>;
  updateVendor(id: number, data: Partial<InsertVendor>): Promise<Vendor>;
  archiveVendor(id: number): Promise<Vendor>;
  deleteVendor(id: number): Promise<void>;

  // Vendor Assignments
  getVendorAssignmentByRequest(requestId: number): Promise<VendorAssignment | undefined>;
  assignVendorToRequest(data: InsertVendorAssignment): Promise<VendorAssignment>;
  updateVendorAssignment(requestId: number, data: Partial<InsertVendorAssignment>): Promise<VendorAssignment>;
  clearVendorAssignment(requestId: number): Promise<void>;

  // Vendor Reviews
  getVendorReviews(vendorId: number, landlordId: string): Promise<VendorReview[]>;
  getVendorReviewForRequest(requestId: number): Promise<VendorReview | undefined>;
  createVendorReview(data: InsertVendorReview): Promise<VendorReview>;

  // Activity Log
  getActivityByRequest(requestId: number): Promise<ActivityLog[]>;
  createActivityLog(data: InsertActivityLog): Promise<ActivityLog>;

  // Analytics
  getVendorStats(vendorId: number, landlordId: string): Promise<{
    totalJobs: number;
    completedJobs: number;
    avgOverallRating: number | null;
    avgQualityRating: number | null;
    avgSpeedRating: number | null;
    avgCommunicationRating: number | null;
    avgFinalCost: number | null;
    totalSpent: number;
    lastAssignedAt: Date | null;
    trustScore: number;
  }>;
  getTopVendors(landlordId: string): Promise<Array<Vendor & { totalJobs: number; avgRating: number | null; trustScore: number }>>;
  getVendorRecommendations(landlordId: string, tradeCategory: string): Promise<Array<Vendor & { totalJobs: number; avgRating: number | null; trustScore: number }>>;
  getDashboardVendorStats(landlordId: string): Promise<{
    needsDispatch: number;
    scheduledToday: number;
    completedThisWeek: number;
    openEmergencies: number;
    avgVendorRating: number | null;
    topVendors: Array<Vendor & { totalJobs: number; avgRating: number | null; trustScore: number }>;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getProperties(landlordId: string): Promise<Property[]> {
    return await db.select().from(properties).where(eq(properties.landlordId, landlordId));
  }

  async getProperty(id: number): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property;
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const [property] = await db.insert(properties).values(insertProperty).returning();
    return property;
  }

  async deleteProperty(id: number): Promise<void> {
    const requests = await db.select().from(maintenanceRequests).where(eq(maintenanceRequests.propertyId, id));
    for (const req of requests) {
      await this.deleteRequest(req.id);
    }
    await db.delete(recurringTasks).where(eq(recurringTasks.propertyId, id));
    await db.delete(properties).where(eq(properties.id, id));
  }

  async getRequestsByLandlord(landlordId: string): Promise<MaintenanceRequest[]> {
    const rows = await db.select({ request: maintenanceRequests })
      .from(maintenanceRequests)
      .innerJoin(properties, eq(maintenanceRequests.propertyId, properties.id))
      .where(eq(properties.landlordId, landlordId));
    return rows.map(r => r.request);
  }

  async getRequest(id: number): Promise<MaintenanceRequest | undefined> {
    const [request] = await db.select().from(maintenanceRequests).where(eq(maintenanceRequests.id, id));
    return request;
  }

  async createRequest(insertRequest: InsertMaintenanceRequest): Promise<MaintenanceRequest> {
    const MAX_RETRIES = 5;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const trackingCode = generateTrackingCode();
        const [request] = await db.insert(maintenanceRequests).values({
          ...insertRequest,
          trackingCode,
        }).returning();
        return request;
      } catch (err: any) {
        const isUniqueViolation = err?.code === '23505' && err?.constraint?.includes('tracking_code');
        if (!isUniqueViolation || attempt === MAX_RETRIES - 1) throw err;
      }
    }
    throw new Error("Failed to generate unique tracking code");
  }

  async updateRequestStatus(id: number, status: string): Promise<MaintenanceRequest> {
    const [request] = await db.update(maintenanceRequests).set({ status }).where(eq(maintenanceRequests.id, id)).returning();
    return request;
  }

  async deleteRequest(id: number): Promise<void> {
    await db.delete(maintenanceActivityLog).where(eq(maintenanceActivityLog.requestId, id));
    await db.delete(vendorReviews).where(eq(vendorReviews.requestId, id));
    await db.delete(vendorAssignments).where(eq(vendorAssignments.requestId, id));
    await db.delete(repairCosts).where(eq(repairCosts.requestId, id));
    await db.delete(requestNotes).where(eq(requestNotes.requestId, id));
    await db.delete(requestMessages).where(eq(requestMessages.requestId, id));
    await db.delete(maintenanceRequests).where(eq(maintenanceRequests.id, id));
  }

  async deleteTenantRequests(landlordId: string, tenantEmail: string, tenantPhone: string): Promise<void> {
    const allRequests = await this.getRequestsByLandlord(landlordId);
    const tenantRequests = allRequests.filter(
      r => r.tenantEmail.toLowerCase() === tenantEmail.toLowerCase() && r.tenantPhone === tenantPhone
    );
    for (const req of tenantRequests) {
      await this.deleteRequest(req.id);
    }
  }

  async getStaff(landlordId: string): Promise<MaintenanceStaff[]> {
    return await db.select().from(maintenanceStaff).where(eq(maintenanceStaff.landlordId, landlordId));
  }

  async createStaff(staff: InsertMaintenanceStaff): Promise<MaintenanceStaff> {
    const [created] = await db.insert(maintenanceStaff).values(staff).returning();
    return created;
  }

  async deleteStaff(id: number): Promise<void> {
    await db.delete(maintenanceStaff).where(eq(maintenanceStaff.id, id));
  }

  async assignRequest(requestId: number, staffId: number): Promise<MaintenanceRequest> {
    const [request] = await db.update(maintenanceRequests).set({ assignedTo: staffId }).where(eq(maintenanceRequests.id, requestId)).returning();
    return request;
  }

  async unassignRequest(requestId: number): Promise<MaintenanceRequest> {
    const [request] = await db.update(maintenanceRequests).set({ assignedTo: null }).where(eq(maintenanceRequests.id, requestId)).returning();
    return request;
  }

  async getRequestByTrackingCode(code: string): Promise<MaintenanceRequest | undefined> {
    const [request] = await db.select().from(maintenanceRequests).where(eq(maintenanceRequests.trackingCode, code));
    return request;
  }

  async getNotesByRequest(requestId: number): Promise<RequestNote[]> {
    return await db.select().from(requestNotes).where(eq(requestNotes.requestId, requestId)).orderBy(desc(requestNotes.createdAt));
  }

  async createNote(note: InsertRequestNote): Promise<RequestNote> {
    const [created] = await db.insert(requestNotes).values(note).returning();
    return created;
  }

  async getCostsByRequest(requestId: number): Promise<RepairCost[]> {
    return await db.select().from(repairCosts).where(eq(repairCosts.requestId, requestId)).orderBy(desc(repairCosts.createdAt));
  }

  async getCostsByLandlord(landlordId: string): Promise<RepairCost[]> {
    return await db.select().from(repairCosts).where(eq(repairCosts.landlordId, landlordId)).orderBy(desc(repairCosts.createdAt));
  }

  async createCost(cost: InsertRepairCost): Promise<RepairCost> {
    const [created] = await db.insert(repairCosts).values(cost).returning();
    return created;
  }

  async deleteCost(id: number): Promise<void> {
    await db.delete(repairCosts).where(eq(repairCosts.id, id));
  }

  async getMessagesByRequest(requestId: number): Promise<RequestMessage[]> {
    return await db.select().from(requestMessages).where(eq(requestMessages.requestId, requestId)).orderBy(requestMessages.createdAt);
  }

  async createMessage(message: InsertRequestMessage): Promise<RequestMessage> {
    const [created] = await db.insert(requestMessages).values(message).returning();
    return created;
  }

  async getRecurringTasks(landlordId: string): Promise<RecurringTask[]> {
    return await db.select().from(recurringTasks).where(eq(recurringTasks.landlordId, landlordId)).orderBy(recurringTasks.nextDueDate);
  }

  async getRecurringTask(id: number): Promise<RecurringTask | undefined> {
    const [task] = await db.select().from(recurringTasks).where(eq(recurringTasks.id, id));
    return task;
  }

  async createRecurringTask(task: InsertRecurringTask): Promise<RecurringTask> {
    const [created] = await db.insert(recurringTasks).values(task).returning();
    return created;
  }

  async updateRecurringTask(id: number, data: Partial<InsertRecurringTask>): Promise<RecurringTask> {
    const [updated] = await db.update(recurringTasks).set(data).where(eq(recurringTasks.id, id)).returning();
    return updated;
  }

  async completeRecurringTask(id: number, nextDueDate: Date): Promise<RecurringTask> {
    const [updated] = await db.update(recurringTasks)
      .set({ lastCompletedDate: new Date(), nextDueDate })
      .where(eq(recurringTasks.id, id))
      .returning();
    return updated;
  }

  async deleteRecurringTask(id: number): Promise<void> {
    await db.delete(recurringTasks).where(eq(recurringTasks.id, id));
  }

  // ── Vendors ────────────────────────────────────────────────────────────────

  async getVendorsByLandlord(landlordId: string): Promise<Vendor[]> {
    return await db.select().from(vendors)
      .where(eq(vendors.landlordId, landlordId))
      .orderBy(desc(vendors.createdAt));
  }

  async getVendor(id: number): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    return vendor;
  }

  async createVendor(data: InsertVendor): Promise<Vendor> {
    const [vendor] = await db.insert(vendors).values(data).returning();
    return vendor;
  }

  async updateVendor(id: number, data: Partial<InsertVendor>): Promise<Vendor> {
    const [vendor] = await db.update(vendors)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(vendors.id, id))
      .returning();
    return vendor;
  }

  async archiveVendor(id: number): Promise<Vendor> {
    const [vendor] = await db.update(vendors)
      .set({ status: "archived", updatedAt: new Date() })
      .where(eq(vendors.id, id))
      .returning();
    return vendor;
  }

  async deleteVendor(id: number): Promise<void> {
    await db.delete(vendorReviews).where(eq(vendorReviews.vendorId, id));
    await db.delete(vendorAssignments).where(eq(vendorAssignments.vendorId, id));
    await db.delete(vendors).where(eq(vendors.id, id));
  }

  // ── Vendor Assignments ────────────────────────────────────────────────────

  async getVendorAssignmentByRequest(requestId: number): Promise<VendorAssignment | undefined> {
    const [assignment] = await db.select().from(vendorAssignments)
      .where(eq(vendorAssignments.requestId, requestId));
    return assignment;
  }

  async assignVendorToRequest(data: InsertVendorAssignment): Promise<VendorAssignment> {
    await db.delete(vendorAssignments).where(eq(vendorAssignments.requestId, data.requestId));
    const [assignment] = await db.insert(vendorAssignments).values(data).returning();
    return assignment;
  }

  async updateVendorAssignment(requestId: number, data: Partial<InsertVendorAssignment>): Promise<VendorAssignment> {
    const [assignment] = await db.update(vendorAssignments)
      .set(data)
      .where(eq(vendorAssignments.requestId, requestId))
      .returning();
    return assignment;
  }

  async clearVendorAssignment(requestId: number): Promise<void> {
    await db.delete(vendorAssignments).where(eq(vendorAssignments.requestId, requestId));
  }

  // ── Vendor Reviews ────────────────────────────────────────────────────────

  async getVendorReviews(vendorId: number, landlordId: string): Promise<VendorReview[]> {
    return await db.select().from(vendorReviews)
      .where(and(eq(vendorReviews.vendorId, vendorId), eq(vendorReviews.landlordId, landlordId)))
      .orderBy(desc(vendorReviews.createdAt));
  }

  async getVendorReviewForRequest(requestId: number): Promise<VendorReview | undefined> {
    const [review] = await db.select().from(vendorReviews)
      .where(eq(vendorReviews.requestId, requestId));
    return review;
  }

  async createVendorReview(data: InsertVendorReview): Promise<VendorReview> {
    const [review] = await db.insert(vendorReviews).values(data).returning();
    return review;
  }

  // ── Activity Log ──────────────────────────────────────────────────────────

  async getActivityByRequest(requestId: number): Promise<ActivityLog[]> {
    return await db.select().from(maintenanceActivityLog)
      .where(eq(maintenanceActivityLog.requestId, requestId))
      .orderBy(desc(maintenanceActivityLog.createdAt));
  }

  async createActivityLog(data: InsertActivityLog): Promise<ActivityLog> {
    const [entry] = await db.insert(maintenanceActivityLog).values(data).returning();
    return entry;
  }

  // ── Analytics ─────────────────────────────────────────────────────────────

  async getVendorStats(vendorId: number, landlordId: string): Promise<{
    totalJobs: number;
    completedJobs: number;
    avgOverallRating: number | null;
    avgQualityRating: number | null;
    avgSpeedRating: number | null;
    avgCommunicationRating: number | null;
    avgFinalCost: number | null;
    totalSpent: number;
    lastAssignedAt: Date | null;
    trustScore: number;
  }> {
    const assignments = await db.select().from(vendorAssignments)
      .where(and(eq(vendorAssignments.vendorId, vendorId), eq(vendorAssignments.landlordId, landlordId)));

    const reviews = await db.select().from(vendorReviews)
      .where(and(eq(vendorReviews.vendorId, vendorId), eq(vendorReviews.landlordId, landlordId)));

    const vendor = await this.getVendor(vendorId);

    const completed = assignments.filter(a => a.jobStatus === "completed" || a.completedAt !== null);
    const ratings = reviews.map(r => r.overallRating).filter((r): r is number => r !== null);
    const qualityRatings = reviews.map(r => r.qualityRating).filter((r): r is number => r !== null);
    const speedRatings = reviews.map(r => r.speedRating).filter((r): r is number => r !== null);
    const commRatings = reviews.map(r => r.communicationRating).filter((r): r is number => r !== null);
    const costs = assignments.map(a => a.finalCost).filter((c): c is number => c !== null);

    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

    const avgOverallRating = avg(ratings);
    const lastAssignment = [...assignments].sort((a, b) =>
      new Date(b.assignedAt!).getTime() - new Date(a.assignedAt!).getTime()
    )[0];

    const totalSpent = costs.reduce((a, b) => a + b, 0);

    // VendorTrust Score (0–100)
    const trustScore = computeTrustScore({
      totalJobs: assignments.length,
      completedJobs: completed.length,
      avgRating: avgOverallRating,
      noShowCount: vendor?.noShowCount ?? 0,
      preferredVendor: vendor?.preferredVendor ?? false,
    });

    return {
      totalJobs: assignments.length,
      completedJobs: completed.length,
      avgOverallRating,
      avgQualityRating: avg(qualityRatings),
      avgSpeedRating: avg(speedRatings),
      avgCommunicationRating: avg(commRatings),
      avgFinalCost: costs.length > 0 ? Math.round(totalSpent / costs.length) : null,
      totalSpent,
      lastAssignedAt: lastAssignment?.assignedAt ?? null,
      trustScore,
    };
  }

  async getTopVendors(landlordId: string): Promise<Array<Vendor & { totalJobs: number; avgRating: number | null; trustScore: number }>> {
    const allVendors = await this.getVendorsByLandlord(landlordId);
    const activeVendors = allVendors.filter(v => v.status === "active");

    const withStats = await Promise.all(activeVendors.map(async (v) => {
      const stats = await this.getVendorStats(v.id, landlordId);
      return { ...v, totalJobs: stats.totalJobs, avgRating: stats.avgOverallRating, trustScore: stats.trustScore };
    }));

    return withStats.sort((a, b) => b.trustScore - a.trustScore);
  }

  async getVendorRecommendations(landlordId: string, tradeCategory: string): Promise<Array<Vendor & { totalJobs: number; avgRating: number | null; trustScore: number }>> {
    const allVendors = await this.getVendorsByLandlord(landlordId);
    const matching = allVendors.filter(v =>
      v.status === "active" &&
      (v.tradeCategory === tradeCategory || v.tradeCategory === "General Handyman")
    );

    const withStats = await Promise.all(matching.map(async (v) => {
      const stats = await this.getVendorStats(v.id, landlordId);
      return { ...v, totalJobs: stats.totalJobs, avgRating: stats.avgOverallRating, trustScore: stats.trustScore };
    }));

    // Sort: preferred first, then by trust score
    return withStats.sort((a, b) => {
      if (a.preferredVendor && !b.preferredVendor) return -1;
      if (!a.preferredVendor && b.preferredVendor) return 1;
      return b.trustScore - a.trustScore;
    });
  }

  async getDashboardVendorStats(landlordId: string): Promise<{
    needsDispatch: number;
    scheduledToday: number;
    completedThisWeek: number;
    openEmergencies: number;
    avgVendorRating: number | null;
    topVendors: Array<Vendor & { totalJobs: number; avgRating: number | null; trustScore: number }>;
  }> {
    const requests = await this.getRequestsByLandlord(landlordId);
    const allAssignments = await db.select().from(vendorAssignments).where(eq(vendorAssignments.landlordId, landlordId));
    const assignedRequestIds = new Set(allAssignments.map(a => a.requestId));

    const needsDispatch = requests.filter(r =>
      r.status !== "Completed" && !assignedRequestIds.has(r.id)
    ).length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const scheduledToday = allAssignments.filter(a => {
      if (!a.scheduledDate) return false;
      const d = new Date(a.scheduledDate);
      return d >= today && d < tomorrow;
    }).length;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const completedThisWeek = allAssignments.filter(a =>
      a.completedAt && new Date(a.completedAt) >= weekAgo
    ).length;

    const openEmergencies = requests.filter(r =>
      r.urgency === "Emergency" && r.status !== "Completed"
    ).length;

    const allReviews = await db.select().from(vendorReviews).where(eq(vendorReviews.landlordId, landlordId));
    const ratings = allReviews.map(r => r.overallRating).filter((r): r is number => r !== null);
    const avgVendorRating = ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : null;

    const topVendors = (await this.getTopVendors(landlordId)).slice(0, 5);

    return { needsDispatch, scheduledToday, completedThisWeek, openEmergencies, avgVendorRating, topVendors };
  }
}

// ── VendorTrust Score Formula ─────────────────────────────────────────────────
// Score 0–100 based on: rating, completion rate, total jobs, preferred status
export function computeTrustScore(params: {
  totalJobs: number;
  completedJobs: number;
  avgRating: number | null;
  noShowCount: number;
  preferredVendor: boolean;
}): number {
  let score = 50; // base

  // Rating component (0–30 pts)
  if (params.avgRating !== null) {
    score += Math.round((params.avgRating / 5) * 30);
  }

  // Completion rate component (0–20 pts)
  if (params.totalJobs > 0) {
    const rate = params.completedJobs / params.totalJobs;
    score += Math.round(rate * 20);
  }

  // Experience component (0–15 pts): more jobs = higher confidence
  const expBonus = Math.min(params.totalJobs * 2.5, 15);
  score += Math.round(expBonus);

  // No-show penalty (-10 per no-show, max -20)
  score -= Math.min(params.noShowCount * 10, 20);

  // Preferred vendor bonus (+5)
  if (params.preferredVendor) score += 5;

  return Math.max(0, Math.min(100, score));
}

export const storage = new DatabaseStorage();
