export interface AdminLink {
  to: string;
  label: string;
  exact?: boolean;
}

/** Cross-section admin routes — shared by AdminLayout sidebar and mobile nav. */
export const ADMIN_LINKS: AdminLink[] = [
  { to: '/admin', label: 'Catalog', exact: true },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/scans', label: 'Scans & 3D' },
  { to: '/admin/team', label: 'Team' },
];

export function isAdminLinkActive(pathname: string, link: AdminLink): boolean {
  return link.exact ? pathname === link.to : pathname.startsWith(link.to);
}
