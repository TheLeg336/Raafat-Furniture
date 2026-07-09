/** Format phone numbers for display while typing / pasting / autofill. */

/** Digits only, keep a leading + if present. */
export function digitsOnlyPhone(raw: string): string {
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '').slice(0, 15);
  return hasPlus ? `+${digits}` : digits;
}

function groups(digits: string, sizes: number[]): string {
  const parts: string[] = [];
  let i = 0;
  for (const size of sizes) {
    if (i >= digits.length) break;
    parts.push(digits.slice(i, i + size));
    i += size;
  }
  if (i < digits.length) parts.push(digits.slice(i));
  return parts.filter(Boolean).join(' ');
}

/**
 * Pretty display format. Egypt (+20 / 01…) and US (+1 / 10-digit) get
 * familiar grouping; everything else is spaced in chunks of 3–4.
 */
export function formatPhoneDisplay(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const hasPlus = trimmed.startsWith('+');
  const d = trimmed.replace(/\D/g, '').slice(0, 15);
  if (!d) return hasPlus ? '+' : '';

  // Egypt local mobile 01xxxxxxxxx
  if (!hasPlus && d.startsWith('01')) {
    return groups(d, [2, 4, 4]);
  }
  // Egypt international +20…
  if (hasPlus && d.startsWith('20')) {
    const local = d.slice(2);
    if (!local) return '+20';
    if (local.startsWith('1')) return `+20 ${groups(local, [1, 4, 4])}`;
    return `+20 ${groups(local, [3, 3, 4])}`;
  }

  // US / NANP
  const usDigits = hasPlus && d.startsWith('1') ? d.slice(1) : (!hasPlus ? d : null);
  if (usDigits !== null && usDigits.length <= 10 && (/^[2-9]/.test(usDigits) || usDigits.length < 3)) {
    const a = usDigits.slice(0, 3);
    const b = usDigits.slice(3, 6);
    const c = usDigits.slice(6, 10);
    let pretty = a;
    if (b) pretty = `(${a}) ${b}`;
    if (c) pretty = `(${a}) ${b}-${c}`;
    return hasPlus ? `+1 ${pretty}` : pretty;
  }

  if (hasPlus) return `+${groups(d, [3, 3, 3, 3])}`;
  return groups(d, [3, 3, 3, 3]);
}

/** Store / validate: digits with optional leading +. Empty string if blank. */
export function normalizePhoneForStorage(raw: string): string {
  return digitsOnlyPhone(raw);
}

/** Optional field: empty OK; if present, at least 7 digits. */
export function isPhoneValidOptional(raw: string): boolean {
  const n = normalizePhoneForStorage(raw);
  if (!n) return true;
  const digits = n.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}
