export enum LayoutOption {
  ModernSleek = 'modern-sleek',
}

export enum ColorSchemeOption {
  BlackGold = 'black-gold',
}

export enum TypographyOption {
  LuxeModern = 'luxe-modern',
}

export enum LanguageOption {
  English = 'en',
  Arabic = 'ar',
}

export interface ColorPalette {
  primary: string;
  primaryHsl: string;
  secondary: string;
  background: string;
  textPrimary: string;
  textSecondary: string;
  success: string;
}

export interface ColorScheme {
  light: ColorPalette;
  dark: ColorPalette;
  defaultMode: 'light' | 'dark';
}


export interface LocalizedString {
  en: string;
  ar: string;
}

export interface Category {
  id: string;
  labelKey: string;
  name?: LocalizedString;
  imageUrl: string;
  subCategories?: Category[];
}

export interface Product {
  id: number | string; // Sanity uses string IDs
  nameKey?: string; // Legacy fallback
  categoryKey?: string; // Legacy fallback
  name?: LocalizedString; // CMS data
  category?: LocalizedString; // CMS data
  description?: LocalizedString; // CMS data
  imageUrl: string;
  images?: string[]; // Multiple images support
  price?: number;
  dimensions?: string;
  materials?: string[];
  colors?: string[];
  model3d?: Model3D;              // optional 3D / AR model
  customDimensionsEnabled?: boolean; // allow user-entered custom dimensions
}

export type TFunction = (key: string) => string;

// ============================================================
//  3D / AR models
// ============================================================

export interface ModelVariant {
  id: string;
  label: LocalizedString | string;   // e.g. "Walnut", "Charcoal Linen"
  swatch?: string;                   // hex colour or small image URL for the chip
  gltfVariant?: string;              // name of a glTF material variant baked into the GLB
  materialName?: string;             // target material in the GLB (for programmatic override)
  colorHex?: string;                 // base-colour-factor override (#RRGGBB)
  textureUrl?: string;              // optional base-colour texture override
  roughness?: number;
  metalness?: number;
}

export interface Model3D {
  url: string;                       // GLB / glTF (required)
  iosUrl?: string;                   // USDZ for iOS Quick Look AR
  poster?: string;                   // poster image while loading
  alt?: string;
  variants?: ModelVariant[];
  // real-world size so AR places the object at accurate scale
  dimensions?: { width?: number; height?: number; depth?: number; unit?: 'm' | 'cm' };
  createdVia?: 'upload' | 'scan';
  scanId?: string;
}

// ============================================================
//  Guided photogrammetry scan jobs
// ============================================================

export type ScanStatus =
  | 'capturing'
  | 'uploading'
  | 'queued'
  | 'processing'
  | 'ready'
  | 'failed';

export interface ScanJob {
  id: string;
  createdBy: string;                 // admin email/uid
  status: ScanStatus;
  frameCount: number;
  frameUrls?: string[];
  realDimensions?: { width?: number; height?: number; depth?: number; unit?: 'm' | 'cm' };
  modelUrl?: string;                 // populated once reconstruction completes
  productId?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
//  Orders
// ============================================================

export type FulfillmentType = 'pickup' | 'shipping' | 'custom';

export type OrderStatus =
  | 'pending_payment'
  | 'payment_verification'   // Instapay/bank reference submitted, awaiting admin confirmation
  | 'paid'
  | 'confirmed'
  | 'in_production'
  | 'awaiting_approval'      // staff finished the item checklist, admin double-checks
  | 'ready'
  | 'shipped'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type PaymentMethod =
  | 'stripe'
  | 'paymob'
  | 'instapay'
  | 'cash_on_pickup'
  | 'cash_on_delivery' // legacy orders only; no longer offered (shipping is prepaid)
  | 'bank_transfer';

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'partially_refunded';

export interface OrderItem {
  productId: string;
  name: LocalizedString | string;
  imageUrl?: string;
  price: number;          // unit price at time of order
  quantity: number;
  color?: string;
  material?: string;
  customDimensions?: string;
}

export interface OrderContact {
  fullName: string;
  phone: string;
  email: string;
  line1?: string;
  city?: string;
  governorate?: string;
  country?: string;
  postalCode?: string;
}

export interface OrderStatusEvent {
  status: OrderStatus;
  at: string;             // ISO
  by?: string;            // admin email or 'system'
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string;    // e.g. EG482913KY — country + 6 digits + random letter + name initial
  userId?: string | null; // null/undefined for guest checkout
  items: OrderItem[];
  currency: string;
  subtotal: number;
  shipping: number;
  tax: number;            // VAT portion. When taxIncluded, already inside total.
  taxRate?: number;       // e.g. 0.14
  taxIncluded?: boolean;  // Egypt retail: prices are VAT-inclusive
  total: number;
  destinationCountry?: string; // ISO2 used for tax + order number
  fulfillment: FulfillmentType;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  statusHistory: OrderStatusEvent[];
  contact: OrderContact;
  customerNote?: string;
  adminNotes?: string;
  /** Indices into items[] the workshop has prepared (admin/worker checklist). */
  prepared?: number[];
  payment?: { reference?: string };            // Instapay / bank transfer reference
  tracking?: { number: string; carrier?: string };
  stripe?: { sessionId?: string; paymentIntentId?: string };
  createdAt: string;
  updatedAt: string;
}