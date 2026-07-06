import React, { useEffect, useMemo, useState } from 'react';
import {
  Search, Download, DollarSign, Clock, CheckCircle2, Phone, Mail, MapPin, StickyNote,
  History, Inbox, BellRing, Truck, BadgeCheck,
} from 'lucide-react';
import type { Order, OrderStatus, TFunction } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
  subscribeAllOrders, updateOrderStatus, setAdminNotes, setPrepared, notifyOrder, ordersToCSV,
  ORDER_STATUSES, ORDER_FLOW, OPEN_STATUSES,
} from '../lib/orders';
import { AdminPageHeader } from '../components/admin/AdminPageHeader';
import { Button } from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { PageSpinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { formatMoney, formatDate, localized } from '../lib/format';

interface Props { t: TFunction; }

const statusTone: Record<OrderStatus, 'gold' | 'success' | 'navy' | 'danger' | 'info'> = {
  pending_payment: 'gold', payment_verification: 'gold', paid: 'success', confirmed: 'info',
  in_production: 'info', awaiting_approval: 'gold', ready: 'info', shipped: 'info',
  completed: 'success', cancelled: 'danger', refunded: 'danger',
};
const label = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const HISTORY_STATUSES: OrderStatus[] = ['completed', 'cancelled', 'refunded'];

const AdminOrders: React.FC<Props> = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [view, setView] = useState<'pending' | 'history'>('pending');
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fulfilFilter, setFulfilFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Order | null>(null);

  useEffect(() => {
    setOrdersError(null);
    const unsub = subscribeAllOrders(
      (o) => { setOrders(o); setOrdersLoading(false); },
      (msg) => { setOrdersError(msg); setOrdersLoading(false); },
    );
    return () => unsub();
  }, []);

  // keep the open modal's order in sync with live data (checklist syncs across devices)
  useEffect(() => {
    if (selected) {
      const fresh = orders.find((o) => o.id === selected.id);
      if (fresh && fresh !== selected) setSelected(fresh);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  const stats = useMemo(() => {
    const revenue = orders.filter((o) => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0);
    const pending = orders.filter((o) => OPEN_STATUSES.includes(o.status)).length;
    const approval = orders.filter((o) => o.status === 'awaiting_approval').length;
    const completed = orders.filter((o) => o.status === 'completed').length;
    return { revenue, pending, approval, completed, currency: orders[0]?.currency };
  }, [orders]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = orders.filter((o) => {
      const inView = view === 'pending' ? !HISTORY_STATUSES.includes(o.status) : HISTORY_STATUSES.includes(o.status);
      if (!inView) return false;
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (fulfilFilter !== 'all' && o.fulfillment !== fulfilFilter) return false;
      if (!needle) return true;
      return (
        o.orderNumber.toLowerCase().includes(needle) ||
        o.contact.fullName.toLowerCase().includes(needle) ||
        o.contact.email.toLowerCase().includes(needle) ||
        o.contact.phone.toLowerCase().includes(needle)
      );
    });
    // Pending: oldest first so the queue is worked in order. History: newest first.
    return list.sort((a, b) => view === 'pending'
      ? a.createdAt.localeCompare(b.createdAt)
      : b.createdAt.localeCompare(a.createdAt));
  }, [orders, q, statusFilter, fulfilFilter, view]);

  const exportCSV = () => {
    const blob = new Blob([ordersToCSV(filtered)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `raafat-orders-${filtered.length}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <AdminPageHeader
        title="Orders"
        actions={(
          <>
            <Button variant={view === 'pending' ? 'primary' : 'secondary'} size="sm" onClick={() => setView('pending')} iconLeft={<Inbox size={15} />}>Pending</Button>
            <Button variant={view === 'history' ? 'primary' : 'secondary'} size="sm" onClick={() => setView('history')} iconLeft={<History size={15} />}>History</Button>
          </>
        )}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat icon={<Clock size={18} />} label="Open orders" value={String(stats.pending)} />
        <Stat icon={<BadgeCheck size={18} />} label="Awaiting approval" value={String(stats.approval)} />
        <Stat icon={<DollarSign size={18} />} label="Revenue (paid)" value={formatMoney(stats.revenue, { currency: stats.currency, compact: true })} />
        <Stat icon={<CheckCircle2 size={18} />} label="Completed" value={String(stats.completed)} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search number, name, email, phone…" aria-label="Search orders"
            className="w-full ps-9 pe-4 py-3 bg-transparent border border-[var(--color-border-strong)] rounded-[var(--radius-md)] outline-none focus:shadow-[0_0_0_2px_var(--color-primary)] focus:border-transparent"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="py-3 px-4 bg-transparent border border-[var(--color-border-strong)] rounded-[var(--radius-md)] outline-none cursor-pointer">
          <option value="all">All statuses</option>
          {(view === 'pending' ? ORDER_STATUSES.filter((s) => !HISTORY_STATUSES.includes(s)) : HISTORY_STATUSES).map((s) => <option key={s} value={s}>{label(s)}</option>)}
        </select>
        <select value={fulfilFilter} onChange={(e) => setFulfilFilter(e.target.value)} className="py-3 px-4 bg-transparent border border-[var(--color-border-strong)] rounded-[var(--radius-md)] outline-none cursor-pointer">
          <option value="all">All fulfillment</option>
          <option value="pickup">Pickup</option>
          <option value="shipping">Delivery</option>
          <option value="custom">Custom</option>
        </select>
        <Button variant="secondary" size="sm" onClick={exportCSV} iconLeft={<Download size={16} />} disabled={filtered.length === 0}>CSV</Button>
      </div>

      {ordersError ? (
        <Card className="p-8 text-start border-[var(--color-danger,#dc2626)]/30 bg-[color-mix(in_srgb,var(--color-danger,#dc2626)_6%,transparent)]">
          <p className="font-semibold text-[var(--color-danger,#dc2626)] mb-2">Could not load orders</p>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">{ordersError}</p>
          <ul className="text-sm text-[var(--color-text-secondary)] list-disc ps-5 space-y-1">
            <li>Sign in with an account listed in <strong>Admin → Team</strong> with role <em>admin</em> or <em>developer</em>.</li>
            <li>First-time setup: in Firebase Console → Firestore → create <code>admins/{'{your-email}'}</code> with field <code>role: developer</code>.</li>
            <li>Orders only exist after checkout works — set <code>FIREBASE_SERVICE_ACCOUNT</code> on the server (Vercel env or local <code>.env</code>).</li>
          </ul>
        </Card>
      ) : ordersLoading ? (
        <PageSpinner />
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center text-[var(--color-text-secondary)]">
          <p className="mb-3">{view === 'pending' ? 'No pending orders yet.' : 'No completed orders yet.'}</p>
          {orders.length === 0 && view === 'pending' && (
            <p className="text-sm max-w-md mx-auto">
              Place a test order from the shop (checkout needs <code>FIREBASE_SERVICE_ACCOUNT</code> configured).
              Workers see orders at <code>/staff</code> once status is paid, confirmed, or in production.
            </p>
          )}
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((o) => (
            <button key={o.id} onClick={() => setSelected(o)} className="text-start">
              <Card hover className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{o.contact.fullName}</span>
                    <span className="font-heading font-bold tracking-wider text-[var(--color-text-secondary)]">{o.orderNumber}</span>
                    <Badge tone={statusTone[o.status]}>{label(o.status)}</Badge>
                    {o.paymentStatus !== 'paid' && <Badge tone="gold">{label(o.paymentStatus)}</Badge>}
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-0.5 truncate">
                    {formatDate(o.createdAt)} · {o.items.reduce((n, it) => n + it.quantity, 0)} items
                    {OPEN_STATUSES.includes(o.status) && ` · ${(o.prepared || []).length}/${o.items.length} prepared`}
                  </p>
                </div>
                <span className="font-heading font-bold whitespace-nowrap">{formatMoney(o.total, { currency: o.currency })}</span>
              </Card>
            </button>
          ))}
        </div>
      )}

      <OrderDetail order={selected} onClose={() => setSelected(null)} adminEmail={user?.email || 'admin'} toast={toast} />
    </>
  );
};

const Stat: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <Card className="p-4">
    <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)] text-sm mb-1">{icon}{label}</div>
    <p className="font-heading text-2xl font-bold">{value}</p>
  </Card>
);

const OrderDetail: React.FC<{ order: Order | null; onClose: () => void; adminEmail: string; toast: ReturnType<typeof useToast> }> = ({ order, onClose, adminEmail, toast }) => {
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (order) { setNotes(order.adminNotes || ''); setNewStatus(''); setNote(''); setTrackingNumber(order.tracking?.number || ''); setCarrier(order.tracking?.carrier || ''); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id]);

  if (!order) return null;

  const prepared = order.prepared || [];
  const allPrepared = order.items.length > 0 && order.items.every((_, i) => prepared.includes(i));
  const inPreparation = ['paid', 'confirmed', 'in_production'].includes(order.status);
  const needsPaymentCheck = order.paymentStatus !== 'paid' && ['instapay', 'bank_transfer'].includes(order.paymentMethod);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try { await fn(); toast.success(ok); }
    catch (e: any) { toast.error(e?.message || 'Action failed'); }
    setBusy(false);
  };

  const toggleItem = async (idx: number) => {
    const next = prepared.includes(idx) ? prepared.filter((n) => n !== idx) : [...prepared, idx];
    try { await setPrepared(order.id, next); } // autosaves; live subscription refreshes the modal
    catch (e: any) { toast.error(e?.message || 'Could not save checklist'); }
  };

  return (
    <Modal open={!!order} onClose={onClose} title={`Order ${order.orderNumber}`} size="lg">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-2">
          <Badge tone={statusTone[order.status]}>{label(order.status)}</Badge>
          <Badge tone={order.paymentStatus === 'paid' ? 'success' : 'gold'}>{label(order.paymentStatus)}</Badge>
          <Badge tone="info">{label(order.fulfillment)}</Badge>
          <Badge tone="neutral">{label(order.paymentMethod)}</Badge>
        </div>

        {/* Payment verification (InstaPay / bank transfer) */}
        {needsPaymentCheck && (
          <section className="p-4 rounded-[var(--radius-md)] border border-[var(--color-primary)]/40 flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Payment verification</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {order.payment?.reference
                ? <>Customer reference: <strong className="text-[var(--color-text-primary)]">{order.payment.reference}</strong> — check your {order.paymentMethod === 'instapay' ? 'InstaPay' : 'bank'} account for {formatMoney(order.total, { currency: order.currency })}.</>
                : 'No transfer reference submitted yet.'}
            </p>
            <div>
              <Button size="sm" loading={busy} onClick={() => run(() => updateOrderStatus(order.id, 'paid', adminEmail, 'Transfer verified', order), 'Payment confirmed')}>
                Confirm payment received
              </Button>
            </div>
          </section>
        )}

        {/* Contact */}
        <section className="text-sm flex flex-col gap-1.5">
          <p className="font-semibold text-base">{order.contact.fullName}</p>
          <a href={`mailto:${order.contact.email}`} className="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"><Mail size={14} /> {order.contact.email}</a>
          <a href={`tel:${order.contact.phone}`} className="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"><Phone size={14} /> {order.contact.phone}</a>
          {order.contact.line1 && <p className="flex items-center gap-2 text-[var(--color-text-secondary)]"><MapPin size={14} /> {[order.contact.line1, order.contact.city, order.contact.governorate, order.contact.country].filter(Boolean).join(', ')}</p>}
          {order.customerNote && <p className="mt-1 p-3 rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] italic">“{order.customerNote}”</p>}
        </section>

        {/* Items — preparation checklist. Autosaves and syncs live across devices. */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Items · {prepared.length}/{order.items.length} prepared</h3>
          </div>
          {order.items.map((it, i) => {
            const done = prepared.includes(i);
            return (
              <label key={i} className={`flex gap-3 items-center p-2 -m-2 rounded-[var(--radius-sm)] ${inPreparation ? 'cursor-pointer hover:bg-[var(--color-surface-2)]' : ''}`}>
                {inPreparation && (
                  <input type="checkbox" checked={done} onChange={() => toggleItem(i)} className="w-5 h-5 accent-[var(--color-primary)] shrink-0" />
                )}
                <div className="w-12 h-12 rounded-[var(--radius-sm)] overflow-hidden bg-[var(--color-secondary)] shrink-0">{it.imageUrl && <img src={it.imageUrl} alt="" className="w-full h-full object-cover" />}</div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${done && inPreparation ? 'line-through opacity-70' : ''}`}>{typeof it.name === 'string' ? it.name : localized(it.name)}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{[it.color, it.material, it.customDimensions].filter(Boolean).join(' · ')} · ×{it.quantity}</p>
                </div>
                <span className="text-sm whitespace-nowrap">{formatMoney(it.price * it.quantity, { currency: order.currency })}</span>
              </label>
            );
          })}
          <div className="flex flex-col gap-1 pt-3 border-t border-[var(--color-border)] text-sm">
            <div className="flex justify-between"><span className="text-[var(--color-text-secondary)]">Subtotal</span><span>{formatMoney(order.subtotal, { currency: order.currency })}</span></div>
            {order.tax > 0 && <div className="flex justify-between text-[var(--color-text-secondary)]"><span>{order.taxIncluded ? `VAT ${Math.round((order.taxRate || 0.14) * 100)}% (included)` : 'Tax'}</span><span>{formatMoney(order.tax, { currency: order.currency })}</span></div>}
            <div className="flex justify-between items-baseline pt-1">
              <span className="font-heading font-bold">Total</span>
              <span className="font-heading text-xl font-bold">{formatMoney(order.total, { currency: order.currency })}</span>
            </div>
          </div>
          {inPreparation && (
            <Button
              size="sm" disabled={!allPrepared} loading={busy} iconLeft={<CheckCircle2 size={15} />}
              onClick={() => run(() => updateOrderStatus(order.id, 'awaiting_approval', adminEmail, 'Checklist complete', order), 'Order marked complete — awaiting approval')}
            >
              Order complete
            </Button>
          )}
        </section>

        {/* Approval: notify customer / add tracking */}
        {order.status === 'awaiting_approval' && (
          <section className="flex flex-col gap-3 p-4 rounded-[var(--radius-md)] border border-[var(--color-primary)]/40">
            <h3 className="text-sm font-semibold">Final approval</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">Double-check the order above, then release it to the customer.</p>
            {order.fulfillment === 'shipping' ? (
              <>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input label="Tracking number" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="e.g. ARAMEX 1234567890" />
                  <Input label="Carrier (optional)" value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="Aramex, DHL…" />
                </div>
                <div>
                  <Button size="sm" loading={busy} disabled={!trackingNumber.trim()} iconLeft={<Truck size={15} />}
                    onClick={() => run(() => notifyOrder(order.id, 'shipped', trackingNumber.trim(), carrier.trim() || undefined), 'Customer notified with tracking')}>
                    Mark shipped & send tracking
                  </Button>
                </div>
              </>
            ) : (
              <div>
                <Button size="sm" loading={busy} iconLeft={<BellRing size={15} />}
                  onClick={() => run(() => notifyOrder(order.id, 'ready'), 'Customer notified — ready for pickup')}>
                  Notify customer — ready for pickup
                </Button>
              </div>
            )}
          </section>
        )}

        {/* Status timeline */}
        <section>
          <h3 className="text-sm font-semibold mb-3">Status history</h3>
          <ol className="flex flex-col gap-2">
            {order.statusHistory.map((e, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="mt-1 w-2 h-2 rounded-full bg-[var(--color-primary)] shrink-0" />
                <div>
                  <span className="font-medium">{label(e.status)}</span>
                  <span className="text-[var(--color-text-secondary)]"> · {formatDate(e.at, true)} · {e.by}</span>
                  {e.note && <p className="text-[var(--color-text-secondary)] italic">{e.note}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Manual status override */}
        <section className="flex flex-col gap-3 p-4 rounded-[var(--radius-md)] bg-[var(--color-surface-2)]">
          <h3 className="text-sm font-semibold">Update status</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value as OrderStatus)}>
              <option value="">Choose status…</option>
              {ORDER_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
            </Select>
            <Input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {ORDER_FLOW.map((s) => (
              <button key={s} onClick={() => setNewStatus(s)} className={`text-xs px-3 py-1 rounded-[var(--radius-pill)] border ${newStatus === s ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}>{label(s)}</button>
            ))}
          </div>
          <Button size="sm" loading={busy} disabled={!newStatus}
            onClick={() => run(async () => { await updateOrderStatus(order.id, newStatus as OrderStatus, adminEmail, note.trim() || undefined, order); setNote(''); }, `Status → ${label(newStatus)}`)}>
            Apply status
          </Button>
        </section>

        {/* Admin notes */}
        <section>
          <div className="flex items-center gap-1.5 mb-2 text-sm font-semibold"><StickyNote size={15} /> Internal notes</div>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Private notes for staff…" />
          <div className="flex justify-end mt-2"><Button size="sm" variant="secondary" loading={busy} onClick={() => run(() => setAdminNotes(order.id, notes), 'Notes saved')}>Save notes</Button></div>
        </section>
      </div>
    </Modal>
  );
};

export default AdminOrders;
