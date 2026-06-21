import React from 'react';
import { Link } from 'react-router-dom';
import { View, Boxes, Ruler } from 'lucide-react';
import type { TFunction } from '../../types';
import { Reveal, RevealGroup, revealItem } from '../ui/Reveal';
import { Button } from '../ui/Button';
import { motion } from 'framer-motion';

/** Promotes the new 3D / AR capability — "see it in your space". */
const ARHighlight: React.FC<{ t: TFunction }> = ({ t }) => {
  const features = [
    { icon: <Boxes size={22} />, title: t('ar_f1_t') || 'View in 3D', desc: t('ar_f1_d') || 'Spin every piece and inspect it from any angle.' },
    { icon: <View size={22} />, title: t('ar_f2_t') || 'Place it in your room', desc: t('ar_f2_d') || 'Augmented reality at true-to-life scale, right on your floor.' },
    { icon: <Ruler size={22} />, title: t('ar_f3_t') || 'Switch materials live', desc: t('ar_f3_d') || 'Try finishes and colours instantly before you decide.' },
  ];
  return (
    <section className="relative overflow-hidden bg-[var(--color-secondary)] text-white py-20 md:py-28">
      <div className="aurora opacity-40" aria-hidden="true" />
      <div className="relative container mx-auto px-6 text-center">
        <Reveal>
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-4 text-balance">
            {t('ar_title') || 'See it in your space before you buy'}
          </h2>
          <p className="text-white/75 max-w-2xl mx-auto mb-14 measure">
            {t('ar_subtitle') || 'Selected pieces come to life in interactive 3D and augmented reality — so you know it fits, in size and in feel.'}
          </p>
        </Reveal>
        <RevealGroup className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
          {features.map((f, i) => (
            <motion.div key={i} variants={revealItem} className="glass rounded-[var(--radius-lg)] p-7 text-start">
              <div className="w-12 h-12 rounded-full bg-[var(--color-primary)] text-[var(--color-ink-on-gold)] flex items-center justify-center mb-4">{f.icon}</div>
              <h3 className="font-heading text-xl font-bold mb-2">{f.title}</h3>
              <p className="text-white/70 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </RevealGroup>
        <Reveal delay={0.1}>
          <Link to="/shop"><Button size="lg">{t('ar_cta') || 'Browse 3D-ready pieces'}</Button></Link>
        </Reveal>
      </div>
    </section>
  );
};

export default ARHighlight;
