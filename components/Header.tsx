import React, { useState, useEffect, forwardRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User as UserIcon, ShoppingBag } from 'lucide-react';
import { LanguageOption } from '../types';
import type { TFunction } from '../types';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../contexts/StoreContext';

interface HeaderProps {
  language: LanguageOption;
  setLanguage: (lang: LanguageOption) => void;
  t: TFunction;
  isShineAnimating: boolean;
  themeMode: 'light' | 'dark';
  setThemeMode: (mode: 'light' | 'dark') => void;
}

const Header = forwardRef<HTMLElement, HeaderProps>(({ language, setLanguage, t, isShineAnimating, themeMode, setThemeMode }, ref) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { cart, setIsCartOpen, isCartOpen } = useStore();

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogoClick = () => {
    setIsMenuOpen(false);
    setIsCartOpen(false);
  };

  useEffect(() => {
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollBarWidth}px`;
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.documentElement.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Handle scrolling when hash changes or when navigating from another page
  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.substring(1);
      setTimeout(() => {
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          const header = document.querySelector('header');
          const isSticky = header && window.getComputedStyle(header).position === 'sticky';
          const headerHeight = isSticky && header ? header.offsetHeight : 0;
          const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      }, 100); // Small delay to ensure DOM is ready if we just navigated
    } else if (location.pathname === '/' && !location.hash) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]);

  const navLinks = [
    { key: 'nav_home', href: '/' },
    { key: 'nav_shop', href: '/#shop' },
    { key: 'nav_about', href: '/#visit-us' },
    { key: 'nav_contact', href: '/#contact' },
  ];
  
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, href: string) => {
    setIsMenuOpen(false);
    
    if (location.pathname === '/' && href === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // If we are already on the home page and clicking a hash link, prevent default and scroll
    if (location.pathname === '/' && href.startsWith('/#')) {
      e.preventDefault();
      const hash = href.substring(1); // Get the '#shop' part
      navigate(hash);
    }
  };

  const headerClass = 'sticky top-0 z-[100] bg-[var(--color-background)] bg-opacity-80 backdrop-blur-xl shadow-sm';
  const navClass = 'text-lg font-medium tracking-wide font-heading';

  const NavLinks: React.FC<{isMobile?: boolean}> = ({ isMobile }) => (
    <ul className={`flex ${isMobile ? 'flex-col text-xl gap-10 items-center' : `items-center ${navClass} gap-8`}`}>
      {navLinks.map(link => (
        <li key={link.key}>
          <Link 
            to={link.href} 
            onClick={(e) => handleNavClick(e, link.href)} 
            className={`nav-link text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-colors duration-300 ${isMobile ? 'leading-loose' : ''}`}
          >
            {t(link.key)}
          </Link>
        </li>
      ))}
    </ul>
  );

  const Controls: React.FC<{isMobile?: boolean}> = ({ isMobile }) => (
    <div className={`flex items-center gap-6 ${isMobile ? 'flex-col gap-4' : ''}`}>
      <Link 
        to={user ? (isAdmin ? "/admin" : "/account") : "/login"} 
        className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors p-2 rounded-full hover:bg-[var(--color-primary)]/5"
        aria-label={t('aria_account')}
      >
        <UserIcon size={20} />
      </Link>
      {!isMobile && (
        <button
          onClick={() => setIsCartOpen(!isCartOpen)}
          className="relative text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors p-2 rounded-full hover:bg-[var(--color-primary)]/5"
          aria-label={t('cart')}
        >
          <ShoppingBag size={20} />
          <AnimatePresence>
            {cartCount > 0 && (
              <motion.span
                key={cartCount}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute top-0 right-0 bg-[var(--color-primary)] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
              >
                {cartCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      )}
      <div className="flex items-center">
        <motion.button 
          onClick={() => setLanguage(LanguageOption.English)}
          className={`text-base font-semibold font-heading ${language === LanguageOption.English ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]'}`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {t('lang_toggle_en')}
        </motion.button>
        <span className="text-[var(--color-text-secondary)] mx-2">/</span>
        <motion.button 
          onClick={() => setLanguage(LanguageOption.Arabic)}
          className={`text-base font-semibold font-heading ${language === LanguageOption.Arabic ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]'}`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {t('lang_toggle_ar')}
        </motion.button>
      </div>
      <ThemeToggle themeMode={themeMode} setThemeMode={setThemeMode} t={t} />
    </div>
  );

  return (
    <>
      <header ref={ref} className={`${headerClass} transition-colors duration-500 shine-effect ${isShineAnimating ? 'shine-onload' : ''} ${isMenuOpen ? 'bg-transparent shadow-none backdrop-blur-none' : ''}`}>
        <div className="container mx-auto px-6 py-4">
          {/* Desktop Layout */}
          <div className="hidden md:grid grid-cols-3 items-center">
            <nav className="justify-self-start">
              <NavLinks />
            </nav>
            
            <div className="justify-self-center text-[var(--color-text-primary)]">
               <Link to="/" onClick={handleLogoClick}>
                  <Logo t={t} />
               </Link>
            </div>

            <div className="justify-self-end">
              <Controls />
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden flex justify-between items-center relative z-50">
            <div className="relative z-50">
              <button 
                onClick={() => { setIsMenuOpen(!isMenuOpen); setIsCartOpen(false); }} 
                aria-label={isMenuOpen ? t('aria_close_menu') : t('aria_open_menu')} 
                className="text-[var(--color-text-primary)] p-2 -ml-2 relative z-50"
              >
                <motion.div 
                  animate={{ rotate: isMenuOpen ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="w-6 h-6 flex flex-col justify-center gap-[5px] items-center"
                >
                  <motion.span
                    animate={isMenuOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-6 h-[2px] bg-current rounded-full origin-center"
                  />
                  <motion.span
                    animate={isMenuOpen ? { opacity: 0, scale: 0 } : { opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="w-6 h-[2px] bg-current rounded-full"
                  />
                  <motion.span
                    animate={isMenuOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-6 h-[2px] bg-current rounded-full origin-center"
                  />
                </motion.div>
              </button>
            </div>

            <div className={`absolute left-1/2 transform -translate-x-1/2 text-[var(--color-text-primary)] z-10 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
               <Link to="/" onClick={handleLogoClick}>
                  <Logo t={t} />
               </Link>
            </div>

            <div className={`relative z-50 flex items-center min-w-[40px] justify-end transition-opacity duration-300 ${isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              {cartCount > 0 && (
                <button
                  onClick={() => setIsCartOpen(!isCartOpen)}
                  className="relative text-[var(--color-text-primary)] p-2 -mr-2"
                  aria-label={t('cart')}
                >
                  <ShoppingBag size={24} />
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1 right-1 bg-[var(--color-primary)] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                  >
                    {cartCount}
                  </motion.span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              aria-hidden="true"
            />
            <motion.div
              className={`fixed top-0 h-full w-[80vw] max-w-sm z-50 bg-[var(--color-background)] shadow-2xl start-0 border-e border-white/10 rounded-e-3xl`}
              initial={{ x: document.documentElement.dir === 'rtl' ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: document.documentElement.dir === 'rtl' ? '100%' : '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="p-8 h-full flex flex-col items-center relative overflow-hidden">
                {/* Decorative background blob */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-primary)] opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                
                <div className="text-[var(--color-text-primary)] mt-4 mb-12 relative z-10">
                  <Link to="/" onClick={handleLogoClick}>
                      <Logo t={t} />
                  </Link>
                </div>
                
                <nav className="flex-grow flex flex-col w-full relative z-10">
                  <motion.div
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: { staggerChildren: 0.1, delayChildren: 0.1 }
                      }
                    }}
                    className="flex flex-col space-y-6 items-center w-full text-center"
                  >
                    {navLinks.map(link => (
                      <motion.div 
                        key={link.key} 
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
                        }}
                      >
                        <Link 
                          to={link.href} 
                          onClick={(e) => handleNavClick(e, link.href)} 
                          className="text-2xl font-medium font-heading text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-colors block py-2"
                        >
                          {t(link.key)}
                        </Link>
                      </motion.div>
                    ))}
                    
                    <motion.div 
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut", delay: 0.3 } }
                      }}
                      className="w-full flex flex-col items-center pt-6 border-t border-[var(--color-text-secondary)]/20"
                    >
                       <Controls isMobile={true} />
                    </motion.div>
                  </motion.div>
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
});

export default Header;