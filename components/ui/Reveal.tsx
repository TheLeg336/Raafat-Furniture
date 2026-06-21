import React from 'react';
import { motion, type Variants } from 'framer-motion';

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

interface RevealProps {
  children: React.ReactNode;
  /** delay in seconds */
  delay?: number;
  direction?: Direction;
  /** distance in px */
  distance?: number;
  blur?: boolean;
  once?: boolean;
  amount?: number;
  className?: string;
  as?: React.ElementType;
}

const offset = (d: Direction, dist: number) => {
  switch (d) {
    case 'up': return { y: dist };
    case 'down': return { y: -dist };
    case 'left': return { x: dist };
    case 'right': return { x: -dist };
    default: return {};
  }
};

/**
 * Scroll-reveal that ENHANCES an already-visible default — content renders even
 * if the animation never fires (headless/hidden tabs). Reduced-motion: instant.
 */
export const Reveal: React.FC<RevealProps> = ({
  children, delay = 0, direction = 'up', distance = 28, blur = true, once = true, amount = 0.3, className = '', as = 'div',
}) => {
  const MotionTag = motion(as as any);
  const variants: Variants = {
    hidden: { opacity: 0, ...offset(direction, distance), filter: blur ? 'blur(8px)' : 'blur(0px)' },
    visible: {
      opacity: 1, x: 0, y: 0, filter: 'blur(0px)',
      transition: { duration: 0.7, ease: [0.25, 1, 0.5, 1], delay },
    },
  };
  return (
    <MotionTag className={className} variants={variants} initial="hidden" whileInView="visible" viewport={{ once, amount }}>
      {children}
    </MotionTag>
  );
};

/** Stagger container — children with `revealItem` variants animate in sequence. */
export const RevealGroup: React.FC<{ children: React.ReactNode; className?: string; stagger?: number; once?: boolean; amount?: number }> = ({
  children, className = '', stagger = 0.08, once = true, amount = 0.2,
}) => (
  <motion.div
    className={className}
    initial="hidden"
    whileInView="visible"
    viewport={{ once, amount }}
    variants={{ hidden: {}, visible: { transition: { staggerChildren: stagger } } }}
  >
    {children}
  </motion.div>
);

export const revealItem: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] } },
};

export default Reveal;
