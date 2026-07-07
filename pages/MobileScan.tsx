import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GuidedScanner } from '../components/scan/GuidedScanner';
import { PageSpinner } from '../components/ui/Spinner';

/** Mobile-only handoff route — continue a desktop-started 3D scan on phone. */
const MobileScan: React.FC = () => {
  const { scanId } = useParams<{ scanId: string }>();
  const { user, isAdmin, loading } = useAuth();

  if (loading) return <PageSpinner />;
  if (!user || !isAdmin) return <Navigate to="/login" replace />;
  if (!scanId) return <Navigate to="/" replace />;

  return (
    <GuidedScanner
      scanId={scanId}
      createdBy={user.email || user.uid}
      onComplete={() => { /* desktop listener picks up the finished scan */ }}
      onCancel={() => { window.location.href = '/'; }}
    />
  );
};

export default MobileScan;
