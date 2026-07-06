import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Store, Truck, Hammer, CreditCard, Wallet, Landmark, ArrowLeft, Lock, Smartphone } from 'lucide-react';
import type { TFunction, FulfillmentType, PaymentMethod, OrderItem } from '../types';
import { useStore } from '../contexts/StoreContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input, Textarea, Select } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useToast } from '../components/ui/Toast';
import { formatMoney, localized } from '../lib/format';
import { placeOrder } from '../lib/checkout';
import { computeTotals } from '../lib/orders';
import { getPaymentsConfig, type PaymentsConfig } from '../lib/api';
import { countryOptions } from '../lib/countries';

interface Props { t: TFunction; }

const EG_VAT = 0.14;

const Checkout: React.FC<Props> = ({ t }) => {
  const { cart, clearCart } = useStore();
  const { user, firstName, lastName } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [config, setConfig] = useState<PaymentsConfig | null>(null);
  const [fulfillment, setFulfillment] = useState<FulfillmentType>('pickup');
  const [payment, setPayment] = useState<PaymentMethod>('cash_on_pickup');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: [firstName, lastName].filter(Boolean).join(' '),
    email: user?.email || '',
    phone: '',
    line1: '', city: '', governorate: '', country: 'EG', postalCode: '',
    note: '',
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<any>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => { getPaymentsConfig().then(setConfig); }, []);

  const lang = (typeof document !== 'undefined' && document.documentElement.lang === 'ar') ? 'ar' : 'en';
  const countries = useMemo(() => countryOptions(lang as 'en' | 'ar'), [lang]);

  const items: OrderItem[] = useMemo(
    () => cart.map((c) => ({
      productId: String(c.productId), name: c.name, imageUrl: c.imageUrl, price: c.price || 0,
      quantity: c.quantity, color: c.color, material: c.material,
    })),
    [cart],
  );
  const totals = computeTotals(items, 0, 0);
  // Preview only — the server recomputes everything from the catalog.
  const destinationEG = fulfillment !== 'shipping' || form.country === 'EG';
  const vatIncluded = destinationEG ? Math.round((totals.subtotal - totals.subtotal / (1 + EG_VAT)) * 100) / 100 : 0;

  const cardAvailable = !!config?.cardProvider;
  const cardMethod: PaymentMethod = config?.cardProvider === 'paymob' ? 'paymob' : 'stripe';
  const instapayAvailable = config ? (config.ipCountry === 'EG' || !config.ipCountry || form.country === 'EG') : true;
  const cashAvailable = fulfillment !== 'shipping' && (config ? config.cashPickupAllowed : true);

  const paymentOptions: { id: PaymentMethod; label: string; desc?: string; icon: React.ReactNode; show: boolean }[] = [
    { id: cardMethod, label: t('pay_card') || 'Card / Apple Pay / Google Pay', icon: <CreditCard size={18} />, show: cardAvailable },
    { id: 'instapay', label: t('pay_instapay') || 'InstaPay', desc: t('pay_instapay_desc') || 'Transfer from any Egyptian bank app', icon: <Smartphone size={18} />, show: instapayAvailable },
    { id: 'cash_on_pickup', label: t('pay_pickup') || 'Cash on pickup', desc: t('pay_pickup_desc') || 'Pay at the showroom (Egypt only)', icon: <Wallet size={18} />, show: cashAvailable },
    { id: 'bank_transfer', label: t('pay_bank') || 'Bank transfer', icon: <Landmark size={18} />, show: true },
  ];
  const visible = paymentOptions.filter((o) => o.show);

  // If the current selection disappears (e.g. switched to shipping), pick the first visible.
  useEffect(() => {
    if (!visible.some((o) => o.id === payment) && visible.length > 0) setPayment(visible[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fulfillment, config, form.country]);

  const fulfillmentOptions: { id: FulfillmentType; label: string; desc: string; icon: React.ReactNode }[] = [
    { id: 'pickup', label: t('fulfil_pickup') || 'Store pickup', desc: t('fulfil_pickup_desc') || 'Collect from a Raafat showroom', icon: <Store size={20} /> },
    { id: 'shipping', label: t('fulfil_ship') || 'Delivery', desc: t('fulfil_ship_desc') || 'Delivered to your address', icon: <Truck size={20} /> },
    { id: 'custom', label: t('fulfil_custom') || 'Custom order', desc: t('fulfil_custom_desc') || 'Made to your specification', icon: <Hammer size={20} /> },
  ];

  const valid = form.fullName.trim() && /\S+@\S+\.\S+/.test(form.email) && form.phone.trim().length >= 6 &&
    form.line1.trim() && form.city.trim() && form.country;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || submitting || items.length === 0) return;
    setSubmitting(true);
    try {
      const { order, redirected, paymentError } = await placeOrder({
        items,
        contact: {
          fullName: form.fullName.trim(), email: form.email.trim(), phone: form.phone.trim(),
          line1: form.line1.trim(), city: form.city.trim(),
          governorate: form.governorate.trim() || undefined, country: form.country,
          postalCode: form.postalCode.trim() || undefined,
        },
        fulfillment, paymentMethod: payment, userId: user?.uid ?? null,
        customerNote: form.note.trim() || undefined,
      });
      if (!redirected) {
        if (paymentError) toast.error(paymentError);
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
                  className={`text-start p-4 rounded-[var(--radius-md)] border-2 transition-colors ${fulfillment === o.id ? 'border-[var(--color-text-primary)] bg-[hsla(var(--color-primary-hsl-values),0.08)]' : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'}`}>
                  <span className="text-[var(--color-primary)]">{o.icon}</span>
                  <span className="block font-semibold mt-2">{o.label}</span>
                  <span className="block text-xs text-[var(--color-text-secondary)] mt-0.5">{o.desc}</span>
                </button>
              ))}
            </div>
            {fulfillment === 'shipping' && (
              <p className="text-xs text-[var(--color-text-secondary)] mt-3">{t('shipping_prepaid_note') || 'Delivery orders are paid in full when placing the order. Shipping cost is confirmed by the store before dispatch.'}</p>
            )}
            {fulfillment === 'custom' && (
              <p className="text-xs text-[var(--color-text-secondary)] mt-3">{t('custom_deposit_note') || 'Custom orders require a deposit and are non-returnable once production starts. Our team will contact you to confirm details.'}</p>
            )}
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

          {/* Address — always required (used for tax and, for delivery, shipping) */}
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="font-heading text-xl font-bold mb-4">
              {fulfillment === 'shipping' ? (t('delivery_address') || 'Delivery address') : (t('billing_address') || 'Your address')}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label={t('address') || 'Address'} required value={form.line1} onChange={set('line1')} autoComplete="address-line1" className="sm:col-span-2" />
              <Input label={t('city') || 'City'} required value={form.city} onChange={set('city')} autoComplete="address-level2" />
              <Input label={t('governorate') || 'Governorate / State'} value={form.governorate} onChange={set('governorate')} autoComplete="address-level1" />
              <Select label={t('country') || 'Country'} value={form.country} onChange={set('country')}>
                {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </Select>
              <Input label={t('postal_code') || 'Postal code'} value={form.postalCode} onChange={set('postalCode')} autoComplete="postal-code" />
            </div>
          </motion.section>

          {/* Payment */}
          <section>
            <h2 className="font-heading text-xl font-bold mb-4">{t('payment') || 'Payment'}</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {visible.map((o) => (
                <button type="button" key={o.id} onClick={() => setPayment(o.id)}
                  className={`flex items-center gap-3 p-4 rounded-[var(--radius-md)] border-2 transition-colors text-start ${payment === o.id ? 'border-[var(--color-text-primary)] bg-[hsla(var(--color-primary-hsl-values),0.08)]' : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'}`}>
                  <span className="text-[var(--color-primary)]">{o.icon}</span>
                  <span>
                    <span className="block font-semibold">{o.label}</span>
                    {o.desc && <span className="block text-xs text-[var(--color-text-secondary)]">{o.desc}</span>}
                  </span>
                </button>
              ))}
            </div>
            {!cardAvailable && (
              <p className="text-xs text-[var(--color-text-secondary)] mt-3">{t('card_soon') || 'Card payments will be available soon. Choose InstaPay, cash or bank transfer for now.'}</p>
            )}
            {(payment === 'instapay' || payment === 'bank_transfer') && (
              <p className="text-xs text-[var(--color-text-secondary)] mt-3">{t('transfer_note') || 'You’ll receive transfer details on the next page. Your order is confirmed once we verify the payment.'}</p>
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
            {destinationEG ? (
              <Row label={t('vat_included') || 'VAT 14% (included)'} value={formatMoney(vatIncluded)} muted />
            ) : (
              <Row label={t('tax_export') || 'Tax'} value={t('tax_export_value') || '0% (export)'} muted />
            )}
          </div>
          <hr className="rule-gold my-5" />
          <div className="flex justify-between items-baseline mb-2">
            <span className="font-heading text-lg font-bold">{t('total') || 'Total'}</span>
            <span className="font-heading text-2xl font-bold">{formatMoney(totals.total)}</span>
          </div>
          {!destinationEG && fulfillment === 'shipping' && (
            <p className="text-[11px] text-[var(--color-text-secondary)] mb-3">{t('duties_note') || 'Import duties and taxes, if any, are collected by your country on delivery.'}</p>
          )}
          <Button type="submit" fullWidth size="lg" loading={submitting} disabled={!valid}
            iconLeft={payment === 'stripe' || payment === 'paymob' ? <Lock size={16} /> : undefined}>
            {payment === 'stripe' || payment === 'paymob' ? (t('pay_now') || 'Pay now') : (t('place_order') || 'Place order')}
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
