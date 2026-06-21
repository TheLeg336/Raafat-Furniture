import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ThemeMode = 'light' | 'dark';

interface ThemeToggleProps {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  t: (key: string) => string;
}

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
);

const ThemeToggle: React.FC<ThemeToggleProps> = ({ themeMode, setThemeMode, t }) => {
  const isDark = themeMode === 'dark';

  const handleToggle = () => {
    setThemeMode(isDark ? 'light' : 'dark');
  };

  // FIX: Added 'as const' to the spring animation configuration.
  // This ensures that TypeScript infers the 'type' property as the literal "spring"
  // instead of a generic string, resolving the type incompatibility with Framer Motion's 'transition' prop.
  const spring = {
    type: "spring",
    stiffness: 700,
    damping: 30
  } as const;

  return (
      <div
        className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors ${isDark ? 'bg-white/20' : 'bg-black/20'}`}
        onClick={handleToggle}
        aria-label={isDark ? t('aria_switch_light') : t('aria_switch_dark')}
        role="switch"
        aria-checked={isDark}
        dir="ltr"
      >
        <motion.div
          className="w-6 h-6 rounded-full flex items-center justify-center"
          initial={false}
          animate={{ x: isDark ? 24 : 0 }}
          style={{
            backgroundColor: 'var(--color-background)',
            color: 'var(--color-text-primary)'
          }}
          transition={spring}
          whileHover={{ scale: 1.1 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isDark ? 'moon' : 'sun'}
              initial={{ y: -15, opacity: 0, rotate: -90 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: 15, opacity: 0, rotate: 90 }}
              transition={{ duration: 0.25 }}
            >
              {isDark ? <MoonIcon /> : <SunIcon />}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
  );
};

export default ThemeToggle;