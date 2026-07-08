import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLaunch } from '../contexts/LaunchContext';
import { LOGIN_PATH } from '../lib/paths';

/** Paths that must stay reachable during coming-soon (auth + money path). */
const COMING_SOON_ALLOWLIST = [
  LOGIN_PATH,
  '/checkout',
  '/order/confirmation',
  '/track',
];

function isAllowlisted(pathname: string) {
  return COMING_SOON_ALLOWLIST.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** True when the storefront should be fully hidden behind coming-soon. Team bypasses. */
export function useComingSoonGate() {
  const { status, loading: launchLoading } = useLaunch();
  const { isAdmin, isWorker, loading: authLoading } = useAuth();
  const location = useLocation();
  const loading = launchLoading || authLoading;
  const blocked =
    !loading &&
    status.comingSoon &&
    !isAdmin &&
    !isWorker &&
    !isAllowlisted(location.pathname);
  return { blocked, status, loading, allowlisted: isAllowlisted(location.pathname) };
}
