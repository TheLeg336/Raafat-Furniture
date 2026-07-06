import React from 'react';
import type { TFunction } from '../types';
import MobileTabBar from './MobileTabBar';

interface StoreChromeProps {
  t: TFunction;
}

/** Mobile-only bottom navigation + layout offsets. Desktop layout is unchanged. */
const StoreChrome: React.FC<StoreChromeProps> = ({ t }) => (
  <MobileTabBar t={t} />
);

export default StoreChrome;
