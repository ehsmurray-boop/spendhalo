import { getUncachableStripeClient } from './stripeClient';

async function createProducts() {
  try {
    const stripe = await getUncachableStripeClient();
    console.log('Creating FinSight Pro products in Stripe...');

    // Check if already exists
    const existing = await stripe.products.search({
      query: "name:'FinSight Pro' AND active:'true'"
    });
    if (existing.data.length > 0) {
      console.log('FinSight Pro already exists:', existing.data[0].id);
      // List its prices
      const prices = await stripe.prices.list({ product: existing.data[0].id, active: true });
      prices.data.forEach(p => {
        console.log(`  Price: ${p.id} — $${(p.unit_amount ?? 0) / 100}/${(p.recurring as { interval: string } | null)?.interval}`);
      });
      return;
    }

    const product = await stripe.products.create({
      name: 'FinSight Pro',
      description: 'Unlock Spending DNA, Regret Analysis, What-If Simulator, Mood & Money correlation, and unlimited transactions.',
      metadata: { tier: 'pro' },
    });
    console.log('Created product:', product.id);

    const monthly = await stripe.prices.create({
      product: product.id,
      unit_amount: 799, // $7.99/mo
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { plan: 'monthly' },
    });
    console.log('Monthly price:', monthly.id, '— $7.99/mo');

    const yearly = await stripe.prices.create({
      product: product.id,
      unit_amount: 6900, // $69/yr (~28% off)
      currency: 'usd',
      recurring: { interval: 'year' },
      metadata: { plan: 'yearly' },
    });
    console.log('Yearly price:', yearly.id, '— $69/yr');

    console.log('\nProducts created! Webhooks will sync them to the database.');
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Error:', msg);
    process.exit(1);
  }
}

createProducts();
