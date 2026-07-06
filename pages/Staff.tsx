import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ClipboardList, Hammer, Home, LogOut, RefreshCw, Store, Truck, X } from 'lucide-react';
import type { TFunction } from '../types';
import { adminPath, LOGIN_PATH } from '../lib/paths';
import { useAuth } from '../contexts/AuthContext';
import { fetchWorkerOrders, saveWorkerPrepared, completeWorkerOrder, type WorkerOrder } from '../lib/worker';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageSpinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { formatDate, localized } from '../lib/format';

interface Props { t: TFunction; }

const fulfilIcon: Record<string, React.ReactNode> = {
  pickup: <Store size={14} />, shipping: <Truck size={14} />, custom: <Hammer size={14} />,
};

/**
 * Workshop view: pending orders as spec checklists — item, colour, material,
 * dimensions. No prices, no customer details. Checklist autosaves to the order
 * so anyone can pick up where a colleague left off.
 */
const Staff: React.FC<Props> = ({ t }) => {
  const { user, isWorker, isAdmin, loading, logout } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState<WorkerOrder[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      setLoadError(null);
      setOrders(await fetchWorkerOrders());
    } catch (e: any) {
      const msg = e?.message || 'Could not load orders';
      setLoadError(msg);
      if (orders === null) setOrders([]);
      console.error(e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user || (!isWorker && !isAdmin)) return;
    load();
    const id = setInterval(load, 20_000); // keep checklists in sync across devices
    return () => clearInterval(id);
  }, [user, isWorker, isAdmin, load]);

  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

  if (loading) return <PageSpinner />;
  if (!user) return <Navigate to={LOGIN_PATH} replace />;
  if (!isWorker && !isAdmin) return <Navigate to="/" replace />;

  const toggle = async (o: WorkerOrder, idx: number) => {
    const prepared = o.prepared.includes(idx) ? o.prepared.filter((n) => n !== idx) : [...o.prepared, idx];
    setOrders((prev) => prev?.map((x) => (x.id === o.id ? { ...x, prepared } : x)) ?? prev);
    try { await saveWorkerPrepared(o.id, prepared); }
    catch { toast.error(t('save_failed') || 'Could not save — check your connection'); load(); }
  };

  const complete = async (o: WorkerOrder) => {
    setBusyId(o.id);
    try {
      await completeWorkerOrder(o.id);
      setOrders((prev) => prev?.filter((x) => x.id !== o.id) ?? prev);
      setCelebrate(true);
      closeTimer.current = setTimeout(() => setCelebrate(false), 3000);
    } catch (e: any) {
      toast.error(e?.message || 'Could not complete the order');
    }
    setBusyId(null);
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <header className="border-b border-[var(--color-surface-2)]">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">
              <Home size={16} /> {t('nav_home') || 'Store'}
            </Link>
            {isAdmin && (
              <>
                <span className="text-[var(--color-text-secondary)] opacity-40">·</span>
                <Link to={adminPath()} className="text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">Catalog</Link>
                <Link to={adminPath('orders')} className="text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">Orders</Link>
              </>
            )}
          </div>
          <button type="button" onClick={() => logout()} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-danger,#dc2626)]">
            <LogOut size={16} /> {t('account_signout') || 'Sign out'}
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold flex items-center gap-3"><ClipboardList size={26} /> {t('staff_title') || 'Workshop orders'}</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">{t('staff_desc') || 'Oldest first. Tick each item as you prepare it — progress saves automatically.'}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={load} iconLeft={<RefreshCw size={15} />}>{t('refresh') || 'Refresh'}</Button>
      </div>

      {loadError ? (
        <Card className="p-8 text-start border-[var(--color-danger,#dc2626)]/30">
          <p className="font-semibold mb-2">Workshop access issue</p>
          <p className="text-sm text-[var(--color-text-secondary)] mb-3">{loadError}</p>
          <ul className="text-sm text-[var(--color-text-secondary)] list-disc ps-5 space-y-1">
            <li>Your login must be added in the developer <strong>Team</strong> panel with role <em>worker</em>.</li>
            <li>This workshop view shows specs only: no prices or customer names.</li>
            <li>Orders appear when status is <em>paid</em>, <em>confirmed</em>, or <em>in_production</em> (after a real checkout).</li>
          </ul>
        </Card>
      ) : orders === null ? (
        <PageSpinner />
      ) : orders.length === 0 ? (
        <Card className="p-12 text-center text-[var(--color-text-secondary)]">
          <p className="mb-2">{t('staff_empty') || 'No pending orders. Nice work.'}</p>
          <p className="text-sm max-w-md mx-auto">Orders show here once customers check out and payment is confirmed. Ask an admin to verify checkout is configured.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((o) => {
            const allDone = o.items.length > 0 && o.items.every((_, i) => o.prepared.includes(i));
            return (
              <Card key={o.id} className="p-5">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="font-heading font-bold tracking-wider text-lg">{o.orderNumber}</span>
                  <Badge tone="info">{fulfilIcon[o.fulfillment]}{t(`fulfil_${o.fulfillment}`) || o.fulfillment}</Badge>
                  <span className="text-xs text-[var(--color-text-secondary)] ms-auto">{formatDate(o.createdAt)}</span>
                </div>
                {o.customerNote && (
                  <p className="text-sm italic text-[var(--color-text-secondary)] mb-3 p-3 rounded-[var(--radius-sm)] bg-[var(--color-surface-2)]">“{o.customerNote}”</p>
                )}
                <ul className="flex flex-col gap-2">
                  {o.items.map((it, i) => {
                    const done = o.prepared.includes(i);
                    return (
                      <li key={i}>
                        <label className={`flex items-center gap-3 p-3 rounded-[var(--radius-md)] border cursor-pointer transition-colors ${done ? 'border-[var(--color-success)] bg-[color-mix(in_srgb,var(--color-success)_8%,transparent)]' : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'}`}>
                          <input type="checkbox" checked={done} onChange={() => toggle(o, i)} className="w-5 h-5 accent-[var(--color-primary)] shrink-0" />
                          {it.imageUrl && <img src={it.imageUrl} alt="" className="w-10 h-10 rounded-[var(--radius-sm)] object-cover shrink-0" />}
                          <span className="flex-1 min-w-0">
                            <span className={`block font-medium ${done ? 'line-through opacity-70' : ''}`}>
                              {typeof it.name === 'string' ? it.name : localized(it.name)} ×{it.quantity}
                            </span>
                            <span className="block text-xs text-[var(--color-text-secondary)]">
                              {[it.color, it.material, it.customDimensions].filter(Boolean).join(' · ') || (t('no_options') || 'Standard finish')}
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-[var(--color-text-secondary)]">{o.prepared.length}/{o.items.length} {t('items_ready') || 'items ready'}</span>
                  <Button size="sm" disabled={!allDone} loading={busyId === o.id} onClick={() => complete(o)} iconLeft={<CheckCircle2 size={15} />}>
                    {t('order_complete') || 'Order complete'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Completion popup — closes itself after 3s or on ✕ */}
      <AnimatePresence>
        {celebrate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setCelebrate(false)}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="relative glass-card rounded-[var(--radius-lg)] px-10 py-8 text-center flex flex-col items-center gap-3 bg-[var(--color-background)] border border-[var(--color-border)] shadow-2xl"
              onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setCelebrate(false)} aria-label="Close" className="absolute top-3 end-3 p-1 rounded-full hover:bg-[var(--color-surface-2)]"><X size={16} /></button>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}>
                <CheckCircle2 size={52} className="text-[var(--color-primary)]" />
              </motion.div>
              <p className="font-heading text-xl font-bold">{t('order_completed_msg') || 'Order completed'}</p>
              <p className="text-sm text-[var(--color-text-secondary)]">{t('order_completed_sub') || 'Sent to the office for final approval.'}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </div>
  );
};

export default Staff;
