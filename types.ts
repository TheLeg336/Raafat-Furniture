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
  price?: number;
  dimensions?: string;
  materials?: string[];
  colors?: string[];
}

export type TFunction = (key: string) => string;