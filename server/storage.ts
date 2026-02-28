import { randomBytes } from "crypto";
import { db } from "./db";
import {
  properties, maintenanceRequests, maintenanceStaff, requestNotes,
  type Property, type InsertProperty,
  type MaintenanceRequest, type InsertMaintenanceRequest,
  type MaintenanceStaff, type InsertMaintenanceStaff,
  type RequestNote, type InsertRequestNote,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

function generateTrackingCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

export interface IStorage {
  getProperties(landlordId: string): Promise<Property[]>;
  getProperty(id: number): Promise<Property | undefined>;
  createProperty(property: InsertProperty): Promise<Property>;

  getRequestsByLandlord(landlordId: string): Promise<MaintenanceRequest[]>;
  getRequest(id: number): Promise<MaintenanceRequest | undefined>;
  createRequest(request: InsertMaintenanceRequest): Promise<MaintenanceRequest>;
  updateRequestStatus(id: number, status: string): Promise<MaintenanceRequest>;

  getStaff(landlordId: string): Promise<MaintenanceStaff[]>;
  createStaff(staff: InsertMaintenanceStaff): Promise<MaintenanceStaff>;
  deleteStaff(id: number): Promise<void>;
  assignRequest(requestId: number, staffId: number): Promise<MaintenanceRequest>;
  unassignRequest(requestId: number): Promise<MaintenanceRequest>;
  getRequestByTrackingCode(code: string): Promise<MaintenanceRequest | undefined>;

  getNotesByRequest(requestId: number): Promise<RequestNote[]>;
  createNote(note: InsertRequestNote): Promise<RequestNote>;
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
        if (!isUniqueViolation || attempt === MAX_RETRIES - 1) {
          throw err;
        }
      }
    }
    throw new Error("Failed to generate unique tracking code");
  }

  async updateRequestStatus(id: number, status: string): Promise<MaintenanceRequest> {
    const [request] = await db.update(maintenanceRequests)
      .set({ status })
      .where(eq(maintenanceRequests.id, id))
      .returning();
    return request;
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
    const [request] = await db.update(maintenanceRequests)
      .set({ assignedTo: staffId })
      .where(eq(maintenanceRequests.id, requestId))
      .returning();
    return request;
  }

  async unassignRequest(requestId: number): Promise<MaintenanceRequest> {
    const [request] = await db.update(maintenanceRequests)
      .set({ assignedTo: null })
      .where(eq(maintenanceRequests.id, requestId))
      .returning();
    return request;
  }

  async getRequestByTrackingCode(code: string): Promise<MaintenanceRequest | undefined> {
    const [request] = await db.select().from(maintenanceRequests).where(eq(maintenanceRequests.trackingCode, code));
    return request;
  }

  async getNotesByRequest(requestId: number): Promise<RequestNote[]> {
    return await db.select().from(requestNotes)
      .where(eq(requestNotes.requestId, requestId))
      .orderBy(desc(requestNotes.createdAt));
  }

  async createNote(note: InsertRequestNote): Promise<RequestNote> {
    const [created] = await db.insert(requestNotes).values(note).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
