// One-off QA cleanup: delete a test order + its order-number reservation.
// Usage: node scripts/qa-cleanup-order.mjs EG781539IC
import 'dotenv/config';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const num = process.argv[2];
if (!num) { console.error('usage: node scripts/qa-cleanup-order.mjs <orderNumber>'); process.exit(1); }
const creds = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (creds.private_key?.includes('\\n')) creds.private_key = creds.private_key.replace(/\\n/g, '\n');
const db = getFirestore(initializeApp({ credential: cert(creds) }));

const snap = await db.collection('orders').where('orderNumber', '==', num).get();
for (const d of snap.docs) { await d.ref.delete(); console.log('deleted order doc', d.id); }
await db.collection('orderNumbers').doc(num).delete().then(() => console.log('deleted reservation', num)).catch(() => console.log('no reservation'));
console.log('done:', snap.size, 'order doc(s) removed');
process.exit(0);
