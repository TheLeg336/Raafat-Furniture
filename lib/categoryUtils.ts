import type { Category, Product, TFunction } from '../types';

/** Category ids that have at least one active (non-archived) product. */
export function getProductCategoryIds(products: Pick<Product, 'categoryKey'>[]): Set<string> {
  const ids = new Set<string>();
  for (const p of products) {
    if (p.categoryKey) ids.add(String(p.categoryKey));
  }
  return ids;
}

/**
 * Keep top-level categories that have products (directly or via subcategories).
 * Subcategory lists are trimmed to entries that have products.
 */
export function filterCategoriesWithProducts(
  categories: Category[],
  productCategoryIds: Set<string>,
): Category[] {
  const out: Category[] = [];
  for (const cat of categories) {
    const subs = cat.subCategories?.filter((s) => productCategoryIds.has(s.id)) ?? [];
    const hasDirect = productCategoryIds.has(cat.id);
    const hasSubs = subs.length > 0;
    if (!hasDirect && !hasSubs) continue;
    out.push({
      ...cat,
      ...(cat.subCategories ? { subCategories: hasSubs ? subs : [] } : {}),
    });
  }
  return out;
}

export function getCategoryLabel(cat: Category | null | undefined, t: TFunction): string {
  if (!cat) return '';
  const lang = (typeof document !== 'undefined' ? document.documentElement.lang : 'en') as 'en' | 'ar';
  if (cat.name?.[lang]?.trim()) return cat.name[lang];
  const fromKey = t(cat.labelKey);
  return fromKey || cat.labelKey || cat.id;
}

export function findCategory(categories: Category[], catId: string | null): Category | null {
  if (!catId) return null;
  for (const cat of categories) {
    if (cat.id === catId) return cat;
    const sub = cat.subCategories?.find((s) => s.id === catId);
    if (sub) return sub;
  }
  return null;
}

/** Lowercase haystack for search — includes CMS names and translation keys. */
export function getCategorySearchText(
  cat: Category,
  texts?: Record<string, Record<string, string>>,
): string {
  const parts = [
    cat.name?.en,
    cat.name?.ar,
    texts?.en?.[cat.labelKey],
    texts?.ar?.[cat.labelKey],
    cat.labelKey,
    cat.id,
  ].filter(Boolean);
  return parts.join(' ').toLowerCase();
}

export function findParentCategory(categories: Category[], childId: string): Category | null {
  return categories.find((c) => c.subCategories?.some((s) => s.id === childId)) ?? null;
}

/** Whether this category id should appear in the storefront (has products). */
export function isCategoryVisible(
  categoryId: string,
  visibleCategories: Category[],
): boolean {
  if (visibleCategories.some((c) => c.id === categoryId)) return true;
  return visibleCategories.some((c) => c.subCategories?.some((s) => s.id === categoryId));
}

/** Product ids belonging to a category leaf, or all descendant leaves for a parent. */
export function getCategoryProductIds(
  categoryId: string,
  allCategories: Category[],
  productCategoryIds: Set<string>,
): Set<string> {
  const cat = findCategory(allCategories, categoryId);
  if (!cat) return new Set();

  const ids = new Set<string>();
  const subs = cat.subCategories ?? [];
  const subsWithProducts = subs.filter((s) => productCategoryIds.has(s.id));

  if (subsWithProducts.length > 0) {
    subsWithProducts.forEach((s) => ids.add(s.id));
    return ids;
  }

  if (productCategoryIds.has(categoryId)) ids.add(categoryId);
  return ids;
}

export function productMatchesCategory(
  product: Pick<Product, 'categoryKey'>,
  categoryId: string,
  allCategories: Category[],
  productCategoryIds: Set<string>,
): boolean {
  if (!product.categoryKey) return false;
  const ids = getCategoryProductIds(categoryId, allCategories, productCategoryIds);
  return ids.has(String(product.categoryKey));
}
