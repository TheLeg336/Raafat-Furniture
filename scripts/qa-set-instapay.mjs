// QA: set or clear settings/payments.instapayAddress. Usage: node scripts/qa-set-instapay.mjs [value|--clear]
import 'dotenv/config';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
const creds = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (creds.private_key?.includes('\\n')) creds.private_key = creds.private_key.replace(/\\n/g, '\n');
const db = getFirestore(initializeApp({ credential: cert(creds) }));
const v = process.argv[2] === '--clear' ? '' : (process.argv[2] || '');
await db.collection('settings').doc('payments').set({ instapayAddress: v }, { merge: true });
console.log('instapayAddress =', JSON.stringify(v));
process.exit(0);
