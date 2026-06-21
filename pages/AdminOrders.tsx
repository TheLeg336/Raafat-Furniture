import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Search, Download, Package, DollarSign, Clock, CheckCircle2, Phone, Mail, MapPin, StickyNote } from 'lucide-react';
import type { Order, OrderStatus, TFunction } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
  subscribeAllOrders, updateOrderStatus, setAdminNotes, ordersToCSV, ORDER_STATUSES, ORDER_FLOW,
} from '../lib/orders';
import { AdminNav } from '../components/admin/AdminNav';
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
  pending_payment: 'gold', paid: 'success', confirmed: 'info', in_production: 'info',
  ready: 'info', shipped: 'info', completed: 'success', cancelled: 'danger', refunded: 'danger',
};
const label = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const AdminOrders: React.FC<Props> = () => {
  const { user, isAdmin, loading } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fulfilFilter, setFulfilFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Order | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    const unsub = subscribeAllOrders((o) => { setOrders(o); setOrdersLoading(false); });
    return () => unsub();
  }, [isAdmin]);

  // keep the open modal's order in sync with live data
  useEffect(() => {
    if (selected) {
      const fresh = orders.find((o) => o.id === selected.id);
      if (fresh && fresh !== selected) setSelected(fresh);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  const stats = useMemo(() => {
    const revenue = orders.filter((o) => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0);
    const pending = orders.filter((o) => ['pending_payment', 'paid', 'confirmed', 'in_production', 'ready'].includes(o.status)).length;
    const completed = orders.filter((o) => o.status === 'completed').length;
    return { revenue, pending, completed, total: orders.length, currency: orders[0]?.currency };
  }, [orders]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return orders.filter((o) => {
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
  }, [orders, q, statusFilter, fulfilFilter]);

  const exportCSV = () => {
    const blob = new Blob([ordersToCSV(filtered)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `raafat-orders-${filtered.length}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <PageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <AdminNav />
      <h1 className="font-heading text-3xl font-bold mb-6">Orders</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat icon={<Package size={18} />} label="Total orders" value={String(stats.total)} />
        <Stat icon={<DollarSign size={18} />} label="Revenue (paid)" value={formatMoney(stats.revenue, { currency: stats.currency, compact: true })} />
        <Stat icon={<Clock size={18} />} label="In progress" value={String(stats.pending)} />
        <Stat icon={<CheckCircle2 size={18} />} label="Completed" value={String(stats.completed)} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search number, name, email, phone…"
            className="w-full ps-9 pe-4 py-3 bg-transparent border border-[var(--color-border-strong)] rounded-[var(--radius-md)] outline-none focus:shadow-[0_0_0_2px_var(--color-primary)] focus:border-transparent"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="py-3 px-4 bg-transparent border border-[var(--color-border-strong)] rounded-[var(--radius-md)] outline-none cursor-pointer">
          <option value="all">All statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
        </select>
        <select value={fulfilFilter} onChange={(e) => setFulfilFilter(e.target.value)} className="py-3 px-4 bg-transparent border border-[var(--color-border-strong)] rounded-[var(--radius-md)] outline-none cursor-pointer">
          <option value="all">All fulfillment</option>
          <option value="pickup">Pickup</option>
          <option value="shipping">Delivery</option>
          <option value="custom">Custom</option>
        </select>
        <Button variant="secondary" size="sm" onClick={exportCSV} iconLeft={<Download size={16} />} disabled={filtered.length === 0}>CSV</Button>
      </div>

      {ordersLoading ? (
        <PageSpinner />
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center text-[var(--color-text-secondary)]">No orders match.</Card>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((o) => (
            <button key={o.id} onClick={() => setSelected(o)} className="text-start">
              <Card hover className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading font-bold tracking-wider">{o.orderNumber}</span>
                    <Badge tone={statusTone[o.status]}>{label(o.status)}</Badge>
                    {o.paymentStatus !== 'paid' && <Badge tone="gold">{label(o.paymentStatus)}</Badge>}
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-0.5 truncate">
                    {o.contact.fullName} · {formatDate(o.createdAt)} · {o.items.reduce((n, it) => n + it.quantity, 0)} items
                  </p>
                </div>
                <span className="font-heading font-bold whitespace-nowrap">{formatMoney(o.total, { currency: o.currency })}</span>
              </Card>
            </button>
          ))}
        </div>
      )}

      <OrderDetail order={selected} onClose={() => setSelected(null)} adminEmail={user.email || 'admin'} toast={toast} />
    </div>
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
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (order) { setNotes(order.adminNotes || ''); setNewStatus(''); setNote(''); } }, [order?.id]);

  if (!order) return null;

  const changeStatus = async () => {
    if (!newStatus) return;
    setBusy(true);
    try {
      await updateOrderStatus(order.id, newStatus, adminEmail, note.trim() || undefined, order);
      toast.success(`Status → ${label(newStatus)}`);
      setNote('');
    } catch (e: any) { toast.error(e?.message || 'Update failed (admin rights / Firestore rules)'); }
    setBusy(false);
  };
  const saveNotes = async () => {
    setBusy(true);
    try { await setAdminNotes(order.id, notes); toast.success('Notes saved'); }
    catch (e: any) { toast.error(e?.message || 'Could not save'); }
    setBusy(false);
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

        {/* Contact */}
        <section className="text-sm flex flex-col gap-1.5">
          <p className="font-semibold text-base">{order.contact.fullName}</p>
          <a href={`mailto:${order.contact.email}`} className="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"><Mail size={14} /> {order.contact.email}</a>
          <a href={`tel:${order.contact.phone}`} className="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"><Phone size={14} /> {order.contact.phone}</a>
          {order.contact.line1 && <p className="flex items-center gap-2 text-[var(--color-text-secondary)]"><MapPin size={14} /> {[order.contact.line1, order.contact.city, order.contact.governorate, order.contact.country].filter(Boolean).join(', ')}</p>}
          {order.customerNote && <p className="mt-1 p-3 rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] italic">“{order.customerNote}”</p>}
        </section>

        {/* Items */}
        <section className="flex flex-col gap-3">
          {order.items.map((it, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-12 h-12 rounded-[var(--radius-sm)] overflow-hidden bg-[var(--color-secondary)] shrink-0">{it.imageUrl && <img src={it.imageUrl} alt="" className="w-full h-full object-cover" />}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{typeof it.name === 'string' ? it.name : localized(it.name)}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">{[it.color, it.material, it.customDimensions].filter(Boolean).join(' · ')} · ×{it.quantity}</p>
              </div>
              <span className="text-sm whitespace-nowrap">{formatMoney(it.price * it.quantity, { currency: order.currency })}</span>
            </div>
          ))}
          <div className="flex justify-between items-baseline pt-3 border-t border-[var(--color-border)]">
            <span className="font-heading font-bold">Total</span>
            <span className="font-heading text-xl font-bold">{formatMoney(order.total, { currency: order.currency })}</span>
          </div>
        </section>

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

        {/* Change status */}
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
          <Button size="sm" onClick={changeStatus} loading={busy} disabled={!newStatus}>Apply status</Button>
        </section>

        {/* Admin notes */}
        <section>
          <div className="flex items-center gap-1.5 mb-2 text-sm font-semibold"><StickyNote size={15} /> Internal notes</div>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Private notes for staff…" />
          <div className="flex justify-end mt-2"><Button size="sm" variant="secondary" onClick={saveNotes} loading={busy}>Save notes</Button></div>
        </section>
      </div>
    </Modal>
  );
};

export default AdminOrders;
