import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { runMigrations } from 'stripe-replit-sync';
import { getStripeSync } from './stripeClient';
import { WebhookHandlers } from './webhookHandlers';

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

async function seedStripeProducts() {
  try {
    const { getUncachableStripeClient } = await import('./stripeClient');
    const stripe = await getUncachableStripeClient();
    const plans = [
      { name: 'Starter Package', description: 'Up to 5 properties. Includes QR tenant submission and basic request tracking.', metadata: { tier: 'starter', maxProperties: '5' }, priceAmount: 1900 },
      { name: 'Growth Package', description: 'Unlimited properties. Includes priority notifications, exportable repair logs, status updates for tenants, and photo uploads.', metadata: { tier: 'growth', maxProperties: 'unlimited' }, priceAmount: 3900 },
      { name: 'Pro Package', description: 'Unlimited properties. Includes analytics dashboard, maintenance cost tracking, and custom branding.', metadata: { tier: 'pro', maxProperties: 'unlimited' }, priceAmount: 5900 },
    ];
    for (const plan of plans) {
      const existing = await stripe.products.search({ query: `name:'${plan.name}'` });
      let productId: string;
      if (existing.data.length > 0) {
        productId = existing.data[0].id;
        if (!existing.data[0].metadata?.tier) {
          await stripe.products.update(productId, { metadata: plan.metadata });
        }
      } else {
        const product = await stripe.products.create({ name: plan.name, description: plan.description, metadata: plan.metadata });
        productId = product.id;
        console.log(`Created product ${plan.name}: ${productId}`);
      }
      const prices = await stripe.prices.list({ product: productId, active: true, limit: 1 });
      if (prices.data.length === 0) {
        await stripe.prices.create({ product: productId, unit_amount: plan.priceAmount, currency: 'usd', recurring: { interval: 'month', trial_period_days: 14 } });
        console.log(`Created price for ${plan.name}`);
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

app.use(express.json());
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

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
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
      initStripe().catch((err) => {
        console.error('Stripe initialization failed (non-fatal):', err);
      });
    },
  );
})();
