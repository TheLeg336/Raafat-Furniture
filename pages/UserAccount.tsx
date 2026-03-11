import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { LogOut, ArrowLeft, User } from 'lucide-react';

import { type TFunction } from '../types';

interface UserAccountProps {
  t: TFunction;
}

const UserAccount: React.FC<UserAccountProps> = ({ t }) => {
  const { user, firstName, lastName, isAdmin, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[var(--color-background)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const fullName = firstName && lastName ? `${firstName} ${lastName}` : null;

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[var(--color-background)] p-6">
      <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-3xl shadow-2xl max-w-md w-full text-center relative">
        <button 
          onClick={() => navigate('/')}
          className="absolute top-6 left-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
          title="Go Back"
        >
          <span className="block"><ArrowLeft size={20} /></span>
        </button>

        <div className="w-20 h-20 bg-[var(--color-primary)]/20 text-[var(--color-primary)] rounded-full flex items-center justify-center mx-auto mb-6 mt-4">
          {user.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
          ) : (
            <User size={40} />
          )}
        </div>
        
        <h1 className="text-2xl font-bold mb-1 text-[var(--color-text-primary)]">
          {fullName || t('account_title')}
        </h1>
        <p className="text-[var(--color-text-secondary)] mb-8">{user.email}</p>
        
        <button 
          onClick={async () => {
            await logout();
            navigate('/');
          }}
          className="w-full py-3 px-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          <LogOut size={20} />
          {t('account_signout')}
        </button>
      </div>
    </div>
  );
};

export default UserAccount;
