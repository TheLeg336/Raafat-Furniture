import { apiFetch } from './api';

export interface ProductFields {
  nameEn: string;
  nameAr: string;
  descEn: string;
  descAr: string;
}

/**
 * Fill missing EN/AR product fields via the server translation proxy.
 * The NVIDIA key stays server-side; the endpoint is admin-only, so apiFetch
 * attaches the caller's Firebase ID token.
 */
export async function translateProductFields(fields: ProductFields): Promise<ProductFields> {
  return apiFetch<ProductFields>('/api/translate', fields);
}
