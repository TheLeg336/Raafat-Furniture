import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { CATEGORIES as FALLBACK_CATEGORIES } from '../constants';
import { Category } from '../types';

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      console.log('Firebase not configured. Using fallback categories.');
      setCategories(FALLBACK_CATEGORIES);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'categories'), orderBy('id', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        // If the collection is empty, we might want to seed it or use fallback
        // For now, let's use fallback if empty to ensure the site works
        setCategories(FALLBACK_CATEGORIES);
      } else {
        const fetchedCategories = snapshot.docs.map(doc => ({
          ...doc.data()
        })) as Category[];
        setCategories(fetchedCategories);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching categories from Firebase:', error);
      try {
        handleFirestoreError(error, OperationType.LIST, 'categories');
      } catch (e) {
        // Error is already logged in handleFirestoreError
      }
      setCategories(FALLBACK_CATEGORIES);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { categories, loading };
};
