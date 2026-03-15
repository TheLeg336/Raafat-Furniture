import React, { useRef, useState, useEffect } from 'react';
import { motion, Variants, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { TFunction } from '../types';
import SearchIcon from './icons/SearchIcon';
import CloseIcon from './icons/CloseIcon';
import { useSettings } from '../hooks/useSettings';

interface HeroProps {
  t: TFunction;
  headerHeight?: number;
}

const Hero: React.FC<HeroProps> = ({ t }) => {
  const heroRef = useRef(null);
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const { settings } = useSettings();

  useEffect(() => {
    if (!isSearchVisible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSearchVisible(false);
      }
    };
    
    // Do not close on blur (when keyboard hides on mobile), only on click outside
    const handleClickOutside = (event: MouseEvent) => {
        if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
          setIsSearchVisible(false);
        }
    };

    // Add listeners
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    
    // Focus input
    searchInputRef.current?.focus();

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchVisible]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const defaultBgImage = settings.heroImageUrl || 'https://picsum.photos/seed/sleek/1280/720';

  const currentConfig = {
      bgImage: defaultBgImage,
      contentClass: 'w-full text-[var(--color-text-primary)]',
      titleClass: 'text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-4',
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.3, delayChildren: 0.5 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.25, 1, 0.5, 1] },
    },
  };
  
  return (
      <div
        ref={heroRef}
        className="relative text-[var(--color-text-primary)] transition-all duration-500 h-[50vh] md:h-screen overflow-hidden"
      >
        {/* 
          Pre-render element: This hidden div includes the classes for the active search bar.
          It forces the browser to compute these styles (especially the expensive backdrop-blur and gradient)
          on page load, preventing animation jank on the first click.
        */}
        <div
          className="search-gloss backdrop-blur-lg shadow-lg rounded-full"
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -1 }}
          aria-hidden="true"
        />

        <motion.div
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${currentConfig.bgImage})`,
            y: backgroundY
          }}
        />
        <div className="absolute inset-0 z-[1] bg-black/40" /> {/* Improved contrast overlay */}
        
        <div className="relative z-[2] h-full container mx-auto px-6 flex flex-col items-center justify-center text-center">
          <motion.div
            className={currentConfig.contentClass}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h1 variants={itemVariants} className={currentConfig.titleClass}>
               {t('hero_sleek_title')}
            </motion.h1>

            <motion.div
              variants={itemVariants}
              className="relative flex items-center justify-center mt-4"
            >
              <motion.div
                ref={searchContainerRef}
                layout
                onClick={() => !isSearchVisible && setIsSearchVisible(true)}
                className={`
                  relative flex items-center justify-center origin-center overflow-hidden rounded-full
                  ${isSearchVisible 
                    ? 'w-full max-w-lg h-14 search-gloss backdrop-blur-lg shadow-lg' 
                    : 'h-14 px-10 bg-[var(--color-primary)] text-white hover:bg-opacity-80 shine-effect cursor-pointer'}
                `}
                transition={{ 
                  layout: { type: "spring", stiffness: 300, damping: 35, mass: 0.8 },
                  opacity: { duration: 0.2 }
                }}
              >
                <div className="relative w-full h-full flex items-center justify-center">
                    {/* Explore Text */}
                    <motion.span
                        className="font-bold text-white whitespace-nowrap uppercase tracking-widest text-sm"
                        animate={{ opacity: isSearchVisible ? 0 : 1 }}
                        transition={{ duration: 0.15 }}
                    >
                        {t('hero_cta_explore')}
                    </motion.span>

                    {/* Search Input Container */}
                    <motion.form
                        onSubmit={handleSearchSubmit}
                        className="absolute inset-0 flex items-center px-5"
                        initial={false}
                        animate={{ 
                            opacity: isSearchVisible ? 1 : 0, 
                            scale: isSearchVisible ? 1 : 0.95 
                        }}
                        transition={{ 
                            type: "spring", 
                            stiffness: 300, 
                            damping: 25,
                            delay: isSearchVisible ? 0.15 : 0
                        }}
                        style={{ pointerEvents: isSearchVisible ? 'auto' : 'none' }}
                    >
                        <SearchIcon className="text-white/80 shrink-0 me-3" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            maxLength={100}
                            placeholder="Search for furniture, styles, and more..."
                            className="w-full bg-transparent text-white placeholder-white/70 outline-none"
                        />
                        <motion.button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setIsSearchVisible(false); }}
                            className="ms-3 text-white/80 hover:text-white shrink-0"
                            aria-label={t('aria_close_search')}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <CloseIcon />
                        </motion.button>
                    </motion.form>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
  );
};

export default Hero;