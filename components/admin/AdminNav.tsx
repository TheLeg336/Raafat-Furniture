import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, ClipboardList, Box, Home, Users } from 'lucide-react';

const items = [
  { to: '/admin', label: 'Catalog', icon: <LayoutGrid size={16} />, exact: true },
  { to: '/admin/orders', label: 'Orders', icon: <ClipboardList size={16} /> },
  { to: '/admin/scans', label: 'Scans & 3D', icon: <Box size={16} /> },
  { to: '/admin/team', label: 'Team', icon: <Users size={16} /> },
];

/** Slim cross-section nav for the admin area. */
export const AdminNav: React.FC = () => {
  const { pathname } = useLocation();
  return (
    <div className="flex items-center gap-2 flex-wrap mb-8">
      {items.map((it) => {
        const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
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
            {it.icon}
            {it.label}
          </Link>
        );
      })}
      <Link to="/" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-pill)] text-sm font-semibold border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] ms-auto">
        <Home size={16} /> Store
      </Link>
    </div>
  );
};

export default AdminNav;
