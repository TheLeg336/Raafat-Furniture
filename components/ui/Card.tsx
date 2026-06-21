import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  inset?: boolean;
  hover?: boolean;
}

/**
 * Flat-by-default surface. Depth is a state, not decoration — pass `hover`
 * for interactive cards that lift on hover. No nested cards (DESIGN.md).
 */
export const Card: React.FC<CardProps> = ({ as: Tag = 'div', inset, hover, className = '', children, ...props }) => (
  <Tag
    className={
      `rounded-[var(--radius-lg)] shadow-[var(--shadow-glass)] ` +
      `${inset ? 'bg-[var(--color-surface-2)]' : 'bg-[var(--color-surface)]'} ` +
      `${hover ? 'transition-[box-shadow,transform] duration-300 hover:shadow-[var(--shadow-lg)] hover:-translate-y-1' : ''} ` +
      className
    }
    {...props}
  >
    {children}
  </Tag>
);

export default Card;
