import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, ClipboardList, Box, Home, Users } from 'lucide-react';
import { ADMIN_LINKS, isAdminLinkActive } from './adminLinks';

const icons: Record<string, React.ReactNode> = {
  Catalog: <LayoutGrid size={16} />,
  Orders: <ClipboardList size={16} />,
  'Scans & 3D': <Box size={16} />,
  Team: <Users size={16} />,
};

/** Slim cross-section nav for the admin area. */
export const AdminNav: React.FC = () => {
  const { pathname } = useLocation();
  return (
    <div className="flex items-center gap-2 flex-wrap mb-8">
      {ADMIN_LINKS.map((it) => {
        const active = isAdminLinkActive(pathname, it);
        return (
          <Link
            key={it.to}
            to={it.to}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-pill)] text-sm font-semibold border transition-colors ${
              active
                ? 'bg-[var(--color-primary)] text-[var(--color-ink-on-gold)] border-transparent'
                : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'
            }`}
          >
            {icons[it.label]}
            {it.label}
          </Link>
        );
      })}
      <Link to="/staff" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-pill)] text-sm font-semibold border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]">
        <ClipboardList size={16} /> Workshop
      </Link>
      <Link to="/" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-pill)] text-sm font-semibold border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] ms-auto">
        <Home size={16} /> Store
      </Link>
    </div>
  );
};

export default AdminNav;
