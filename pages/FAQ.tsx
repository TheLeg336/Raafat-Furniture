import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { TFunction } from '../types';
import { useSeo } from '../lib/seo';

interface Props { t: TFunction; }

/**
 * FAQ entries keyed for i18n: faq_qN / faq_aN in constants.ts (EN + AR),
 * overridable live from Firestore content like every other string.
 */
const FAQ_KEYS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

const FALLBACKS: Record<number, { q: string; a: string }> = {
  1: { q: 'How long does delivery take?', a: 'In-stock pieces ship within 3–7 business days inside Egypt. Made-to-order and custom pieces typically take 3–6 weeks depending on the design. International delivery times are quoted per order.' },
  2: { q: 'Do you deliver outside Egypt?', a: 'Yes — we ship worldwide. Delivery orders are paid in full when placed; the shipping cost is confirmed by our team before dispatch. Import duties, if any, are collected by your country on delivery.' },
  3: { q: 'What payment methods do you accept?', a: 'Card (including Apple Pay and Google Pay), InstaPay, bank transfer, and cash on pickup at our Egyptian showrooms. Delivery orders must be paid before shipping.' },
  4: { q: 'Can I return an item?', a: 'Ready-made items can be returned within 14 days of delivery in unused condition. Custom and made-to-order pieces are non-returnable once production starts. See the full policy in our Terms.' },
  5: { q: 'How do custom orders work?', a: 'Contact us via the Contact page or WhatsApp with your specification (dimensions, materials, style). Our team confirms the design and price, takes a deposit, then starts production. Custom pieces are non-returnable once work begins.' },
  6: { q: 'How do I view a piece in my room (AR)?', a: 'On any product with a 3D model, tap “View in your space” on your phone. The piece appears at true scale in your room, in the colour and material you selected.' },
  7: { q: 'How do I care for my furniture?', a: 'Dust with a soft dry cloth. Keep wood away from direct sunlight and heat sources. For upholstery, blot spills immediately and use a professional cleaner for stains.' },
  8: { q: 'How can I track my order?', a: 'Use the Track Order page with your order number and email. Shipped orders include a tracking number sent by email.' },
};

const FAQ: React.FC<Props> = ({ t }) => {
  const [open, setOpen] = useState<number | null>(1);

  useSeo({
    title: 'FAQ — Delivery, Returns & Custom Orders | Raafat Furniture',
    description: 'Answers about delivery times, worldwide shipping, payment methods, returns, custom orders, AR room preview, and furniture care at Raafat Furniture.',
    path: '/faq',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ_KEYS.map((n) => ({
        '@type': 'Question',
        name: t(`faq_q${n}`) || FALLBACKS[n].q,
        acceptedAnswer: { '@type': 'Answer', text: t(`faq_a${n}`) || FALLBACKS[n].a },
      })),
    },
  });

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 md:py-20">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <h1 className="font-heading text-4xl md:text-5xl font-bold mb-3">{t('faq_title') || 'Frequently asked questions'}</h1>
        <p className="text-[var(--color-text-secondary)]">{t('faq_desc') || 'Everything about ordering, delivery, returns and care.'}</p>
      </motion.div>

      <div className="flex flex-col gap-3">
        {FAQ_KEYS.map((n) => {
          const q = t(`faq_q${n}`) || FALLBACKS[n].q;
          const a = t(`faq_a${n}`) || FALLBACKS[n].a;
          const isOpen = open === n;
          return (
            <div key={n} className="border border-[var(--color-border)] rounded-[var(--radius-md)] overflow-hidden">
              <button
                onClick={() => setOpen(isOpen ? null : n)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-4 p-5 text-start font-semibold hover:bg-[var(--color-surface-2)] transition-colors"
              >
                {q}
                <ChevronDown size={18} className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                    <p className="px-5 pb-5 text-[var(--color-text-secondary)] leading-relaxed">{a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <p className="text-center text-sm text-[var(--color-text-secondary)] mt-10">
        {t('faq_more') || 'Still have a question?'}{' '}
        <Link to="/contact" className="text-[var(--color-primary)] font-semibold hover:underline">{t('contact_title') || 'Contact us'}</Link>
      </p>
    </div>
  );
};

export default FAQ;
