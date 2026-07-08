/**
 * Local smoke helpers for GuidedScanner camera start (no real webcam required).
 * Run: node scripts/spoof-camera-scan.mjs
 */
import assert from 'node:assert/strict';

/** Mirrors GuidedScanner requestCamera fallback order. */
async function requestCamera(getUserMedia) {
  if (!getUserMedia) {
    throw new Error('Camera API is not available in this browser. Use HTTPS (or localhost) and a supported browser.');
  }
  const attempts = [
    { audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } },
    { audio: false, video: { facingMode: 'environment' } },
    { audio: false, video: { facingMode: 'user' } },
    { audio: false, video: true },
  ];
  let lastErr;
  for (const constraints of attempts) {
    try {
      return await getUserMedia(constraints);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Could not start camera.');
}

function fakeStream() {
  return { getTracks: () => [{ stop() {} }], id: 'fake' };
}

// 1) First constraint succeeds
{
  let calls = 0;
  const stream = await requestCamera(async () => { calls += 1; return fakeStream(); });
  assert.equal(stream.id, 'fake');
  assert.equal(calls, 1);
}

// 2) Overconstrained then fallback
{
  let calls = 0;
  const stream = await requestCamera(async (c) => {
    calls += 1;
    if (calls < 3) {
      const err = new Error('over');
      err.name = 'OverconstrainedError';
      throw err;
    }
    return fakeStream();
  });
  assert.equal(stream.id, 'fake');
  assert.equal(calls, 3);
}

// 3) Missing API
{
  let threw = false;
  try { await requestCamera(null); } catch { threw = true; }
  assert.equal(threw, true);
}

console.log('spoof-camera-scan: all checks passed');
