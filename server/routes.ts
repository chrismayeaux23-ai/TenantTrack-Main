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
import { eq, sql, desc, and, gte, lte } from "drizzle-orm";
import { properties, maintenanceRequests, repairCosts, recurringTasks } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Set up Replit integrations first
  await setupAuth(app);
  registerAuthRoutes(app);
  registerObjectStorageRoutes(app);

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
      res.json({
        totalRequests,
        newRequests,
        inProgress,
        completed,
        emergencies,
        totalProperties: props.length,
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  return httpServer;
}
