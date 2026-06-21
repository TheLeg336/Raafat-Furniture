import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Store, Truck, Hammer, XCircle } from 'lucide-react';
import type { Order, TFunction } from '../types';
import { getOrderByNumber, updateOrderStatus } from '../lib/orders';
import { sendConfirmationEmail } from '../lib/checkout';
import { useStore } from '../contexts/StoreContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageSpinner } from '../components/ui/Spinner';
import { formatMoney, localized } from '../lib/format';

interface Props { t: TFunction; }

const fulfilIcon: Record<string, React.ReactNode> = {
  pickup: <Store size={16} />, shipping: <Truck size={16} />, custom: <Hammer size={16} />,
};

const OrderConfirmation: React.FC<Props> = ({ t }) => {
  const [params] = useSearchParams();
  const orderNumber = params.get('order') || '';
  const paid = params.get('paid') === '1';
  const cancelled = params.get('cancelled') === '1';
  const { clearCart } = useStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const handled = useRef(false);

  useEffect(() => {
    if (!orderNumber) { setLoading(false); return; }
    let active = true;
    (async () => {
      const o = await getOrderByNumber(orderNumber);
      if (!active) return;
      setOrder(o);
      setLoading(false);
      if (o && paid && !cancelled && !handled.current) {
        handled.current = true;
        clearCart?.();
        // Reflect payment + send the confirmation email (no-op if the webhook already did).
        if (o.paymentStatus !== 'paid') {
          try { await updateOrderStatus(o.id, 'paid', 'system', 'Confirmed on return from checkout', o); } catch { /* rules may forbid; webhook handles it */ }
          sendConfirmationEmail(o);
        }
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber, paid]);

  if (loading) return <PageSpinner />;

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center flex flex-col items-center gap-5">
        <XCircle size={40} className="text-[var(--color-text-secondary)]" />
        <h1 className="font-heading text-3xl font-bold">{t('order_not_found') || 'Order not found'}</h1>
        <p className="text-[var(--color-text-secondary)]">{t('order_not_found_desc') || 'We couldn’t find that order number.'}</p>
        <Link to="/"><Button>{t('product_return_home') || 'Return home'}</Button></Link>
      </div>
    );
  }

  const isPaid = order.paymentStatus === 'paid' || paid;

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 md:py-16">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
        className="text-center mb-8 flex flex-col items-center gap-3">
        {cancelled ? (
          <Clock size={52} className="text-[var(--color-text-secondary)]" />
        ) : (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}>
            <CheckCircle2 size={56} className="text-[var(--color-primary)]" />
          </motion.div>
        )}
        <span className="text-xs font-bold tracking-[0.18em] uppercase text-[var(--color-primary)]">
          {cancelled ? (t('payment_pending') || 'Payment pending') : (t('order_confirmed') || 'Order confirmed')}
        </span>
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-balance">
          {cancelled ? (t('finish_payment') || 'Your order is reserved') : (t('thank_you') || 'Thank you for your order')}
        </h1>
        <p className="text-[var(--color-text-secondary)] measure">
          {cancelled
            ? (t('finish_payment_desc') || 'Payment wasn’t completed. Your order is saved — you can pay on pickup, by transfer, or contact us.')
            : (t('confirmation_desc') || 'A confirmation has been sent to your email. Keep your order number for reference.')}
        </p>
      </motion.div>

      <Card className="p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[var(--color-border)]">
          <div>
            <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">{t('order_number') || 'Order number'}</p>
            <p className="font-heading text-2xl font-bold tracking-wider text-[var(--color-secondary)] dark:text-[var(--color-primary)]">{order.orderNumber}</p>
          </div>
          <div className="flex gap-2">
            <Badge tone={isPaid ? 'success' : 'gold'}>{isPaid ? (t('paid') || 'Paid') : (t('unpaid') || 'Awaiting payment')}</Badge>
            <Badge tone="info">{fulfilIcon[order.fulfillment]}{t(`fulfil_${order.fulfillment}`) || order.fulfillment}</Badge>
          </div>
        </div>

        <div className="flex flex-col gap-4 py-5">
          {order.items.map((it, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-14 h-14 rounded-[var(--radius-sm)] overflow-hidden bg-[var(--color-secondary)] shrink-0">
                {it.imageUrl && <img src={it.imageUrl} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{typeof it.name === 'string' ? it.name : localized(it.name)}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">{[it.color, it.material, it.customDimensions].filter(Boolean).join(' · ')} · ×{it.quantity}</p>
              </div>
              <p className="font-medium whitespace-nowrap">{formatMoney(it.price * it.quantity)}</p>
            </div>
          ))}
        </div>

        <hr className="rule-gold my-2" />
        <div className="flex flex-col gap-2 py-4 text-sm">
          <div className="flex justify-between"><span className="text-[var(--color-text-secondary)]">{t('subtotal') || 'Subtotal'}</span><span>{formatMoney(order.subtotal)}</span></div>
          {order.shipping > 0 && <div className="flex justify-between"><span className="text-[var(--color-text-secondary)]">{t('shipping') || 'Shipping'}</span><span>{formatMoney(order.shipping)}</span></div>}
          <div className="flex justify-between items-baseline pt-2 mt-1 border-t border-[var(--color-border)]">
            <span className="font-heading text-lg font-bold">{t('total') || 'Total'}</span>
            <span className="font-heading text-xl font-bold">{formatMoney(order.total)}</span>
          </div>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
        <Link to="/shop"><Button variant="secondary" fullWidth>{t('continue_shopping') || 'Continue shopping'}</Button></Link>
        <Link to="/account"><Button fullWidth>{t('view_my_orders') || 'View my orders'}</Button></Link>
      </div>
    </div>
  );
};

export default OrderConfirmation;
