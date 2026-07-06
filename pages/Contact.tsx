import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, MessageCircle, Send } from 'lucide-react';
import type { TFunction } from '../types';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { BranchCards } from '../components/BranchCards';
import { Card } from '../components/ui/Card';
import { useToast } from '../components/ui/Toast';
import { apiFetch } from '../lib/api';
import { useSeo } from '../lib/seo';

interface Props { t: TFunction; }

const PHONE = '01010279777';
const WHATSAPP = `https://wa.me/2${PHONE}`;

const Contact: React.FC<Props> = ({ t }) => {
  useSeo({
    title: 'Contact Raafat Furniture — Showrooms in Cairo & Minya',
    description: 'Get in touch with Raafat Furniture by WhatsApp, phone, or our contact form. Visit our showrooms in Cairo, Minya and New Minya, or ask about custom orders and worldwide delivery.',
    path: '/contact',
  });
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<any>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await apiFetch('/api/contact', form);
      setSent(true);
    } catch (err: any) {
      toast.error(err?.message || 'Could not send your message. Please try WhatsApp or phone.');
    }
    setBusy(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 md:py-20">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <h1 className="font-heading text-4xl md:text-5xl font-bold mb-3">{t('contact_title') || 'Contact us'}</h1>
        <p className="text-[var(--color-text-secondary)] measure mx-auto">{t('contact_desc') || 'Questions about a piece, a custom order, or your delivery? We answer within one business day.'}</p>
      </motion.div>

      <div className="grid md:grid-cols-[1fr_1.2fr] gap-8 items-start">
        <div className="flex flex-col gap-4">
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">
            <Card hover className="p-5 flex items-center gap-4">
              <MessageCircle size={22} className="text-[var(--color-primary)] shrink-0" />
              <div>
                <p className="font-semibold">{t('contact_whatsapp') || 'WhatsApp'}</p>
                <p className="text-sm text-[var(--color-text-secondary)]" dir="ltr">+2 {PHONE}</p>
              </div>
            </Card>
          </a>
          <a href={`tel:+2${PHONE}`}>
            <Card hover className="p-5 flex items-center gap-4">
              <Phone size={22} className="text-[var(--color-primary)] shrink-0" />
              <div>
                <p className="font-semibold">{t('contact_phone') || 'Phone'}</p>
                <p className="text-sm text-[var(--color-text-secondary)]" dir="ltr">+2 {PHONE}</p>
              </div>
            </Card>
          </a>
          <Card className="p-5 flex items-center gap-4">
            <MapPin size={22} className="text-[var(--color-primary)] shrink-0" />
            <div>
              <p className="font-semibold">{t('contact_visit') || 'Visit a showroom'}</p>
              <p className="text-sm text-[var(--color-text-secondary)]">{t('contact_visit_desc') || 'Branch addresses are in the footer below.'}</p>
            </div>
          </Card>
        </div>

        <Card className="p-6 md:p-8">
          {sent ? (
            <div className="text-center py-10 flex flex-col items-center gap-3">
              <Send size={36} className="text-[var(--color-primary)]" />
              <h2 className="font-heading text-2xl font-bold">{t('contact_sent') || 'Message sent'}</h2>
              <p className="text-[var(--color-text-secondary)]">{t('contact_sent_desc') || 'Thanks — we’ll get back to you shortly.'}</p>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-1"><Mail size={18} className="text-[var(--color-primary)]" /><h2 className="font-heading text-xl font-bold">{t('contact_form_title') || 'Send us a message'}</h2></div>
              <Input label={t('full_name') || 'Full name'} required value={form.name} onChange={set('name')} autoComplete="name" />
              <Input label={t('login_email') || 'Email'} type="email" required value={form.email} onChange={set('email')} autoComplete="email" />
              <Textarea label={t('contact_message') || 'Message'} required rows={5} value={form.message} onChange={set('message')} />
              <Button type="submit" loading={busy} iconLeft={<Send size={16} />}>{t('contact_send') || 'Send message'}</Button>
            </form>
          )}
        </Card>
      </div>

      <section id="locations" className="mt-16 md:mt-20 pt-12 border-t border-[var(--color-secondary)]/20" aria-labelledby="contact-locations-heading">
        <h2 id="contact-locations-heading" className="font-heading text-2xl md:text-3xl font-bold text-center mb-8">
          {t('our_branches') || 'Our showrooms'}
        </h2>
        <BranchCards t={t} />
      </section>
    </div>
  );
};

export default Contact;
