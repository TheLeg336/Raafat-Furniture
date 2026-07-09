import React, { useRef, useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowDown } from 'lucide-react';
import type { TFunction } from '../types';
import SearchIcon from './icons/SearchIcon';
import CloseIcon from './icons/CloseIcon';
import { useSettings } from '../hooks/useSettings';

interface HeroProps {
  t: TFunction;
  headerHeight?: number;
  themeMode: 'light' | 'dark';
}

const DEFAULT_HERO_IMAGE =
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1920&q=80';

/** Collapsed pill width — wide enough for "Explore" / Arabic label. */
const PILL_WIDTH = '11.5rem';

const Hero: React.FC<HeroProps> = ({ t, themeMode }) => {
  const heroRef = useRef(null);
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const isDark = themeMode === 'dark';

  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  /** After first entrance, never re-run the entrance animation (fixes choppy re-load on scroll-to-top). */
  const [entered, setEntered] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const { settings } = useSettings();

  const closeSearch = () => {
    setIsSearchVisible(false);
    setSearchQuery('');
  };

  useEffect(() => {
    const tmr = window.setTimeout(() => setEntered(true), 1600);
    return () => window.clearTimeout(tmr);
  }, []);

  useEffect(() => {
    if (!isSearchVisible) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeSearch(); };
    const onClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) closeSearch();
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    const tmr = window.setTimeout(() => searchInputRef.current?.focus(), 180);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
      window.clearTimeout(tmr);
    };
  }, [isSearchVisible]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const bgImage = settings.heroImageUrl || DEFAULT_HERO_IMAGE;
  const title = t('hero_sleek_title') || 'The Future of Design';
  const words = title.split(' ');

  const heroOverlay = isDark
    ? 'linear-gradient(180deg, rgba(10,16,32,0.55) 0%, rgba(10,16,32,0.30) 35%, rgba(10,16,32,0.75) 100%)'
    : 'linear-gradient(180deg, rgba(243,240,232,0.55) 0%, rgba(243,240,232,0.25) 35%, rgba(243,240,232,0.80) 100%)';

  const subtitleClass = isDark ? 'text-white/80' : 'text-[var(--color-text-secondary)]';
  const scrollCueClass = isDark ? 'text-white/70' : 'text-[var(--color-text-secondary)]';
  const searchIconClass = isDark
    ? 'text-white/80 hover:text-white'
    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]';
  const searchInputClass = isDark
    ? 'text-white placeholder-white/70'
    : 'text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)]';

  const spring = reduce
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 320, damping: 34, mass: 0.85 };

  return (
    <div
      ref={heroRef}
      className={`relative grain h-[88vh] min-h-[520px] md:h-[88vh] md:min-h-[600px] lg:h-[90vh] lg:min-h-[640px] overflow-hidden ${
        isDark ? 'text-white' : 'text-[var(--color-text-primary)]'
      }`}
      style={{ overflowAnchor: 'none', contentVisibility: 'auto' as any }}
    >
      <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})` }} />
      <div className="absolute inset-0 z-[1]" style={{ background: heroOverlay }} />
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-[var(--color-background)] via-transparent to-transparent opacity-90" />
      {!reduce && <div className="aurora z-[1] opacity-50" aria-hidden="true" />}

      <div className="relative z-[2] h-full container mx-auto px-5 md:px-8 lg:px-6 flex flex-col items-center justify-center text-center">
        <div className="w-full max-w-4xl">
          <h1 className="font-heading font-bold tracking-[-0.02em] leading-[0.95] mb-5 md:mb-6 text-balance text-[2.5rem] md:text-[3.75rem] lg:text-[5.5rem]">
            {words.map((w, i) => (
              <span key={i} className="inline-block overflow-hidden align-bottom me-[0.25em] last:me-0">
                <motion.span
                  className="inline-block"
                  initial={entered || reduce ? false : { y: '110%' }}
                  animate={{ y: '0%' }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: entered ? 0 : 0.3 + i * 0.12 }}
                >
                  {w}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            className={`${subtitleClass} max-w-xl mx-auto mb-8 md:mb-9 text-base md:text-lg lg:text-xl measure px-2 md:px-0`}
            initial={entered || reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1], delay: entered ? 0 : 0.7 }}
          >
            {t('hero_subtitle') || 'Furniture made to be lived with, crafted, considered, and yours.'}
          </motion.p>

          <motion.div
            className="relative flex items-center justify-center w-full px-2 md:px-0"
            initial={entered || reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1], delay: entered ? 0 : 0.85 }}
          >
            {/* Always full-width track so the pill can physically expand into it */}
            <div className="w-full max-w-lg flex justify-center">
              <motion.div
                ref={searchContainerRef}
                onClick={() => !isSearchVisible && setIsSearchVisible(true)}
                className={`relative flex items-center justify-center overflow-hidden rounded-full h-14 ${
                  isSearchVisible
                    ? 'glass shadow-lg'
                    : 'bg-[var(--color-primary)] text-[var(--color-ink-on-gold)] hover:brightness-105 shine-effect cursor-pointer shadow-[var(--gold-glow)]'
                }`}
                initial={false}
                animate={{
                  width: isSearchVisible ? '100%' : PILL_WIDTH,
                }}
                transition={spring}
                style={{ maxWidth: '100%' }}
              >
                {/* Explore label — fades as width expands */}
                <motion.span
                  className="absolute inset-0 flex items-center justify-center font-bold text-[var(--color-ink-on-gold)] whitespace-nowrap uppercase tracking-widest text-sm pointer-events-none"
                  initial={false}
                  animate={{ opacity: isSearchVisible ? 0 : 1 }}
                  transition={{ duration: 0.12 }}
                >
                  {t('hero_cta_explore') || 'Explore'}
                </motion.span>

                {/* Search form — always mounted; reveals as pill expands */}
                <motion.form
                  onSubmit={handleSearchSubmit}
                  className="absolute inset-0 flex items-center px-4 md:px-5"
                  initial={false}
                  animate={{ opacity: isSearchVisible ? 1 : 0 }}
                  transition={{ duration: 0.15, delay: isSearchVisible ? 0.1 : 0 }}
                  style={{ pointerEvents: isSearchVisible ? 'auto' : 'none' }}
                >
                  <button type="submit" className={`${searchIconClass} shrink-0 me-2 transition-colors`} aria-label={t('nav_shop')}>
                    <SearchIcon />
                  </button>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    maxLength={100}
                    placeholder={t('search_placeholder') || 'Search furniture, styles, and more…'}
                    className={`w-full min-w-0 bg-transparent outline-none text-sm md:text-base ${searchInputClass}`}
                  />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); closeSearch(); }}
                    className={`ms-2 shrink-0 p-1 transition-colors ${searchIconClass}`}
                    aria-label={t('aria_close_search')}
                  >
                    <CloseIcon />
                  </button>
                </motion.form>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div
        className={`absolute bottom-7 left-1/2 -translate-x-1/2 z-[2] ${scrollCueClass}`}
        initial={entered || reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: entered ? 0 : 1.4, duration: 0.8 }}
        aria-hidden="true"
      >
        <ArrowDown size={16} className="scroll-cue" />
      </motion.div>
    </div>
  );
};

export default Hero;
