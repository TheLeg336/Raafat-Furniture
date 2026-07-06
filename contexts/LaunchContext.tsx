import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

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

const defaultStatus: LaunchStatus = { comingSoon: false, message: null, scheduledAt: null };

const LaunchContext = createContext<LaunchContextValue>({
  status: defaultStatus,
  loading: true,
  refresh: async () => {},
});

export function LaunchProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<LaunchStatus>(defaultStatus);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/launch/status');
      if (!res.ok) throw new Error('status failed');
      const data = await res.json();
      setStatus({
        comingSoon: !!data.comingSoon,
        message: data.message || null,
        scheduledAt: data.scheduledAt || null,
      });
    } catch {
      setStatus(defaultStatus);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(id);
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
