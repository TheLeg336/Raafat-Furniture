import React from 'react';

type Tone = 'neutral' | 'gold' | 'navy' | 'success' | 'danger' | 'info';

const tones: Record<Tone, string> = {
  neutral: 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] border-[var(--color-border)]',
  gold: 'bg-[hsla(var(--color-primary-hsl-values),0.16)] text-[var(--color-ink-on-gold)] border-transparent dark:text-[var(--color-primary)]',
  navy: 'bg-[var(--color-secondary)] text-white border-transparent',
  success: 'bg-[rgba(46,125,50,0.12)] text-[#2e7d32] border-[rgba(46,125,50,0.35)]',
  danger: 'bg-[var(--color-danger-bg)] text-[var(--color-danger)] border-[var(--color-danger)]',
  info: 'bg-[rgba(20,33,61,0.08)] text-[var(--color-secondary)] border-[rgba(20,33,61,0.25)] dark:text-[#9db4e0] dark:bg-[rgba(157,180,224,0.12)] dark:border-[rgba(157,180,224,0.3)]',
};

interface BadgeProps {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ tone = 'neutral', className = '', children }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border px-3 py-1 text-xs font-semibold ${tones[tone]} ${className}`}
  >
    {children}
  </span>
);

export default Badge;
