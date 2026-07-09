/** Country-aware address field layout for checkout. */

export type AddressFieldKey = 'line1' | 'city' | 'governorate' | 'postalCode';

export interface AddressFieldSpec {
  key: AddressFieldKey;
  labelKey: string;
  fallback: string;
  required: boolean;
  autoComplete?: string;
  /** Grid span on the Field wrapper (not the input). */
  wrapperClassName?: string;
}

const EG: AddressFieldSpec[] = [
  { key: 'line1', labelKey: 'address', fallback: 'Street address', required: true, autoComplete: 'address-line1', wrapperClassName: 'sm:col-span-2' },
  { key: 'city', labelKey: 'city', fallback: 'City', required: true, autoComplete: 'address-level2' },
  { key: 'governorate', labelKey: 'governorate', fallback: 'Governorate', required: true, autoComplete: 'address-level1' },
  { key: 'postalCode', labelKey: 'postal_code', fallback: 'Postal code', required: false, autoComplete: 'postal-code' },
];

const US: AddressFieldSpec[] = [
  { key: 'line1', labelKey: 'address', fallback: 'Street address', required: true, autoComplete: 'address-line1', wrapperClassName: 'sm:col-span-2' },
  { key: 'city', labelKey: 'city', fallback: 'City', required: true, autoComplete: 'address-level2' },
  { key: 'governorate', labelKey: 'governorate', fallback: 'State', required: true, autoComplete: 'address-level1' },
  { key: 'postalCode', labelKey: 'postal_code', fallback: 'ZIP code', required: true, autoComplete: 'postal-code' },
];

const GB: AddressFieldSpec[] = [
  { key: 'line1', labelKey: 'address', fallback: 'Address line 1', required: true, autoComplete: 'address-line1', wrapperClassName: 'sm:col-span-2' },
  { key: 'city', labelKey: 'city', fallback: 'Town / City', required: true, autoComplete: 'address-level2' },
  { key: 'postalCode', labelKey: 'postal_code', fallback: 'Postcode', required: true, autoComplete: 'postal-code' },
];

const DEFAULT: AddressFieldSpec[] = [
  { key: 'line1', labelKey: 'address', fallback: 'Address', required: true, autoComplete: 'address-line1', wrapperClassName: 'sm:col-span-2' },
  { key: 'city', labelKey: 'city', fallback: 'City', required: true, autoComplete: 'address-level2' },
  { key: 'governorate', labelKey: 'governorate', fallback: 'State / Province / Region', required: false, autoComplete: 'address-level1' },
  { key: 'postalCode', labelKey: 'postal_code', fallback: 'Postal code', required: false, autoComplete: 'postal-code' },
];

export function addressFieldsForCountry(country: string): AddressFieldSpec[] {
  if (country === 'EG') return EG;
  if (country === 'US') return US;
  if (country === 'GB' || country === 'IE') return GB;
  if (['CA', 'AU', 'IN', 'MX', 'BR'].includes(country)) return US;
  return DEFAULT;
}

export function isAddressComplete(
  country: string,
  values: Record<AddressFieldKey, string>,
): boolean {
  return addressFieldsForCountry(country)
    .filter((f) => f.required)
    .every((f) => values[f.key]?.trim());
}
