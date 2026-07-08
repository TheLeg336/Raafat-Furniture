import React from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GuidedScanner } from '../components/scan/GuidedScanner';
import { PageSpinner } from '../components/ui/Spinner';
import { LOGIN_PATH } from '../lib/paths';

/** Mobile-only handoff route — continue a desktop-started 3D scan on phone. */
const MobileScan: React.FC = () => {
  const { scanId } = useParams<{ scanId: string }>();
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return <PageSpinner />;
  if (!user || !isAdmin) return <Navigate to={LOGIN_PATH} replace />;
  if (!scanId) return <Navigate to="/" replace />;

  return (
    <GuidedScanner
      scanId={scanId}
      createdBy={user.email || user.uid}
      onComplete={() => { /* desktop listener picks up the finished scan */ }}
      onCancel={() => { navigate('/'); }}
    />
  );
};

export default MobileScan;
