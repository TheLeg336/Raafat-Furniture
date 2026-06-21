import React from 'react';
import type { TFunction } from '../../types';

/** Quiet moving strip of brand values — adds motion + rhythm between sections. */
const BrandMarquee: React.FC<{ t: TFunction }> = ({ t }) => {
  const words = [
    t('value_handcrafted') || 'Handcrafted',
    t('value_solid_wood') || 'Solid Wood',
    t('value_made_to_order') || 'Made to Order',
    t('value_delivered') || 'Delivered & Installed',
    t('value_timeless') || 'Timeless Design',
    t('value_egypt') || 'Made in Egypt',
  ];
  const strip = [...words, ...words];
  return (
    <div className="relative overflow-hidden border-y border-[var(--color-border)] bg-[var(--color-surface-2)] py-4 select-none" aria-hidden="true">
      <div className="marquee-track gap-10">
        {strip.map((w, i) => (
          <span key={i} className="inline-flex items-center gap-10 text-[var(--color-text-secondary)] font-heading text-lg">
            {w}
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
          </span>
        ))}
      </div>
    </div>
  );
};

export default BrandMarquee;
