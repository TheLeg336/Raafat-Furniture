/**
 * Vercel serverless entry (source). Bundled to api/index.js at build time.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApiApp } from '../server/app';

const app = createApiApp();

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return (app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(req, res);
}
