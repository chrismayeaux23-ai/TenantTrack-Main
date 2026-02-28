import { pgTable, text, serial, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  landlordId: varchar("landlord_id").notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const maintenanceRequests = pgTable("maintenance_requests", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  unitNumber: text("unit_number").notNull(),
  issueType: text("issue_type").notNull(),
  description: text("description").notNull(),
  urgency: text("urgency").notNull(),
  tenantName: text("tenant_name").notNull(),
  tenantPhone: text("tenant_phone").notNull(),
  tenantEmail: text("tenant_email").notNull(),
  status: text("status").notNull().default("New"),
  photoUrls: text("photo_urls").array(),
  assignedTo: integer("assigned_to"),
  trackingCode: text("tracking_code").unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const requestNotes = pgTable("request_notes", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull(),
  authorId: varchar("author_id").notNull(),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const maintenanceStaff = pgTable("maintenance_staff", {
  id: serial("id").primaryKey(),
  landlordId: varchar("landlord_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
});

export const insertPropertySchema = createInsertSchema(properties).omit({ id: true, createdAt: true });
export const insertMaintenanceRequestSchema = createInsertSchema(maintenanceRequests).omit({ id: true, createdAt: true, assignedTo: true, trackingCode: true });
export const insertMaintenanceStaffSchema = createInsertSchema(maintenanceStaff).omit({ id: true });
export const insertRequestNoteSchema = createInsertSchema(requestNotes).omit({ id: true, createdAt: true });

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type MaintenanceRequest = typeof maintenanceRequests.$inferSelect;
export type InsertMaintenanceRequest = z.infer<typeof insertMaintenanceRequestSchema>;

export type MaintenanceStaff = typeof maintenanceStaff.$inferSelect;
export type InsertMaintenanceStaff = z.infer<typeof insertMaintenanceStaffSchema>;

export type RequestNote = typeof requestNotes.$inferSelect;
export type InsertRequestNote = z.infer<typeof insertRequestNoteSchema>;

export type CreatePropertyRequest = Omit<InsertProperty, "landlordId">;
export type CreateMaintenanceRequest = Omit<InsertMaintenanceRequest, "status">;
export type UpdateRequestStatus = { status: string };

export type PropertyResponse = Property;
export type PropertiesListResponse = Property[];
export type MaintenanceRequestResponse = MaintenanceRequest;
export type MaintenanceRequestsListResponse = MaintenanceRequest[];
