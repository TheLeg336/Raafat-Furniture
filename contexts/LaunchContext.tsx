import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cacheGet, cacheSet } from '../lib/dataCache';

export interface LaunchStatus {
  comingSoon: boolean;
  message: string | null;
  scheduledAt: string | null;
}

interface LaunchContextValue {
  status: LaunchStatus;
  loading: boolean;
  refresh: () => Promise<void>;
}

const CACHE_KEY = 'rf_launch_status';
const defaultStatus: LaunchStatus = { comingSoon: false, message: null, scheduledAt: null };

const LaunchContext = createContext<LaunchContextValue>({
  status: defaultStatus,
  loading: true,
  refresh: async () => {},
});

function parseLaunch(data: Record<string, unknown> | undefined): LaunchStatus {
  if (!data) return defaultStatus;
  return {
    comingSoon: !!data.comingSoon,
    message: (data.message as string) || null,
    scheduledAt: (data.scheduledAt as string) || null,
  };
}

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

  // Real-time Firestore mirror — works even when API is stale or admin saved via client fallback.
  useEffect(() => {
    if (!db) return;
    return onSnapshot(doc(db, 'settings', 'launch'), (snap) => {
      apply(parseLaunch(snap.exists() ? snap.data() : undefined));
    }, () => { /* offline — keep cached */ });
  }, [apply]);

  return (
    <LaunchContext.Provider value={{ status, loading, refresh }}>
      {children}
    </LaunchContext.Provider>
  );
}

export function useLaunch() {
  return useContext(LaunchContext);
}
