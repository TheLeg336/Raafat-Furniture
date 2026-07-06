import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

export interface PillNavItem {
  key: string;
  label: string;
  href?: string;
  icon: LucideIcon;
  active?: boolean;
  onClick?: () => void;
}

interface MobilePillNavProps {
  items: PillNavItem[];
  ariaLabel: string;
}

/** Floating iOS-style liquid glass pill tab bar (mobile only). */
export const MobilePillNav: React.FC<MobilePillNavProps> = ({ items, ariaLabel }) => (
  <nav
    className="md:hidden fixed inset-x-0 bottom-0 z-[110] px-4 pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))] pointer-events-none"
    aria-label={ariaLabel}
  >
    <div
      className="pointer-events-auto mx-auto flex max-w-sm items-center justify-around gap-1 rounded-full border border-white/20 bg-[var(--color-background)]/55 px-2 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-[var(--color-background)]/45"
      style={{ minHeight: 'var(--mobile-tab-height)' }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const inner = (
          <>
            <Icon size={21} strokeWidth={item.active ? 2.25 : 1.75} />
            <span className="text-[10px] font-semibold leading-none">{item.label}</span>
            {item.active && (
              <motion.span
                layoutId="mobile-pill-indicator"
                className="absolute -bottom-0.5 h-0.5 w-6 rounded-full bg-[var(--color-primary)]"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
          </>
        );
        const className = `relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-1.5 transition-colors ${
          item.active ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]'
        }`;

        if (item.onClick) {
          return (
            <button key={item.key} type="button" onClick={item.onClick} className={className} aria-label={item.label}>
              {inner}
            </button>
          );
        }

        return (
          <Link key={item.key} to={item.href || '#'} className={className} aria-current={item.active ? 'page' : undefined}>
            {inner}
          </Link>
        );
      })}
    </div>
  </nav>
);

export default MobilePillNav;
