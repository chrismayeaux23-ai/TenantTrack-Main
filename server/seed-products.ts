import { getUncachableStripeClient } from './stripeClient';

async function createProducts() {
  const stripe = await getUncachableStripeClient();

  const plans = [
    {
      name: 'Starter',
      description: 'For small landlords (1–5 units). QR maintenance system, basic dashboard, email notifications.',
      metadata: { tier: 'starter', maxProperties: '5' },
      priceAmount: 2900,
    },
    {
      name: 'Growth',
      description: 'For 6–25 units. Priority request highlighting, maintenance history tracking, basic reporting, custom QR per unit.',
      metadata: { tier: 'growth', maxProperties: '25' },
      priceAmount: 5900,
    },
    {
      name: 'Pro',
      description: 'For 25+ units. Advanced reporting, export features, priority support, early access features.',
      metadata: { tier: 'pro', maxProperties: 'unlimited' },
      priceAmount: 9900,
    },
  ];

  for (const plan of plans) {
    const existing = await stripe.products.search({ query: `name:'${plan.name}'` });
    if (existing.data.length > 0) {
      console.log(`${plan.name} already exists (${existing.data[0].id}), skipping.`);
      continue;
    }

    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
      metadata: plan.metadata,
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.priceAmount,
      currency: 'usd',
      recurring: { interval: 'month', trial_period_days: 14 },
    });

    console.log(`Created ${plan.name}: product=${product.id}, price=${price.id}`);
  }

  console.log('Done seeding products.');
}

createProducts().catch(console.error);
