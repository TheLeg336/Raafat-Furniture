import React, { createContext, useContext, useEffect, useState } from 'react';
import { getPaymentsConfig } from '../lib/api';
import { type StoreCurrency } from '../lib/currency';
import { browseCurrencyFromGeo } from '../lib/geo';

interface CurrencyContextType {
  currency: StoreCurrency;
  /** True once the IP-based default has been resolved. */
  ready: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);
const LEGACY_STORAGE_KEY = 'rf_currency';

/**
 * Browse currency is derived from the visitor's IP country (EG → EGP, else USD).
 * The charge currency at checkout is decided server-side from the verified destination —
 * this context only controls what prices are shown.
 */
export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<StoreCurrency>('USD');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { localStorage.removeItem(LEGACY_STORAGE_KEY); } catch { /* private mode */ }
    let active = true;
    getPaymentsConfig().then((cfg) => {
      if (active) {
        setCurrencyState(browseCurrencyFromGeo(cfg.ipCountry));
        setReady(true);
      }
    });
    return () => { active = false; };
  }, []);

  return <CurrencyContext.Provider value={{ currency, ready }}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
};
