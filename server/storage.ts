import { randomBytes } from "crypto";
import { db } from "./db";
import {
  properties, maintenanceRequests, maintenanceStaff, requestNotes, repairCosts, recurringTasks, requestMessages,
  type Property, type InsertProperty,
  type MaintenanceRequest, type InsertMaintenanceRequest,
  type MaintenanceStaff, type InsertMaintenanceStaff,
  type RequestNote, type InsertRequestNote,
  type RepairCost, type InsertRepairCost,
  type RecurringTask, type InsertRecurringTask,
  type RequestMessage, type InsertRequestMessage,
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

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
      await db.delete(repairCosts).where(eq(repairCosts.requestId, req.id));
      await db.delete(requestNotes).where(eq(requestNotes.requestId, req.id));
      await db.delete(requestMessages).where(eq(requestMessages.requestId, req.id));
      await db.delete(maintenanceRequests).where(eq(maintenanceRequests.id, req.id));
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
}

export const storage = new DatabaseStorage();
