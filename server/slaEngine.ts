import { storage } from "./storage";
import { db } from "./db";
import { vendorAssignments, maintenanceRequests, properties, vendors } from "@shared/schema";
import { users } from "@shared/models/auth";
import { eq, and, sql, isNull, lt } from "drizzle-orm";
import { getSlaThreshold, autoDispatchRequest } from "./dispatchEngine";
import { sendLandlordAlertEmail } from "./emailService";

export async function checkSlaViolations() {
  try {
    const now = new Date();

    const pendingAssignments = await db.select().from(vendorAssignments)
      .where(and(
        eq(vendorAssignments.vendorResponseStatus, "pending-response"),
        sql`${vendorAssignments.responseDeadline} IS NOT NULL`,
        sql`${vendorAssignments.responseDeadline} < ${now}`
      ));

    for (const assignment of pendingAssignments) {
      await db.update(vendorAssignments)
        .set({ vendorResponseStatus: "no-response" })
        .where(eq(vendorAssignments.id, assignment.id));

      const vendor = await storage.getVendor(assignment.vendorId);
      if (vendor) {
        await storage.updateVendor(vendor.id, {
          noShowCount: (vendor.noShowCount || 0) + 1,
        } as any);
      }

      await storage.createActivityLog({
        requestId: assignment.requestId,
        landlordId: assignment.landlordId,
        eventType: "sla-violation",
        eventLabel: `${vendor?.name || "Vendor"} did not respond within SLA deadline`,
        details: `Response deadline was ${assignment.responseDeadline?.toISOString()}`,
      });

      const request = await storage.getRequest(assignment.requestId);

      await storage.createSlaEscalation({
        requestId: assignment.requestId,
        landlordId: assignment.landlordId,
        escalationType: "no-response",
        urgency: request?.urgency || "Medium",
        previousVendorId: assignment.vendorId,
        reason: `Vendor ${vendor?.name} did not respond within SLA threshold`,
      });

      const landlordUser = await db.select().from(users)
        .where(eq(users.id, assignment.landlordId))
        .then(r => r[0]);

      if (landlordUser?.email) {
        sendLandlordAlertEmail({
          landlordEmail: landlordUser.email,
          alertType: "no-response",
          requestId: assignment.requestId,
          vendorName: vendor?.name || "Vendor",
          message: `${vendor?.name} did not respond to the job assignment within the SLA deadline. Consider reassigning to another vendor.`,
        }).catch(() => {});
      }
    }

    const openEmergencies = await db.select({
      request: maintenanceRequests,
      property: properties,
    })
      .from(maintenanceRequests)
      .innerJoin(properties, eq(maintenanceRequests.propertyId, properties.id))
      .where(and(
        eq(maintenanceRequests.urgency, "Emergency"),
        sql`${maintenanceRequests.status} NOT IN ('Completed')`,
      ));

    for (const { request, property } of openEmergencies) {
      const assignment = await storage.getVendorAssignmentByRequest(request.id);
      if (!assignment) {
        const hoursSinceCreated = (now.getTime() - new Date(request.createdAt!).getTime()) / (1000 * 60 * 60);
        if (hoursSinceCreated > 0.5) {
          const existingEscalations = await storage.getEscalationsByRequest(request.id);
          const recentEscalation = existingEscalations.find(e =>
            e.escalationType === "emergency-unassigned" &&
            (now.getTime() - new Date(e.createdAt!).getTime()) < 60 * 60 * 1000
          );

          if (!recentEscalation) {
            await storage.createSlaEscalation({
              requestId: request.id,
              landlordId: property.landlordId,
              escalationType: "emergency-unassigned",
              urgency: "Emergency",
              reason: `Emergency request unassigned for ${Math.round(hoursSinceCreated * 10) / 10} hours`,
            });

            await storage.createActivityLog({
              requestId: request.id,
              landlordId: property.landlordId,
              eventType: "sla-escalation",
              eventLabel: "Emergency request still unassigned",
            });

            const landlordUser = await db.select().from(users)
              .where(eq(users.id, property.landlordId))
              .then(r => r[0]);

            if (landlordUser?.email) {
              sendLandlordAlertEmail({
                landlordEmail: landlordUser.email,
                alertType: "emergency-unassigned",
                requestId: request.id,
                vendorName: "N/A",
                message: `Emergency maintenance request at ${property.name} Unit ${request.unitNumber} has been unassigned for ${Math.round(hoursSinceCreated * 10) / 10} hours.`,
              }).catch(() => {});
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("SLA check error:", err);
  }
}

let slaInterval: NodeJS.Timeout | null = null;

export function startSlaEngine() {
  if (slaInterval) return;
  console.log("SLA engine started — checking every 5 minutes");
  slaInterval = setInterval(checkSlaViolations, 5 * 60 * 1000);
  setTimeout(checkSlaViolations, 30 * 1000);
}

export function stopSlaEngine() {
  if (slaInterval) {
    clearInterval(slaInterval);
    slaInterval = null;
  }
}
