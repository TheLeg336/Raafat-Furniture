import type { TFunction } from '../types';

export interface BranchDisplay {
  name: string;
  address: string;
}

/** Showroom cards — single source for Visit Us + Contact (not duplicated in footer). */
export function getBranches(t: TFunction): BranchDisplay[] {
  return [
    { name: t('footer_cairo_branch_title') || 'Cairo Branch', address: t('footer_cairo_branch_address') || '' },
    { name: t('footer_minya_branch_title') || 'Minya Branch', address: t('footer_minya_branch_address') || '' },
    { name: t('footer_new_minya_branch_title') || 'New Minya Branch', address: t('footer_new_minya_branch_address') || '' },
  ];
}
