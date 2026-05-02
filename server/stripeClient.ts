import Stripe from 'stripe';

let connectionSettings: { settings: { publishable: string; secret: string } } | null = null;

const isProductionDeployment = () => process.env.REPLIT_DEPLOYMENT === '1';

async function getConnectorCredentials(): Promise<{ publishableKey: string; secretKey: string }> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    throw new Error('X-Replit-Token not found for repl/depl');
  }

  const connectorName = 'stripe';
  const targetEnvironment = isProductionDeployment() ? 'production' : 'development';

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set('include_secrets', 'true');
  url.searchParams.set('connector_names', connectorName);
  url.searchParams.set('environment', targetEnvironment);

  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'X-Replit-Token': xReplitToken,
    },
  });

  const data = await response.json();
  connectionSettings = data.items?.[0] ?? null;

  if (!connectionSettings || !connectionSettings.settings.publishable || !connectionSettings.settings.secret) {
    throw new Error(`Stripe ${targetEnvironment} connection not found`);
  }

  return {
    publishableKey: connectionSettings.settings.publishable,
    secretKey: connectionSettings.settings.secret,
  };
}

export async function getStripeSecretKey(): Promise<string> {
  const envSecret = process.env.STRIPE_LIVE_SECRET_KEY;
  if (isProductionDeployment() && envSecret) {
    return envSecret;
  }
  return (await getConnectorCredentials()).secretKey;
}

export async function getStripePublishableKey(): Promise<string> {
  const envPublishable = process.env.STRIPE_LIVE_PUBLISHABLE_KEY;
  if (isProductionDeployment() && envPublishable) {
    return envPublishable;
  }
  return (await getConnectorCredentials()).publishableKey;
}

export async function getUncachableStripeClient(): Promise<Stripe> {
  const secretKey = await getStripeSecretKey();
  return new Stripe(secretKey, {
    apiVersion: '2025-08-27.basil' as Stripe.LatestApiVersion,
  });
}

let stripeSync: any = null;

export async function getStripeSync() {
  if (!stripeSync) {
    const { StripeSync } = await import('stripe-replit-sync');
    const secretKey = await getStripeSecretKey();

    stripeSync = new StripeSync({
      poolConfig: {
        connectionString: process.env.DATABASE_URL!,
        max: 2,
      },
      stripeSecretKey: secretKey,
    });
  }
  return stripeSync;
}
