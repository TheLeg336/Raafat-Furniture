import React from 'react';
import type { TFunction } from '../types';
import { Reveal, RevealGroup } from './ui/Reveal';
import { BranchCards } from './BranchCards';

const VisitUsSection: React.FC<{ t: TFunction }> = ({ t }) => (
  <section id="visit-us" className="bg-[var(--color-background)] py-16 md:py-24 lg:py-28 transition-colors duration-500" aria-labelledby="visit-us-heading">
    <div className="container mx-auto px-5 md:px-8 lg:px-6">
      <Reveal className="text-center max-w-3xl mx-auto mb-10 md:mb-12 lg:mb-14">
        <h2 id="visit-us-heading" className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-5 text-balance">
          {t('visit_us_title') || 'Visit Us'}
        </h2>
        <p className="text-[var(--color-text-secondary)] leading-relaxed measure mx-auto" style={{ textWrap: 'pretty' as any }}>
          {t('visit_us_p1')}
        </p>
      </Reveal>

      <RevealGroup>
        <BranchCards t={t} animated />
      </RevealGroup>
    </div>
  </section>
);

export default VisitUsSection;
