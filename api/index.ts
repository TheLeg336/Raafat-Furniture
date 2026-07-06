/**
 * Vercel serverless entry for all /api/* routes except the Stripe webhook
 * (which needs the raw body — see api/stripe-webhook.ts). Routed via vercel.json.
 */
import { createApiApp } from '../server/app';

const app = createApiApp();

export default app;
