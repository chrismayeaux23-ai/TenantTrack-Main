import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { runMigrations } from 'stripe-replit-sync';
import { getStripeSync } from './stripeClient';
import { WebhookHandlers } from './webhookHandlers';
import { db } from "./db";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";
import { startSlaEngine } from "./slaEngine";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

async function runColumnMigrations() {
  try {
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash varchar');
    await pool.end();
    console.log("Column migrations complete");
  } catch (err) {
    console.error("Column migration failed (non-fatal):", err);
  }
}

async function ensureOwnerProTier() {
  try {
    const OWNER_ID = "55210273";
    const [user] = await db.select().from(users).where(eq(users.id, OWNER_ID));
    if (user && user.subscriptionTier !== "pro") {
      await db.update(users).set({ subscriptionTier: "pro" }).where(eq(users.id, OWNER_ID));
      console.log("Owner account set to pro tier");
    }
  } catch (err) {
    console.error("Failed to set owner tier:", err);
  }
}

async function seedStripeProducts() {
  try {
    const { getUncachableStripeClient } = await import('./stripeClient');
    const stripe = await getUncachableStripeClient();
    const plans = [
      { name: 'Starter', description: 'For small landlords (1–5 units). QR maintenance system, basic dashboard, email notifications.', metadata: { tier: 'starter', maxProperties: '5' }, priceAmount: 2900 },
      { name: 'Growth', description: 'For 6–25 units. Priority request highlighting, maintenance history tracking, basic reporting, custom QR per unit.', metadata: { tier: 'growth', maxProperties: '25' }, priceAmount: 5900 },
      { name: 'Pro', description: 'For 25+ units. Advanced reporting, export features, priority support, early access features.', metadata: { tier: 'pro', maxProperties: 'unlimited' }, priceAmount: 9900 },
    ];
    const oldNames = ['Starter Package', 'Growth Package', 'Pro Package'];
    for (const oldName of oldNames) {
      try {
        const old = await stripe.products.search({ query: `name:'${oldName}'` });
        for (const p of old.data) {
          if (p.active) {
            await stripe.products.update(p.id, { active: false });
            console.log(`Archived old product: ${oldName} (${p.id})`);
          }
        }
      } catch {}
    }

    for (const plan of plans) {
      const existing = await stripe.products.search({ query: `metadata['tier']:'${plan.metadata.tier}'` });
      const activeExisting = existing.data.find(p => p.active);
      let productId: string;
      if (activeExisting) {
        productId = activeExisting.id;
        await stripe.products.update(productId, { name: plan.name, description: plan.description, metadata: plan.metadata });
      } else {
        const product = await stripe.products.create({ name: plan.name, description: plan.description, metadata: plan.metadata });
        productId = product.id;
        console.log(`Created product ${plan.name}: ${productId}`);
      }
      const prices = await stripe.prices.list({ product: productId, active: true, limit: 10 });
      const correctPrice = prices.data.find(p => p.unit_amount === plan.priceAmount);
      if (!correctPrice) {
        for (const oldPrice of prices.data) {
          await stripe.prices.update(oldPrice.id, { active: false });
        }
        await stripe.prices.create({ product: productId, unit_amount: plan.priceAmount, currency: 'usd', recurring: { interval: 'month', trial_period_days: 14 } });
        console.log(`Created new price for ${plan.name}: $${plan.priceAmount / 100}/mo`);
      }
    }
  } catch (err) {
    console.error('Failed to seed products:', err);
  }
}

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL required for Stripe integration');
  }

  try {
    console.log('Initializing Stripe schema...');
    await runMigrations({ databaseUrl, schema: 'stripe' });
    console.log('Stripe schema ready');

    const stripeSync = await getStripeSync();

    console.log('Setting up managed webhook...');
    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
    const webhookResult = await stripeSync.findOrCreateManagedWebhook(
      `${webhookBaseUrl}/api/stripe/webhook`
    );
    console.log('Webhook configured:', JSON.stringify(webhookResult).substring(0, 200));

    await seedStripeProducts();

    stripeSync.syncBackfill()
      .then(() => console.log('Stripe data synced'))
      .catch((err: any) => console.error('Error syncing Stripe data:', err));
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
    throw error;
  }
}

app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  console.log("RESEND_API_KEY loaded:", !!process.env.RESEND_API_KEY);
  console.log("EMAIL_FROM:", process.env.EMAIL_FROM);
  console.log("APP_URL:", process.env.APP_URL);
  console.log("NODE_ENV:", process.env.NODE_ENV);
  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewall\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ed. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
      runColumnMigrations();
      ensureOwnerProTier();
      startSlaEngine();
      initStripe().catch((err) => {
        console.error('Stripe initialization failed (non-fatal):', err);
      });
    },
  );
})();
