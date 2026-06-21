export interface ProductFields {
  nameEn: string;
  nameAr: string;
  descEn: string;
  descAr: string;
}

/**
 * Fill missing EN/AR product fields via the server translation proxy.
 * The Gemini key stays server-side (never shipped to the browser).
 */
export async function translateProductFields(fields: ProductFields): Promise<ProductFields> {
  const res = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Translation is not configured or failed.');
  }
  return res.json();
}
