import { adminPath } from '../../lib/paths';

export interface AdminLink {
  to: string;
  label: string;
  exact?: boolean;
}

/** Admin + developer routes — shared by AdminLayout sidebar and mobile nav. */
export const ADMIN_LINKS: AdminLink[] = [
  { to: adminPath(), label: 'Catalog', exact: true },
  { to: adminPath('orders'), label: 'Orders' },
];

/** Developer-only: team management and launch / dev tools. */
export const DEV_ONLY_LINKS: AdminLink[] = [
  { to: adminPath('team'), label: 'Team' },
  { to: adminPath('dev'), label: 'Dev' },
];

export function isAdminLinkActive(pathname: string, link: AdminLink): boolean {
  return link.exact ? pathname === link.to : pathname.startsWith(link.to);
}
