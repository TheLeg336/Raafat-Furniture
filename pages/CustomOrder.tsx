import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Hammer, Send, CheckCircle2 } from 'lucide-react';
import type { TFunction } from '../types';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useToast } from '../components/ui/Toast';
import { apiFetch } from '../lib/api';
import { useSeo } from '../lib/seo';

interface Props { t: TFunction; }

/** Made-to-order request form. Reached from the home CTA and from a product
    marked "custom order available" (?item=Name prefills the description). */
const CustomOrder: React.FC<Props> = ({ t }) => {
  useSeo({
    title: 'Custom Furniture Orders — Made to Order | Raafat Furniture',
    description: 'Commission a custom furniture piece handcrafted in Egypt. Tell us your dimensions and vision — sofas, beds, dining tables, and more, made to order and shipped worldwide.',
    path: '/custom-order',
  });
  const toast = useToast();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ name: '', email: '', phone: '', dimensions: '', details: '' });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<any>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Prefill from a product's "request a custom version" link.
  useEffect(() => {
    const item = params.get('item');
    if (item) {
      setForm((f) => f.details ? f : { ...f, details: `${t('custom_prefill') || 'Custom version of'}: ${item}\n\n` });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await apiFetch('/api/custom-order', form);
      setSent(true);
    } catch (err: any) {
      toast.error(err?.message || 'Could not send your request. Please try WhatsApp or phone.');
    }
    setBusy(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 md:py-20">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <div className="w-14 h-14 rounded-full bg-[var(--color-primary)]/12 flex items-center justify-center mx-auto mb-4">
          <Hammer size={26} className="text-[var(--color-primary)]" />
        </div>
        <h1 className="font-heading text-4xl md:text-5xl font-bold mb-3">{t('custom_order_page_title') || 'Custom order'}</h1>
        <p className="text-[var(--color-text-secondary)] measure mx-auto">
          {t('custom_order_desc') || 'Every piece is handcrafted to order. Tell us what you have in mind — a size, a material, a whole new design — and our designers will get back to you with a quote.'}
        </p>
      </motion.div>

      <Card className="p-6 md:p-8">
        {sent ? (
          <div className="text-center py-10 flex flex-col items-center gap-3">
            <CheckCircle2 size={40} className="text-[var(--color-primary)]" />
            <h2 className="font-heading text-2xl font-bold">{t('custom_order_sent') || 'Request received'}</h2>
            <p className="text-[var(--color-text-secondary)] measure">
              {t('custom_order_sent_desc') || 'Thanks — our design team will email you within one business day to discuss your piece and pricing.'}
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <Input label={t('full_name') || 'Full name'} required value={form.name} onChange={set('name')} autoComplete="name" />
            <Input label={t('login_email') || 'Email'} type="email" required value={form.email} onChange={set('email')} autoComplete="email" />
            <Input label={`${t('phone') || 'Phone'} (${t('admin_optional') || 'optional'})`} type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" />
            <Input
              label={`${t('dimensions') || 'Dimensions'} (${t('admin_optional') || 'optional'})`}
              hint={t('custom_dimensions_hint') || 'Tell us the size you need — we make to order.'}
              value={form.dimensions} onChange={set('dimensions')} placeholder={t('custom_dimensions_ph') || 'e.g. 220cm W × 95cm D'}
            />
            <Textarea label={t('custom_order_details') || 'What would you like us to make?'} required rows={6} value={form.details} onChange={set('details')} placeholder={t('custom_order_details_ph') || 'Describe the piece: type, style, materials, colour, and anything else that matters to you.'} />
            <Button type="submit" loading={busy} iconLeft={<Send size={16} />}>{t('custom_order_submit') || 'Send request'}</Button>
          </form>
        )}
      </Card>
    </div>
  );
};

export default CustomOrder;
