import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PackageSearch, CheckCircle2, Circle } from 'lucide-react';
import type { Order, OrderStatus, TFunction } from '../types';
import { trackOrder } from '../lib/orders';
import { rememberOrderEmail } from '../lib/checkout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { formatDate } from '../lib/format';

interface Props { t: TFunction; }

/** Customer-facing timeline steps (internal states map onto the nearest step). */
const STEPS: { key: OrderStatus; labelKey: string; fallback: string }[] = [
  { key: 'pending_payment', labelKey: 'step_awaiting_payment', fallback: 'Awaiting payment' },
  { key: 'paid', labelKey: 'step_confirmed', fallback: 'Order confirmed' },
  { key: 'in_production', labelKey: 'step_preparing', fallback: 'Being prepared' },
  { key: 'ready', labelKey: 'step_ready', fallback: 'Ready' },
  { key: 'shipped', labelKey: 'step_shipped', fallback: 'Shipped / awaiting pickup' },
  { key: 'completed', labelKey: 'step_completed', fallback: 'Completed' },
];

const STATUS_RANK: Partial<Record<OrderStatus, number>> = {
  pending_payment: 0, payment_verification: 0,
  paid: 1, confirmed: 1,
  in_production: 2, awaiting_approval: 2,
  ready: 3,
  shipped: 4,
  completed: 5,
};

const TrackOrder: React.FC<Props> = ({ t }) => {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setNotFound(false); setOrder(null);
    const o = await trackOrder(orderNumber.trim(), email.trim());
    if (o) { setOrder(o); rememberOrderEmail(o.orderNumber, email.trim()); }
    else setNotFound(true);
    setBusy(false);
  };

  const rank = order ? (STATUS_RANK[order.status] ?? 0) : 0;
  const cancelled = order && (order.status === 'cancelled' || order.status === 'refunded');

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 md:py-20">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10 flex flex-col items-center gap-3">
        <PackageSearch size={40} className="text-[var(--color-primary)]" />
        <h1 className="font-heading text-4xl font-bold">{t('track_title') || 'Track your order'}</h1>
        <p className="text-[var(--color-text-secondary)]">{t('track_desc') || 'Enter your order number and the email you used at checkout.'}</p>
      </motion.div>

      <Card className="p-6 mb-8">
        <form onSubmit={submit} className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <Input label={t('order_number') || 'Order number'} required value={orderNumber} onChange={(e) => setOrderNumber(e.target.value.toUpperCase())} placeholder="EG123456KY" />
          <Input label={t('login_email') || 'Email'} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" loading={busy}>{t('track_cta') || 'Track'}</Button>
        </form>
        {notFound && <p className="text-sm text-[var(--color-danger,#dc2626)] mt-3">{t('order_not_found_desc') || 'No order matches that number and email.'}</p>}
      </Card>

      {order && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">{t('order_number') || 'Order number'}</p>
                <p className="font-heading text-2xl font-bold tracking-wider">{order.orderNumber}</p>
              </div>
              <Badge tone={cancelled ? 'danger' : order.paymentStatus === 'paid' ? 'success' : 'gold'}>
                {cancelled ? (t('cancelled') || 'Cancelled') : order.paymentStatus === 'paid' ? (t('paid') || 'Paid') : (t('unpaid') || 'Awaiting payment')}
              </Badge>
            </div>

            {cancelled ? (
              <p className="text-[var(--color-text-secondary)]">{t('order_cancelled_desc') || 'This order was cancelled. Contact us if that’s unexpected.'}</p>
            ) : (
              <ol className="flex flex-col gap-0">
                {STEPS.map((s, i) => {
                  const reached = rank >= i;
                  const isLast = i === STEPS.length - 1;
                  return (
                    <li key={s.key} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        {reached
                          ? <CheckCircle2 size={22} className="text-[var(--color-primary)] shrink-0" />
                          : <Circle size={22} className="text-[var(--color-border-strong)] shrink-0" />}
                        {!isLast && <span className={`w-0.5 flex-1 my-1 ${rank > i ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`} />}
                      </div>
                      <div className={`pb-6 ${reached ? '' : 'opacity-60'}`}>
                        <p className="font-semibold leading-6">{t(s.labelKey) || s.fallback}</p>
                        {s.key === 'shipped' && order.tracking?.number && (
                          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
                            {t('tracking_number') || 'Tracking number'}{order.tracking.carrier ? ` (${order.tracking.carrier})` : ''}: <span className="font-semibold text-[var(--color-text-primary)]">{order.tracking.number}</span>
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            <p className="text-xs text-[var(--color-text-secondary)] mt-2">
              {t('last_updated') || 'Last updated'}: {formatDate(order.updatedAt, true)}
            </p>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default TrackOrder;
