import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { db } from "./db";
import { users } from "@shared/models/auth";
import { eq, sql, desc, and, gte, lte, isNull } from "drizzle-orm";
import { properties, maintenanceRequests, repairCosts, recurringTasks, requestNotes, maintenanceStaff, vendors, vendorAssignments, vendorReviews, passwordResetTokens, emailVerificationCodes, TRADE_CATEGORIES } from "@shared/schema";
import { authStorage } from "./replit_integrations/auth/storage";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendNewRequestEmail, sendStatusUpdateEmail, sendStaffAssignmentEmail, sendVendorDispatchEmail, sendVendorReminderEmail, sendTenantVendorScheduledEmail, sendLandlordAlertEmail, sendPasswordResetEmail, sendVerificationCodeEmail } from "./emailService";
import { autoDispatchRequest, scoreVendorsForRequest, generateMagicToken, getSlaThreshold } from "./dispatchEngine";
import { setupGoogleAuth } from "./googleAuth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Set up Replit integrations first
  await setupAuth(app);
  registerAuthRoutes(app);
  registerObjectStorageRoutes(app);
  setupGoogleAuth(app);

  const DEMO_USER_ID = "demo-landlord";
  const DEMO_EMAIL = "tenanttrackapp@gmail.com";
  const DEMO_PASSWORD = "Jetta1989$";

  async function ensureOwnerAccount() {
    try {
      const ownerEmail = "chrismayox@gmail.com";
      const ownerPasswordHash = await bcrypt.hash("Jetta1989$", 12);
      const [existing] = await db.select().from(users).where(eq(users.email, ownerEmail)).limit(1);
      let ownerId: string;
      if (!existing) {
        ownerId = crypto.randomUUID();
        await db.insert(users).values({
          id: ownerId,
          email: ownerEmail,
          firstName: "Chris",
          lastName: "Mayeaux",
          passwordHash: ownerPasswordHash,
          subscriptionTier: "pro",
          emailVerified: true,
        });
        console.log("Owner account created");
      } else {
        ownerId = existing.id;
        const updates: any = { subscriptionTier: "pro", passwordHash: ownerPasswordHash, emailVerified: true };
        await db.update(users).set(updates).where(eq(users.id, existing.id));
        console.log("Owner account updated");
      }

      await seedOwnerDemoData(ownerId);

      const [demoUser] = await db.select().from(users).where(eq(users.id, DEMO_USER_ID)).limit(1);
      if (demoUser) {
        const demoHash = await bcrypt.hash(DEMO_PASSWORD, 12);
        await db.update(users).set({ email: DEMO_EMAIL, passwordHash: demoHash, emailVerified: true }).where(eq(users.id, DEMO_USER_ID));
        console.log(`Demo landlord updated (email: ${DEMO_EMAIL})`);
      }
    } catch (err) {
      console.error("Failed to ensure owner account:", err);
    }
  }

  async function seedOwnerDemoData(ownerId: string) {
    const existing = await storage.getProperties(ownerId);
    const hasWalkthroughData = existing.some(p => p.name === "Hawthorne Heights");
    if (hasWalkthroughData) return;

    const now = new Date();
    const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000);
    const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3600000);

    const prop1 = await storage.createProperty({ landlordId: ownerId, name: "Hawthorne Heights", address: "3847 SE Hawthorne Blvd, Portland, OR 97214" });
    const prop2 = await storage.createProperty({ landlordId: ownerId, name: "Pearl District Lofts", address: "1025 NW Glisan St, Portland, OR 97209" });
    const prop3 = await storage.createProperty({ landlordId: ownerId, name: "Alberta Arts Commons", address: "2810 NE Alberta St, Portland, OR 97211" });
    const prop4 = await storage.createProperty({ landlordId: ownerId, name: "Sellwood Creek Apartments", address: "7420 SE Milwaukie Ave, Portland, OR 97202" });
    const prop5 = await storage.createProperty({ landlordId: ownerId, name: "Division Street Duplexes", address: "4512 SE Division St, Portland, OR 97206" });

    const req1 = await storage.createRequest({ propertyId: prop1.id, unitNumber: "204", issueType: "Plumbing", description: "Kitchen sink dripping non-stop. Water pooling under the cabinet and causing mold smell. Needs immediate fix.", urgency: "High", tenantName: "Sofia Ramirez", tenantPhone: "503-555-1201", tenantEmail: "sofia.r@email.com", status: "In-Progress", photoUrls: [] });
    const req2 = await storage.createRequest({ propertyId: prop2.id, unitNumber: "PH-2", issueType: "Electrical", description: "Sparking from living room outlet when anything is plugged in. Breaker keeps tripping. Very concerned about fire risk.", urgency: "Emergency", tenantName: "David Nguyen", tenantPhone: "503-555-1202", tenantEmail: "dnguyen@email.com", status: "In-Progress", photoUrls: [] });
    const req3 = await storage.createRequest({ propertyId: prop3.id, unitNumber: "B", issueType: "HVAC", description: "Central heat not working — thermostat reads 52°F inside. Tried resetting breaker, no change. Kids in the unit.", urgency: "Emergency", tenantName: "Maya Thompson", tenantPhone: "503-555-1203", tenantEmail: "maya.t@email.com", status: "In-Progress", photoUrls: [] });
    const req4 = await storage.createRequest({ propertyId: prop1.id, unitNumber: "107", issueType: "Appliance", description: "Dishwasher making loud grinding noise and leaving dishes dirty. Water not draining after cycle.", urgency: "Medium", tenantName: "James O'Brien", tenantPhone: "503-555-1204", tenantEmail: "jobrien@email.com", status: "In-Progress", photoUrls: [] });
    const req5 = await storage.createRequest({ propertyId: prop4.id, unitNumber: "3A", issueType: "Plumbing", description: "Toilet in master bath running continuously for 4 days. Water bill concern. Already jiggled the handle.", urgency: "Medium", tenantName: "Lisa Park", tenantPhone: "503-555-1205", tenantEmail: "lpark@email.com", status: "Completed", photoUrls: [] });
    const req6 = await storage.createRequest({ propertyId: prop2.id, unitNumber: "305", issueType: "Painting", description: "Water stain spreading on bedroom ceiling from upstairs unit leak (leak was fixed). Need ceiling repainted.", urgency: "Low", tenantName: "Andre Williams", tenantPhone: "503-555-1206", tenantEmail: "andre.w@email.com", status: "New", photoUrls: [] });
    const req7 = await storage.createRequest({ propertyId: prop5.id, unitNumber: "A", issueType: "Electrical", description: "Porch light and doorbell both stopped working same day. Tried new bulbs, no change.", urgency: "Low", tenantName: "Karen Mitchell", tenantPhone: "503-555-1207", tenantEmail: "karen.m@email.com", status: "New", photoUrls: [] });
    const req8 = await storage.createRequest({ propertyId: prop3.id, unitNumber: "D", issueType: "Plumbing", description: "Bathtub slow drain — standing water after 5 minutes. Hair trap was cleaned, still slow.", urgency: "Medium", tenantName: "Tyler Chen", tenantPhone: "503-555-1208", tenantEmail: "tchen@email.com", status: "In-Progress", photoUrls: [] });
    const req9 = await storage.createRequest({ propertyId: prop4.id, unitNumber: "1B", issueType: "Appliance", description: "Refrigerator making buzzing noise and not keeping food cold. Freezer side seems fine.", urgency: "High", tenantName: "Maria Santos", tenantPhone: "503-555-1209", tenantEmail: "msantos@email.com", status: "New", photoUrls: [] });
    const req10 = await storage.createRequest({ propertyId: prop1.id, unitNumber: "312", issueType: "HVAC", description: "AC blowing warm air only. Filter was just changed last month. Thermostat display working fine.", urgency: "Medium", tenantName: "Ryan Foster", tenantPhone: "503-555-1210", tenantEmail: "rfoster@email.com", status: "Completed", photoUrls: [] });
    const req11 = await storage.createRequest({ propertyId: prop5.id, unitNumber: "B", issueType: "Roofing", description: "Leak in upstairs bedroom during heavy rain. Bucket catching water. Ceiling drywall getting soft.", urgency: "High", tenantName: "Jessica Adams", tenantPhone: "503-555-1211", tenantEmail: "jadams@email.com", status: "In-Progress", photoUrls: [] });
    const req12 = await storage.createRequest({ propertyId: prop2.id, unitNumber: "412", issueType: "General Handyman", description: "Closet door came off track. Sliding door won't close. Also need weather stripping on front door.", urgency: "Low", tenantName: "Chris Patel", tenantPhone: "503-555-1212", tenantEmail: "cpatel@email.com", status: "New", photoUrls: [] });
    const req13 = await storage.createRequest({ propertyId: prop3.id, unitNumber: "A", issueType: "Pest Control", description: "Ants in kitchen — coming from gap near back door. Tried store-bought traps, they keep coming.", urgency: "Medium", tenantName: "Nina Kowalski", tenantPhone: "503-555-1213", tenantEmail: "nina.k@email.com", status: "Completed", photoUrls: [] });
    const req14 = await storage.createRequest({ propertyId: prop4.id, unitNumber: "2A", issueType: "Electrical", description: "Garbage disposal jammed and making humming noise. Reset button was pressed, still stuck.", urgency: "Low", tenantName: "Brandon Lee", tenantPhone: "503-555-1214", tenantEmail: "blee@email.com", status: "New", photoUrls: [] });

    const v1 = await storage.createVendor({ landlordId: ownerId, name: "Carlos Ruiz", companyName: "Ruiz Plumbing LLC", tradeCategory: "Plumbing", phone: "503-380-6482", email: "carlos@ruizplumbing.com", city: "Portland", serviceArea: "Metro Portland", preferredVendor: true, emergencyAvailable: true, status: "active", notes: "Reliable, always on time. Has 24/7 emergency line. Cleans up after every job.", licenseInfo: "OR Plumber #PL-44821", insuranceInfo: "Fully insured, $2M liability", lastJobCompletedAt: daysAgo(2) });
    const v2 = await storage.createVendor({ landlordId: ownerId, name: "Janet Park", companyName: "Bright Electric Co.", tradeCategory: "Electrical", phone: "503-555-2002", email: "janet@brightelectric.com", city: "Portland", serviceArea: "Portland & Beaverton", preferredVendor: true, emergencyAvailable: true, status: "active", notes: "Excellent for panel upgrades and emergency calls. Fast response times.", licenseInfo: "OR Electrician #EL-77203", insuranceInfo: "General liability $1M", lastJobCompletedAt: daysAgo(1) });
    const v3 = await storage.createVendor({ landlordId: ownerId, name: "Tom Wallace", companyName: "Cool Air Services", tradeCategory: "HVAC", phone: "503-555-2003", email: "tom@coolair.com", city: "Portland", serviceArea: "All Portland suburbs", preferredVendor: true, emergencyAvailable: false, status: "active", notes: "Good pricing on seasonal contracts. Great for preventive HVAC work.", licenseInfo: "OR HVAC #HC-55102", insuranceInfo: "Fully bonded, $1M liability", lastJobCompletedAt: daysAgo(5) });
    const v4 = await storage.createVendor({ landlordId: ownerId, name: "Marcus Lee", companyName: "Lee's Fix-It Services", tradeCategory: "General Handyman", phone: "503-555-2004", email: "marcus.fix@email.com", city: "Portland", serviceArea: "Inner SE/NE Portland", preferredVendor: false, emergencyAvailable: false, status: "active", notes: "Great for small jobs — drywall, doors, minor plumbing. Reasonable rates.", lastJobCompletedAt: daysAgo(8) });
    const v5 = await storage.createVendor({ landlordId: ownerId, name: "Sandra Vega", companyName: "Fresh Coat Painting", tradeCategory: "Painting", phone: "503-555-2005", email: "sandra@freshcoat.com", city: "Beaverton", serviceArea: "Portland & Beaverton", preferredVendor: false, emergencyAvailable: false, status: "active", notes: "Neat, fast painter. Provides written estimates. Books out 1–2 weeks.", licenseInfo: "OR Contractor #CCB-98712" });
    const v6 = await storage.createVendor({ landlordId: ownerId, name: "Derek Finch", companyName: "Finch Roofing & Gutters", tradeCategory: "Roofing", phone: "503-555-2006", email: "derek@finchroofing.com", city: "Gresham", serviceArea: "Portland Metro + Gresham", preferredVendor: false, emergencyAvailable: true, noShowCount: 1, status: "active", notes: "Emergency tarp service available. Had one no-show — always confirm day-of.", licenseInfo: "OR Contractor #CCB-112983", insuranceInfo: "Fully insured, $2M liability" });
    const v7 = await storage.createVendor({ landlordId: ownerId, name: "Amy Chen", companyName: "PDX Locksmith Pro", tradeCategory: "General Handyman", phone: "503-555-2007", email: "amy@pdxlocksmith.com", city: "Portland", serviceArea: "All Portland", preferredVendor: false, emergencyAvailable: true, status: "active", notes: "24/7 lockout service. Also handles deadbolt installs and key systems.", licenseInfo: "OR Locksmith #LK-8834" });
    const v8 = await storage.createVendor({ landlordId: ownerId, name: "Mike Brennan", companyName: "Brennan Appliance Repair", tradeCategory: "Appliance", phone: "503-555-2008", email: "mike@brennanappliance.com", city: "Lake Oswego", serviceArea: "Portland Metro", preferredVendor: true, emergencyAvailable: false, status: "active", notes: "Factory authorized for most major brands. Usually same-week availability.", licenseInfo: "EPA Certified #608-44291", insuranceInfo: "Insured, $1M liability", lastJobCompletedAt: daysAgo(10) });
    const v9 = await storage.createVendor({ landlordId: ownerId, name: "Rosa Gutierrez", companyName: "Green Guard Pest Control", tradeCategory: "Pest Control", phone: "503-555-2009", email: "rosa@greenguardpest.com", city: "Portland", serviceArea: "Portland & surrounding", preferredVendor: false, emergencyAvailable: false, status: "active", notes: "Eco-friendly treatments. Great with ants, rodents, and wasps. Quarterly contracts available.", licenseInfo: "ODA Pest #PC-2291" });
    const v10 = await storage.createVendor({ landlordId: ownerId, name: "Jake Morrison", companyName: "Morrison Landscaping", tradeCategory: "Landscaping", phone: "503-555-2010", email: "jake@morrisonlandscaping.com", city: "Milwaukie", serviceArea: "SE Portland & Milwaukie", preferredVendor: false, emergencyAvailable: false, status: "active", notes: "Monthly maintenance contracts. Good pricing for multi-property deals." });

    await storage.assignVendorToRequest({ requestId: req1.id, vendorId: v1.id, landlordId: ownerId, assignedBy: ownerId, contactedVendor: true, priority: "High", jobStatus: "in-progress", scheduledDate: daysAgo(0), arrivalWindow: "8 AM – 10 AM", startedAt: hoursFromNow(-2), assignmentNotes: "Carlos confirmed. Replacing supply line under kitchen sink." });
    await storage.assignVendorToRequest({ requestId: req2.id, vendorId: v2.id, landlordId: ownerId, assignedBy: ownerId, contactedVendor: true, priority: "Emergency", jobStatus: "in-progress", scheduledDate: daysAgo(0), arrivalWindow: "ASAP", startedAt: hoursFromNow(-1), assignmentNotes: "Janet responding immediately — tenant advised to shut off breaker." });
    await storage.assignVendorToRequest({ requestId: req3.id, vendorId: v3.id, landlordId: ownerId, assignedBy: ownerId, contactedVendor: true, priority: "Emergency", jobStatus: "scheduled", scheduledDate: hoursFromNow(4), arrivalWindow: "2 PM – 4 PM", assignmentNotes: "Tom confirmed for this afternoon. Tenant using space heaters meanwhile." });
    await storage.assignVendorToRequest({ requestId: req4.id, vendorId: v8.id, landlordId: ownerId, assignedBy: ownerId, contactedVendor: true, priority: "Normal", jobStatus: "scheduled", scheduledDate: hoursFromNow(26), arrivalWindow: "10 AM – 12 PM", assignmentNotes: "Mike checking dishwasher motor and drain pump tomorrow morning." });
    await storage.assignVendorToRequest({ requestId: req5.id, vendorId: v1.id, landlordId: ownerId, assignedBy: ownerId, contactedVendor: true, priority: "Normal", jobStatus: "completed", scheduledDate: daysAgo(3), completedAt: daysAgo(3), completionNotes: "Replaced flapper valve and fill valve. Toilet running perfectly now. Tenant confirmed.", invoiceNumber: "RP-2026-0147", materialsUsed: "Fluidmaster 400A fill valve, Korky flapper", finalCost: 18500 });
    await storage.assignVendorToRequest({ requestId: req8.id, vendorId: v1.id, landlordId: ownerId, assignedBy: ownerId, contactedVendor: true, priority: "Normal", jobStatus: "scheduled", scheduledDate: hoursFromNow(48), arrivalWindow: "1 PM – 3 PM", assignmentNotes: "Carlos will snake the drain. May need to pull tub drain assembly." });
    await storage.assignVendorToRequest({ requestId: req10.id, vendorId: v3.id, landlordId: ownerId, assignedBy: ownerId, contactedVendor: true, priority: "Normal", jobStatus: "completed", scheduledDate: daysAgo(6), completedAt: daysAgo(5), completionNotes: "Replaced dual run capacitor and recharged R-410A. System cooling to spec. Tenant confirmed 72°F.", invoiceNumber: "CAS-2026-0089", materialsUsed: "Dual run capacitor 45/5uF 440V, R-410A refrigerant 2.5 lbs", finalCost: 34500 });
    await storage.assignVendorToRequest({ requestId: req11.id, vendorId: v6.id, landlordId: ownerId, assignedBy: ownerId, contactedVendor: true, priority: "High", jobStatus: "in-progress", scheduledDate: daysAgo(1), startedAt: daysAgo(1), arrivalWindow: "Morning", assignmentNotes: "Derek applied emergency tarp yesterday. Full repair today." });
    await storage.assignVendorToRequest({ requestId: req13.id, vendorId: v9.id, landlordId: ownerId, assignedBy: ownerId, contactedVendor: true, priority: "Normal", jobStatus: "completed", scheduledDate: daysAgo(4), completedAt: daysAgo(4), completionNotes: "Applied gel bait treatment and sealed entry points near back door. Follow-up in 2 weeks recommended.", invoiceNumber: "GG-2026-0055", materialsUsed: "Advion ant gel, silicone caulk", finalCost: 12500 });
    await storage.assignVendorToRequest({ requestId: req9.id, vendorId: v8.id, landlordId: ownerId, assignedBy: ownerId, contactedVendor: false, priority: "High", jobStatus: "assigned", assignmentNotes: "Mike assigned — need to call him to confirm availability for fridge diagnostic." });

    await storage.createCost({ requestId: req1.id, landlordId: ownerId, description: "Plumber service call — supply line repair", amount: 17500, vendor: "Ruiz Plumbing LLC" });
    await storage.createCost({ requestId: req2.id, landlordId: ownerId, description: "Emergency electrician — outlet & wiring inspection", amount: 22000, vendor: "Bright Electric Co." });
    await storage.createCost({ requestId: req5.id, landlordId: ownerId, description: "Toilet repair — parts and labor", amount: 18500, vendor: "Ruiz Plumbing LLC" });
    await storage.createCost({ requestId: req5.id, landlordId: ownerId, description: "Fill valve + flapper (parts)", amount: 4200, vendor: "Home Depot" });
    await storage.createCost({ requestId: req10.id, landlordId: ownerId, description: "HVAC capacitor replacement + refrigerant recharge", amount: 34500, vendor: "Cool Air Services" });
    await storage.createCost({ requestId: req11.id, landlordId: ownerId, description: "Emergency roof tarp + inspection", amount: 45000, vendor: "Finch Roofing & Gutters" });
    await storage.createCost({ requestId: req13.id, landlordId: ownerId, description: "Ant treatment — gel bait + sealing", amount: 12500, vendor: "Green Guard Pest Control" });
    await storage.createCost({ requestId: req8.id, landlordId: ownerId, description: "Drain snaking estimate (deposit)", amount: 7500, vendor: "Ruiz Plumbing LLC" });
    await storage.createCost({ requestId: req4.id, landlordId: ownerId, description: "Dishwasher diagnostic fee", amount: 8500, vendor: "Brennan Appliance Repair" });
    await storage.createCost({ requestId: req3.id, landlordId: ownerId, description: "Emergency HVAC call — estimated", amount: 28000, vendor: "Cool Air Services" });

    await storage.createNote({ requestId: req1.id, authorId: ownerId, authorName: "Chris Mayeaux", content: "Carlos on-site now. Says it's the hot water supply line — corroded fitting. Should be done by noon." });
    await storage.createNote({ requestId: req2.id, authorId: ownerId, authorName: "Chris Mayeaux", content: "URGENT: Janet dispatched immediately. Tenant told to kill breaker to that circuit. Possible arc fault." });
    await storage.createNote({ requestId: req3.id, authorId: ownerId, authorName: "Chris Mayeaux", content: "Tom confirmed for 2 PM today. Dropped off two space heaters for tenant in the meantime." });
    await storage.createNote({ requestId: req5.id, authorId: ownerId, authorName: "Chris Mayeaux", content: "Carlos fixed it in 30 min. New flapper and fill valve. Toilet runs perfectly now. Tenant happy." });
    await storage.createNote({ requestId: req10.id, authorId: ownerId, authorName: "Chris Mayeaux", content: "Tom replaced the capacitor and recharged refrigerant. Unit is back to 72°F. Tenant confirmed all good." });
    await storage.createNote({ requestId: req11.id, authorId: ownerId, authorName: "Chris Mayeaux", content: "Derek tarped the roof yesterday. Coming back today for permanent patch. Tenant moved to guest room." });
    await storage.createNote({ requestId: req13.id, authorId: ownerId, authorName: "Chris Mayeaux", content: "Rosa treated with eco-friendly gel bait. Sealed gap under back door. Will check back in 2 weeks." });

    await storage.createStaff({ landlordId: ownerId, name: "Mike Thompson", email: "mike@hawthorneprop.com", phone: "503-555-3001" });
    await storage.createStaff({ landlordId: ownerId, name: "Ana Rodriguez", email: "ana@hawthorneprop.com", phone: "503-555-3002" });
    await storage.createStaff({ landlordId: ownerId, name: "Jake Owens", email: "jake@hawthorneprop.com", phone: "503-555-3003" });
    await storage.createStaff({ landlordId: ownerId, name: "Priya Sharma", email: "priya@hawthorneprop.com", phone: "503-555-3004" });

    await storage.createRecurringTask({ landlordId: ownerId, propertyId: prop1.id, title: "HVAC Filter Change", description: "Replace all HVAC filters in units and common areas", frequency: "quarterly", nextDueDate: new Date(now.getTime() + 18 * 86400000), isActive: true });
    await storage.createRecurringTask({ landlordId: ownerId, propertyId: prop2.id, title: "Fire Extinguisher Inspection", description: "Annual inspection and tag update for all fire extinguishers", frequency: "annually", nextDueDate: new Date(now.getTime() + 90 * 86400000), isActive: true });
    await storage.createRecurringTask({ landlordId: ownerId, propertyId: prop3.id, title: "Pest Control — Quarterly", description: "Perimeter spray and interior bait stations for all units", frequency: "quarterly", nextDueDate: new Date(now.getTime() + 12 * 86400000), isActive: true });
    await storage.createRecurringTask({ landlordId: ownerId, propertyId: prop4.id, title: "Gutter Cleaning", description: "Clean gutters and downspouts on all buildings", frequency: "biannually", nextDueDate: new Date(now.getTime() - 2 * 86400000), isActive: true });
    await storage.createRecurringTask({ landlordId: ownerId, propertyId: prop1.id, title: "Smoke Detector Battery Check", description: "Test all smoke/CO detectors and replace batteries", frequency: "biannually", nextDueDate: new Date(now.getTime() + 45 * 86400000), isActive: true });
    await storage.createRecurringTask({ landlordId: ownerId, propertyId: prop5.id, title: "Landscaping — Monthly", description: "Lawn mowing, hedge trimming, and leaf cleanup", frequency: "monthly", nextDueDate: new Date(now.getTime() + 5 * 86400000), isActive: true });

    await storage.createVendorReview({ requestId: req5.id, vendorId: v1.id, landlordId: ownerId, qualityRating: 5, speedRating: 5, communicationRating: 5, priceRating: 4, overallRating: 5, reviewNotes: "Carlos is fantastic — fixed the toilet in 30 min, texted me a photo when done, cleaned up perfectly. Will always call him first." });
    await storage.createVendorReview({ requestId: req10.id, vendorId: v3.id, landlordId: ownerId, qualityRating: 5, speedRating: 4, communicationRating: 4, priceRating: 3, overallRating: 4, reviewNotes: "Good work overall. Took an extra day to get out but the repair was solid and tenant is happy now." });
    await storage.createVendorReview({ requestId: req13.id, vendorId: v9.id, landlordId: ownerId, qualityRating: 5, speedRating: 5, communicationRating: 5, priceRating: 5, overallRating: 5, reviewNotes: "Rosa was thorough — sealed every entry point, used eco-friendly products. Ants gone within 48 hours. Highly recommend." });

    await storage.createActivityLog({ requestId: req1.id, landlordId: ownerId, eventType: "request_created", eventLabel: "Request Created", details: "Sofia Ramirez submitted via QR code — kitchen sink leak" });
    await storage.createActivityLog({ requestId: req1.id, landlordId: ownerId, eventType: "vendor_assigned", eventLabel: "Vendor Assigned", details: "Carlos Ruiz (Ruiz Plumbing LLC) assigned — High priority" });
    await storage.createActivityLog({ requestId: req1.id, landlordId: ownerId, eventType: "vendor_contacted", eventLabel: "Vendor Contacted", details: "Carlos confirmed — arriving 8–10 AM" });
    await storage.createActivityLog({ requestId: req1.id, landlordId: ownerId, eventType: "job_in_progress", eventLabel: "Work Started", details: "Carlos on-site, replacing supply line" });
    await storage.createActivityLog({ requestId: req2.id, landlordId: ownerId, eventType: "request_created", eventLabel: "Request Created", details: "David Nguyen reported sparking outlet — EMERGENCY" });
    await storage.createActivityLog({ requestId: req2.id, landlordId: ownerId, eventType: "vendor_assigned", eventLabel: "Vendor Assigned", details: "Janet Park (Bright Electric Co.) dispatched — Emergency" });
    await storage.createActivityLog({ requestId: req2.id, landlordId: ownerId, eventType: "job_in_progress", eventLabel: "Work Started", details: "Janet on-site inspecting outlet and wiring" });
    await storage.createActivityLog({ requestId: req5.id, landlordId: ownerId, eventType: "request_created", eventLabel: "Request Created", details: "Lisa Park reported running toilet" });
    await storage.createActivityLog({ requestId: req5.id, landlordId: ownerId, eventType: "vendor_assigned", eventLabel: "Vendor Assigned", details: "Carlos Ruiz assigned — Normal priority" });
    await storage.createActivityLog({ requestId: req5.id, landlordId: ownerId, eventType: "job_scheduled", eventLabel: "Schedule Set", details: `Scheduled for ${daysAgo(3).toLocaleDateString()}` });
    await storage.createActivityLog({ requestId: req5.id, landlordId: ownerId, eventType: "job_completed", eventLabel: "Job Completed", details: "Toilet repaired — new flapper and fill valve. Tenant confirmed." });
    await storage.createActivityLog({ requestId: req5.id, landlordId: ownerId, eventType: "vendor_reviewed", eventLabel: "Vendor Reviewed", details: "5/5 overall — Carlos is top tier" });
    await storage.createActivityLog({ requestId: req10.id, landlordId: ownerId, eventType: "request_created", eventLabel: "Request Created", details: "Ryan Foster reported AC blowing warm air" });
    await storage.createActivityLog({ requestId: req10.id, landlordId: ownerId, eventType: "vendor_assigned", eventLabel: "Vendor Assigned", details: "Tom Wallace (Cool Air Services) assigned" });
    await storage.createActivityLog({ requestId: req10.id, landlordId: ownerId, eventType: "job_completed", eventLabel: "Job Completed", details: "Capacitor replaced, refrigerant recharged. System cooling to 72°F." });
    await storage.createActivityLog({ requestId: req10.id, landlordId: ownerId, eventType: "vendor_reviewed", eventLabel: "Vendor Reviewed", details: "4/5 overall — solid repair" });
    await storage.createActivityLog({ requestId: req11.id, landlordId: ownerId, eventType: "request_created", eventLabel: "Request Created", details: "Jessica Adams reported roof leak during rain — High priority" });
    await storage.createActivityLog({ requestId: req11.id, landlordId: ownerId, eventType: "vendor_assigned", eventLabel: "Vendor Assigned", details: "Derek Finch (Finch Roofing) assigned — emergency tarp + repair" });
    await storage.createActivityLog({ requestId: req11.id, landlordId: ownerId, eventType: "job_in_progress", eventLabel: "Work Started", details: "Emergency tarp applied yesterday. Full repair in progress today." });
    await storage.createActivityLog({ requestId: req13.id, landlordId: ownerId, eventType: "request_created", eventLabel: "Request Created", details: "Nina Kowalski reported ant infestation in kitchen" });
    await storage.createActivityLog({ requestId: req13.id, landlordId: ownerId, eventType: "vendor_assigned", eventLabel: "Vendor Assigned", details: "Rosa Gutierrez (Green Guard Pest Control) assigned" });
    await storage.createActivityLog({ requestId: req13.id, landlordId: ownerId, eventType: "job_completed", eventLabel: "Job Completed", details: "Gel bait applied, entry points sealed. Follow-up in 2 weeks." });
    await storage.createActivityLog({ requestId: req13.id, landlordId: ownerId, eventType: "vendor_reviewed", eventLabel: "Vendor Reviewed", details: "5/5 — eco-friendly, thorough, fast results" });

    console.log("Owner walkthrough demo data seeded successfully");
  }

  ensureOwnerAccount();

  async function seedDemoData() {
    const existing = await storage.getProperties(DEMO_USER_ID);
    if (existing.length > 0) return;

    const prop1 = await storage.createProperty({ landlordId: DEMO_USER_ID, name: "Sunset Apartments", address: "450 Sunset Blvd, Portland, OR 97201" });
    const prop2 = await storage.createProperty({ landlordId: DEMO_USER_ID, name: "Riverside Condos", address: "1200 River Dr, Portland, OR 97232" });

    const now = new Date();
    const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000);
    const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3600000);

    // ── Maintenance Requests in various states ────────────────────────────────
    const req1 = await storage.createRequest({ propertyId: prop1.id, unitNumber: "3A", issueType: "Plumbing", description: "Kitchen faucet leaking constantly — water pooling under sink cabinet.", urgency: "High", tenantName: "Maria Garcia", tenantPhone: "503-555-0101", tenantEmail: "maria.g@email.com", status: "In-Progress", photoUrls: [] });
    const req2 = await storage.createRequest({ propertyId: prop1.id, unitNumber: "7B", issueType: "Electrical", description: "Bathroom GFCI outlet sparking when plugging in hairdryer. Possible wiring issue.", urgency: "Emergency", tenantName: "James Wilson", tenantPhone: "503-555-0202", tenantEmail: "jwilson@email.com", status: "New", photoUrls: [] });
    const req3 = await storage.createRequest({ propertyId: prop2.id, unitNumber: "12C", issueType: "HVAC", description: "Central AC not cooling. Thermostat set to 72°F but reading 85°F inside.", urgency: "Medium", tenantName: "Sarah Chen", tenantPhone: "503-555-0303", tenantEmail: "schen@email.com", status: "Completed", photoUrls: [] });
    const req4 = await storage.createRequest({ propertyId: prop1.id, unitNumber: "5A", issueType: "Appliance", description: "Dishwasher making loud grinding noise and not draining. Standing water in unit.", urgency: "Low", tenantName: "David Kim", tenantPhone: "503-555-0404", tenantEmail: "dkim@email.com", status: "New", photoUrls: [] });
    const req5 = await storage.createRequest({ propertyId: prop2.id, unitNumber: "8D", issueType: "Plumbing", description: "Toilet running continuously — been like this 3 days, wasting water.", urgency: "Medium", tenantName: "Lisa Johnson", tenantPhone: "503-555-0505", tenantEmail: "ljohnson@email.com", status: "In-Progress", photoUrls: [] });
    const req6 = await storage.createRequest({ propertyId: prop2.id, unitNumber: "4B", issueType: "Painting", description: "Water damage stains on bedroom ceiling from previous leak. Need repaint.", urgency: "Low", tenantName: "Alex Torres", tenantPhone: "503-555-0606", tenantEmail: "atorres@email.com", status: "New", photoUrls: [] });
    const req7 = await storage.createRequest({ propertyId: prop1.id, unitNumber: "2F", issueType: "Electrical", description: "Porch light fixture not working. Replaced bulb — still no power.", urgency: "Low", tenantName: "Rachel Moore", tenantPhone: "503-555-0707", tenantEmail: "rmoore@email.com", status: "New", photoUrls: [] });

    // ── Costs ─────────────────────────────────────────────────────────────────
    await storage.createCost({ requestId: req1.id, landlordId: DEMO_USER_ID, description: "Plumber service call", amount: 15000, vendor: "Ruiz Plumbing LLC" });
    await storage.createCost({ requestId: req1.id, landlordId: DEMO_USER_ID, description: "Replacement faucet parts", amount: 8500, vendor: "Home Depot" });
    await storage.createCost({ requestId: req3.id, landlordId: DEMO_USER_ID, description: "HVAC repair — compressor recharge", amount: 32000, vendor: "Cool Air Services" });
    await storage.createCost({ requestId: req5.id, landlordId: DEMO_USER_ID, description: "Toilet flapper + fill valve replacement", amount: 4500, vendor: "Marcus Lee Handyman" });

    // ── Notes ─────────────────────────────────────────────────────────────────
    await storage.createNote({ requestId: req1.id, authorId: DEMO_USER_ID, authorName: "Demo Landlord", content: "Carlos on-site now. Says it's the supply line — should be done by noon." });
    await storage.createNote({ requestId: req2.id, authorId: DEMO_USER_ID, authorName: "Demo Landlord", content: "URGENT: Janet dispatched for today. Tenant advised to avoid outlet." });
    await storage.createNote({ requestId: req3.id, authorId: DEMO_USER_ID, authorName: "Demo Landlord", content: "Compressor replaced under warranty. Unit cooling properly. Tenant satisfied." });

    // ── Staff ─────────────────────────────────────────────────────────────────
    await storage.createStaff({ landlordId: DEMO_USER_ID, name: "Mike Thompson", email: "mike@maintenance.com", phone: "503-555-1001" });
    await storage.createStaff({ landlordId: DEMO_USER_ID, name: "Ana Rodriguez", email: "ana@maintenance.com", phone: "503-555-1002" });

    // ── Recurring Tasks ───────────────────────────────────────────────────────
    await storage.createRecurringTask({ landlordId: DEMO_USER_ID, propertyId: prop1.id, title: "HVAC Filter Change", description: "Replace all HVAC filters in common areas", frequency: "quarterly", nextDueDate: new Date(now.getTime() + 15 * 86400000), isActive: true });
    await storage.createRecurringTask({ landlordId: DEMO_USER_ID, propertyId: prop2.id, title: "Smoke Detector Check", description: "Test all smoke detectors and replace batteries if needed", frequency: "biannually", nextDueDate: new Date(now.getTime() - 3 * 86400000), isActive: true });
    await storage.createRecurringTask({ landlordId: DEMO_USER_ID, propertyId: prop1.id, title: "Fire Extinguisher Inspection", description: "Annual inspection of all fire extinguishers", frequency: "annually", nextDueDate: new Date(now.getTime() + 60 * 86400000), isActive: true });

    // ── Vendors with trust/performance data ───────────────────────────────────
    const v1 = await storage.createVendor({ landlordId: DEMO_USER_ID, name: "Carlos Ruiz", companyName: "Ruiz Plumbing LLC", tradeCategory: "Plumbing", phone: "503-555-2001", email: "carlos@ruizplumbing.com", city: "Portland", serviceArea: "Metro Portland", preferredVendor: true, emergencyAvailable: true, status: "active", notes: "Always on time. Has 24/7 emergency line. Cleans up after every job.", licenseInfo: "OR Plumber #PL-44821", insuranceInfo: "Fully insured, $2M liability", lastJobCompletedAt: daysAgo(2) });
    const v2 = await storage.createVendor({ landlordId: DEMO_USER_ID, name: "Janet Park", companyName: "Bright Electric Co.", tradeCategory: "Electrical", phone: "503-555-2002", email: "janet@brightelectric.com", city: "Portland", serviceArea: "Portland & Beaverton", preferredVendor: true, emergencyAvailable: true, status: "active", notes: "Excellent for panel upgrades and emergency calls. Fast response times.", licenseInfo: "OR Electrician #EL-77203", insuranceInfo: "General liability $1M", lastJobCompletedAt: daysAgo(1) });
    const v3 = await storage.createVendor({ landlordId: DEMO_USER_ID, name: "Tom Wallace", companyName: "Cool Air Services", tradeCategory: "HVAC", phone: "503-555-2003", email: "tom@coolair.com", city: "Portland", serviceArea: "All Portland suburbs", preferredVendor: false, emergencyAvailable: false, status: "active", notes: "Good pricing on seasonal contracts. Slower response on urgent requests.", lastJobCompletedAt: daysAgo(5) });
    const v4 = await storage.createVendor({ landlordId: DEMO_USER_ID, name: "Marcus Lee", companyName: null, tradeCategory: "General Handyman", phone: "503-555-2004", email: "marcus.fix@email.com", city: "Portland", serviceArea: "Inner SE/NE Portland", preferredVendor: false, emergencyAvailable: false, status: "active", notes: "Great for small jobs — drywall, doors, minor plumbing. Reasonable rates." });
    const v5 = await storage.createVendor({ landlordId: DEMO_USER_ID, name: "Sandra Vega", companyName: "Fresh Coat Painting", tradeCategory: "Painting", phone: "503-555-2005", email: "sandra@freshcoat.com", city: "Beaverton", serviceArea: "Portland & Beaverton", preferredVendor: false, emergencyAvailable: false, status: "active", notes: "Neat, fast painter. Provides written estimates. Books out 1–2 weeks." });
    const v6 = await storage.createVendor({ landlordId: DEMO_USER_ID, name: "Derek Finch", companyName: "Finch Roofing", tradeCategory: "Roofing", phone: "503-555-2006", email: "derek@finchroofing.com", city: "Gresham", serviceArea: "Portland Metro + Gresham", preferredVendor: false, emergencyAvailable: true, noShowCount: 1, status: "active", notes: "Used twice. First job great; second time was a no-show — call ahead to confirm.", licenseInfo: "OR Contractor #CCB-112983" });

    // ── Vendor Assignments across requests ────────────────────────────────────

    // req1: Plumbing - In-Progress with Carlos, contacted, scheduled for today
    const tomorrow = hoursFromNow(20);
    await storage.assignVendorToRequest({ requestId: req1.id, vendorId: v1.id, landlordId: DEMO_USER_ID, assignedBy: DEMO_USER_ID, contactedVendor: true, priority: "High", jobStatus: "in-progress", scheduledDate: tomorrow, arrivalWindow: "8 AM – 10 AM", assignmentNotes: "Carlos confirmed. On-site this morning to replace supply line." });

    // req2: Electrical - Emergency, assigned to Janet
    await storage.assignVendorToRequest({ requestId: req2.id, vendorId: v2.id, landlordId: DEMO_USER_ID, assignedBy: DEMO_USER_ID, contactedVendor: true, priority: "Emergency", jobStatus: "contacted", assignmentNotes: "Janet responding today. Tenant told not to use outlet." });

    // req3: HVAC - Completed with Tom, has proof of completion
    const completedDate = daysAgo(5);
    await storage.assignVendorToRequest({ requestId: req3.id, vendorId: v3.id, landlordId: DEMO_USER_ID, assignedBy: DEMO_USER_ID, contactedVendor: true, priority: "Normal", jobStatus: "completed", scheduledDate: daysAgo(7), completedAt: completedDate, completionNotes: "Replaced capacitor and recharged refrigerant. Unit cooling to spec. Tenant confirmed comfortable temperatures.", invoiceNumber: "CAS-2024-0312", materialsUsed: "Dual run capacitor (440V, 45/5uF), R-410A refrigerant 2lbs", finalCost: 32000 });

    // req5: Plumbing - In-Progress with Marcus
    await storage.assignVendorToRequest({ requestId: req5.id, vendorId: v4.id, landlordId: DEMO_USER_ID, assignedBy: DEMO_USER_ID, contactedVendor: true, priority: "Normal", jobStatus: "scheduled", scheduledDate: hoursFromNow(48), arrivalWindow: "2 PM – 5 PM", assignmentNotes: "Marcus available Thursday afternoon." });

    // ── Vendor Reviews ─────────────────────────────────────────────────────────
    await storage.createVendorReview({ requestId: req1.id, vendorId: v1.id, landlordId: DEMO_USER_ID, qualityRating: 5, speedRating: 5, communicationRating: 5, priceRating: 4, overallRating: 5, reviewNotes: "Carlos is fantastic — fixed the leak quickly, cleaned up, and texted me a photo when done. Will always use him." });
    await storage.createVendorReview({ requestId: req3.id, vendorId: v3.id, landlordId: DEMO_USER_ID, qualityRating: 4, speedRating: 3, communicationRating: 4, priceRating: 3, overallRating: 4, reviewNotes: "Good work overall. Took longer to arrive than promised but the repair was solid and tenant is happy." });

    // ── Activity Logs ─────────────────────────────────────────────────────────
    await storage.createActivityLog({ requestId: req1.id, landlordId: DEMO_USER_ID, eventType: "request_created", eventLabel: "Request Created", details: "Maria Garcia submitted via QR code" });
    await storage.createActivityLog({ requestId: req1.id, landlordId: DEMO_USER_ID, eventType: "vendor_assigned", eventLabel: "Vendor Assigned", details: "Carlos Ruiz (Ruiz Plumbing LLC) assigned — High priority" });
    await storage.createActivityLog({ requestId: req1.id, landlordId: DEMO_USER_ID, eventType: "vendor_contacted", eventLabel: "Vendor Contacted", details: "Landlord confirmed call with vendor" });
    await storage.createActivityLog({ requestId: req1.id, landlordId: DEMO_USER_ID, eventType: "job_in_progress", eventLabel: "Work Started", details: "Carlos on-site, work in progress" });
    await storage.createActivityLog({ requestId: req2.id, landlordId: DEMO_USER_ID, eventType: "request_created", eventLabel: "Request Created", details: "James Wilson submitted via QR code — Emergency" });
    await storage.createActivityLog({ requestId: req2.id, landlordId: DEMO_USER_ID, eventType: "vendor_assigned", eventLabel: "Vendor Assigned", details: "Janet Park (Bright Electric Co.) assigned — Emergency priority" });
    await storage.createActivityLog({ requestId: req2.id, landlordId: DEMO_USER_ID, eventType: "vendor_contacted", eventLabel: "Vendor Contacted", details: "Landlord confirmed contact — Janet responding today" });
    await storage.createActivityLog({ requestId: req3.id, landlordId: DEMO_USER_ID, eventType: "vendor_assigned", eventLabel: "Vendor Assigned", details: "Tom Wallace (Cool Air Services) assigned" });
    await storage.createActivityLog({ requestId: req3.id, landlordId: DEMO_USER_ID, eventType: "job_scheduled", eventLabel: "Schedule Set", details: `Scheduled for ${daysAgo(7).toLocaleDateString()}` });
    await storage.createActivityLog({ requestId: req3.id, landlordId: DEMO_USER_ID, eventType: "job_completed", eventLabel: "Job Completed", details: "Compressor repaired. Tenant confirmed unit cooling correctly." });
    await storage.createActivityLog({ requestId: req3.id, landlordId: DEMO_USER_ID, eventType: "vendor_reviewed", eventLabel: "Vendor Reviewed", details: "4/5 overall rating" });

    console.log("TenantTrack demo data seeded successfully");
  }

  app.post("/api/demo-login", async (req: any, res) => {
    try {
      await authStorage.upsertUser({
        id: DEMO_USER_ID,
        email: DEMO_EMAIL,
        firstName: "Demo",
        lastName: "Landlord",
        profileImageUrl: null,
      });

      await db.update(users).set({ subscriptionTier: "pro", companyName: "Demo Property Management" }).where(eq(users.id, DEMO_USER_ID));

      await seedDemoData();

      const demoUser = {
        claims: { sub: DEMO_USER_ID, email: DEMO_EMAIL, first_name: "Demo", last_name: "Landlord" },
        isLocalAuth: true,
      };

      req.login(demoUser, (err: any) => {
        if (err) {
          console.error("Demo login error:", err);
          return res.status(500).json({ message: "Login failed" });
        }
        res.json({ success: true });
      });
    } catch (err) {
      console.error("Demo login error:", err);
      res.status(500).json({ message: "Demo login failed" });
    }
  });

  // ── Email/Password Auth ─────────────────────────────────────────────────────

  function generateVerificationCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  app.post("/api/auth/signup", async (req: any, res) => {
    try {
      const { email, password, firstName, lastName } = z.object({
        email: z.string().email(),
        password: z.string().min(8),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
      }).parse(req.body);

      const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existing.length > 0) {
        return res.status(400).json({ message: "An account with this email already exists." });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const newId = crypto.randomUUID();
      const [newUser] = await db.insert(users).values({
        id: newId,
        email,
        firstName,
        lastName,
        passwordHash,
        subscriptionTier: "free",
        emailVerified: false,
      }).returning();

      const code = generateVerificationCode();
      await db.update(emailVerificationCodes).set({ usedAt: new Date() }).where(and(eq(emailVerificationCodes.email, email), isNull(emailVerificationCodes.usedAt)));
      await db.insert(emailVerificationCodes).values({
        userId: newId,
        email,
        code,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });

      sendVerificationCodeEmail({ email, code, firstName }).catch(err => console.error("Verification email error:", err));

      res.json({ success: true, requiresVerification: true, email: newUser.email });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Signup error:", err);
      res.status(500).json({ message: "Signup failed. Please try again." });
    }
  });

  app.post("/api/auth/signin", async (req: any, res) => {
    try {
      const { email, password } = z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }).parse(req.body);

      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid email or password." });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password." });
      }

      if (!user.emailVerified) {
        const code = generateVerificationCode();
        await db.update(emailVerificationCodes).set({ usedAt: new Date() }).where(and(eq(emailVerificationCodes.email, user.email!), isNull(emailVerificationCodes.usedAt)));
        await db.insert(emailVerificationCodes).values({
          userId: user.id,
          email: user.email!,
          code,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        });
        sendVerificationCodeEmail({ email: user.email!, code, firstName: user.firstName || "there" }).catch(err => console.error("Verification email error:", err));
        return res.status(403).json({ message: "Please verify your email first.", requiresVerification: true, email: user.email });
      }

      const sessionUser = {
        claims: { sub: user.id, email: user.email, first_name: user.firstName, last_name: user.lastName },
        isLocalAuth: true,
      };

      req.login(sessionUser, (err: any) => {
        if (err) return res.status(500).json({ message: "Login failed." });
        res.json({ success: true, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } });
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Signin error:", err);
      res.status(500).json({ message: "Sign in failed. Please try again." });
    }
  });

  app.post("/api/auth/verify-email", async (req: any, res) => {
    try {
      const { email, code } = z.object({
        email: z.string().email(),
        code: z.string().length(6),
      }).parse(req.body);

      const [record] = await db.select().from(emailVerificationCodes)
        .where(and(eq(emailVerificationCodes.email, email), eq(emailVerificationCodes.code, code), isNull(emailVerificationCodes.usedAt)))
        .orderBy(desc(emailVerificationCodes.createdAt))
        .limit(1);

      if (!record) {
        return res.status(400).json({ message: "Invalid verification code." });
      }

      if (new Date() > record.expiresAt) {
        return res.status(400).json({ message: "Verification code has expired. Please request a new one." });
      }

      await db.update(emailVerificationCodes).set({ usedAt: new Date() }).where(eq(emailVerificationCodes.id, record.id));
      await db.update(users).set({ emailVerified: true }).where(eq(users.id, record.userId));

      const [user] = await db.select().from(users).where(eq(users.id, record.userId)).limit(1);

      const sessionUser = {
        claims: { sub: user.id, email: user.email, first_name: user.firstName, last_name: user.lastName },
        isLocalAuth: true,
      };

      req.login(sessionUser, (err: any) => {
        if (err) return res.status(500).json({ message: "Login failed after verification." });
        res.json({ success: true, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } });
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Verify email error:", err);
      res.status(500).json({ message: "Verification failed. Please try again." });
    }
  });

  app.post("/api/auth/resend-verification", async (req: any, res) => {
    try {
      const { email } = z.object({ email: z.string().email() }).parse(req.body);

      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!user) {
        return res.json({ success: true });
      }

      if (user.emailVerified) {
        return res.json({ success: true, message: "Email already verified." });
      }

      const code = generateVerificationCode();
      await db.update(emailVerificationCodes).set({ usedAt: new Date() }).where(and(eq(emailVerificationCodes.email, user.email!), isNull(emailVerificationCodes.usedAt)));
      await db.insert(emailVerificationCodes).values({
        userId: user.id,
        email: user.email!,
        code,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });

      sendVerificationCodeEmail({ email: user.email!, code, firstName: user.firstName || "there" }).catch(err => console.error("Resend verification email error:", err));

      res.json({ success: true });
    } catch (err) {
      console.error("Resend verification error:", err);
      res.status(500).json({ message: "Failed to resend code." });
    }
  });

  app.post("/api/auth/forgot-password", async (req: any, res) => {
    try {
      const { email } = z.object({ email: z.string().email() }).parse(req.body);

      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!user) {
        return res.json({ success: true });
      }

      const token = crypto.randomBytes(32).toString("hex");
      await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(and(eq(passwordResetTokens.userId, user.id), isNull(passwordResetTokens.usedAt)));
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      const APP_URL = process.env.APP_URL || "https://www.tenant-track.com";
      const resetUrl = `${APP_URL}/reset-password?token=${token}`;

      sendPasswordResetEmail({ email: user.email!, resetUrl }).catch(err => console.error("Password reset email error:", err));

      res.json({ success: true });
    } catch (err) {
      console.error("Forgot password error:", err);
      res.status(500).json({ message: "Failed to send reset email." });
    }
  });

  app.post("/api/auth/reset-password", async (req: any, res) => {
    try {
      const { token, password } = z.object({
        token: z.string().min(1),
        password: z.string().min(8),
      }).parse(req.body);

      const [record] = await db.select().from(passwordResetTokens)
        .where(and(eq(passwordResetTokens.token, token), isNull(passwordResetTokens.usedAt)))
        .limit(1);

      if (!record) {
        return res.status(400).json({ message: "Invalid or expired reset link." });
      }

      if (new Date() > record.expiresAt) {
        return res.status(400).json({ message: "This reset link has expired. Please request a new one." });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      await db.update(users).set({ passwordHash }).where(eq(users.id, record.userId));
      await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, record.id));

      res.json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Reset password error:", err);
      res.status(500).json({ message: "Failed to reset password." });
    }
  });

  app.get(api.properties.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const props = await storage.getProperties(userId);
      res.json(props);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  app.get(api.properties.get.path, async (req, res) => {
    try {
      const prop = await storage.getProperty(Number(req.params.id));
      if (!prop) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(prop);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });

  app.post(api.properties.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.properties.create.input.parse(req.body);
      const userId = req.user.claims.sub;
      const prop = await storage.createProperty({ ...input, landlordId: userId });
      res.status(201).json(prop);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to create property" });
    }
  });

  app.delete('/api/properties/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const property = await storage.getProperty(Number(req.params.id));
      if (!property || property.landlordId !== userId) {
        return res.status(404).json({ message: "Property not found" });
      }
      await storage.deleteProperty(Number(req.params.id));
      res.json({ message: "Property deleted" });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete property" });
    }
  });

  app.get(api.requests.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requests = await storage.getRequestsByLandlord(userId);
      res.json(requests);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch requests" });
    }
  });

  app.get('/api/requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestId = Number(req.params.id);
      const request = await storage.getRequest(requestId);
      if (!request) return res.status(404).json({ message: "Request not found" });
      const prop = await storage.getProperty(request.propertyId);
      if (!prop || prop.landlordId !== userId) return res.status(403).json({ message: "Forbidden" });
      res.json(request);
    } catch {
      res.status(500).json({ message: "Failed to fetch request" });
    }
  });

  app.post(api.requests.create.path, async (req, res) => {
    try {
      const bodySchema = api.requests.create.input.extend({
        propertyId: z.coerce.number()
      });
      const input = bodySchema.parse(req.body);
      
      const prop = await storage.getProperty(input.propertyId);
      if (!prop) {
         return res.status(404).json({ message: "Property not found" });
      }
      
      const request = await storage.createRequest({ ...input, status: "New" });
      res.status(201).json(request);

      // Fire-and-forget: email landlord about new request
      (async () => {
        try {
          const [landlord] = await db.select().from(users).where(eq(users.id, prop.landlordId)).limit(1);
          if (landlord?.email) {
            await sendNewRequestEmail({
              landlordEmail: landlord.email,
              landlordName: `${landlord.firstName || ""} ${landlord.lastName || ""}`.trim() || "Landlord",
              tenantName: request.tenantName,
              propertyName: prop.name,
              unitNumber: request.unitNumber,
              issueType: request.issueType,
              urgency: request.urgency,
              description: request.description,
              trackingCode: request.trackingCode,
            });
          }
        } catch (e) { console.error("Email send error:", e); }
      })();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to create request" });
    }
  });

  app.patch(api.requests.updateStatus.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.requests.updateStatus.input.parse(req.body);
      const request = await storage.updateRequestStatus(Number(req.params.id), input.status);
      res.json(request);

      // Fire-and-forget: email tenant about status update
      (async () => {
        try {
          if (request.tenantEmail) {
            const prop = await storage.getProperty(request.propertyId);
            await sendStatusUpdateEmail({
              tenantEmail: request.tenantEmail,
              tenantName: request.tenantName,
              propertyName: prop?.name || "Your property",
              unitNumber: request.unitNumber,
              issueType: request.issueType,
              newStatus: request.status,
              trackingCode: request.trackingCode,
            });
          }
        } catch (e) { console.error("Email send error:", e); }
      })();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to update request" });
    }
  });

  app.delete('/api/requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const landlordRequests = await storage.getRequestsByLandlord(userId);
      const ownedRequest = landlordRequests.find(r => r.id === Number(req.params.id));
      if (!ownedRequest) {
        return res.status(404).json({ message: "Request not found" });
      }
      await storage.deleteRequest(Number(req.params.id));
      res.json({ message: "Request deleted" });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete request" });
    }
  });

  app.get(api.staff.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const staff = await storage.getStaff(userId);
      res.json(staff);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch staff" });
    }
  });

  app.post(api.staff.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.staff.create.input.parse(req.body);
      const userId = req.user.claims.sub;
      const staff = await storage.createStaff({ ...input, landlordId: userId });
      res.status(201).json(staff);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to create staff" });
    }
  });

  app.delete('/api/staff/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const staffList = await storage.getStaff(userId);
      const staffMember = staffList.find(s => s.id === Number(req.params.id));
      if (!staffMember) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      await storage.deleteStaff(Number(req.params.id));
      res.json({ message: "Staff member deleted" });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete staff member" });
    }
  });

  app.patch('/api/requests/:id/assign', isAuthenticated, async (req: any, res) => {
    try {
      const input = api.requests.assign.input.parse(req.body);
      const userId = req.user.claims.sub;

      const landlordRequests = await storage.getRequestsByLandlord(userId);
      const ownedRequest = landlordRequests.find(r => r.id === Number(req.params.id));
      if (!ownedRequest) {
        return res.status(404).json({ message: "Request not found" });
      }

      if (input.staffId === 0) {
        const request = await storage.unassignRequest(Number(req.params.id));
        return res.json(request);
      }

      const staffList = await storage.getStaff(userId);
      const staffMember = staffList.find(s => s.id === input.staffId);
      if (!staffMember) {
        return res.status(400).json({ message: "Staff member does not belong to your team" });
      }
      const request = await storage.assignRequest(Number(req.params.id), input.staffId);
      res.json(request);

      // Fire-and-forget: email staff member about assignment
      (async () => {
        try {
          if (staffMember.email) {
            const prop = await storage.getProperty(ownedRequest.propertyId);
            await sendStaffAssignmentEmail({
              staffEmail: staffMember.email,
              staffName: staffMember.name,
              propertyName: prop?.name || "The property",
              unitNumber: ownedRequest.unitNumber,
              issueType: ownedRequest.issueType,
              urgency: ownedRequest.urgency,
              description: ownedRequest.description,
              tenantName: ownedRequest.tenantName,
              tenantPhone: ownedRequest.tenantPhone,
            });
          }
        } catch (e) { console.error("Email send error:", e); }
      })();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to assign request" });
    }
  });

  app.get('/api/requests/track/:code', async (req, res) => {
    try {
      const request = await storage.getRequestByTrackingCode(req.params.code);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      const property = await storage.getProperty(request.propertyId);
      res.json({
        id: request.id,
        unitNumber: request.unitNumber,
        issueType: request.issueType,
        description: request.description,
        urgency: request.urgency,
        status: request.status,
        createdAt: request.createdAt ? request.createdAt.toISOString() : null,
        propertyName: property?.name || "Unknown Property",
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to track request" });
    }
  });

  app.get('/api/messages/:requestId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const landlordRequests = await storage.getRequestsByLandlord(userId);
      const ownedRequest = landlordRequests.find(r => r.id === Number(req.params.requestId));
      if (!ownedRequest) {
        return res.status(404).json({ message: "Request not found" });
      }
      const messages = await storage.getMessagesByRequest(Number(req.params.requestId));
      res.json(messages);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/messages/:requestId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const landlordRequests = await storage.getRequestsByLandlord(userId);
      const ownedRequest = landlordRequests.find(r => r.id === Number(req.params.requestId));
      if (!ownedRequest) {
        return res.status(404).json({ message: "Request not found" });
      }
      const { content } = req.body;
      if (!content || !content.trim()) {
        return res.status(400).json({ message: "Message content is required" });
      }
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      const senderName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Landlord';
      const message = await storage.createMessage({
        requestId: Number(req.params.requestId),
        senderType: "landlord",
        senderName,
        content: content.trim(),
      });
      res.status(201).json(message);
    } catch (err) {
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get('/api/requests/track/:code/messages', async (req, res) => {
    try {
      const request = await storage.getRequestByTrackingCode(req.params.code);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      const messages = await storage.getMessagesByRequest(request.id);
      res.json(messages);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/requests/track/:code/messages', async (req, res) => {
    try {
      const request = await storage.getRequestByTrackingCode(req.params.code);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      const { content, senderName } = req.body;
      if (!content || !content.trim()) {
        return res.status(400).json({ message: "Message content is required" });
      }
      const message = await storage.createMessage({
        requestId: request.id,
        senderType: "tenant",
        senderName: senderName?.trim() || request.tenantName,
        content: content.trim(),
      });
      res.status(201).json(message);
    } catch (err) {
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        companyName: user.companyName,
        profileImageUrl: user.profileImageUrl,
        subscriptionTier: user.subscriptionTier || 'trial',
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.patch('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const schema = z.object({
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        phone: z.string().optional(),
        companyName: z.string().optional(),
      });
      const input = schema.parse(req.body);
      const [updated] = await db.update(users)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();
      res.json({
        id: updated.id,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        phone: updated.phone,
        companyName: updated.companyName,
        profileImageUrl: updated.profileImageUrl,
        subscriptionTier: updated.subscriptionTier || 'trial',
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get('/api/stripe/publishable-key', async (_req, res) => {
    try {
      const key = await getStripePublishableKey();
      res.json({ publishableKey: key });
    } catch (err) {
      res.status(500).json({ message: "Failed to get Stripe key" });
    }
  });

  app.get('/api/stripe/plans', async (_req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.metadata as product_metadata,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency,
          pr.recurring
        FROM stripe.products p
        LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        WHERE p.active = true AND p.metadata->>'tier' IS NOT NULL
        ORDER BY pr.unit_amount ASC
      `);

      if (result.rows.length > 0) {
        return res.json(result.rows);
      }

      const stripe = await getUncachableStripeClient();
      const products = await stripe.products.list({ active: true, limit: 100 });
      const plans: any[] = [];
      for (const product of products.data) {
        if (!product.metadata?.tier) continue;
        const prices = await stripe.prices.list({ product: product.id, active: true, limit: 1 });
        const price = prices.data[0];
        if (!price) continue;
        plans.push({
          product_id: product.id,
          product_name: product.name,
          product_description: product.description,
          product_metadata: product.metadata,
          price_id: price.id,
          unit_amount: price.unit_amount,
          currency: price.currency,
          recurring: price.recurring,
        });
      }
      plans.sort((a, b) => (a.unit_amount || 0) - (b.unit_amount || 0));
      res.json(plans);
    } catch (err) {
      console.error("Failed to fetch plans:", err);
      res.json([]);
    }
  });

  app.get('/api/stripe/subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user?.stripeSubscriptionId) {
        return res.json({ subscription: null, tier: user?.subscriptionTier || 'trial' });
      }

      const subResult = await db.execute(
        sql`SELECT * FROM stripe.subscriptions WHERE id = ${user.stripeSubscriptionId}`
      );
      res.json({ 
        subscription: subResult.rows[0] || null, 
        tier: user?.subscriptionTier || 'trial',
        stripeCustomerId: user?.stripeCustomerId 
      });
    } catch (err) {
      console.error("Failed to fetch subscription:", err);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  app.post('/api/stripe/checkout', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { priceId, tier } = req.body;

      if (!priceId || !tier) {
        return res.status(400).json({ message: "Missing priceId or tier" });
      }

      const validTiers = ['starter', 'growth', 'pro'];
      if (!validTiers.includes(tier)) {
        return res.status(400).json({ message: "Invalid tier" });
      }

      const stripe = await getUncachableStripeClient();
      try {
        const priceObj = await stripe.prices.retrieve(priceId, { expand: ['product'] });
        const product = priceObj.product as any;
        if (!priceObj.active || !product?.active || product?.metadata?.tier !== tier) {
          return res.status(400).json({ message: "Invalid price for the selected plan" });
        }
      } catch {
        return res.status(400).json({ message: "Invalid price for the selected plan" });
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) return res.status(404).json({ message: "User not found" });

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          metadata: { userId },
        });
        customerId = customer.id;
        await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, userId));
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        subscription_data: {
          trial_period_days: 14,
          metadata: { userId, tier },
        },
        success_url: `${req.protocol}://${req.get('host')}/?checkout=success`,
        cancel_url: `${req.protocol}://${req.get('host')}/?checkout=cancel`,
      });

      res.json({ url: session.url });
    } catch (err) {
      console.error("Checkout error:", err);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  app.post('/api/stripe/portal', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [user] = await db.select().from(users).where(eq(users.id, userId));

      if (!user?.stripeCustomerId) {
        return res.status(400).json({ message: "No billing account found" });
      }

      const stripe = await getUncachableStripeClient();
      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${req.protocol}://${req.get('host')}/billing`,
      });

      res.json({ url: session.url });
    } catch (err) {
      console.error("Portal error:", err);
      res.status(500).json({ message: "Failed to create portal session" });
    }
  });

  app.get('/api/notes/:requestId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestId = Number(req.params.requestId);
      const landlordRequests = await storage.getRequestsByLandlord(userId);
      if (!landlordRequests.find(r => r.id === requestId)) {
        return res.status(404).json({ message: "Request not found" });
      }
      const notes = await storage.getNotesByRequest(requestId);
      res.json(notes);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  app.post('/api/notes/:requestId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestId = Number(req.params.requestId);
      const landlordRequests = await storage.getRequestsByLandlord(userId);
      if (!landlordRequests.find(r => r.id === requestId)) {
        return res.status(404).json({ message: "Request not found" });
      }
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      const schema = z.object({ content: z.string().min(1).max(2000) });
      const input = schema.parse(req.body);
      const note = await storage.createNote({
        requestId,
        authorId: userId,
        authorName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email || 'Landlord',
        content: input.content,
      });
      res.status(201).json(note);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create note" });
    }
  });

  app.get('/api/tenants', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requests = await storage.getRequestsByLandlord(userId);
      const props = await storage.getProperties(userId);
      const propMap = new Map(props.map(p => [p.id, p.name]));

      const tenantMap = new Map<string, any>();
      for (const r of requests) {
        const key = `${r.tenantEmail.toLowerCase()}-${r.tenantPhone}`;
        if (!tenantMap.has(key)) {
          tenantMap.set(key, {
            name: r.tenantName,
            email: r.tenantEmail,
            phone: r.tenantPhone,
            requestCount: 0,
            properties: new Set<string>(),
            lastRequest: r.createdAt,
          });
        }
        const t = tenantMap.get(key)!;
        t.requestCount++;
        t.properties.add(propMap.get(r.propertyId) || 'Unknown');
        if (r.createdAt && (!t.lastRequest || r.createdAt > t.lastRequest)) {
          t.lastRequest = r.createdAt;
        }
      }

      const tenants = Array.from(tenantMap.values()).map(t => ({
        ...t,
        properties: Array.from(t.properties),
      }));
      tenants.sort((a: any, b: any) => (b.lastRequest?.getTime?.() || 0) - (a.lastRequest?.getTime?.() || 0));
      res.json(tenants);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch tenants" });
    }
  });

  app.delete('/api/tenants', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const schema = z.object({
        email: z.string().email(),
        phone: z.string().min(1),
      });
      const { email, phone } = schema.parse(req.body);
      await storage.deleteTenantRequests(userId, email, phone);
      res.json({ message: "Tenant and all associated requests deleted" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Failed to delete tenant" });
    }
  });

  // === REPAIR COSTS ROUTES ===
  // Static routes MUST come before parameterized :requestId route
  app.get('/api/costs/report', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, endDate, propertyId } = req.query;
      const costs = await storage.getCostsByLandlord(userId);
      const landlordRequests = await storage.getRequestsByLandlord(userId);
      const props = await storage.getProperties(userId);
      const requestMap = new Map(landlordRequests.map(r => [Number(r.id), r]));
      const propMap = new Map(props.map(p => [Number(p.id), p]));

      let filtered = costs.filter(c => {
        const request = requestMap.get(Number(c.requestId));
        if (!request) return false;
        if (propertyId && Number(request.propertyId) !== Number(propertyId)) return false;
        if (startDate && c.createdAt) {
          const costDate = new Date(c.createdAt).getTime();
          const filterStart = new Date(startDate as string).getTime();
          if (costDate < filterStart) return false;
        }
        if (endDate && c.createdAt) {
          const costDate = new Date(c.createdAt).getTime();
          const filterEnd = new Date(endDate as string + 'T23:59:59').getTime();
          if (costDate > filterEnd) return false;
        }
        return true;
      });

      const grouped: Record<string, { propertyName: string; costs: any[]; total: number }> = {};
      for (const cost of filtered) {
        const request = requestMap.get(Number(cost.requestId))!;
        const prop = propMap.get(Number(request.propertyId));
        const propName = prop?.name || 'Unknown';
        if (!grouped[propName]) grouped[propName] = { propertyName: propName, costs: [], total: 0 };
        grouped[propName].costs.push({
          ...cost,
          unitNumber: request.unitNumber,
          issueType: request.issueType,
          requestDescription: request.description,
        });
        grouped[propName].total += cost.amount;
      }

      const totalSpent = filtered.reduce((s, c) => s + c.amount, 0);
      const uniqueRequests = new Set(filtered.map(c => c.requestId)).size;
      res.json({
        totalSpent,
        averagePerRequest: uniqueRequests > 0 ? Math.round(totalSpent / uniqueRequests) : 0,
        numberOfRepairs: filtered.length,
        byProperty: Object.values(grouped),
      });
    } catch (err) {
      console.error("Cost report error:", err);
      res.status(500).json({ message: "Failed to generate cost report" });
    }
  });

  app.get('/api/costs/export', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, endDate, propertyId } = req.query;
      const costs = await storage.getCostsByLandlord(userId);
      const landlordRequests = await storage.getRequestsByLandlord(userId);
      const props = await storage.getProperties(userId);
      const requestMap = new Map(landlordRequests.map(r => [Number(r.id), r]));
      const propMap = new Map(props.map(p => [Number(p.id), p]));

      let filtered = costs.filter(c => {
        const request = requestMap.get(Number(c.requestId));
        if (!request) return false;
        if (propertyId && Number(request.propertyId) !== Number(propertyId)) return false;
        if (startDate && c.createdAt) {
          const costDate = new Date(c.createdAt).getTime();
          const filterStart = new Date(startDate as string).getTime();
          if (costDate < filterStart) return false;
        }
        if (endDate && c.createdAt) {
          const costDate = new Date(c.createdAt).getTime();
          const filterEnd = new Date(endDate as string + 'T23:59:59').getTime();
          if (costDate > filterEnd) return false;
        }
        return true;
      });

      const rows = [['Date', 'Property', 'Unit', 'Issue', 'Description', 'Vendor', 'Amount'].join(',')];
      for (const cost of filtered) {
        const request = requestMap.get(Number(cost.requestId))!;
        const prop = propMap.get(Number(request.propertyId));
        const escapeCsv = (v: string) => `"${(v || '').replace(/"/g, '""')}"`;
        rows.push([
          cost.createdAt ? new Date(cost.createdAt).toISOString().split('T')[0] : '',
          escapeCsv(prop?.name || 'Unknown'),
          escapeCsv(request.unitNumber),
          escapeCsv(request.issueType),
          escapeCsv(cost.description),
          escapeCsv(cost.vendor || ''),
          (cost.amount / 100).toFixed(2),
        ].join(','));
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="cost-report.csv"');
      res.send(rows.join('\n'));
    } catch (err) {
      console.error("Cost export error:", err);
      res.status(500).json({ message: "Failed to export costs" });
    }
  });

  app.get('/api/costs/:requestId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestId = Number(req.params.requestId);
      const landlordRequests = await storage.getRequestsByLandlord(userId);
      if (!landlordRequests.find(r => r.id === requestId)) {
        return res.status(404).json({ message: "Request not found" });
      }
      const costs = await storage.getCostsByRequest(requestId);
      res.json(costs);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch costs" });
    }
  });

  app.post('/api/costs/:requestId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestId = Number(req.params.requestId);
      const landlordRequests = await storage.getRequestsByLandlord(userId);
      if (!landlordRequests.find(r => r.id === requestId)) {
        return res.status(404).json({ message: "Request not found" });
      }
      const schema = z.object({
        description: z.string().min(1).max(500),
        amount: z.number().int().positive(),
        vendor: z.string().max(200).optional(),
        receiptUrl: z.string().url().optional(),
      });
      const input = schema.parse(req.body);
      const cost = await storage.createCost({
        requestId,
        landlordId: userId,
        description: input.description,
        amount: input.amount,
        vendor: input.vendor || null,
        receiptUrl: input.receiptUrl || null,
      });
      res.status(201).json(cost);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create cost" });
    }
  });

  app.delete('/api/costs/:costId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const costs = await storage.getCostsByLandlord(userId);
      const cost = costs.find(c => c.id === Number(req.params.costId));
      if (!cost) {
        return res.status(404).json({ message: "Cost not found" });
      }
      await storage.deleteCost(Number(req.params.costId));
      res.json({ message: "Cost deleted" });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete cost" });
    }
  });

  // === RECURRING TASKS ROUTES ===
  app.get('/api/recurring', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tasks = await storage.getRecurringTasks(userId);
      res.json(tasks);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch recurring tasks" });
    }
  });

  app.post('/api/recurring', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const schema = z.object({
        propertyId: z.number().int().positive(),
        title: z.string().min(1).max(200),
        description: z.string().max(1000).optional(),
        frequency: z.enum(['weekly', 'biweekly', 'monthly', 'quarterly', 'biannually', 'annually']),
        nextDueDate: z.coerce.date(),
      });
      const input = schema.parse(req.body);
      const props = await storage.getProperties(userId);
      if (!props.find(p => p.id === input.propertyId)) {
        return res.status(400).json({ message: "Property not found" });
      }
      const task = await storage.createRecurringTask({
        landlordId: userId,
        propertyId: input.propertyId,
        title: input.title,
        description: input.description || null,
        frequency: input.frequency,
        nextDueDate: input.nextDueDate,
        lastCompletedDate: null,
        isActive: true,
      });
      res.status(201).json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create recurring task" });
    }
  });

  app.patch('/api/recurring/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const taskId = Number(req.params.id);
      const task = await storage.getRecurringTask(taskId);
      if (!task || task.landlordId !== userId) {
        return res.status(404).json({ message: "Task not found" });
      }
      const schema = z.object({
        title: z.string().min(1).max(200).optional(),
        description: z.string().max(1000).optional(),
        frequency: z.enum(['weekly', 'biweekly', 'monthly', 'quarterly', 'biannually', 'annually']).optional(),
        nextDueDate: z.coerce.date().optional(),
        isActive: z.boolean().optional(),
      });
      const input = schema.parse(req.body);
      const updated = await storage.updateRecurringTask(taskId, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Failed to update recurring task" });
    }
  });

  app.post('/api/recurring/:id/complete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const taskId = Number(req.params.id);
      const task = await storage.getRecurringTask(taskId);
      if (!task || task.landlordId !== userId) {
        return res.status(404).json({ message: "Task not found" });
      }
      const now = new Date();
      const next = new Date(now);
      switch (task.frequency) {
        case 'weekly': next.setDate(next.getDate() + 7); break;
        case 'biweekly': next.setDate(next.getDate() + 14); break;
        case 'monthly': next.setMonth(next.getMonth() + 1); break;
        case 'quarterly': next.setMonth(next.getMonth() + 3); break;
        case 'biannually': next.setMonth(next.getMonth() + 6); break;
        case 'annually': next.setFullYear(next.getFullYear() + 1); break;
      }
      const updated = await storage.completeRecurringTask(taskId, next);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to complete recurring task" });
    }
  });

  app.delete('/api/recurring/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const taskId = Number(req.params.id);
      const task = await storage.getRecurringTask(taskId);
      if (!task || task.landlordId !== userId) {
        return res.status(404).json({ message: "Task not found" });
      }
      await storage.deleteRecurringTask(taskId);
      res.json({ message: "Task deleted" });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete recurring task" });
    }
  });

  // ── Vendor Routes ──────────────────────────────────────────────────────────

  app.get('/api/vendors', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const list = await storage.getVendorsByLandlord(userId);
      res.json(list);
    } catch {
      res.status(500).json({ message: "Failed to fetch vendors" });
    }
  });

  app.get('/api/vendors/top', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const top = await storage.getTopVendors(userId);
      res.json(top.slice(0, 5));
    } catch {
      res.status(500).json({ message: "Failed to fetch top vendors" });
    }
  });

  app.get('/api/vendors/recommendations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tradeCategory = String(req.query.tradeCategory || "");
      if (!tradeCategory) return res.json([]);
      const recs = await storage.getVendorRecommendations(userId, tradeCategory);
      res.json(recs.slice(0, 5));
    } catch {
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  app.get('/api/vendors/:id/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const vendorId = Number(req.params.id);
      const vendor = await storage.getVendor(vendorId);
      if (!vendor || vendor.landlordId !== userId) return res.status(404).json({ message: "Vendor not found" });
      const stats = await storage.getVendorStats(vendorId, userId);
      res.json(stats);
    } catch {
      res.status(500).json({ message: "Failed to fetch vendor stats" });
    }
  });

  app.get('/api/vendors/:id/reviews', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const vendorId = Number(req.params.id);
      const vendor = await storage.getVendor(vendorId);
      if (!vendor || vendor.landlordId !== userId) return res.status(404).json({ message: "Vendor not found" });
      const reviews = await storage.getVendorReviews(vendorId, userId);
      res.json(reviews);
    } catch {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // ── Vendor Job History ─────────────────────────────────────────────────────
  app.get('/api/vendors/:id/jobs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const vendorId = Number(req.params.id);
      const vendor = await storage.getVendor(vendorId);
      if (!vendor || vendor.landlordId !== userId) return res.status(404).json({ message: "Vendor not found" });

      const assignments = await db.select().from(vendorAssignments)
        .where(and(eq(vendorAssignments.vendorId, vendorId), eq(vendorAssignments.landlordId, userId)))
        .orderBy(desc(vendorAssignments.assignedAt));

      const jobsWithDetails = await Promise.all(assignments.map(async (a) => {
        const request = await storage.getRequest(a.requestId);
        const prop = request ? await storage.getProperty(request.propertyId) : null;
        const review = await storage.getVendorReviewForRequest(a.requestId);
        return { ...a, request, property: prop, review };
      }));

      res.json(jobsWithDetails);
    } catch {
      res.status(500).json({ message: "Failed to fetch vendor jobs" });
    }
  });

  // ── Analytics ───────────────────────────────────────────────────────────────
  app.get('/api/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const allRequests = await storage.getRequestsByLandlord(userId);
      const allProps = await storage.getProperties(userId);
      const allVendors = await storage.getVendorsByLandlord(userId);
      const allAssignments = await db.select().from(vendorAssignments).where(eq(vendorAssignments.landlordId, userId));
      const allReviews = await db.select().from(vendorReviews).where(eq(vendorReviews.landlordId, userId));

      // -- Category breakdown
      const categoryMap: Record<string, number> = {};
      for (const r of allRequests) {
        categoryMap[r.issueType] = (categoryMap[r.issueType] || 0) + 1;
      }
      const categoryBreakdown = Object.entries(categoryMap)
        .sort((a, b) => b[1] - a[1])
        .map(([category, count]) => ({ category, count }));

      // -- Volume by property
      const propMap: Record<number, { name: string; count: number }> = {};
      for (const p of allProps) propMap[p.id] = { name: p.name, count: 0 };
      for (const r of allRequests) {
        if (propMap[r.propertyId]) propMap[r.propertyId].count++;
      }
      const volumeByProperty = Object.values(propMap).sort((a, b) => b.count - a.count);

      // -- Request status summary
      const statusSummary = {
        new: allRequests.filter(r => r.status === 'New').length,
        inProgress: allRequests.filter(r => r.status === 'In-Progress').length,
        completed: allRequests.filter(r => r.status === 'Completed').length,
        total: allRequests.length,
      };

      // -- Overdue: open requests older than 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const overdueRequests = allRequests.filter(r =>
        r.status !== 'Completed' && new Date(r.createdAt!) < sevenDaysAgo
      );

      // -- Avg days to complete (from createdAt to completedAt on assignments)
      const completedAssignments = allAssignments.filter(a => a.completedAt && a.assignedAt);
      const avgDaysToComplete = completedAssignments.length > 0
        ? Math.round(completedAssignments.reduce((sum, a) => {
            return sum + (new Date(a.completedAt!).getTime() - new Date(a.assignedAt!).getTime()) / (1000 * 60 * 60 * 24);
          }, 0) / completedAssignments.length * 10) / 10
        : null;

      // -- Monthly trend (last 6 months)
      const monthlyTrend: Array<{ month: string; count: number }> = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        const count = allRequests.filter(r => {
          const rd = new Date(r.createdAt!);
          return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
        }).length;
        monthlyTrend.push({ month: monthLabel, count });
      }

      // -- Vendor leaderboard
      const activeVendors = allVendors.filter(v => v.status === 'active');
      const leaderboard = await Promise.all(activeVendors.map(async (v) => {
        const stats = await storage.getVendorStats(v.id, userId);
        return {
          id: v.id,
          name: v.name,
          companyName: v.companyName,
          tradeCategory: v.tradeCategory,
          preferredVendor: v.preferredVendor,
          trustScore: stats.trustScore,
          totalJobs: stats.totalJobs,
          completedJobs: stats.completedJobs,
          avgRating: stats.avgOverallRating,
          totalSpent: stats.totalSpent,
        };
      }));
      leaderboard.sort((a, b) => b.trustScore - a.trustScore);

      // -- Urgency breakdown
      const urgencyBreakdown = {
        emergency: allRequests.filter(r => r.urgency === 'Emergency').length,
        high: allRequests.filter(r => r.urgency === 'High').length,
        medium: allRequests.filter(r => r.urgency === 'Medium').length,
        low: allRequests.filter(r => r.urgency === 'Low').length,
      };

      // -- Avg rating across all reviews
      const ratings = allReviews.map(r => r.overallRating).filter((r): r is number => r !== null);
      const avgRating = ratings.length > 0 ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null;

      res.json({
        statusSummary,
        categoryBreakdown,
        volumeByProperty,
        overdueRequests: overdueRequests.length,
        overdueList: overdueRequests.slice(0, 10),
        avgDaysToComplete,
        monthlyTrend,
        leaderboard,
        urgencyBreakdown,
        avgRating,
        totalVendors: allVendors.filter(v => v.status === 'active').length,
        totalAssignments: allAssignments.length,
      });
    } catch (err) {
      console.error('Analytics error:', err);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.post('/api/vendors', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const input = z.object({
        name: z.string().min(1).max(200),
        companyName: z.string().max(200).optional(),
        tradeCategory: z.string().min(1),
        phone: z.string().max(50).optional(),
        email: z.string().email().optional().or(z.literal('')),
        city: z.string().max(100).optional(),
        serviceArea: z.string().max(200).optional(),
        notes: z.string().max(2000).optional(),
        preferredVendor: z.boolean().optional(),
        emergencyAvailable: z.boolean().optional(),
        licenseInfo: z.string().max(500).optional(),
        insuranceInfo: z.string().max(500).optional(),
      }).parse(req.body);
      const vendor = await storage.createVendor({ ...input, landlordId: userId, status: "active" });
      res.status(201).json(vendor);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to create vendor" });
    }
  });

  app.post('/api/vendors/import-photos', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const tier = user?.subscriptionTier || "trial";
      if (tier !== "growth" && tier !== "pro") {
        return res.status(403).json({ message: "Photo import requires Growth or Pro plan" });
      }

      const input = z.object({
        images: z.array(z.object({
          base64: z.string().min(1),
          mimeType: z.string().regex(/^image\/(png|jpeg|jpg|webp|gif|heic|heif)$/i),
        })).min(1).max(5),
      }).parse(req.body);

      const { extractVendorsFromImages } = await import("./vendorPhotoExtraction");
      const extracted = await extractVendorsFromImages(input.images);

      const existingVendors = await storage.getVendorsByLandlord(userId);
      const existingSet = new Set(
        existingVendors.map(v => `${v.name.toLowerCase()}|${v.tradeCategory.toLowerCase()}`)
      );

      const rows = extracted.map(v => {
        const errors: string[] = [];
        let status: "valid" | "invalid" | "duplicate" = "valid";
        if (!v.name) {
          status = "invalid";
          errors.push("Name is required");
        }
        if (!v.tradeCategory || !(TRADE_CATEGORIES as readonly string[]).includes(v.tradeCategory)) {
          status = "invalid";
          errors.push("Invalid trade category");
        }
        if (status === "valid") {
          const key = `${v.name.toLowerCase()}|${v.tradeCategory.toLowerCase()}`;
          if (existingSet.has(key)) {
            status = "duplicate";
            errors.push("Vendor with same name and trade already exists");
          }
        }
        return { ...v, status, errors, selected: status === "valid" };
      });

      res.json({ rows, processed: input.images.length });
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      const msg = err?.message || "Failed to read photos";
      console.error("Photo extraction error:", msg);
      res.status(500).json({ message: msg });
    }
  });

  app.post('/api/vendors/import', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const tier = user?.subscriptionTier || "trial";
      if (tier !== "growth" && tier !== "pro") {
        return res.status(403).json({ message: "Vendor import requires Growth or Pro plan" });
      }

      const vendorSchema = z.object({
        name: z.string().min(1).max(200),
        companyName: z.string().max(200).optional().default(""),
        tradeCategory: z.string().min(1),
        phone: z.string().max(50).optional().default(""),
        email: z.string().max(200).optional().default("").refine(
          (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
          { message: "Invalid email format" }
        ),
        city: z.string().max(100).optional().default(""),
        serviceArea: z.string().max(200).optional().default(""),
        notes: z.string().max(2000).optional().default(""),
        preferredVendor: z.boolean().optional().default(false),
        emergencyAvailable: z.boolean().optional().default(false),
        licenseInfo: z.string().max(500).optional().default(""),
        insuranceInfo: z.string().max(500).optional().default(""),
      });

      const body = z.object({
        vendors: z.array(z.record(z.unknown())).min(1).max(500),
        source: z.enum(["manual", "csv", "phonebook_photo"]).optional().default("csv"),
      }).parse(req.body);
      const results: { imported: number; failed: number; errors: string[] } = { imported: 0, failed: 0, errors: [] };

      const existingVendors = await storage.getVendorsByLandlord(userId);
      const existingSet = new Set(existingVendors.map((v) => `${v.name.toLowerCase()}|${v.tradeCategory.toLowerCase()}`));
      const batchSet = new Set<string>();

      for (let i = 0; i < body.vendors.length; i++) {
        try {
          const parsed = vendorSchema.parse(body.vendors[i]);
          if (!(TRADE_CATEGORIES as readonly string[]).includes(parsed.tradeCategory)) {
            results.failed++;
            results.errors.push(`Row ${i + 1}: Invalid trade category "${parsed.tradeCategory}"`);
            continue;
          }
          const key = `${parsed.name.toLowerCase()}|${parsed.tradeCategory.toLowerCase()}`;
          if (existingSet.has(key)) {
            results.failed++;
            results.errors.push(`Row ${i + 1}: Duplicate — vendor "${parsed.name}" (${parsed.tradeCategory}) already exists`);
            continue;
          }
          if (batchSet.has(key)) {
            results.failed++;
            results.errors.push(`Row ${i + 1}: Duplicate within file — "${parsed.name}" (${parsed.tradeCategory})`);
            continue;
          }
          batchSet.add(key);
          await storage.createVendor({
            ...parsed,
            landlordId: userId,
            status: "active",
            source: body.source,
          });
          existingSet.add(key);
          results.imported++;
        } catch (err) {
          results.failed++;
          if (err instanceof z.ZodError) {
            results.errors.push(`Row ${i + 1}: ${err.errors[0].message}`);
          } else {
            results.errors.push(`Row ${i + 1}: Failed to import`);
          }
        }
      }

      res.json(results);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to import vendors" });
    }
  });

  app.patch('/api/vendors/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const vendorId = Number(req.params.id);
      const vendor = await storage.getVendor(vendorId);
      if (!vendor || vendor.landlordId !== userId) return res.status(404).json({ message: "Vendor not found" });
      const input = z.object({
        name: z.string().min(1).max(200).optional(),
        companyName: z.string().max(200).optional().nullable(),
        tradeCategory: z.string().min(1).optional(),
        phone: z.string().max(50).optional().nullable(),
        email: z.string().max(200).optional().nullable(),
        city: z.string().max(100).optional().nullable(),
        serviceArea: z.string().max(200).optional().nullable(),
        notes: z.string().max(2000).optional().nullable(),
        preferredVendor: z.boolean().optional(),
        emergencyAvailable: z.boolean().optional(),
        noShowCount: z.number().int().min(0).optional(),
        licenseInfo: z.string().max(500).optional().nullable(),
        insuranceInfo: z.string().max(500).optional().nullable(),
        status: z.enum(["active", "archived"]).optional(),
      }).parse(req.body);
      const updated = await storage.updateVendor(vendorId, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to update vendor" });
    }
  });

  app.delete('/api/vendors/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const vendorId = Number(req.params.id);
      const vendor = await storage.getVendor(vendorId);
      if (!vendor || vendor.landlordId !== userId) return res.status(404).json({ message: "Vendor not found" });
      await storage.deleteVendor(vendorId);
      res.json({ message: "Vendor deleted" });
    } catch {
      res.status(500).json({ message: "Failed to delete vendor" });
    }
  });

  // ── Vendor Assignments ─────────────────────────────────────────────────────

  app.get('/api/requests/:id/vendor-assignment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestId = Number(req.params.id);
      const request = await storage.getRequest(requestId);
      if (!request) return res.status(404).json({ message: "Request not found" });
      const prop = await storage.getProperty(request.propertyId);
      if (!prop || prop.landlordId !== userId) return res.status(403).json({ message: "Forbidden" });
      const assignment = await storage.getVendorAssignmentByRequest(requestId);
      if (!assignment) return res.json(null);
      const vendor = await storage.getVendor(assignment.vendorId);
      res.json({ assignment, vendor });
    } catch {
      res.status(500).json({ message: "Failed to fetch vendor assignment" });
    }
  });

  app.patch('/api/requests/:id/vendor-assignment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestId = Number(req.params.id);
      const request = await storage.getRequest(requestId);
      if (!request) return res.status(404).json({ message: "Request not found" });
      const prop = await storage.getProperty(request.propertyId);
      if (!prop || prop.landlordId !== userId) return res.status(403).json({ message: "Forbidden" });

      const input = z.object({
        vendorId: z.number(),
        priority: z.string().optional(),
        assignmentNotes: z.string().optional(),
        targetCompletionDate: z.coerce.date().optional().nullable(),
        scheduledDate: z.coerce.date().optional().nullable(),
        jobStatus: z.string().optional(),
        arrivalWindow: z.string().optional().nullable(),
      }).parse(req.body);

      const selectedVendor = await storage.getVendor(input.vendorId);
      if (!selectedVendor || selectedVendor.landlordId !== userId) {
        return res.status(403).json({ message: "Vendor not found or does not belong to your account" });
      }

      const existing = await storage.getVendorAssignmentByRequest(requestId);
      let assignment: any;

      if (existing) {
        assignment = await storage.updateVendorAssignment(requestId, input);
        await storage.createActivityLog({ requestId, landlordId: userId, eventType: "vendor_reassigned", eventLabel: "Vendor Reassigned", details: `Reassigned to ${selectedVendor.name}` });
      } else {
        assignment = await storage.assignVendorToRequest({ requestId, landlordId: userId, assignedBy: userId, ...input });
        await storage.createActivityLog({ requestId, landlordId: userId, eventType: "vendor_assigned", eventLabel: "Vendor Assigned", details: `${selectedVendor.name}${selectedVendor.companyName ? ` (${selectedVendor.companyName})` : ''} assigned` });
      }
      if (request.status === "New") {
        await storage.updateRequestStatus(requestId, "In-Progress");
      }

      const magicToken = generateMagicToken();
      const slaMs = getSlaThreshold(request.urgency || "Medium");
      const responseDeadline = new Date(Date.now() + slaMs);
      const magicTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await storage.updateVendorAssignment(requestId, {
        magicToken,
        magicTokenExpiresAt,
        responseDeadline,
        vendorResponseStatus: "pending-response",
        vendorLinkSentAt: new Date(),
      });
      assignment = await storage.getVendorAssignmentByRequest(requestId);

      if (selectedVendor.email && magicToken) {
        const property = await storage.getProperty(request.propertyId);
        sendVendorDispatchEmail({
          vendorEmail: selectedVendor.email,
          vendorName: selectedVendor.name,
          propertyName: property?.name || "Property",
          unitNumber: request.unitNumber || "",
          issueType: request.issueType || "",
          urgency: request.urgency || "",
          description: request.description || "",
          magicToken,
        }).catch((err) => { console.error("Manual dispatch email error:", err); });

        await storage.createVendorNotification({
          assignmentId: assignment.id,
          vendorId: selectedVendor.id,
          landlordId: userId,
          notificationType: "dispatch",
          channel: "email",
        });

        await storage.createActivityLog({ requestId, landlordId: userId, eventType: "vendor_notified", eventLabel: "Vendor Notified", details: `Magic link email sent to ${selectedVendor.email}` });
      }

      res.json({ assignment, vendor: selectedVendor });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to assign vendor" });
    }
  });

  app.delete('/api/requests/:id/vendor-assignment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestId = Number(req.params.id);
      const request = await storage.getRequest(requestId);
      if (!request) return res.status(404).json({ message: "Request not found" });
      const prop = await storage.getProperty(request.propertyId);
      if (!prop || prop.landlordId !== userId) return res.status(403).json({ message: "Forbidden" });
      await storage.clearVendorAssignment(requestId);
      await storage.createActivityLog({ requestId, landlordId: userId, eventType: "vendor_removed", eventLabel: "Vendor Removed", details: "Vendor assignment cleared" });
      res.json({ message: "Assignment cleared" });
    } catch {
      res.status(500).json({ message: "Failed to clear assignment" });
    }
  });

  // ── Dispatch Update (job status, scheduling, proof of completion) ───────────

  app.patch('/api/requests/:id/dispatch', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestId = Number(req.params.id);
      const request = await storage.getRequest(requestId);
      if (!request) return res.status(404).json({ message: "Request not found" });
      const prop = await storage.getProperty(request.propertyId);
      if (!prop || prop.landlordId !== userId) return res.status(403).json({ message: "Forbidden" });

      const input = z.object({
        jobStatus: z.string().optional(),
        scheduledDate: z.coerce.date().optional().nullable(),
        arrivalWindow: z.string().optional().nullable(),
        startedAt: z.coerce.date().optional().nullable(),
        completedAt: z.coerce.date().optional().nullable(),
        completionNotes: z.string().max(3000).optional().nullable(),
        invoiceNumber: z.string().max(200).optional().nullable(),
        materialsUsed: z.string().max(1000).optional().nullable(),
        finalCost: z.number().int().optional().nullable(),
      }).parse(req.body);

      const existing = await storage.getVendorAssignmentByRequest(requestId);
      if (!existing) return res.status(404).json({ message: "No vendor assigned to this request" });

      const assignment = await storage.updateVendorAssignment(requestId, input);

      // Auto-log activity events based on job status changes
      const statusLabels: Record<string, string> = {
        "scheduled": "Schedule Set",
        "in-progress": "Work Started",
        "waiting-on-parts": "Waiting on Parts",
        "completed": "Job Completed",
        "cancelled": "Job Cancelled",
      };
      if (input.jobStatus && statusLabels[input.jobStatus]) {
        await storage.createActivityLog({
          requestId, landlordId: userId,
          eventType: `job_${input.jobStatus.replace(/-/g, "_")}`,
          eventLabel: statusLabels[input.jobStatus],
          details: input.jobStatus === "completed"
            ? `Job completed${input.completionNotes ? ": " + input.completionNotes.substring(0, 100) : ""}`
            : input.jobStatus === "scheduled" && input.scheduledDate
              ? `Scheduled for ${new Date(input.scheduledDate).toLocaleDateString()}`
              : undefined,
        });
      }

      // If job is completed, update vendor lastJobCompletedAt
      if (input.jobStatus === "completed" || input.completedAt) {
        await storage.updateVendor(existing.vendorId, { lastJobCompletedAt: input.completedAt || new Date() });
        // Auto-update request status to Completed
        await storage.updateRequestStatus(requestId, "Completed");
      }
      if (input.jobStatus === "in-progress") {
        await storage.updateRequestStatus(requestId, "In-Progress");
      }

      const vendor = await storage.getVendor(existing.vendorId);
      res.json({ assignment, vendor });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to update dispatch" });
    }
  });

  app.patch('/api/requests/:id/vendor-contacted', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestId = Number(req.params.id);
      const { contacted } = z.object({ contacted: z.boolean() }).parse(req.body);
      const request = await storage.getRequest(requestId);
      if (!request) return res.status(404).json({ message: "Request not found" });
      const prop = await storage.getProperty(request.propertyId);
      if (!prop || prop.landlordId !== userId) return res.status(403).json({ message: "Forbidden" });
      const assignment = await storage.updateVendorAssignment(requestId, { contactedVendor: contacted });
      if (contacted) {
        await storage.createActivityLog({ requestId, landlordId: userId, eventType: "vendor_contacted", eventLabel: "Vendor Contacted", details: "Landlord confirmed contact with vendor" });
      }
      res.json(assignment);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to update" });
    }
  });

  // ── Vendor Reviews ─────────────────────────────────────────────────────────

  app.get('/api/requests/:id/vendor-review', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestId = Number(req.params.id);
      const request = await storage.getRequest(requestId);
      if (!request) return res.status(404).json({ message: "Request not found" });
      const prop = await storage.getProperty(request.propertyId);
      if (!prop || prop.landlordId !== userId) return res.status(403).json({ message: "Forbidden" });
      const review = await storage.getVendorReviewForRequest(requestId);
      res.json(review ?? null);
    } catch {
      res.status(500).json({ message: "Failed to fetch review" });
    }
  });

  app.post('/api/requests/:id/vendor-review', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestId = Number(req.params.id);
      const request = await storage.getRequest(requestId);
      if (!request) return res.status(404).json({ message: "Request not found" });
      const prop = await storage.getProperty(request.propertyId);
      if (!prop || prop.landlordId !== userId) return res.status(403).json({ message: "Forbidden" });
      const assignment = await storage.getVendorAssignmentByRequest(requestId);
      if (!assignment) return res.status(400).json({ message: "No vendor assigned to this request" });

      const input = z.object({
        qualityRating: z.number().min(1).max(5).optional(),
        speedRating: z.number().min(1).max(5).optional(),
        communicationRating: z.number().min(1).max(5).optional(),
        priceRating: z.number().min(1).max(5).optional(),
        overallRating: z.number().min(1).max(5),
        reviewNotes: z.string().max(2000).optional(),
      }).parse(req.body);

      const review = await storage.createVendorReview({ requestId, vendorId: assignment.vendorId, landlordId: userId, ...input });
      await storage.createActivityLog({ requestId, landlordId: userId, eventType: "vendor_reviewed", eventLabel: "Vendor Reviewed", details: `${input.overallRating}/5 overall rating` });
      res.status(201).json(review);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to submit review" });
    }
  });

  // ── Activity Log ───────────────────────────────────────────────────────────

  app.get('/api/requests/:id/activity', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestId = Number(req.params.id);
      const request = await storage.getRequest(requestId);
      if (!request) return res.status(404).json({ message: "Request not found" });
      const prop = await storage.getProperty(request.propertyId);
      if (!prop || prop.landlordId !== userId) return res.status(403).json({ message: "Forbidden" });
      const activity = await storage.getActivityByRequest(requestId);
      res.json(activity);
    } catch {
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requests = await storage.getRequestsByLandlord(userId);
      const props = await storage.getProperties(userId);
      const totalRequests = requests.length;
      const newRequests = requests.filter(r => r.status === 'New').length;
      const inProgress = requests.filter(r => r.status === 'In-Progress').length;
      const completed = requests.filter(r => r.status === 'Completed').length;
      const emergencies = requests.filter(r => r.urgency === 'Emergency').length;

      // TenantTrack enhanced stats
      const vendorStats = await storage.getDashboardVendorStats(userId);

      res.json({
        totalRequests,
        newRequests,
        inProgress,
        completed,
        emergencies,
        totalProperties: props.length,
        needsDispatch: vendorStats.needsDispatch,
        scheduledToday: vendorStats.scheduledToday,
        completedThisWeek: vendorStats.completedThisWeek,
        openEmergencies: vendorStats.openEmergencies,
        avgVendorRating: vendorStats.avgVendorRating,
        topVendors: vendorStats.topVendors,
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // ── Auto-Dispatch Routes ──────────────────────────────────────────────────

  app.get('/api/requests/:id/dispatch-recommendation', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestId = parseInt(req.params.id);
      const request = await storage.getRequest(requestId);
      if (!request) return res.status(404).json({ message: "Request not found" });
      const scores = await scoreVendorsForRequest(request, userId);
      res.json(scores);
    } catch (err) {
      res.status(500).json({ message: "Failed to get recommendations" });
    }
  });

  app.post('/api/requests/:id/auto-dispatch', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestId = parseInt(req.params.id);
      const { mode } = req.body;
      if (!mode || !["recommend", "auto-assign"].includes(mode)) {
        return res.status(400).json({ message: "Invalid dispatch mode" });
      }
      const result = await autoDispatchRequest(requestId, userId, mode);

      if (result.assigned) {
        const request = await storage.getRequest(requestId);
        if (request?.status === "New") {
          await storage.updateRequestStatus(requestId, "In-Progress");
        }
        const vendor = await storage.getVendor(result.assigned.vendorId);
        if (vendor?.email && result.assigned.magicToken) {
          const property = request ? await storage.getProperty(request.propertyId) : null;
          sendVendorDispatchEmail({
            vendorEmail: vendor.email,
            vendorName: vendor.name,
            propertyName: property?.name || "Property",
            unitNumber: request?.unitNumber || "",
            issueType: request?.issueType || "",
            urgency: request?.urgency || "",
            description: request?.description || "",
            magicToken: result.assigned.magicToken,
          }).catch(() => {});

          await storage.createVendorNotification({
            assignmentId: result.assigned.id,
            vendorId: vendor.id,
            landlordId: userId,
            notificationType: "dispatch",
            channel: "email",
          });
        }
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Auto-dispatch failed" });
    }
  });

  // ── Vendor Portal (Magic Link - No Auth Required) ───────────────────────

  app.get('/api/vendor-portal/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const assignment = await storage.getVendorAssignmentByToken(token);
      if (!assignment) return res.status(404).json({ message: "Invalid or expired link" });

      if (assignment.magicTokenExpiresAt && new Date(assignment.magicTokenExpiresAt) < new Date()) {
        return res.status(410).json({ message: "This link has expired. Please ask the landlord to resend." });
      }

      const vendor = await storage.getVendor(assignment.vendorId);
      const request = await storage.getRequest(assignment.requestId);
      const property = request ? await storage.getProperty(request.propertyId) : null;

      res.json({
        assignment: {
          id: assignment.id,
          jobStatus: assignment.jobStatus,
          scheduledDate: assignment.scheduledDate,
          arrivalWindow: assignment.arrivalWindow,
          vendorResponseStatus: assignment.vendorResponseStatus,
          priority: assignment.priority,
          assignmentNotes: assignment.assignmentNotes,
          proposedTime: assignment.proposedTime,
          vendorNotes: assignment.vendorNotes,
          rescheduledFrom: assignment.rescheduledFrom,
          rescheduledTo: assignment.rescheduledTo,
          estimatedDuration: assignment.estimatedDuration,
        },
        request: request ? {
          id: request.id,
          unitNumber: request.unitNumber,
          issueType: request.issueType,
          description: request.description,
          urgency: request.urgency,
          tenantName: request.tenantName,
          tenantPhone: request.tenantPhone,
          photoUrls: request.photoUrls,
          status: request.status,
        } : null,
        property: property ? {
          name: property.name,
          address: property.address,
        } : null,
        vendor: vendor ? {
          name: vendor.name,
          companyName: vendor.companyName,
        } : null,
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to load job details" });
    }
  });

  app.post('/api/vendor-portal/:token/respond', async (req, res) => {
    try {
      const { token } = req.params;
      const assignment = await storage.getVendorAssignmentByToken(token);
      if (!assignment) return res.status(404).json({ message: "Invalid or expired link" });

      if (assignment.magicTokenExpiresAt && new Date(assignment.magicTokenExpiresAt) < new Date()) {
        return res.status(410).json({ message: "This link has expired" });
      }

      const { action, proposedTime, completionNotes, invoiceNumber, materialsUsed, finalCost, vendorNotes } = req.body;

      const updateData: Record<string, any> = {};
      if (vendorNotes !== undefined) updateData.vendorNotes = vendorNotes;
      updateData.vendorRespondedAt = new Date();
      let eventType = "";
      let eventLabel = "";

      const getLandlordEmail = async () => {
        const u = await db.select().from(users).where(eq(users.id, assignment.landlordId)).then(r => r[0]);
        return u?.email;
      };
      const getVendorRecord = async () => storage.getVendor(assignment.vendorId);

      switch (action) {
        case "accept":
          updateData.vendorResponseStatus = "accepted";
          updateData.acceptedAt = new Date();
          updateData.jobStatus = assignment.scheduledDate ? "scheduled" : "assigned";
          eventType = "vendor-accepted";
          eventLabel = "Vendor accepted the job";
          await storage.updateRequestStatus(assignment.requestId, "In-Progress");
          {
            const landlordEmail = await getLandlordEmail();
            const vendor = await getVendorRecord();
            if (landlordEmail) {
              sendLandlordAlertEmail({
                landlordEmail,
                alertType: "vendor-accepted",
                requestId: assignment.requestId,
                vendorName: vendor?.name || "Vendor",
                message: `${vendor?.name} has accepted the maintenance job${assignment.scheduledDate ? ` scheduled for ${new Date(assignment.scheduledDate).toLocaleString()}` : ''}.`,
              }).catch(() => {});
            }
          }
          break;
        case "decline":
          updateData.vendorResponseStatus = "declined";
          updateData.declinedAt = new Date();
          updateData.jobStatus = "needs-dispatch";
          eventType = "vendor-declined";
          eventLabel = "Vendor declined the job";
          {
            const landlordEmail = await getLandlordEmail();
            const vendor = await getVendorRecord();
            if (landlordEmail) {
              sendLandlordAlertEmail({
                landlordEmail,
                alertType: "vendor-declined",
                requestId: assignment.requestId,
                vendorName: vendor?.name || "Vendor",
                message: `${vendor?.name} has declined the maintenance job.`,
              }).catch(() => {});
            }
          }
          break;
        case "propose-time":
          if (!proposedTime) return res.status(400).json({ message: "Proposed time required" });
          updateData.vendorResponseStatus = "proposed-new-time";
          updateData.proposedTime = new Date(proposedTime);
          eventType = "vendor-proposed-time";
          eventLabel = `Vendor proposed new time: ${new Date(proposedTime).toLocaleString()}`;
          {
            const landlordEmail = await getLandlordEmail();
            const vendor = await getVendorRecord();
            if (landlordEmail) {
              sendLandlordAlertEmail({
                landlordEmail,
                alertType: "vendor-proposed-time",
                requestId: assignment.requestId,
                vendorName: vendor?.name || "Vendor",
                message: `${vendor?.name} proposed a new time: ${new Date(proposedTime).toLocaleString()}.`,
              }).catch(() => {});
            }
          }
          break;
        case "en-route":
          updateData.enRouteAt = new Date();
          updateData.jobStatus = "in-progress";
          eventType = "vendor-en-route";
          eventLabel = "Vendor is en route";
          await storage.updateRequestStatus(assignment.requestId, "In-Progress");
          {
            const landlordEmail = await getLandlordEmail();
            const vendor = await getVendorRecord();
            if (landlordEmail) {
              sendLandlordAlertEmail({
                landlordEmail,
                alertType: "vendor-en-route",
                requestId: assignment.requestId,
                vendorName: vendor?.name || "Vendor",
                message: `${vendor?.name} is en route to the job site.`,
              }).catch(() => {});
            }
          }
          break;
        case "started":
          updateData.startedAt = new Date();
          updateData.jobStatus = "in-progress";
          eventType = "vendor-started";
          eventLabel = "Vendor started work";
          await storage.updateRequestStatus(assignment.requestId, "In-Progress");
          break;
        case "completed":
          updateData.completedAt = new Date();
          updateData.jobStatus = "completed";
          if (completionNotes) updateData.completionNotes = completionNotes;
          if (invoiceNumber) updateData.invoiceNumber = invoiceNumber;
          if (materialsUsed) updateData.materialsUsed = materialsUsed;
          if (finalCost !== undefined) updateData.finalCost = parseInt(finalCost);
          eventType = "vendor-completed";
          eventLabel = "Vendor completed the job";
          await storage.updateRequestStatus(assignment.requestId, "Completed");
          {
            const vendorRecord = await getVendorRecord();
            if (vendorRecord) {
              await storage.updateVendor(vendorRecord.id, { lastJobCompletedAt: new Date() } as any);
            }
            const landlordEmail = await getLandlordEmail();
            if (landlordEmail) {
              sendLandlordAlertEmail({
                landlordEmail,
                alertType: "vendor-completed",
                requestId: assignment.requestId,
                vendorName: vendorRecord?.name || "Vendor",
                message: `${vendorRecord?.name} has completed the maintenance job.${finalCost ? ` Final cost: $${finalCost}` : ''}`,
              }).catch(() => {});
            }
          }
          break;
        default:
          return res.status(400).json({ message: "Invalid action" });
      }

      const updated = await storage.updateVendorAssignment(assignment.requestId, updateData);

      if (eventType) {
        await storage.createActivityLog({
          requestId: assignment.requestId,
          landlordId: assignment.landlordId,
          eventType,
          eventLabel,
        });
      }

      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to process response" });
    }
  });

  // ── Schedule Routes ─────────────────────────────────────────────────────

  app.get('/api/schedule', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const allAssignments = await storage.getAllAssignmentsByLandlord(userId);
      const requests = await storage.getRequestsByLandlord(userId);
      const allVendors = await storage.getVendorsByLandlord(userId);
      const allProperties = await storage.getProperties(userId);

      const requestMap = new Map(requests.map(r => [r.id, r]));
      const vendorMap = new Map(allVendors.map(v => [v.id, v]));
      const propertyMap = new Map(allProperties.map(p => [p.id, p]));

      const scheduleItems = allAssignments
        .filter(a => a.jobStatus !== "cancelled")
        .map(a => {
          const request = requestMap.get(a.requestId);
          const vendor = vendorMap.get(a.vendorId);
          const property = request ? propertyMap.get(request.propertyId) : null;
          return {
            assignment: a,
            request: request ? {
              id: request.id,
              unitNumber: request.unitNumber,
              issueType: request.issueType,
              description: request.description,
              urgency: request.urgency,
              tenantName: request.tenantName,
              status: request.status,
            } : null,
            vendor: vendor ? {
              id: vendor.id,
              name: vendor.name,
              companyName: vendor.companyName,
              tradeCategory: vendor.tradeCategory,
              phone: vendor.phone,
            } : null,
            property: property ? {
              id: property.id,
              name: property.name,
              address: property.address,
            } : null,
          };
        });

      res.json(scheduleItems);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch schedule" });
    }
  });

  app.post('/api/schedule/check-conflicts', isAuthenticated, async (req: any, res) => {
    try {
      const { vendorId, scheduledDate, duration } = req.body;
      if (!vendorId || !scheduledDate) return res.status(400).json({ message: "Missing fields" });

      const start = new Date(scheduledDate);
      const durationMs = (duration || 2) * 60 * 60 * 1000;
      const end = new Date(start.getTime() + durationMs);

      const activeJobs = await storage.getActiveAssignmentsByVendor(vendorId);
      const conflicts = activeJobs.filter(a => {
        if (!a.scheduledDate) return false;
        const jobStart = new Date(a.scheduledDate);
        const jobEnd = new Date(jobStart.getTime() + durationMs);
        return jobStart < end && jobEnd > start;
      });

      res.json({ hasConflict: conflicts.length > 0, conflicts });
    } catch (err) {
      res.status(500).json({ message: "Failed to check conflicts" });
    }
  });

  // ── Dispatch Board Route ────────────────────────────────────────────────

  app.get('/api/dispatch-board', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requests = await storage.getRequestsByLandlord(userId);
      const allAssignments = await storage.getAllAssignmentsByLandlord(userId);
      const allVendors = await storage.getVendorsByLandlord(userId);
      const allProperties = await storage.getProperties(userId);

      const vendorMap = new Map(allVendors.map(v => [v.id, v]));
      const propertyMap = new Map(allProperties.map(p => [p.id, p]));
      const assignmentMap = new Map(allAssignments.map(a => [a.requestId, a]));

      const cards = requests.map(r => {
        const assignment = assignmentMap.get(r.id);
        const vendor = assignment ? vendorMap.get(assignment.vendorId) : null;
        const property = propertyMap.get(r.propertyId);

        let column = "needs-dispatch";
        if (assignment) {
          if (assignment.jobStatus === "completed") column = "completed";
          else if (assignment.jobStatus === "waiting-on-parts") column = "waiting-on-parts";
          else if (assignment.jobStatus === "in-progress") column = "in-progress";
          else if (assignment.jobStatus === "scheduled" || assignment.scheduledDate) column = "scheduled";
          else if (assignment.vendorResponseStatus === "pending-response" || assignment.vendorResponseStatus === "proposed-new-time") column = "awaiting-response";
          else column = assignment.jobStatus || "needs-dispatch";
        } else if (r.status === "Completed") {
          column = "completed";
        }

        return {
          requestId: r.id,
          column,
          property: property ? { id: property.id, name: property.name } : null,
          unitNumber: r.unitNumber,
          issueType: r.issueType,
          urgency: r.urgency,
          tenantName: r.tenantName,
          status: r.status,
          createdAt: r.createdAt,
          vendor: vendor ? {
            id: vendor.id,
            name: vendor.name,
            companyName: vendor.companyName,
          } : null,
          assignment: assignment ? {
            id: assignment.id,
            jobStatus: assignment.jobStatus,
            scheduledDate: assignment.scheduledDate,
            vendorResponseStatus: assignment.vendorResponseStatus,
            arrivalWindow: assignment.arrivalWindow,
            dispatchScore: assignment.dispatchScore,
            responseDeadline: assignment.responseDeadline,
          } : null,
        };
      });

      res.json(cards);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch dispatch board" });
    }
  });

  app.patch('/api/dispatch-board/:requestId/move', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestId = parseInt(req.params.requestId);
      const { column } = req.body;

      const statusMap: Record<string, string> = {
        "needs-dispatch": "needs-dispatch",
        "awaiting-response": "assigned",
        "scheduled": "scheduled",
        "in-progress": "in-progress",
        "waiting-on-parts": "waiting-on-parts",
        "completed": "completed",
      };

      const jobStatus = statusMap[column];
      if (!jobStatus) return res.status(400).json({ message: "Invalid column" });

      const assignment = await storage.getVendorAssignmentByRequest(requestId);
      if (assignment) {
        const updateData: any = { jobStatus };
        if (column === "completed") {
          updateData.completedAt = new Date();
          await storage.updateRequestStatus(requestId, "Completed");
        } else if (column === "in-progress") {
          updateData.startedAt = updateData.startedAt || new Date();
          await storage.updateRequestStatus(requestId, "In-Progress");
        }
        await storage.updateVendorAssignment(requestId, updateData);
      }

      await storage.createActivityLog({
        requestId,
        landlordId: userId,
        eventType: "status-change",
        eventLabel: `Moved to ${column}`,
      });

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to move card" });
    }
  });

  // ── SLA Escalations ────────────────────────────────────────────────────

  app.get('/api/escalations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const escalations = await storage.getEscalationsByLandlord(userId);
      res.json(escalations);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch escalations" });
    }
  });

  app.get('/api/requests/:id/escalations', isAuthenticated, async (req: any, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const escalations = await storage.getEscalationsByRequest(requestId);
      res.json(escalations);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch escalations" });
    }
  });

  app.get('/api/requests/:id/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const assignment = await storage.getVendorAssignmentByRequest(requestId);
      if (!assignment) return res.json([]);
      const notifications = await storage.getNotificationsByAssignment(assignment.id);
      res.json(notifications);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // ── Generate magic link for existing assignment ─────────────────────────

  app.post('/api/requests/:id/generate-magic-link', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestId = parseInt(req.params.id);
      const assignment = await storage.getVendorAssignmentByRequest(requestId);
      if (!assignment) return res.status(404).json({ message: "No vendor assigned" });

      const magicToken = generateMagicToken();
      const responseDeadline = new Date(Date.now() + getSlaThreshold(req.body.urgency || "Medium"));
      const magicTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const updated = await storage.updateVendorAssignment(requestId, {
        magicToken,
        responseDeadline,
        magicTokenExpiresAt,
        vendorLinkSentAt: new Date(),
        vendorResponseStatus: "pending-response",
      });

      const vendor = await storage.getVendor(assignment.vendorId);
      if (vendor?.email) {
        const request = await storage.getRequest(requestId);
        const property = request ? await storage.getProperty(request.propertyId) : null;
        sendVendorDispatchEmail({
          vendorEmail: vendor.email,
          vendorName: vendor.name,
          propertyName: property?.name || "Property",
          unitNumber: request?.unitNumber || "",
          issueType: request?.issueType || "",
          urgency: request?.urgency || "",
          description: request?.description || "",
          magicToken,
        }).catch(() => {});

        await storage.createVendorNotification({
          assignmentId: assignment.id,
          vendorId: vendor.id,
          landlordId: userId,
          notificationType: "dispatch",
          channel: "email",
        });
      }

      res.json({ magicToken, assignment: updated });
    } catch (err) {
      res.status(500).json({ message: "Failed to generate magic link" });
    }
  });

  // ── Revoke Magic Link ──────────────────────────────────────────────────

  app.post('/api/requests/:id/revoke-magic-link', isAuthenticated, async (req: any, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const assignment = await storage.getVendorAssignmentByRequest(requestId);
      if (!assignment) return res.status(404).json({ message: "No vendor assigned" });

      const updated = await storage.updateVendorAssignment(requestId, {
        magicToken: null,
        magicTokenExpiresAt: null,
        vendorResponseStatus: "pending-response",
      });

      await storage.createActivityLog({
        requestId,
        landlordId: req.user.claims.sub,
        eventType: "magic-link-revoked",
        eventLabel: "Magic link revoked by landlord",
      });

      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to revoke link" });
    }
  });

  // ── Schedule / Reschedule Job ─────────────────────────────────────────

  app.patch('/api/requests/:id/schedule', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestId = parseInt(req.params.id);
      const { scheduledDate, arrivalWindow, estimatedDuration, schedulingNotes } = req.body;

      const assignment = await storage.getVendorAssignmentByRequest(requestId);
      if (!assignment) return res.status(404).json({ message: "No vendor assigned" });

      const updateData: Record<string, any> = {};

      if (scheduledDate !== undefined) {
        if (assignment.scheduledDate && scheduledDate) {
          updateData.rescheduledFrom = assignment.scheduledDate;
          updateData.rescheduledTo = new Date(scheduledDate);
        }
        updateData.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;
        updateData.jobStatus = scheduledDate ? "scheduled" : "assigned";
      }
      if (arrivalWindow !== undefined) updateData.arrivalWindow = arrivalWindow || null;
      if (estimatedDuration !== undefined) updateData.estimatedDuration = estimatedDuration || null;
      if (schedulingNotes !== undefined) updateData.schedulingNotes = schedulingNotes || null;

      const updated = await storage.updateVendorAssignment(requestId, updateData);

      const schedAction = scheduledDate ? "rescheduled" : "unscheduled";
      await storage.createActivityLog({
        requestId,
        landlordId: userId,
        eventType: `job-${schedAction}`,
        eventLabel: scheduledDate
          ? `Job ${assignment.scheduledDate ? 'rescheduled' : 'scheduled'} to ${new Date(scheduledDate).toLocaleString()}`
          : "Job unscheduled",
      });

      if (scheduledDate) {
        const request = await storage.getRequest(requestId);
        const vendor = await storage.getVendor(assignment.vendorId);
        const property = request ? await storage.getProperty(request.propertyId) : null;
        if (request?.tenantEmail) {
          sendTenantVendorScheduledEmail({
            tenantEmail: request.tenantEmail,
            tenantName: request.tenantName || "Tenant",
            propertyName: property?.name || "Property",
            unitNumber: request.unitNumber || "",
            issueType: request.issueType || "",
            vendorName: vendor?.name || "Vendor",
            scheduledDate: new Date(scheduledDate).toLocaleString(),
            trackingCode: request.trackingCode || "",
          }).catch(() => {});
        }
        if (vendor?.email && assignment.magicToken) {
          sendVendorReminderEmail({
            vendorEmail: vendor.email,
            vendorName: vendor.name,
            propertyName: property?.name || "Property",
            unitNumber: request?.unitNumber || "",
            issueType: request?.issueType || "",
            scheduledDate: new Date(scheduledDate).toLocaleString(),
            magicToken: assignment.magicToken,
          }).catch(() => {});
        }
      }

      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to update schedule" });
    }
  });

  return httpServer;
}
