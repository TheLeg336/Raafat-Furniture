import React, { useState, useEffect } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Home, LogOut, Menu, X, LayoutGrid, ClipboardList, Users, Code2 } from 'lucide-react';
import type { TFunction } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import LogoIcon from '../LogoIcon';
import { PageSpinner } from '../ui/Spinner';
import { ADMIN_LINKS, DEV_ONLY_LINKS, isAdminLinkActive } from './adminLinks';
import { LOGIN_PATH } from '../../lib/paths';

const NAV_ICONS: Record<string, React.ReactNode> = {
  Catalog: <LayoutGrid size={18} />,
  Orders: <ClipboardList size={18} />,
  Team: <Users size={18} />,
  Dev: <Code2 size={18} />,
};

interface AdminLayoutProps {
  t: TFunction;
}

/** Shared shell for every /admin/* route — sidebar on desktop, bottom bar on mobile. */
export const AdminLayout: React.FC<AdminLayoutProps> = ({ t }) => {
  const { user, isAdmin, isDeveloper, loading, logout, firstName, lastName } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const meta = document.querySelector('meta[name="robots"]');
    const prev = meta?.getAttribute('content') || '';
    if (meta) meta.setAttribute('content', 'noindex, nofollow');
    return () => { if (meta) meta.setAttribute('content', prev); };
  }, []);

  if (loading) return <PageSpinner />;
  if (!user) return <Navigate to={LOGIN_PATH} replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-6">
        <div className="glass-card max-w-md w-full p-8 text-center rounded-[var(--radius-lg)]">
          <h1 className="text-xl font-bold mb-3">{t('admin_access_denied') || 'Access denied'}</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            {t('admin_not_authorized')?.replace('{email}', user.email || '') || 'This account is not authorized for admin.'}
          </p>
          <button
            type="button"
            onClick={() => logout()}
            className="w-full py-2.5 px-4 bg-[var(--color-primary)] text-[var(--color-ink-on-gold)] rounded-[var(--radius-md)] font-semibold text-sm"
          >
            {t('account_signout') || 'Sign out'}
          </button>
        </div>
      </div>
    );
  }

  const displayName = firstName && lastName ? `${firstName} ${lastName}` : (t('account_admin') || 'Admin');

  const NavLink: React.FC<{ to: string; label: string; exact?: boolean; onClick?: () => void }> = ({
    to, label, exact, onClick,
  }) => {
    const active = isAdminLinkActive(location.pathname, { to, label, exact });
    return (
      <Link
        to={to}
        onClick={onClick}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors ${
          active
            ? 'bg-[var(--color-primary)]/12 text-[var(--color-primary)]'
            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'
        }`}
      >
        {NAV_ICONS[label]}
        <span className="truncate">{label}</span>
      </Link>
    );
  };

  const sidebar = (
    <>
      <div className="flex items-center gap-2.5 px-3 py-4 border-b border-[var(--color-surface-2)]">
        <LogoIcon size={36} className="rounded-lg shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{displayName}</p>
          <p className="text-[11px] text-[var(--color-text-secondary)] truncate">{user.email}</p>
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {ADMIN_LINKS.map((link) => (
          <NavLink key={link.to} {...link} onClick={() => setMobileOpen(false)} />
        ))}
        {isDeveloper && DEV_ONLY_LINKS.map((link) => (
          <NavLink key={link.to} {...link} onClick={() => setMobileOpen(false)} />
        ))}
      </nav>

      <div className="p-2 border-t border-[var(--color-surface-2)] space-y-0.5">
        <Link
          to="/"
          className="flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]"
        >
          <Home size={18} />
          {t('admin_back_to_site') || 'Store'}
        </Link>
        <button
          type="button"
          onClick={() => logout()}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium text-[var(--color-danger,#dc2626)] hover:bg-[var(--color-danger-bg)]"
        >
          <LogOut size={18} />
          {t('account_signout') || 'Sign out'}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]">
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-52 shrink-0 border-e border-[var(--color-surface-2)] sticky top-0 h-screen">
          {sidebar}
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile header */}
          <header className="md:hidden sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--color-surface-2)] bg-[var(--color-background)]/95 backdrop-blur-md">
            <div className="flex items-center gap-2 min-w-0">
              <LogoIcon size={28} className="rounded-md shrink-0" />
              <span className="font-heading font-semibold text-sm truncate">Raafat Admin</span>
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-2)]"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </header>

          {/* Mobile drawer */}
          {mobileOpen && (
            <div className="md:hidden fixed inset-0 z-40 flex">
              <button type="button" className="flex-1 bg-black/40" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
              <aside className="w-64 max-w-[85vw] bg-[var(--color-background)] border-s border-[var(--color-surface-2)] flex flex-col h-full shadow-2xl">
                {sidebar}
              </aside>
            </div>
          )}

          <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-5 md:px-6 md:py-6 pb-[4.5rem] md:pb-6">
            <div className="mx-auto w-full max-w-5xl">
              <Outlet />
            </div>
          </main>

          {/* Mobile bottom nav */}
          <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 flex justify-around items-stretch border-t border-[var(--color-surface-2)] bg-[var(--color-background)]/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
            {[...ADMIN_LINKS, ...(isDeveloper ? DEV_ONLY_LINKS : [])].map((link) => {
              const active = isAdminLinkActive(location.pathname, link);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold min-w-0 ${
                    active ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'
                  }`}
                >
                  <span className="shrink-0">{NAV_ICONS[link.label]}</span>
                  <span className="truncate max-w-full px-1">{link.label.split(' ')[0]}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
