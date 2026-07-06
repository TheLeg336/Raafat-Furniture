import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Store, Truck, Hammer, XCircle, Smartphone, Landmark, Copy } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import type { Order, TFunction } from '../types';
import { trackOrder, submitPaymentReference } from '../lib/orders';
import { recallOrderEmail, rememberOrderEmail, syncStripePayment } from '../lib/checkout';
import { db } from '../lib/firebase';
import { useStore } from '../contexts/StoreContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageSpinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
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
  const { user } = useAuth();
  const toast = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [needEmail, setNeedEmail] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const handled = useRef(false);

  const load = async (email: string) => {
    if (paid && !handled.current) {
      handled.current = true;
      clearCart?.();
      // Reconcile with Stripe server-side (webhook is primary; this covers dev/latency).
      await syncStripePayment(orderNumber, email);
    }
    const o = await trackOrder(orderNumber, email);
    if (o) { setOrder(o); setNeedEmail(false); }
    return o;
  };

  useEffect(() => {
    if (!orderNumber) { setLoading(false); return; }
    let active = true;
    (async () => {
      // Fall back to the signed-in user's email (e.g. arriving from My Orders).
      const email = recallOrderEmail(orderNumber) || user?.email || '';
      if (!email) {
        if (active) { setNeedEmail(true); setLoading(false); }
        return;
      }
      const o = await load(email);
      if (active) { if (!o) setNeedEmail(true); setLoading(false); }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber, paid]);

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    rememberOrderEmail(orderNumber, emailInput.trim());
    const o = await load(emailInput.trim());
    if (!o) toast.error(t('order_not_found_desc') || 'No order matches that number and email.');
    setLoading(false);
  };

  if (loading) return <PageSpinner />;

  if (needEmail && !order) {
    return (
      <div className="max-w-md mx-auto px-6 py-24">
        <h1 className="font-heading text-3xl font-bold mb-3 text-center">{t('view_order') || 'View your order'}</h1>
        <p className="text-[var(--color-text-secondary)] text-center mb-6">{t('confirm_email_prompt') || 'Enter the email used on this order to view the receipt.'}</p>
        <form onSubmit={lookup} className="flex flex-col gap-4">
          <Input label={t('login_email') || 'Email'} type="email" required value={emailInput} onChange={(e) => setEmailInput(e.target.value)} />
          <Button type="submit" fullWidth>{t('view_order') || 'View order'}</Button>
        </form>
      </div>
    );
  }

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

  const isPaid = order.paymentStatus === 'paid';
  const awaitingTransfer = !isPaid && (order.paymentMethod === 'instapay' || order.paymentMethod === 'bank_transfer');

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 md:py-16">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
        className="text-center mb-8 flex flex-col items-center gap-3">
        {cancelled && !isPaid ? (
          <Clock size={52} className="text-[var(--color-text-secondary)]" />
        ) : (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}>
            <CheckCircle2 size={56} className="text-[var(--color-primary)]" />
          </motion.div>
        )}
        <span className="text-xs font-bold tracking-[0.18em] uppercase text-[var(--color-primary)]">
          {cancelled && !isPaid ? (t('payment_pending') || 'Payment pending') : (t('order_confirmed') || 'Order confirmed')}
        </span>
        <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide -mb-2">{t('order_number') || 'Order number'}</p>
        <p className="font-heading text-3xl font-bold tracking-[0.15em] text-[var(--color-secondary)] dark:text-[var(--color-primary)]">{order.orderNumber}</p>
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-balance">
          {cancelled && !isPaid ? (t('finish_payment') || 'Your order is reserved') : (t('thank_you') || 'Thank you for your order')}
        </h1>
        <p className="text-[var(--color-text-secondary)] measure">
          {cancelled && !isPaid
            ? (t('finish_payment_desc') || 'Payment wasn’t completed. Your order is saved — you can pay by transfer or contact us.')
            : (t('confirmation_desc') || 'A confirmation has been sent to your email. Keep your order number for reference.')}
        </p>
      </motion.div>

      {awaitingTransfer && <TransferPanel t={t} order={order} onSubmitted={() => load(recallOrderEmail(orderNumber) || order.contact.email)} />}

      <Card className="p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[var(--color-border)]">
          <p className="text-sm text-[var(--color-text-secondary)]">{t('receipt') || 'Receipt'}</p>
          <div className="flex gap-2">
            <Badge tone={isPaid ? 'success' : 'gold'}>
              {isPaid ? (t('paid') || 'Paid')
                : order.status === 'payment_verification' ? (t('verifying_payment') || 'Verifying payment')
                : (t('unpaid') || 'Awaiting payment')}
            </Badge>
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
              <p className="font-medium whitespace-nowrap">{formatMoney(it.price * it.quantity, { currency: order.currency })}</p>
            </div>
          ))}
        </div>

        <hr className="rule-gold my-2" />
        <div className="flex flex-col gap-2 py-4 text-sm">
          <div className="flex justify-between"><span className="text-[var(--color-text-secondary)]">{t('subtotal') || 'Subtotal'}</span><span>{formatMoney(order.subtotal, { currency: order.currency })}</span></div>
          {order.shipping > 0 && <div className="flex justify-between"><span className="text-[var(--color-text-secondary)]">{t('shipping') || 'Shipping'}</span><span>{formatMoney(order.shipping, { currency: order.currency })}</span></div>}
          {order.tax > 0 && (
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">
                {order.taxIncluded
                  ? (t('vat_included') || `VAT ${Math.round((order.taxRate || 0.14) * 100)}% (included)`)
                  : (t('tax') || 'Tax')}
              </span>
              <span className="text-[var(--color-text-secondary)]">{formatMoney(order.tax, { currency: order.currency })}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline pt-2 mt-1 border-t border-[var(--color-border)]">
            <span className="font-heading text-lg font-bold">{t('total') || 'Total'}</span>
            <span className="font-heading text-xl font-bold">{formatMoney(order.total, { currency: order.currency })}</span>
          </div>
          {order.fulfillment === 'shipping' && order.destinationCountry && order.destinationCountry !== 'EG' && (
            <p className="text-[11px] text-[var(--color-text-secondary)] pt-1">{t('duties_note') || 'Import duties and taxes, if any, are collected by your country on delivery.'}</p>
          )}
          {order.tracking?.number && (
            <p className="text-sm pt-2">
              <span className="text-[var(--color-text-secondary)]">{t('tracking_number') || 'Tracking number'}{order.tracking.carrier ? ` (${order.tracking.carrier})` : ''}: </span>
              <span className="font-semibold">{order.tracking.number}</span>
            </p>
          )}
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
        <Link to="/shop"><Button variant="secondary" fullWidth>{t('continue_shopping') || 'Continue shopping'}</Button></Link>
        <Link to="/track"><Button fullWidth>{t('track_order') || 'Track your order'}</Button></Link>
      </div>
    </div>
  );
};

/** Instapay / bank transfer instructions + payment reference submission. */
const TransferPanel: React.FC<{ t: TFunction; order: Order; onSubmitted: () => void }> = ({ t, order, onSubmitted }) => {
  const toast = useToast();
  const [instapayAddress, setInstapayAddress] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [reference, setReference] = useState(order.payment?.reference || '');
  const [busy, setBusy] = useState(false);
  const submitted = order.status === 'payment_verification' || !!order.payment?.reference;
  const isInstapay = order.paymentMethod === 'instapay';

  useEffect(() => {
    if (!db) return;
    getDoc(doc(db, 'settings', 'payments')).then((snap) => {
      const d = snap.exists() ? snap.data() : {};
      setInstapayAddress(d.instapayAddress || '');
      setBankDetails(d.bankDetails || '');
    }).catch(() => {});
  }, []);

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).then(() => toast.success(t('copied') || 'Copied'));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) return;
    setBusy(true);
    try {
      await submitPaymentReference(order.orderNumber, order.contact.email, reference.trim());
      toast.success(t('reference_submitted') || 'Reference submitted — we’ll verify your payment shortly.');
      onSubmitted();
    } catch (err: any) {
      toast.error(err?.message || 'Could not submit the reference.');
    }
    setBusy(false);
  };

  return (
    <Card className="p-6 mb-6 border-[var(--color-primary)]/40">
      <div className="flex items-center gap-2 mb-3">
        {isInstapay ? <Smartphone size={18} className="text-[var(--color-primary)]" /> : <Landmark size={18} className="text-[var(--color-primary)]" />}
        <h2 className="font-heading text-lg font-bold">{isInstapay ? (t('pay_with_instapay') || 'Pay with InstaPay') : (t('pay_by_transfer') || 'Pay by bank transfer')}</h2>
      </div>
      {submitted ? (
        <p className="text-sm text-[var(--color-text-secondary)]">
          {t('reference_received') || 'We received your payment reference and are verifying it. You’ll get a confirmation email once approved.'}
        </p>
      ) : (
        <>
          <ol className="text-sm text-[var(--color-text-secondary)] list-decimal ms-5 flex flex-col gap-1.5 mb-4">
            <li>
              {isInstapay
                ? (t('instapay_step1') || 'Send the total below from any Egyptian banking app to our InstaPay address:')
                : (t('bank_step1') || 'Transfer the total below to our bank account:')}
              {isInstapay && instapayAddress && (
                <button type="button" onClick={() => copy(instapayAddress)} className="inline-flex items-center gap-1 ms-2 font-semibold text-[var(--color-primary)]">
                  {instapayAddress} <Copy size={12} />
                </button>
              )}
              {!isInstapay && bankDetails && <span className="block font-medium text-[var(--color-text-primary)] mt-1 whitespace-pre-line">{bankDetails}</span>}
              {((isInstapay && !instapayAddress) || (!isInstapay && !bankDetails)) && (
                <span className="block mt-1 italic">{t('transfer_details_soon') || 'Our team will send you the transfer details by email shortly.'}</span>
              )}
            </li>
            <li>{t('transfer_step2') || 'Copy the transaction reference number from your app.'}</li>
            <li>{t('transfer_step3') || 'Paste it below so we can verify your payment.'}</li>
          </ol>
          <p className="font-heading text-xl font-bold mb-4">{formatMoney(order.total, { currency: order.currency })}</p>
          <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1"><Input label={t('payment_reference') || 'Transaction reference'} value={reference} onChange={(e) => setReference(e.target.value)} required /></div>
            <div className="sm:self-end"><Button type="submit" loading={busy}>{t('submit_reference') || 'Submit'}</Button></div>
          </form>
        </>
      )}
    </Card>
  );
};

export default OrderConfirmation;
