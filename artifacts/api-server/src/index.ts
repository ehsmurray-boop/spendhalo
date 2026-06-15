import { runMigrations } from 'stripe-replit-sync';
import { getStripeSync } from "./stripeClient";
import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];
if (!rawPort) throw new Error("PORT environment variable is required but was not provided.");
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT value: "${rawPort}"`);

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    logger.warn('DATABASE_URL not set — skipping Stripe init');
    return;
  }

  try {
    logger.info('Initializing Stripe schema...');
    await runMigrations({ databaseUrl, schema: 'stripe' });
    logger.info('Stripe schema ready');

    const stripeSync = await getStripeSync();
    const domain = process.env.REPLIT_DOMAINS?.split(',')[0];
    if (domain) {
      await stripeSync.findOrCreateManagedWebhook(`https://${domain}/api/stripe/webhook`);
      logger.info('Stripe webhook configured');
    }

    // Non-blocking backfill
    stripeSync.syncBackfill()
      .then(() => logger.info('Stripe data synced'))
      .catch((err) => logger.warn({ err }, 'Stripe backfill error (non-fatal)'));
  } catch (error) {
    // Non-fatal — log and continue so the rest of the app works
    logger.warn({ error }, 'Stripe init skipped (integration may not be connected yet)');
  }
}

// Fire-and-forget Stripe init — server starts regardless
initStripe();

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
});
