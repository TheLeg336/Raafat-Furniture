/**
 * Bundle api-src/*.ts → api/*.js so Vercel serverless can resolve server/ code.
 * Vercel does not follow ../server imports from unbundled api/*.ts on cold start.
 */
import * as esbuild from 'esbuild';

const shared = {
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  packages: 'external',
  logLevel: 'info',
};

await Promise.all([
  esbuild.build({
    ...shared,
    entryPoints: ['api-src/index.ts'],
    outfile: 'api/index.js',
  }),
  esbuild.build({
    ...shared,
    entryPoints: ['api-src/stripe-webhook.ts'],
    outfile: 'api/stripe-webhook.js',
  }),
]);

console.log('[bundle-vercel-api] Wrote api/index.js and api/stripe-webhook.js');
