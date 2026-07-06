/**
 * Stripe webhook as a dedicated Vercel function: signature verification needs the
 * raw request body, so Vercel's automatic body parsing is disabled here.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleStripeEvent } from '../server/app';

export const config = { api: { bodyParser: false } };

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end('Method Not Allowed');
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks);
  const { status, body } = await handleStripeEvent(raw, String(req.headers['stripe-signature'] || ''));
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(typeof body === 'string' ? JSON.stringify({ error: body }) : JSON.stringify(body));
}
