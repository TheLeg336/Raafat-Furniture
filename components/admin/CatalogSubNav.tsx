import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminPath } from '../../lib/paths';
import type { TFunction } from '../../types';

type CatalogTab = 'categories' | 'archive' | 'logs';

interface Props {
  t: TFunction;
  isDeveloper: boolean;
  archiveCount?: number;
}

/** In-page tabs for catalog management (categories / archive / logs). */
export const CatalogSubNav: React.FC<Props> = ({ t, isDeveloper, archiveCount = 0 }) => {
  const [searchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as CatalogTab) || 'categories';

  const items: { id: CatalogTab; label: string; badge?: number }[] = [
    { id: 'categories', label: t('admin_tab_categories') || 'Categories' },
    { id: 'archive', label: t('admin_tab_archive') || 'Archive', badge: archiveCount || undefined },
  ];
  if (isDeveloper) items.push({ id: 'logs', label: t('admin_tab_logs') || 'Logs' });

  return (
    <div className="flex flex-wrap gap-1 mb-5 p-1 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] w-fit max-w-full">
      {items.map((item) => {
        const active = tab === item.id;
        return (
          <Link
            key={item.id}
            to={item.id === 'categories' ? adminPath() : `${adminPath()}?tab=${item.id}`}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-sm font-medium transition-colors ${
              active
                ? 'bg-[var(--color-background)] text-[var(--color-primary)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {item.label}
            {item.badge != null && item.badge > 0 && (
              <span className="text-[10px] font-bold bg-[var(--color-primary)] text-[var(--color-ink-on-gold)] px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
};

export default CatalogSubNav;
