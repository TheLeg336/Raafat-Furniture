import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, User, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TFunction } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../contexts/StoreContext';
import { adminPath, STAFF_PATH, LOGIN_PATH } from '../lib/paths';

interface MobileTabBarProps {
  t: TFunction;
}

const MobileTabBar: React.FC<MobileTabBarProps> = ({ t }) => {
  const location = useLocation();
  const { user, isAdmin, isWorker } = useAuth();
  const { cart, setIsCartOpen } = useStore();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const accountPath = user ? (isAdmin ? adminPath() : isWorker ? STAFF_PATH : '/account') : LOGIN_PATH;

  const tabs = [
    { key: 'home', href: '/', icon: Home, label: t('nav_home') || 'Home' },
    { key: 'shop', href: '/shop', icon: Store, label: t('nav_shop') || 'Shop' },
    { key: 'cart', href: '#cart', icon: ShoppingBag, label: t('cart') || 'Cart', isCart: true },
    { key: 'account', href: accountPath, icon: User, label: t('aria_account') || 'Account' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/' && !location.hash;
    if (href === '/shop') return location.pathname === '/shop' || location.pathname.startsWith('/product');
    if (href === accountPath) return location.pathname === accountPath || location.pathname === '/account';
    return false;
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-[110] border-t border-[var(--color-border)] bg-[var(--color-background)]/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
      style={{ height: 'var(--mobile-tab-height)' }}
      aria-label={t('mobile_nav') || 'Main navigation'}
    >
      <div className="grid grid-cols-4 h-full">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = !tab.isCart && isActive(tab.href);

          if (tab.isCart) {
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="flex flex-col items-center justify-center gap-0.5 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors relative"
                aria-label={tab.label}
              >
                <span className="relative">
                  <Icon size={22} strokeWidth={1.75} />
                  <AnimatePresence>
                    {cartCount > 0 && (
                      <motion.span
                        key={cartCount}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1.5 -end-2 bg-[var(--color-primary)] text-[var(--color-ink-on-gold)] text-[9px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center"
                      >
                        {cartCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={tab.key}
              to={tab.href}
              className={`relative flex flex-col items-center justify-center gap-0.5 transition-colors ${
                active ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.25 : 1.75} />
              <span className="text-[10px] font-medium">{tab.label}</span>
              {active && (
                <motion.span
                  layoutId="mobile-tab-indicator"
                  className="absolute bottom-[calc(env(safe-area-inset-bottom)+2px)] w-8 h-0.5 rounded-full bg-[var(--color-primary)]"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileTabBar;
