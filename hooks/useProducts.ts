import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PRODUCTS as FALLBACK_PRODUCTS } from '../constants';
import { Product } from '../types';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      console.log('Firebase not configured. Using fallback products.');
      setProducts(FALLBACK_PRODUCTS);
      setLoading(false);
      return;
    }

    // Fetch products where archivedAt is null
    const q = query(collection(db, 'products'), where('archivedAt', '==', null));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      // If Firebase is configured but empty, we can show empty state or fallback.
      // Let's show the fetched products (even if empty) since it's the real DB.
      setProducts(fetchedProducts);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching from Firebase:', error);
      setProducts(FALLBACK_PRODUCTS);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { products, loading };
};
