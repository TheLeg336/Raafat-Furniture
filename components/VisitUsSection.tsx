import React from 'react';
import { MapPin, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import type { TFunction } from '../types';
import { Reveal, RevealGroup, revealItem } from './ui/Reveal';
import { Card } from './ui/Card';

const VisitUsSection: React.FC<{ t: TFunction }> = ({ t }) => {
  const branches = [
    { name: t('footer_cairo_branch_title'), address: t('footer_cairo_branch_address') },
    { name: t('footer_minya_branch_title'), address: t('footer_minya_branch_address') },
    { name: t('footer_new_minya_branch_title'), address: t('footer_new_minya_branch_address') },
  ];

  return (
    <section id="visit-us" className="bg-[var(--color-background)] py-20 md:py-28 transition-colors duration-500">
      <div className="container mx-auto px-6">
        <Reveal className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-5 text-balance">
            {t('visit_us_title') || 'Come see it in person'}
          </h2>
          <p className="text-[var(--color-text-secondary)] leading-relaxed measure mx-auto" style={{ textWrap: 'pretty' as any }}>
            {t('visit_us_p1') || 'Our showrooms across Egypt are open daily. Touch the materials, feel the weight, and let our team help you find the right piece.'}
          </p>
        </Reveal>

        <RevealGroup className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((b, i) => (
            <motion.div key={i} variants={revealItem}>
              <Card hover className="p-7 h-full flex flex-col">
                <div className="w-11 h-11 rounded-full bg-[hsla(var(--color-primary-hsl-values),0.14)] text-[var(--color-primary)] flex items-center justify-center mb-5">
                  <MapPin size={20} />
                </div>
                <h3 className="font-heading text-xl font-bold mb-2">{b.name}</h3>
                <p className="text-[var(--color-text-secondary)] leading-relaxed flex-1">{b.address}</p>
                <p className="mt-5 flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <Clock size={15} className="text-[var(--color-primary)]" /> {t('footer_hours')}
                </p>
              </Card>
            </motion.div>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
};

export default VisitUsSection;
