import React from 'react';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

/** Consistent page title row across admin sections. */
export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({ title, description, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5 md:mb-6">
    <div className="min-w-0">
      <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight">{title}</h1>
      {description && <p className="text-sm text-[var(--color-text-secondary)] mt-1 max-w-2xl">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
  </div>
);

export default AdminPageHeader;
