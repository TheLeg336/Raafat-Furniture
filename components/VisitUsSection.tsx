import React from 'react';
import type { TFunction } from '../types';
import { Reveal } from './ui/Reveal';

const VisitUsSection: React.FC<{ t: TFunction }> = ({ t }) => (
  <section id="visit-us" className="bg-[var(--color-background)] py-20 md:py-28 transition-colors duration-500">
    <div className="container mx-auto px-6">
      <Reveal className="text-center max-w-3xl mx-auto">
        <h2 className="font-heading text-4xl md:text-5xl font-bold mb-5 text-balance">
          {t('visit_us_title') || 'Come see it in person'}
        </h2>
        <p className="text-[var(--color-text-secondary)] leading-relaxed measure mx-auto" style={{ textWrap: 'pretty' as any }}>
          {t('visit_us_p1') || 'Our showrooms across Egypt are open daily. Touch the materials, feel the weight, and let our team help you find the right piece.'}
        </p>
      </Reveal>
    </div>
  </section>
);

export default VisitUsSection;
