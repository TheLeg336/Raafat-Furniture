import React from 'react';
import { MapPin, Clock } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import type { TFunction } from '../types';
import { getBranches } from '../lib/branches';
import { Card } from './ui/Card';
import { revealItem } from './ui/Reveal';

interface Props {
  t: TFunction;
  /** Use motion variants when inside RevealGroup */
  animated?: boolean;
  className?: string;
}

const motionItem: Variants = revealItem;

export const BranchCards: React.FC<Props> = ({ t, animated = false, className = '' }) => {
  const branches = getBranches(t);
  const Wrapper = animated ? motion.div : 'div';
  const wrapperProps = animated ? { variants: motionItem } : {};

  return (
    <div className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {branches.map((b, i) => (
        <Wrapper key={i} {...wrapperProps}>
          <Card hover className="p-7 h-full flex flex-col text-start">
            <div className="w-11 h-11 rounded-full bg-[hsla(var(--color-primary-hsl-values),0.14)] text-[var(--color-primary)] flex items-center justify-center mb-5">
              <MapPin size={20} aria-hidden />
            </div>
            <h3 className="font-heading text-xl font-bold mb-2 text-[var(--color-text-primary)]">{b.name}</h3>
            <p className="text-[var(--color-text-secondary)] leading-relaxed flex-1">{b.address}</p>
            <p className="mt-5 flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <Clock size={15} className="text-[var(--color-primary)] shrink-0" aria-hidden />
              {t('footer_hours')}
            </p>
          </Card>
        </Wrapper>
      ))}
    </div>
  );
};
