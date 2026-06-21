import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

export interface Settings {
  heroImageUrl?: string;
}

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    const unsubscribe = onSnapshot(doc(db, 'settings', 'general'), (doc) => {
      if (doc.exists()) {
        setSettings(doc.data() as Settings);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching settings:", error);
      try {
        handleFirestoreError(error, OperationType.GET, 'settings/general');
      } catch (e) {
        // Error is already logged
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateSettings = async (newSettings: Partial<Settings>) => {
    if (!db) return;
    try {
      await setDoc(doc(db, 'settings', 'general'), newSettings, { merge: true });
    } catch (error) {
      console.error("Error updating settings:", error);
      try {
        handleFirestoreError(error, OperationType.WRITE, 'settings/general');
      } catch (e) {
        // Error is already logged
      }
      throw error;
    }
  };

  return { settings, loading, updateSettings };
};
