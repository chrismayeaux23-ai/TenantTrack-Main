import { pgTable, text, serial, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
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

export const repairCosts = pgTable("repair_costs", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull(),
  landlordId: varchar("landlord_id").notNull(),
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  vendor: text("vendor"),
  receiptUrl: text("receipt_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const recurringTasks = pgTable("recurring_tasks", {
  id: serial("id").primaryKey(),
  landlordId: varchar("landlord_id").notNull(),
  propertyId: integer("property_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  frequency: text("frequency").notNull(),
  nextDueDate: timestamp("next_due_date").notNull(),
  lastCompletedDate: timestamp("last_completed_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const requestMessages = pgTable("request_messages", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull(),
  senderType: text("sender_type").notNull(),
  senderName: text("sender_name").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Vendor Tables ──────────────────────────────────────────────────────────────

export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  landlordId: varchar("landlord_id").notNull(),
  name: text("name").notNull(),
  companyName: text("company_name"),
  tradeCategory: text("trade_category").notNull(),
  phone: text("phone"),
  email: text("email"),
  city: text("city"),
  serviceArea: text("service_area"),
  notes: text("notes"),
  preferredVendor: boolean("preferred_vendor").default(false),
  licenseInfo: text("license_info"),
  insuranceInfo: text("insurance_info"),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const vendorAssignments = pgTable("vendor_assignments", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull(),
  vendorId: integer("vendor_id").notNull(),
  landlordId: varchar("landlord_id").notNull(),
  assignedBy: varchar("assigned_by"),
  assignedAt: timestamp("assigned_at").defaultNow(),
  contactedVendor: boolean("contacted_vendor").default(false),
  priority: text("priority").default("Normal"),
  targetCompletionDate: timestamp("target_completion_date"),
  scheduledDate: timestamp("scheduled_date"),
  completedAt: timestamp("completed_at"),
  assignmentNotes: text("assignment_notes"),
  finalCost: integer("final_cost"),
});

export const vendorReviews = pgTable("vendor_reviews", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull(),
  vendorId: integer("vendor_id").notNull(),
  landlordId: varchar("landlord_id").notNull(),
  qualityRating: integer("quality_rating"),
  speedRating: integer("speed_rating"),
  communicationRating: integer("communication_rating"),
  priceRating: integer("price_rating"),
  overallRating: integer("overall_rating"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const maintenanceActivityLog = pgTable("maintenance_activity_log", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull(),
  landlordId: varchar("landlord_id").notNull(),
  eventType: text("event_type").notNull(),
  eventLabel: text("event_label").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Insert Schemas ─────────────────────────────────────────────────────────────

export const insertPropertySchema = createInsertSchema(properties).omit({ id: true, createdAt: true });
export const insertMaintenanceRequestSchema = createInsertSchema(maintenanceRequests).omit({ id: true, createdAt: true, assignedTo: true, trackingCode: true });
export const insertMaintenanceStaffSchema = createInsertSchema(maintenanceStaff).omit({ id: true });
export const insertRequestNoteSchema = createInsertSchema(requestNotes).omit({ id: true, createdAt: true });
export const insertRepairCostSchema = createInsertSchema(repairCosts).omit({ id: true, createdAt: true });
export const insertRecurringTaskSchema = createInsertSchema(recurringTasks).omit({ id: true, createdAt: true });
export const insertRequestMessageSchema = createInsertSchema(requestMessages).omit({ id: true, createdAt: true });

export const insertVendorSchema = createInsertSchema(vendors).omit({ id: true, createdAt: true, updatedAt: true });
export const insertVendorAssignmentSchema = createInsertSchema(vendorAssignments).omit({ id: true, assignedAt: true });
export const insertVendorReviewSchema = createInsertSchema(vendorReviews).omit({ id: true, createdAt: true });
export const insertActivityLogSchema = createInsertSchema(maintenanceActivityLog).omit({ id: true, createdAt: true });

// ── Types ─────────────────────────────────────────────────────────────────────

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type MaintenanceRequest = typeof maintenanceRequests.$inferSelect;
export type InsertMaintenanceRequest = z.infer<typeof insertMaintenanceRequestSchema>;

export type MaintenanceStaff = typeof maintenanceStaff.$inferSelect;
export type InsertMaintenanceStaff = z.infer<typeof insertMaintenanceStaffSchema>;

export type RequestNote = typeof requestNotes.$inferSelect;
export type InsertRequestNote = z.infer<typeof insertRequestNoteSchema>;

export type RepairCost = typeof repairCosts.$inferSelect;
export type InsertRepairCost = z.infer<typeof insertRepairCostSchema>;

export type RecurringTask = typeof recurringTasks.$inferSelect;
export type InsertRecurringTask = z.infer<typeof insertRecurringTaskSchema>;

export type RequestMessage = typeof requestMessages.$inferSelect;
export type InsertRequestMessage = z.infer<typeof insertRequestMessageSchema>;

export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;

export type VendorAssignment = typeof vendorAssignments.$inferSelect;
export type InsertVendorAssignment = z.infer<typeof insertVendorAssignmentSchema>;

export type VendorReview = typeof vendorReviews.$inferSelect;
export type InsertVendorReview = z.infer<typeof insertVendorReviewSchema>;

export type ActivityLog = typeof maintenanceActivityLog.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

export type CreatePropertyRequest = Omit<InsertProperty, "landlordId">;
export type CreateMaintenanceRequest = Omit<InsertMaintenanceRequest, "status">;
export type UpdateRequestStatus = { status: string };

export type PropertyResponse = Property;
export type PropertiesListResponse = Property[];
export type MaintenanceRequestResponse = MaintenanceRequest;
export type MaintenanceRequestsListResponse = MaintenanceRequest[];

export const TRADE_CATEGORIES = [
  "Plumbing",
  "Electrical",
  "HVAC",
  "Appliance",
  "Painting",
  "Carpentry",
  "Landscaping",
  "Cleaning",
  "Pest Control",
  "Roofing",
  "Flooring",
  "General Handyman",
  "Other",
] as const;

export type TradeCategory = typeof TRADE_CATEGORIES[number];
