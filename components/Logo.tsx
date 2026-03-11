import React from 'react';
import { motion, Variants } from 'framer-motion';

const logoVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

const letterVariants: Variants = {
  hidden: { opacity: 0, rotateY: -90 },
  visible: {
    opacity: 1,
    rotateY: 0,
    // Refined the animation with a custom 'easeOut' cubic-bezier curve for a
    // smoother, more luxurious and polished entrance effect.
    transition: {
      duration: 1,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

interface LogoProps {
  t?: (key: string) => string;
}

const Logo: React.FC<LogoProps> = ({ t }) => {
  const raafatLetters = Array.from("RAAFAT");
  const furnitureLetters = Array.from("FURNITURE");

  return (
    <motion.div
      className="flex flex-col items-center leading-none"
      style={{
        transform: 'scale(1.15)',
        perspective: 400 // Add perspective for a 3D effect on rotation
      }}
      variants={logoVariants}
      initial="hidden"
      animate="visible"
      aria-label={t ? t('aria_logo') : "Raafat Furniture Logo"}
      dir="ltr"
    >
      {/* RAAFAT word */}
      <motion.div
        className="flex text-xl font-light tracking-[0.3em] mb-[-0.1rem] mr-[-0.3em]"
        style={{ fontFamily: "'Inter', sans-serif" }}
        aria-hidden="true"
      >
        {raafatLetters.map((letter, index) => (
          <motion.span
            key={`raafat-${index}`}
            variants={letterVariants}
            className="inline-block" // Ensures transforms are applied correctly
          >
            {letter}
          </motion.span>
        ))}
      </motion.div>

      {/* FURNITURE word */}
      <motion.div
        className="flex font-semibold"
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '0.7rem',
          letterSpacing: '0.2em',
          marginRight: '-0.2em',
        }}
        aria-hidden="true"
      >
        {furnitureLetters.map((letter, index) => (
          <motion.span
            key={`furniture-${index}`}
            variants={letterVariants}
            className="inline-block"
          >
            {letter}
          </motion.span>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default Logo;
