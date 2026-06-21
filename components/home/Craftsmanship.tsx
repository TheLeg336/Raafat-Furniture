import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { TFunction } from '../../types';
import { Reveal } from '../ui/Reveal';
import { Button } from '../ui/Button';

/** Editorial split: parallax craftsmanship image + heritage copy. */
const Craftsmanship: React.FC<{ t: TFunction }> = ({ t }) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-8%', reduce ? '-8%' : '8%']);

  return (
    <section ref={ref} className="container mx-auto px-6 py-20 md:py-28">
      <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
        <Reveal direction="right" className="relative rounded-[var(--radius-lg)] overflow-hidden aspect-[4/5] md:aspect-square glow-on-hover">
          <motion.img
            src="https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=80"
            alt={t('craft_image_alt') || 'A craftsman finishing a solid-wood frame by hand'}
            style={{ y }}
            className="absolute inset-0 w-full h-[116%] object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </Reveal>

        <div>
          <Reveal>
            <h2 className="font-heading text-4xl md:text-5xl font-bold leading-tight text-balance mb-6">
              {t('craft_title') || 'Made by hand, made to last'}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-[var(--color-text-secondary)] leading-relaxed measure mb-5" style={{ textWrap: 'pretty' as any }}>
              {t('craft_p1') || 'Every piece begins as solid timber and the eye of a craftsman. We joinery-build for decades of use, finish by hand, and obsess over the details you feel but rarely see — the weight of a drawer, the warmth of an edge.'}
            </p>
            <p className="text-[var(--color-text-secondary)] leading-relaxed measure mb-8" style={{ textWrap: 'pretty' as any }}>
              {t('craft_p2') || 'Choose from our collections or commission a piece to your exact dimensions. Either way, it is built once, and built right.'}
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <Link to="/shop"><Button size="lg">{t('craft_cta') || 'Explore the collections'}</Button></Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default Craftsmanship;
