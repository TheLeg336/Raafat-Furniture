import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLaunch } from '../contexts/LaunchContext';
import { LOGIN_PATH } from '../lib/paths';

/** True when the storefront should be fully hidden behind coming-soon. Team bypasses. */
export function useComingSoonGate() {
  const { status, loading: launchLoading } = useLaunch();
  const { isAdmin, isWorker, loading: authLoading } = useAuth();
  const location = useLocation();
  const onLoginPath = location.pathname === LOGIN_PATH;
  const loading = launchLoading || authLoading;
  const blocked = !loading && status.comingSoon && !isAdmin && !isWorker && !onLoginPath;
  return { blocked, status, loading };
}
