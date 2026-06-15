import { Router, type IRouter } from 'express';
import { storage } from '../storage';
import { stripeService } from '../stripeService';
import { logger } from '../lib/logger';

const router: IRouter = Router();

// Get current subscription status for a session ID (simple, no auth required for demo)
router.get('/stripe/subscription/:sessionId', async (req, res): Promise<void> => {
  const { sessionId } = req.params;
  try {
    const user = await storage.getUser(sessionId);
    if (!user?.stripeCustomerId) {
      res.json({ isPro: false, subscription: null });
      return;
    }
    const subscription = await storage.getActiveSubscriptionForCustomer(user.stripeCustomerId);
    res.json({ isPro: !!subscription, subscription });
  } catch (err) {
    req.log.error({ err }, 'Error fetching subscription');
    res.json({ isPro: false, subscription: null });
  }
});

// List products with prices
router.get('/stripe/products', async (_req, res): Promise<void> => {
  let rows;
  try {
    rows = await storage.listProductsWithPrices();
  } catch {
    res.json({ data: [] });
    return;
  }
  const productsMap = new Map<string, { id: string; name: string; description: string; active: boolean; prices: object[] }>();
  for (const row of rows as Record<string, unknown>[]) {
    const pid = row.product_id as string;
    if (!productsMap.has(pid)) {
      productsMap.set(pid, {
        id: pid,
        name: row.product_name as string,
        description: row.product_description as string,
        active: row.product_active as boolean,
        prices: [],
      });
    }
    if (row.price_id) {
      productsMap.get(pid)!.prices.push({
        id: row.price_id,
        unit_amount: row.unit_amount,
        currency: row.currency,
        recurring: row.recurring,
      });
    }
  }
  res.json({ data: Array.from(productsMap.values()) });
});

// Create checkout session — userId is passed in body (no auth system yet)
router.post('/stripe/checkout', async (req, res): Promise<void> => {
  const { priceId, userId, email } = req.body as { priceId: string; userId: string; email?: string };
  if (!priceId || !userId) {
    res.status(400).json({ error: 'priceId and userId are required' });
    return;
  }

  // Upsert user
  let user = await storage.upsertUser(userId, email);

  // Create or reuse Stripe customer
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripeService.createCustomer(email ?? `${userId}@finsight.app`, userId);
    user = await storage.updateUserStripeInfo(userId, { stripeCustomerId: customer.id });
    customerId = customer.id;
  }

  const host = `${req.protocol}://${req.get('host')}`;
  const session = await stripeService.createCheckoutSession(
    customerId!,
    priceId,
    `${host}/?upgraded=true`,
    `${host}/upgrade`
  );

  res.json({ url: session.url });
});

// Customer portal — manage subscription
router.post('/stripe/portal', async (req, res): Promise<void> => {
  const { userId } = req.body as { userId: string };
  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }
  const user = await storage.getUser(userId);
  if (!user?.stripeCustomerId) {
    res.status(404).json({ error: 'No Stripe customer found for this user' });
    return;
  }
  const host = `${req.protocol}://${req.get('host')}`;
  const portalSession = await stripeService.createCustomerPortalSession(
    user.stripeCustomerId,
    `${host}/`
  );
  res.json({ url: portalSession.url });
});

export default router;
