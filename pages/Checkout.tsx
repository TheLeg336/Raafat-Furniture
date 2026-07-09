import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, Store, Truck, CreditCard, Landmark, ArrowLeft, Lock, Smartphone } from 'lucide-react';
import type { TFunction, FulfillmentType, PaymentMethod, OrderItem, OrderContact } from '../types';
import { useStore } from '../contexts/StoreContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input, Textarea, Select } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useToast } from '../components/ui/Toast';
import { CheckoutStep } from '../components/checkout/CheckoutStep';
import { formatMoney, localized } from '../lib/format';
import { placeOrder } from '../lib/checkout';
import { computeTotals } from '../lib/orders';
import { trackBeginCheckout } from '../lib/analytics';
import { getPaymentsConfig, type PaymentsConfig } from '../lib/api';
import { countryOptions } from '../lib/countries';
import { priceFor } from '../lib/currency';
import { defaultCheckoutCountry } from '../lib/geo';
import { PICKUP_LOCATIONS, pickupLabel, sortPickupByDistance, resolveEgyptHintCoords, formatPickupDistance } from '../lib/pickupLocations';
import { addressFieldsForCountry, isAddressComplete, type AddressFieldKey } from '../lib/addressFormats';
import { loadSavedAddress, saveAddressForUser, persistCheckoutDraft, readCheckoutDraft, clearCheckoutDraft } from '../lib/savedAddress';
import { formatPhoneDisplay, isPhoneValidOptional, normalizePhoneForStorage } from '../lib/phoneFormat';
import { useProducts } from '../hooks/useProducts';
import { LOGIN_PATH } from '../lib/paths';
import { MapPin, Navigation } from 'lucide-react';

interface Props { t: TFunction; }

type StepId = 'fulfillment' | 'details' | 'address' | 'payment';

const EG_VAT = 0.14;
const STEPS: StepId[] = ['fulfillment', 'details', 'address', 'payment'];

interface CheckoutDraft {
  fulfillment?: FulfillmentType;
  pickupLocationId?: string;
  payment?: PaymentMethod;
  form?: Partial<typeof emptyForm>;
  done?: StepId[];
}

const emptyForm = {
  fullName: '',
  email: '',
  phone: '',
  line1: '', city: '', governorate: '', country: 'EG', postalCode: '',
  note: '',
};

const Checkout: React.FC<Props> = ({ t }) => {
  const { cart, clearCart } = useStore();
  const { user, firstName, lastName } = useAuth();
  const { products } = useProducts();
  const toast = useToast();
  const navigate = useNavigate();
  const lang = (typeof document !== 'undefined' && document.documentElement.lang === 'ar') ? 'ar' : 'en';

  const draft = readCheckoutDraft<CheckoutDraft>();

  const [config, setConfig] = useState<PaymentsConfig | null>(null);
  const [fulfillment, setFulfillment] = useState<FulfillmentType>(draft?.fulfillment || 'pickup');
  const [pickupLocationId, setPickupLocationId] = useState(draft?.pickupLocationId || PICKUP_LOCATIONS[0].id);
  const [payment, setPayment] = useState<PaymentMethod>(draft?.payment && draft.payment !== 'cash_on_pickup' ? draft.payment : 'stripe');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    ...emptyForm,
    fullName: [firstName, lastName].filter(Boolean).join(' '),
    email: user?.email || '',
    ...draft?.form,
  });
  const [openStep, setOpenStep] = useState<StepId>('fulfillment');
  const [doneSteps, setDoneSteps] = useState<Set<StepId>>(new Set(draft?.done || []));
  const [savePrompt, setSavePrompt] = useState<'none' | 'signed-in' | 'guest'>('none');
  const [guestDeclinedAccount, setGuestDeclinedAccount] = useState(false);
  const [nearHint, setNearHint] = useState('');
  const [sortedPickup, setSortedPickup] = useState(() => PICKUP_LOCATIONS.map((loc) => ({ loc, km: null as number | null })));
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoError, setGeoError] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<any>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const applyOrigin = (origin: { lat: number; lng: number }) => {
    const ranked = sortPickupByDistance(origin);
    setSortedPickup(ranked.map(({ loc, km }) => ({ loc, km })));
    if (ranked[0]) setPickupLocationId(ranked[0].loc.id);
  };

  const useMyLocation = () => {
    setGeoError('');
    if (!navigator.geolocation) {
      setGeoError(t('geo_unsupported') || 'Location is not available in this browser.');
      return;
    }
    setGeoBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoBusy(false);
      },
      () => {
        setGeoError(t('geo_denied') || 'Could not read your location. Try a city or postal code instead.');
        setGeoBusy(false);
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  };

  const applyNearHint = () => {
    const coords = resolveEgyptHintCoords(nearHint);
    if (!coords) {
      setGeoError(t('geo_hint_unknown') || 'Could not match that city or postal code. Try Cairo, Minya, Alexandria, or a 5-digit postal code.');
      return;
    }
    setGeoError('');
    applyOrigin(coords);
  };

  const useImperialDistance = config?.ipCountry === 'US';

  useEffect(() => {
    const load = (force = false) => {
      getPaymentsConfig({ force }).then((cfg) => {
        setConfig(cfg);
        if (!draft?.form?.country) {
          setForm((f) => ({ ...f, country: defaultCheckoutCountry(cfg.ipCountry) }));
        }
      });
    };
    load(false);
    const onVis = () => { if (document.visibilityState === 'visible') load(true); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    loadSavedAddress(user.uid).then((addr) => {
      if (addr && !draft?.form?.line1) {
        setForm((f) => ({
          ...f,
          fullName: addr.fullName || f.fullName,
          email: addr.email || f.email,
          phone: addr.phone || f.phone,
          line1: addr.line1 || '',
          city: addr.city || '',
          governorate: addr.governorate || '',
          country: addr.country || f.country,
          postalCode: addr.postalCode || '',
        }));
      }
    });
  }, [user?.uid]);

  useEffect(() => {
    persistCheckoutDraft({ fulfillment, pickupLocationId, payment, form, done: [...doneSteps] });
  }, [fulfillment, pickupLocationId, payment, form, doneSteps]);

  const countries = useMemo(() => countryOptions(lang), [lang]);
  const addrFields = useMemo(() => addressFieldsForCountry(form.country), [form.country]);
  const pickupLoc = PICKUP_LOCATIONS.find((p) => p.id === pickupLocationId) || PICKUP_LOCATIONS[0];

  const destinationEG = fulfillment !== 'shipping' || form.country === 'EG';
  const chargeCurrency = destinationEG ? 'EGP' : 'USD';

  const items: OrderItem[] = useMemo(
    () => cart.map((c) => {
      const product = products.find((p) => String(p.id) === String(c.productId));
      const price = priceFor(product, chargeCurrency) ?? c.price ?? 0;
      return {
        productId: String(c.productId), name: c.name, imageUrl: c.imageUrl, price,
        quantity: c.quantity, color: c.color, material: c.material,
      };
    }),
    [cart, products, chargeCurrency],
  );
  const totals = computeTotals(items, 0, 0);
  const vatIncluded = destinationEG ? Math.round((totals.subtotal - totals.subtotal / (1 + EG_VAT)) * 100) / 100 : 0;

  const cardAvailable = !!config?.cardProvider;
  const cardMethod: PaymentMethod = config?.cardProvider === 'paymob' ? 'paymob' : 'stripe';
  const methods = config?.methods || { stripe: true, paymob: true, instapay: true, bank_transfer: true };
  const instapayAvailable = methods.instapay && (config ? (config.ipCountry === 'EG' || !config.ipCountry || form.country === 'EG') : true);

  const paymentOptions: { id: PaymentMethod; label: string; desc?: string; icon: React.ReactNode; show: boolean }[] = [
    { id: cardMethod, label: t('pay_card') || 'Card / Apple Pay / Google Pay', icon: <CreditCard size={18} />, show: cardAvailable },
    { id: 'instapay', label: t('pay_instapay') || 'InstaPay', desc: t('pay_instapay_desc') || 'Transfer from any Egyptian bank app', icon: <Smartphone size={18} />, show: instapayAvailable },
    { id: 'bank_transfer', label: t('pay_bank') || 'Bank transfer', icon: <Landmark size={18} />, show: methods.bank_transfer },
  ];
  const visible = paymentOptions.filter((o) => o.show);

  useEffect(() => {
    if (!visible.some((o) => o.id === payment) && visible.length > 0) setPayment(visible[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fulfillment, config, form.country]);

  useEffect(() => {
    if (items.length === 0) return;
    trackBeginCheckout(totals.total, chargeCurrency, items.reduce((n, it) => n + it.quantity, 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fulfillmentValid = fulfillment === 'shipping' || !!pickupLocationId;
  const detailsValid = form.fullName.trim().length > 1 && /\S+@\S+\.\S+/.test(form.email) && isPhoneValidOptional(form.phone);
  const addressValues: Record<AddressFieldKey, string> = {
    line1: form.line1, city: form.city, governorate: form.governorate, postalCode: form.postalCode,
  };
  const needsBillingAddress = fulfillment === 'shipping' || payment === 'stripe' || payment === 'paymob';
  const addressValid = needsBillingAddress
    ? isAddressComplete(form.country, addressValues)
    : true;
  const allValid = fulfillmentValid && detailsValid && addressValid && visible.length > 0;

  const markDone = (step: StepId) => setDoneSteps((s) => new Set([...s, step]));

  const advanceFrom = (step: StepId) => {
    markDone(step);
    const idx = STEPS.indexOf(step);
    const next = STEPS[idx + 1];
    if (next) setOpenStep(next);
  };

  const handleAddressContinue = () => {
    if (needsBillingAddress && !addressValid) return;
    if (!needsBillingAddress) {
      advanceFrom('address');
      return;
    }
    if (user) {
      setSavePrompt('signed-in');
    } else if (!guestDeclinedAccount) {
      setSavePrompt('guest');
    } else {
      advanceFrom('address');
    }
  };

  const confirmSaveAddress = async (save: boolean) => {
    if (save && user) {
      const contact: OrderContact = {
        fullName: form.fullName.trim(), email: form.email.trim(), phone: normalizePhoneForStorage(form.phone),
        line1: form.line1.trim(), city: form.city.trim(),
        governorate: form.governorate.trim() || undefined,
        country: form.country, postalCode: form.postalCode.trim() || undefined,
      };
      try {
        await saveAddressForUser(user.uid, contact);
        toast.success(t('address_saved') || 'Address saved to your account');
      } catch {
        toast.error(t('address_save_failed') || 'Could not save address');
      }
    }
    setSavePrompt('none');
    advanceFrom('address');
  };

  const handleGuestAccount = (create: boolean) => {
    if (create) {
      persistCheckoutDraft({ fulfillment, pickupLocationId, payment, form, done: [...doneSteps, 'details'] });
      navigate(`${LOGIN_PATH}?return=${encodeURIComponent('/checkout')}&signup=true`);
      return;
    }
    setGuestDeclinedAccount(true);
    setSavePrompt('none');
    advanceFrom('address');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allValid || submitting || items.length === 0) return;
    setSubmitting(true);
    try {
      const pickupNote = fulfillment === 'pickup'
        ? `Pickup: ${pickupLabel(pickupLoc, lang)}`
        : undefined;
      const pickupLocForOrder = PICKUP_LOCATIONS.find((l) => l.id === pickupLocationId) || PICKUP_LOCATIONS[0];
      const useCustomerAddress = needsBillingAddress && form.line1.trim() && form.city.trim();
      const { order, redirected, paymentError } = await placeOrder({
        items,
        contact: {
          fullName: form.fullName.trim(), email: form.email.trim(), phone: normalizePhoneForStorage(form.phone),
          ...(useCustomerAddress
            ? {
                line1: form.line1.trim(), city: form.city.trim(),
                governorate: form.governorate.trim() || undefined, country: form.country,
                postalCode: form.postalCode.trim() || undefined,
              }
            : {
                line1: pickupLocForOrder.street.en,
                city: pickupLocForOrder.city,
                country: 'EG',
              }),
        },
        fulfillment,
        pickupLocationId: fulfillment === 'pickup' ? pickupLocationId : undefined,
        paymentMethod: payment,
        userId: user?.uid ?? null,
        customerNote: [form.note.trim(), pickupNote].filter(Boolean).join('\n') || undefined,
      });
      clearCheckoutDraft();
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

  const fulfillmentSummary = fulfillment === 'pickup'
    ? `${t('fulfil_pickup') || 'Pickup'} · ${pickupLoc.name[lang]}`
    : (t('fulfil_ship') || 'Delivery');

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-6 py-6 md:py-16 pb-10 overflow-x-hidden">
      <Link to="/shop" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] mb-4">
        <ArrowLeft size={16} /> {t('continue_shopping') || 'Continue shopping'}
      </Link>
      <h1 className="font-heading text-2xl md:text-4xl font-bold mb-6">{t('checkout') || 'Checkout'}</h1>

      <form id="checkout-form" onSubmit={submit} className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-6 lg:gap-10 items-start">
        <div className="flex flex-col gap-3 order-2 lg:order-1 min-w-0 w-full max-w-full">
          <CheckoutStep
            step={1}
            title={t('how_to_receive') || 'How would you like to receive it?'}
            summary={fulfillmentSummary}
            open={openStep === 'fulfillment'}
            done={doneSteps.has('fulfillment')}
            onToggle={() => setOpenStep('fulfillment')}
            onContinue={() => fulfillmentValid && advanceFrom('fulfillment')}
            continueDisabled={!fulfillmentValid}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'pickup' as const, label: t('fulfil_pickup') || 'Store pickup', desc: t('fulfil_pickup_desc') || 'Collect from a showroom', icon: <Store size={20} /> },
                { id: 'shipping' as const, label: t('fulfil_ship') || 'Delivery', desc: t('fulfil_ship_desc') || 'Delivered to your address', icon: <Truck size={20} /> },
              ].map((o) => (
                <button type="button" key={o.id} onClick={() => setFulfillment(o.id)}
                  className={`text-start p-4 rounded-[var(--radius-md)] border-2 transition-colors ${fulfillment === o.id ? 'border-[var(--color-primary)] bg-[hsla(var(--color-primary-hsl-values),0.08)]' : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'}`}>
                  <span className="text-[var(--color-primary)]">{o.icon}</span>
                  <span className="block font-semibold mt-2">{o.label}</span>
                  <span className="block text-xs text-[var(--color-text-secondary)] mt-0.5">{o.desc}</span>
                </button>
              ))}
            </div>
            {fulfillment === 'pickup' && (
              <div className="space-y-3 pt-2 min-w-0">
                <p className="text-sm font-semibold">{t('pickup_location') || 'Choose a showroom'}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {t('pickup_sort_help') || 'Sort showrooms by how close they are to you — tap a showroom below to select it.'}
                </p>
                <Button type="button" size="sm" variant="secondary" loading={geoBusy} onClick={useMyLocation} iconLeft={<Navigation size={14} />} className="w-full sm:w-auto">
                  {t('sort_by_my_location') || 'Sort by my location'}
                </Button>
                <div className="flex flex-col gap-2 min-w-0">
                  <label className="text-xs font-medium text-[var(--color-text-secondary)]" htmlFor="pickup-city-hint">
                    {t('or_type_city') || 'Or type a city / postal code'}
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2 min-w-0">
                    <input
                      id="pickup-city-hint"
                      value={nearHint}
                      onChange={(e) => setNearHint(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyNearHint(); } }}
                      placeholder={t('near_hint_placeholder') || 'City or postal code (e.g. Cairo, 11771)'}
                      className="flex-1 min-w-0 w-full bg-[var(--color-surface-2)] text-[var(--color-text-primary)] rounded-[var(--radius-md)] px-3 py-2.5 text-sm outline-none placeholder:text-[var(--color-text-secondary)]"
                    />
                    <Button type="button" size="sm" variant="secondary" onClick={applyNearHint} iconLeft={<MapPin size={14} />} className="shrink-0 w-full sm:w-auto">
                      {t('sort_showrooms') || 'Sort showrooms'}
                    </Button>
                  </div>
                </div>
                {geoError && <p className="text-xs text-[var(--color-danger)]">{geoError}</p>}
                {sortedPickup.map(({ loc, km }) => (
                  <button
                    type="button"
                    key={loc.id}
                    onClick={() => setPickupLocationId(loc.id)}
                    className={`w-full text-start p-3 rounded-[var(--radius-md)] border transition-colors min-w-0 ${pickupLocationId === loc.id ? 'border-[var(--color-primary)] bg-[hsla(var(--color-primary-hsl-values),0.08)]' : 'border-[var(--color-border)]'}`}
                  >
                    <span className="flex items-center justify-between gap-2 min-w-0">
                      <span className="block font-semibold text-sm truncate">{loc.name[lang]}</span>
                      {km != null && (
                        <span className="text-[10px] uppercase tracking-wide text-[var(--color-text-secondary)] shrink-0">
                          {formatPickupDistance(km, useImperialDistance)}
                        </span>
                      )}
                    </span>
                    <span className="block text-xs text-[var(--color-text-secondary)] mt-0.5 break-words">{loc.street[lang]}</span>
                  </button>
                ))}
              </div>
            )}
          </CheckoutStep>

          <CheckoutStep
            step={2}
            title={t('your_details') || 'Your details'}
            summary={form.fullName ? `${form.fullName} · ${form.email}` : undefined}
            open={openStep === 'details'}
            done={doneSteps.has('details')}
            onToggle={() => setOpenStep('details')}
            onContinue={() => detailsValid && advanceFrom('details')}
            continueDisabled={!detailsValid}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
              <Input label={t('full_name') || 'Full name'} required value={form.fullName} onChange={set('fullName')} autoComplete="name" />
              <Input label={t('login_email') || 'Email'} type="email" required value={form.email} onChange={set('email')} autoComplete="email" />
              <Input
                label={t('phone') || 'Phone'}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: formatPhoneDisplay(e.target.value) }))}
                hint={t('phone_optional_hint') || 'Optional — helps us reach you about your order'}
                wrapperClassName="sm:col-span-2"
              />
            </div>
          </CheckoutStep>

          <CheckoutStep
            step={3}
            title={fulfillment === 'shipping'
              ? (t('delivery_address') || 'Delivery address')
              : needsBillingAddress
                ? (t('billing_address') || 'Billing address')
                : (t('pickup_confirm') || 'Confirm pickup')}
            summary={fulfillment === 'pickup' && !needsBillingAddress
              ? pickupLoc.name[lang]
              : (form.line1 ? `${form.city}, ${form.country}` : undefined)}
            open={openStep === 'address'}
            done={doneSteps.has('address')}
            onToggle={() => setOpenStep('address')}
            onContinue={savePrompt === 'none' ? handleAddressContinue : undefined}
            continueDisabled={!addressValid}
            continueLabel={savePrompt !== 'none' ? undefined : (t('continue') || 'Continue')}
          >
            {fulfillment === 'pickup' && (
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 mb-3">
                <p className="text-sm font-semibold mb-1">{pickupLoc.name[lang]}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">{pickupLoc.street[lang]}</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                  {t('pickup_collect_here') || 'You will collect your order from this showroom.'}
                </p>
              </div>
            )}
            {needsBillingAddress ? (
              <>
                {fulfillment === 'pickup' && (
                  <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                    {t('billing_for_card') || 'Card payments need a billing address (where your card is registered).'}
                  </p>
                )}
                <Select label={t('country') || 'Country'} value={form.country} onChange={set('country')} wrapperClassName="w-full">
                  {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </Select>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                  {addrFields.map((field) => (
                    <Input
                      key={field.key}
                      label={t(field.labelKey) || field.fallback}
                      required={field.required}
                      value={form[field.key]}
                      onChange={set(field.key)}
                      autoComplete={field.autoComplete}
                      wrapperClassName={field.wrapperClassName}
                    />
                  ))}
                </div>

                {savePrompt === 'signed-in' && (
                  <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 space-y-3">
                    <p className="text-sm">{t('save_address_prompt') || 'Save this address to your account for next time?'}</p>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" onClick={() => confirmSaveAddress(true)}>{t('save') || 'Save'}</Button>
                      <Button type="button" size="sm" variant="secondary" onClick={() => confirmSaveAddress(false)}>{t('not_now') || 'Not now'}</Button>
                    </div>
                  </div>
                )}
                {savePrompt === 'guest' && (
                  <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 space-y-3">
                    <p className="text-sm">{t('guest_save_prompt') || 'Create an account to save your address for future orders?'}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" onClick={() => handleGuestAccount(true)}>{t('create_account') || 'Create account'}</Button>
                      <Button type="button" size="sm" variant="secondary" onClick={() => handleGuestAccount(false)}>{t('continue_guest') || 'Continue as guest'}</Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-[var(--color-text-secondary)]">
                {t('pickup_no_address_needed') || 'No delivery address needed for transfer payments — collect from the showroom above.'}
              </p>
            )}
          </CheckoutStep>

          <CheckoutStep
            step={4}
            title={t('payment') || 'Payment'}
            summary={visible.find((o) => o.id === payment)?.label}
            open={openStep === 'payment'}
            done={doneSteps.has('payment')}
            onToggle={() => setOpenStep('payment')}
          >
            <div className="grid grid-cols-1 gap-3">
              {visible.length === 0 ? (
                <p className="text-sm text-[var(--color-danger)]">
                  {t('no_payment_methods') || 'No payment methods are available right now. Please contact the store or try again later.'}
                </p>
              ) : visible.map((o) => (
                <button type="button" key={o.id} onClick={() => setPayment(o.id)}
                  className={`flex items-center gap-3 p-4 rounded-[var(--radius-md)] border-2 transition-colors text-start ${payment === o.id ? 'border-[var(--color-primary)] bg-[hsla(var(--color-primary-hsl-values),0.08)]' : 'border-[var(--color-border)]'}`}>
                  <span className="text-[var(--color-primary)]">{o.icon}</span>
                  <span>
                    <span className="block font-semibold">{o.label}</span>
                    {o.desc && <span className="block text-xs text-[var(--color-text-secondary)]">{o.desc}</span>}
                  </span>
                </button>
              ))}
            </div>
            <Textarea label={t('order_note') || 'Note to the store (optional)'} value={form.note} onChange={set('note')} rows={2} />
          </CheckoutStep>
        </div>

        {/* Order summary — desktop sidebar */}
        <Card className="p-5 lg:sticky lg:top-24 order-1 lg:order-2 hidden lg:block">
          <SummaryPanel t={t} cart={cart} items={items} chargeCurrency={chargeCurrency} totals={totals} vatIncluded={vatIncluded} destinationEG={destinationEG} fulfillment={fulfillment} />
          <Button type="submit" fullWidth size="lg" loading={submitting} disabled={!allValid} className="mt-4"
            iconLeft={payment === 'stripe' || payment === 'paymob' ? <Lock size={16} /> : undefined}>
            {payment === 'stripe' || payment === 'paymob' ? (t('pay_now') || 'Pay now') : (t('place_order') || 'Place order')}
          </Button>
        </Card>
      </form>

      {/* Mobile — total + place order at page bottom (not floating above nav) */}
      <div className="lg:hidden mt-8 pt-6 border-t border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-4">
          <span className="font-heading text-lg font-bold">{t('total') || 'Total'}</span>
          <span className="font-heading text-2xl font-bold text-[var(--color-primary)]">{formatMoney(totals.total, { currency: chargeCurrency })}</span>
        </div>
        <Button type="button" fullWidth size="lg" loading={submitting} disabled={!allValid}
          iconLeft={payment === 'stripe' || payment === 'paymob' ? <Lock size={16} /> : undefined}
          onClick={() => (document.getElementById('checkout-form') as HTMLFormElement | null)?.requestSubmit()}>
          {payment === 'stripe' || payment === 'paymob' ? (t('pay_now') || 'Pay now') : (t('place_order') || 'Place order')}
        </Button>
        <p className="text-[11px] text-center text-[var(--color-text-secondary)] mt-3 flex items-center justify-center gap-1">
          <Lock size={11} /> {t('secure_checkout') || 'Secure checkout'}
        </p>
      </div>
    </div>
  );
};

const SummaryPanel: React.FC<{
  t: TFunction;
  cart: { id: string; imageUrl?: string; name: unknown; quantity: number }[];
  items: OrderItem[];
  chargeCurrency: string;
  totals: ReturnType<typeof computeTotals>;
  vatIncluded: number;
  destinationEG: boolean;
  fulfillment: FulfillmentType;
}> = ({ t, cart, items, chargeCurrency, totals, vatIncluded, destinationEG, fulfillment }) => (
  <>
    <h2 className="font-heading text-xl font-bold mb-4">{t('order_summary') || 'Order summary'}</h2>
    <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pe-1">
      {cart.map((c, i) => (
        <div key={c.id} className="flex gap-3">
          <div className="w-12 h-12 rounded-[var(--radius-sm)] overflow-hidden bg-[var(--color-surface-2)] shrink-0">
            {c.imageUrl && <img src={c.imageUrl} alt="" className="w-full h-full object-cover" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{typeof c.name === 'string' ? c.name : localized(c.name as import('../types').LocalizedString)}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">×{c.quantity}</p>
          </div>
          <p className="text-sm font-medium">{formatMoney((items[i]?.price || 0) * c.quantity, { currency: chargeCurrency })}</p>
        </div>
      ))}
    </div>
    <hr className="rule-gold my-4" />
    <div className="flex flex-col gap-1.5 text-sm">
      <Row label={t('subtotal') || 'Subtotal'} value={formatMoney(totals.subtotal, { currency: chargeCurrency })} />
      <Row label={t('shipping') || 'Shipping'} value={fulfillment === 'shipping' ? (t('shipping_tbd') || 'Confirmed after order') : (t('free') || 'Free')} muted />
      {destinationEG ? (
        <Row label={t('vat_included') || 'VAT 14% (included)'} value={formatMoney(vatIncluded, { currency: chargeCurrency })} muted />
      ) : (
        <Row label={t('tax_export') || 'Tax'} value={t('tax_export_value') || '0% (export)'} muted />
      )}
    </div>
    <hr className="rule-gold my-4" />
    <div className="flex justify-between items-baseline">
      <span className="font-heading font-bold">{t('total') || 'Total'}</span>
      <span className="font-heading text-xl font-bold">{formatMoney(totals.total, { currency: chargeCurrency })}</span>
    </div>
  </>
);

const Row: React.FC<{ label: string; value: string; muted?: boolean }> = ({ label, value, muted }) => (
  <div className="flex justify-between">
    <span className="text-[var(--color-text-secondary)]">{label}</span>
    <span className={muted ? 'text-[var(--color-text-secondary)]' : 'font-medium'}>{value}</span>
  </div>
);

export default Checkout;
