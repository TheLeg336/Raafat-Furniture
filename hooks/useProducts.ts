import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PRODUCTS as FALLBACK_PRODUCTS } from '../constants';
import { Product } from '../types';
import { cacheGet, cacheSet } from '../lib/dataCache';

const CACHE_KEY = 'rf_products_v1';

export const useProducts = () => {
  const cached = cacheGet<Product[]>(CACHE_KEY, 10 * 60 * 1000);
  const [products, setProducts] = useState<Product[]>(cached || []);
  const [loading, setLoading] = useState(!cached?.length);

  useEffect(() => {
    if (!db) {
      setProducts(FALLBACK_PRODUCTS);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'products'), where('archivedAt', '==', null), limit(300));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedProducts = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Product[];
      cacheSet(CACHE_KEY, fetchedProducts);
      setProducts(fetchedProducts);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching from Firebase:', error);
      if (!cached?.length) setProducts(FALLBACK_PRODUCTS);
      setLoading(false);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { products, loading };
};
