import React, { createContext, useContext, useEffect, useState } from 'react';
import { getPaymentsConfig } from '../lib/api';
import { currencyForCountry, type StoreCurrency } from '../lib/currency';

interface CurrencyContextType {
  currency: StoreCurrency;
  setCurrency: (c: StoreCurrency) => void;
  /** True once the IP-based default has been resolved (or a manual choice exists). */
  ready: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);
const STORAGE_KEY = 'rf_currency';

/**
 * Browse currency: a manual choice (persisted) wins; otherwise it's derived from
 * the visitor's IP country. The *charge* currency at checkout is decided server-side
 * from the verified destination — this context only controls what prices are shown.
 */
export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const stored = (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY)) as StoreCurrency | null;
  const [currency, setCurrencyState] = useState<StoreCurrency>(stored === 'EGP' || stored === 'USD' ? stored : 'EGP');
  const [ready, setReady] = useState(!!stored);

  useEffect(() => {
    if (stored) return; // respect an explicit choice
    let active = true;
    getPaymentsConfig().then((cfg) => {
      if (active) { setCurrencyState(currencyForCountry(cfg.ipCountry)); setReady(true); }
    });
    return () => { active = false; };
  }, [stored]);

  const setCurrency = (c: StoreCurrency) => {
    setCurrencyState(c);
    setReady(true);
    try { localStorage.setItem(STORAGE_KEY, c); } catch { /* private mode */ }
  };

  return <CurrencyContext.Provider value={{ currency, setCurrency, ready }}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
};
