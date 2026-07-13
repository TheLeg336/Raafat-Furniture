import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cacheGet, cacheSet } from '../lib/dataCache';

export interface LaunchStatus {
  /** Already resolved for THIS visitor's country (see server /api/launch/status). */
  comingSoon: boolean;
  /** Underlying flag regardless of geo scope. */
  comingSoonActive: boolean;
  scope: 'everyone' | 'international';
  message: string | null;
  scheduledAt: string | null;
}

interface LaunchContextValue {
  status: LaunchStatus;
  loading: boolean;
  refresh: () => Promise<void>;
}

const CACHE_KEY = 'rf_launch_status';
const defaultStatus: LaunchStatus = { comingSoon: false, comingSoonActive: false, scope: 'everyone', message: null, scheduledAt: null };

const LaunchContext = createContext<LaunchContextValue>({
  status: defaultStatus,
  loading: true,
  refresh: async () => {},
});


export function LaunchProvider({ children }: { children: React.ReactNode }) {
  const cached = cacheGet<LaunchStatus>(CACHE_KEY, 60_000);
  const [status, setStatus] = useState<LaunchStatus>(cached || defaultStatus);
  const [loading, setLoading] = useState(!cached);

  const apply = useCallback((next: LaunchStatus) => {
    setStatus(next);
    cacheSet(CACHE_KEY, next);
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/launch/status', { cache: 'no-store' });
      if (!res.ok) throw new Error('status failed');
      const data = await res.json();
      apply({
        comingSoon: !!data.comingSoon,
        comingSoonActive: !!data.comingSoonActive,
        scope: data.scope === 'international' ? 'international' : 'everyone',
        message: data.message || null,
        scheduledAt: data.scheduledAt || null,
      });
    } catch {
      /* Firestore listener is the fallback */
    }
  }, [apply]);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(id);
  }, [refresh]);

  // Real-time trigger: when the launch doc changes, re-fetch the server-resolved
  // status (the server applies the geo scope for this visitor — the raw doc can't).
  useEffect(() => {
    if (!db) return;
    return onSnapshot(doc(db, 'settings', 'launch'), () => {
      refresh();
    }, () => { /* offline — keep cached */ });
  }, [refresh]);

  return (
    <LaunchContext.Provider value={{ status, loading, refresh }}>
      {children}
    </LaunchContext.Provider>
  );
}

export function useLaunch() {
  return useContext(LaunchContext);
}
