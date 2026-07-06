import React from 'react';
import { useLocation } from 'react-router-dom';
import { Home, Store, User } from 'lucide-react';
import type { TFunction } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { adminPath, STAFF_PATH, LOGIN_PATH } from '../lib/paths';
import { MobilePillNav } from './ui/MobilePillNav';

interface MobileTabBarProps {
  t: TFunction;
}

const MobileTabBar: React.FC<MobileTabBarProps> = ({ t }) => {
  const location = useLocation();
  const { user, isAdmin, isWorker } = useAuth();

  const accountPath = user ? (isAdmin ? adminPath() : isWorker ? STAFF_PATH : '/account') : LOGIN_PATH;

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/' && !location.hash;
    if (href === '/shop') return location.pathname === '/shop' || location.pathname.startsWith('/product');
    if (href === accountPath) return location.pathname === accountPath || location.pathname === '/account';
    return false;
  };

  return (
    <MobilePillNav
      ariaLabel={t('mobile_nav') || 'Main navigation'}
      items={[
        { key: 'home', href: '/', icon: Home, label: t('nav_home') || 'Home', active: isActive('/') },
        { key: 'shop', href: '/shop', icon: Store, label: t('nav_shop') || 'Shop', active: isActive('/shop') },
        { key: 'account', href: accountPath, icon: User, label: t('aria_account') || 'Account', active: isActive(accountPath) },
      ]}
    />
  );
};

export default MobileTabBar;
