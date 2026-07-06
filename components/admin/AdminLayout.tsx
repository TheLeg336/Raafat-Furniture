import React, { useState, useEffect } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Home, LogOut, Menu, LayoutGrid, ClipboardList, Users, Code2 } from 'lucide-react';
import type { TFunction } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import LogoIcon from '../LogoIcon';
import { PageSpinner } from '../ui/Spinner';
import { MobilePillNav } from '../ui/MobilePillNav';
import { MobileBottomSheet } from '../ui/MobileBottomSheet';
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

/** Shared shell for every /admin/* route — sidebar on desktop, pill bar + drawer on mobile. */
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

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

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
  const drawerLinks = [...ADMIN_LINKS, ...(isDeveloper ? DEV_ONLY_LINKS : [])];

  const NavLink: React.FC<{ to: string; label: string; exact?: boolean; onClick?: () => void }> = ({
    to, label, exact, onClick,
  }) => {
    const active = isAdminLinkActive(location.pathname, { to, label, exact });
    return (
      <Link
        to={to}
        onClick={onClick}
        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-colors ${
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
        {drawerLinks.map((link) => (
          <NavLink key={link.to} {...link} onClick={() => setMobileOpen(false)} />
        ))}
      </nav>

      <div className="p-2 border-t border-[var(--color-surface-2)] space-y-0.5">
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]"
        >
          <Home size={18} />
          {t('admin_back_to_site') || 'Store'}
        </Link>
        <button
          type="button"
          onClick={() => logout()}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium text-[var(--color-danger,#dc2626)] hover:bg-[var(--color-danger-bg)]"
        >
          <LogOut size={18} />
          {t('account_signout') || 'Sign out'}
        </button>
      </div>
    </>
  );

  const catalogActive = isAdminLinkActive(location.pathname, ADMIN_LINKS[0]);
  const ordersActive = isAdminLinkActive(location.pathname, ADMIN_LINKS[1]);

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]">
      <div className="flex min-h-screen">
        <aside className="hidden md:flex flex-col w-52 shrink-0 border-e border-[var(--color-surface-2)] sticky top-0 h-screen">
          {sidebar}
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="md:hidden sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--color-surface-2)] bg-[var(--color-background)]/95 backdrop-blur-md">
            <div className="flex items-center gap-2 min-w-0">
              <LogoIcon size={28} className="rounded-md shrink-0" />
              <span className="font-heading font-semibold text-sm truncate">Raafat Admin</span>
            </div>
          </header>

          <MobileBottomSheet
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ariaLabel={t('mobile_nav') || 'Admin menu'}
          >
            <div className="flex flex-col min-h-[12rem] px-2 pb-2">
              {sidebar}
            </div>
          </MobileBottomSheet>

          <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-5 md:px-6 md:py-6 max-md:pb-[var(--mobile-tab-offset)]">
            <div className="mx-auto w-full max-w-5xl">
              <Outlet />
            </div>
          </main>

          <MobilePillNav
            ariaLabel={t('mobile_nav') || 'Admin navigation'}
            items={[
              { key: 'catalog', href: ADMIN_LINKS[0].to, icon: LayoutGrid, label: 'Catalog', active: catalogActive },
              { key: 'orders', href: ADMIN_LINKS[1].to, icon: ClipboardList, label: 'Orders', active: ordersActive },
              { key: 'menu', icon: Menu, label: 'Menu', active: mobileOpen, onClick: () => setMobileOpen((o) => !o) },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
