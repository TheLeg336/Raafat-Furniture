import React from 'react';

interface SpinnerProps {
  size?: number;
  className?: string;
  label?: string;
}

/** Brand spinner — gold ring. Announces itself to screen readers. */
export const Spinner: React.FC<SpinnerProps> = ({ size = 28, className = '', label = 'Loading' }) => (
  <span
    role="status"
    aria-label={label}
    className={`inline-block animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent ${className}`}
    style={{ width: size, height: size }}
  />
);

export const PageSpinner: React.FC<{ label?: string }> = ({ label }) => (
  <div className="flex items-center justify-center py-24 w-full">
    <Spinner size={36} label={label} />
  </div>
);

export default Spinner;
