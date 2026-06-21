import React, { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Store, Truck, Hammer, CreditCard, Wallet, Landmark, ArrowLeft, Lock } from 'lucide-react';
import type { TFunction, FulfillmentType, PaymentMethod, OrderItem } from '../types';
import { useStore } from '../contexts/StoreContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useToast } from '../components/ui/Toast';
import { formatMoney, localized } from '../lib/format';
import { placeOrder, stripeConfigured } from '../lib/checkout';
import { computeTotals } from '../lib/orders';

interface Props { t: TFunction; }

const Checkout: React.FC<Props> = ({ t }) => {
  const { cart, clearCart } = useStore();
  const { user, firstName, lastName } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [fulfillment, setFulfillment] = useState<FulfillmentType>('pickup');
  const [payment, setPayment] = useState<PaymentMethod>(stripeConfigured() ? 'stripe' : 'cash_on_pickup');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: [firstName, lastName].filter(Boolean).join(' '),
    email: user?.email || '',
    phone: '',
    line1: '', city: '', governorate: '', country: 'Egypt', postalCode: '',
    note: '',
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<any>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const items: OrderItem[] = useMemo(
    () => cart.map((c) => ({
      productId: String(c.productId), name: c.name, imageUrl: c.imageUrl, price: c.price || 0,
      quantity: c.quantity, color: c.color, material: c.material,
    })),
    [cart],
  );
  const shipping = 0; // store confirms delivery cost after order; pickup is free
  const totals = computeTotals(items, fulfillment === 'shipping' ? shipping : 0, 0);

  const paymentOptions: { id: PaymentMethod; label: string; icon: React.ReactNode; show: boolean }[] = [
    { id: 'stripe', label: t('pay_card') || 'Pay by card', icon: <CreditCard size={18} />, show: stripeConfigured() },
    { id: 'cash_on_pickup', label: t('pay_pickup') || 'Cash on pickup', icon: <Wallet size={18} />, show: fulfillment !== 'shipping' },
    { id: 'cash_on_delivery', label: t('pay_cod') || 'Cash on delivery', icon: <Wallet size={18} />, show: fulfillment === 'shipping' },
    { id: 'bank_transfer', label: t('pay_bank') || 'Bank transfer', icon: <Landmark size={18} />, show: true },
  ];

  const fulfillmentOptions: { id: FulfillmentType; label: string; desc: string; icon: React.ReactNode }[] = [
    { id: 'pickup', label: t('fulfil_pickup') || 'Store pickup', desc: t('fulfil_pickup_desc') || 'Collect from a Raafat showroom', icon: <Store size={20} /> },
    { id: 'shipping', label: t('fulfil_ship') || 'Delivery', desc: t('fulfil_ship_desc') || 'Delivered to your address', icon: <Truck size={20} /> },
    { id: 'custom', label: t('fulfil_custom') || 'Custom order', desc: t('fulfil_custom_desc') || 'Made to your specification', icon: <Hammer size={20} /> },
  ];

  const valid = form.fullName.trim() && /\S+@\S+\.\S+/.test(form.email) && form.phone.trim().length >= 6 &&
    (fulfillment !== 'shipping' || (form.line1.trim() && form.city.trim()));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || submitting || items.length === 0) return;
    setSubmitting(true);
    try {
      const { order, redirected } = await placeOrder({
        items,
        contact: {
          fullName: form.fullName.trim(), email: form.email.trim(), phone: form.phone.trim(),
          line1: form.line1.trim() || undefined, city: form.city.trim() || undefined,
          governorate: form.governorate.trim() || undefined, country: form.country.trim() || undefined,
          postalCode: form.postalCode.trim() || undefined,
        },
        fulfillment, paymentMethod: payment, userId: user?.uid ?? null,
        customerNote: form.note.trim() || undefined,
        shipping: fulfillment === 'shipping' ? shipping : 0,
        currency: undefined,
      });
      if (!redirected) {
        clearCart?.();
        navigate(`/order/confirmation?order=${order.orderNumber}`);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Could not place order. Please try again.');
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center flex flex-col items-center gap-5">
        <ShoppingBag size={40} className="text-[var(--color-text-secondary)]" />
        <h1 className="font-heading text-3xl font-bold">{t('cart_empty') || 'Your cart is empty'}</h1>
        <Link to="/shop"><Button>{t('continue_shopping') || 'Continue shopping'}</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 md:py-16">
      <Link to="/shop" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] mb-6">
        <ArrowLeft size={16} /> {t('continue_shopping') || 'Continue shopping'}
      </Link>
      <h1 className="font-heading text-4xl font-bold mb-8">{t('checkout') || 'Checkout'}</h1>

      <form onSubmit={submit} className="grid lg:grid-cols-[1fr_400px] gap-8 items-start">
        <div className="flex flex-col gap-8">
          {/* Fulfillment */}
          <section>
            <h2 className="font-heading text-xl font-bold mb-4">{t('how_to_receive') || 'How would you like to receive it?'}</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {fulfillmentOptions.map((o) => (
                <button type="button" key={o.id} onClick={() => setFulfillment(o.id)}
                  className={`text-start p-4 rounded-[var(--radius-md)] border-2 transition-colors ${fulfillment === o.id ? 'border-[var(--color-primary)] bg-[hsla(var(--color-primary-hsl-values),0.06)]' : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'}`}>
                  <span className="text-[var(--color-primary)]">{o.icon}</span>
                  <span className="block font-semibold mt-2">{o.label}</span>
                  <span className="block text-xs text-[var(--color-text-secondary)] mt-0.5">{o.desc}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="font-heading text-xl font-bold mb-4">{t('your_details') || 'Your details'}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label={t('full_name') || 'Full name'} required value={form.fullName} onChange={set('fullName')} autoComplete="name" />
              <Input label={t('login_email') || 'Email'} type="email" required value={form.email} onChange={set('email')} autoComplete="email" />
              <Input label={t('phone') || 'Phone'} type="tel" required value={form.phone} onChange={set('phone')} autoComplete="tel" className="sm:col-span-2" />
            </div>
          </section>

          {/* Address (shipping only) */}
          {fulfillment === 'shipping' && (
            <motion.section initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <h2 className="font-heading text-xl font-bold mb-4">{t('delivery_address') || 'Delivery address'}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label={t('address') || 'Address'} required value={form.line1} onChange={set('line1')} autoComplete="address-line1" className="sm:col-span-2" />
                <Input label={t('city') || 'City'} required value={form.city} onChange={set('city')} autoComplete="address-level2" />
                <Input label={t('governorate') || 'Governorate'} value={form.governorate} onChange={set('governorate')} autoComplete="address-level1" />
                <Input label={t('country') || 'Country'} value={form.country} onChange={set('country')} autoComplete="country-name" />
                <Input label={t('postal_code') || 'Postal code'} value={form.postalCode} onChange={set('postalCode')} autoComplete="postal-code" />
              </div>
            </motion.section>
          )}

          {/* Payment */}
          <section>
            <h2 className="font-heading text-xl font-bold mb-4">{t('payment') || 'Payment'}</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {paymentOptions.filter((o) => o.show).map((o) => (
                <button type="button" key={o.id} onClick={() => setPayment(o.id)}
                  className={`flex items-center gap-3 p-4 rounded-[var(--radius-md)] border-2 transition-colors ${payment === o.id ? 'border-[var(--color-primary)] bg-[hsla(var(--color-primary-hsl-values),0.06)]' : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'}`}>
                  <span className="text-[var(--color-primary)]">{o.icon}</span>
                  <span className="font-semibold">{o.label}</span>
                </button>
              ))}
            </div>
            {!stripeConfigured() && (
              <p className="text-xs text-[var(--color-text-secondary)] mt-3">{t('card_soon') || 'Card payments will be available soon. Choose cash or bank transfer for now.'}</p>
            )}
            <Textarea label={t('order_note') || 'Note to the store (optional)'} className="mt-4" value={form.note} onChange={set('note')} rows={3} />
          </section>
        </div>

        {/* Summary */}
        <Card className="p-6 lg:sticky lg:top-24">
          <h2 className="font-heading text-xl font-bold mb-4">{t('order_summary') || 'Order summary'}</h2>
          <div className="flex flex-col gap-4 max-h-72 overflow-y-auto pe-1">
            {cart.map((c) => (
              <div key={c.id} className="flex gap-3">
                <div className="w-14 h-14 rounded-[var(--radius-sm)] overflow-hidden bg-[var(--color-secondary)] shrink-0">
                  {c.imageUrl && <img src={c.imageUrl} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{typeof c.name === 'string' ? c.name : localized(c.name)}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{[c.color, c.material].filter(Boolean).join(' · ')} · ×{c.quantity}</p>
                </div>
                <p className="text-sm font-medium whitespace-nowrap">{formatMoney((c.price || 0) * c.quantity)}</p>
              </div>
            ))}
          </div>
          <hr className="rule-gold my-5" />
          <div className="flex flex-col gap-2 text-sm">
            <Row label={t('subtotal') || 'Subtotal'} value={formatMoney(totals.subtotal)} />
            <Row label={t('shipping') || 'Shipping'} value={fulfillment === 'shipping' ? (t('shipping_tbd') || 'Confirmed after order') : (t('free') || 'Free')} muted />
          </div>
          <hr className="rule-gold my-5" />
          <div className="flex justify-between items-baseline mb-5">
            <span className="font-heading text-lg font-bold">{t('total') || 'Total'}</span>
            <span className="font-heading text-2xl font-bold">{formatMoney(totals.total)}</span>
          </div>
          <Button type="submit" fullWidth size="lg" loading={submitting} disabled={!valid}
            iconLeft={payment === 'stripe' ? <Lock size={16} /> : undefined}>
            {payment === 'stripe' ? (t('pay_now') || 'Pay now') : (t('place_order') || 'Place order')}
          </Button>
          <p className="text-[11px] text-center text-[var(--color-text-secondary)] mt-3 flex items-center justify-center gap-1">
            <Lock size={11} /> {t('secure_checkout') || 'Secure checkout'}
          </p>
        </Card>
      </form>
    </div>
  );
};

const Row: React.FC<{ label: string; value: string; muted?: boolean }> = ({ label, value, muted }) => (
  <div className="flex justify-between">
    <span className="text-[var(--color-text-secondary)]">{label}</span>
    <span className={muted ? 'text-[var(--color-text-secondary)]' : 'font-medium'}>{value}</span>
  </div>
);

export default Checkout;
