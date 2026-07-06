import { useMemo } from 'react';
import { useCategories } from './useCategories';
import { useProducts } from './useProducts';
import {
  filterCategoriesWithProducts,
  getProductCategoryIds,
} from '../lib/categoryUtils';

/** Categories/subcategories that have at least one product — for storefront UI. */
export function useVisibleCategories() {
  const { categories: allCategories, loading: categoriesLoading } = useCategories();
  const { products, loading: productsLoading } = useProducts();

  const productCategoryIds = useMemo(() => getProductCategoryIds(products), [products]);

  const categories = useMemo(
    () => filterCategoriesWithProducts(allCategories, productCategoryIds),
    [allCategories, productCategoryIds],
  );

  return {
    categories,
    allCategories,
    productCategoryIds,
    loading: categoriesLoading || productsLoading,
  };
}
