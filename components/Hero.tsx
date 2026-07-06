import React, { useRef, useState, useEffect } from 'react';
import { motion, Variants, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowDown } from 'lucide-react';
import type { TFunction } from '../types';
import SearchIcon from './icons/SearchIcon';
import CloseIcon from './icons/CloseIcon';
import { useSettings } from '../hooks/useSettings';

interface HeroProps {
  t: TFunction;
  headerHeight?: number;
}

const DEFAULT_HERO_IMAGE =
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1920&q=80';

const Hero: React.FC<HeroProps> = ({ t }) => {
  const heroRef = useRef(null);
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '22%']);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '40%']);
  const overlayOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.2]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.12]);

  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const { settings } = useSettings();

  useEffect(() => {
    if (!isSearchVisible) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsSearchVisible(false); };
    const onClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) setIsSearchVisible(false);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    searchInputRef.current?.focus();
    return () => { window.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick); };
  }, [isSearchVisible]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const bgImage = settings.heroImageUrl || DEFAULT_HERO_IMAGE;

  const title = t('hero_sleek_title') || 'The Future of Design';
  const words = title.split(' ');

  const container: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } } };
  const wordMask: Variants = {
    hidden: { y: '110%' },
    visible: { y: '0%', transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
  };
  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25, 1, 0.5, 1], delay: 0.7 } },
  };

  return (
    <div ref={heroRef} className="relative grain text-white h-[88vh] md:h-[100dvh] min-h-[560px] overflow-hidden">
      <motion.div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})`, y: backgroundY, scale }} />
      <motion.div className="absolute inset-0 z-[1]" style={{ opacity: overlayOpacity, background: 'linear-gradient(180deg, rgba(10,16,32,0.55) 0%, rgba(10,16,32,0.30) 35%, rgba(10,16,32,0.75) 100%)' }} />
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-[var(--color-background)] via-transparent to-transparent opacity-90" />
      {!reduce && <div className="aurora z-[1] opacity-50" aria-hidden="true" />}

      <div className="glass shadow-lg rounded-full" style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -1 }} aria-hidden="true" />

      <motion.div className="relative z-[2] h-full container mx-auto px-6 flex flex-col items-center justify-center text-center" style={{ y: contentY }}>
        <motion.div variants={container} initial="hidden" animate="visible">
          <h1 className="font-heading font-bold tracking-[-0.02em] leading-[0.95] mb-6 text-balance" style={{ fontSize: 'clamp(2.75rem, 9vw, 5.5rem)' }}>
            {words.map((w, i) => (
              <span key={i} className="inline-block overflow-hidden align-bottom me-[0.25em] last:me-0">
                <motion.span className="inline-block" variants={wordMask}>{w}</motion.span>
              </span>
            ))}
          </h1>

          <motion.p variants={fadeUp} className="text-white/80 max-w-xl mx-auto mb-9 text-base md:text-lg measure">
            {t('hero_subtitle') || 'Furniture made to be lived with, crafted, considered, and yours.'}
          </motion.p>

          <motion.div variants={fadeUp} className="relative flex items-center justify-center">
            <motion.div
              ref={searchContainerRef}
              layout
              onClick={() => !isSearchVisible && setIsSearchVisible(true)}
              className={`relative flex items-center justify-center origin-center overflow-hidden rounded-full ${
                isSearchVisible
                  ? 'w-full max-w-lg h-14 glass shadow-lg'
                  : 'h-14 px-10 bg-[var(--color-primary)] text-[var(--color-ink-on-gold)] hover:brightness-105 shine-effect shine-onload cursor-pointer shadow-[var(--gold-glow)]'
              }`}
              transition={{ layout: { type: 'spring', stiffness: 300, damping: 35, mass: 0.8 }, opacity: { duration: 0.2 } }}
            >
              <div className="relative w-full h-full flex items-center justify-center">
                <motion.span className="font-bold text-[var(--color-ink-on-gold)] whitespace-nowrap uppercase tracking-widest text-sm" animate={{ opacity: isSearchVisible ? 0 : 1 }} transition={{ duration: 0.15 }}>
                  {t('hero_cta_explore') || 'Explore'}
                </motion.span>
                <motion.form
                  onSubmit={handleSearchSubmit}
                  className="absolute inset-0 flex items-center px-5"
                  initial={false}
                  animate={{ opacity: isSearchVisible ? 1 : 0, scale: isSearchVisible ? 1 : 0.95 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25, delay: isSearchVisible ? 0.15 : 0 }}
                  style={{ pointerEvents: isSearchVisible ? 'auto' : 'none' }}
                >
                  <button type="submit" className="text-white/80 hover:text-white shrink-0 me-3 transition-colors" aria-label={t('nav_shop')}><SearchIcon /></button>
                  <input
                    ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} maxLength={100}
                    placeholder={t('search_placeholder') || 'Search furniture, styles, and more…'}
                    className="w-full bg-transparent text-white placeholder-white/70 outline-none"
                  />
                  <motion.button type="button" onClick={(e) => { e.stopPropagation(); setIsSearchVisible(false); }} className="ms-3 text-white/80 hover:text-white shrink-0" aria-label={t('aria_close_search')} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><CloseIcon /></motion.button>
                </motion.form>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-[2] text-white/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4, duration: 0.8 }} aria-hidden="true">
        <ArrowDown size={16} className="scroll-cue" />
      </motion.div>
    </div>
  );
};

export default Hero;
