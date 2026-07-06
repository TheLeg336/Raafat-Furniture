/**
 * Vercel serverless entry for all /api/* routes except the Stripe webhook
 * (which needs the raw body — see api/stripe-webhook.ts). Routed via vercel.json.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApiApp } from '../server/app';

// Build once per cold start — Vercel's Node runtime expects an explicit (req, res) handler.
const app = createApiApp();

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return (app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(req, res);
}
