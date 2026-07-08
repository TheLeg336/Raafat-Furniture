import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { User as UserIcon, ArrowLeft } from 'lucide-react';

import { type TFunction } from '../types';
import { adminPath, STAFF_PATH, safeReturnPath } from '../lib/paths';

interface LoginProps {
  t: TFunction;
}

/** Google-only auth — reduces spam accounts vs open email/password signup. */
const Login: React.FC<LoginProps> = ({ t }) => {
  const { user, isAdmin, isWorker, loading, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = safeReturnPath(searchParams.get('return'), '/');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      if (isAdmin) navigate(adminPath());
      else if (isWorker) navigate(STAFF_PATH);
      else navigate(returnTo);
    }
  }, [user, isAdmin, isWorker, loading, navigate, returnTo]);

  const handleGoogleLogin = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      setError(err.message || (t('login_google_error') || 'Google sign-in failed. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)] p-4 md:p-6 relative overflow-hidden">
      <motion.div
        animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute top-[-5%] left-[-5%] w-[80%] md:w-[40%] h-[50%] md:h-[40%] bg-[var(--color-primary)] opacity-30 md:opacity-20 rounded-full blur-[60px] md:blur-[100px] z-0"
      />
      <motion.div
        animate={{ x: [0, -40, 0], y: [0, 60, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        className="absolute bottom-[-5%] right-[-5%] w-[90%] md:w-[45%] h-[60%] md:h-[45%] bg-[var(--color-primary)] opacity-25 md:opacity-15 rounded-full blur-[60px] md:blur-[100px] z-0"
      />
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -50, 0], scale: [1, 1.3, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        className="absolute top-[20%] right-[5%] w-[70%] md:w-[30%] h-[40%] md:h-[30%] bg-[var(--color-secondary)] opacity-20 md:opacity-10 rounded-full blur-[50px] md:blur-[80px] z-0"
      />

      <div className="bg-white/5 backdrop-blur-2xl ring-1 ring-white/10 px-6 md:px-10 py-8 md:py-12 rounded-3xl shadow-2xl max-w-md w-full text-center relative z-10">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 start-4 md:top-6 md:start-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
          title={t('nav_go_back') || 'Go Back'}
          aria-label={t('nav_go_back') || 'Go Back'}
        >
          <span className="block"><ArrowLeft size={20} /></span>
        </button>

        <div className="relative z-10">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-[var(--color-primary)]/20 text-[var(--color-primary)] rounded-full flex items-center justify-center mx-auto mb-3 md:mb-6 shadow-lg shadow-[var(--color-primary)]/20">
            <UserIcon size={24} className="md:w-8 md:h-8" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2 text-[var(--color-text-primary)]">
            {t('login_welcome_back') || 'Welcome back'}
          </h1>
          <p className="text-[var(--color-text-secondary)] text-sm md:text-base mb-6 md:mb-8">
            {t('login_google_only_desc') || 'Sign in with Google to continue. This keeps your account secure and reduces spam.'}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 text-red-500 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            type="button"
            disabled={isSubmitting}
            className="w-full py-3 md:py-3.5 px-4 bg-white/5 backdrop-blur-sm rounded-xl text-[var(--color-text-primary)] font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-3 disabled:opacity-60"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
            ) : (
              <>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="w-5 h-5" />
                {t('login_google') || 'Continue with Google'}
              </>
            )}
          </button>

          <p className="mt-6 text-xs text-[var(--color-text-secondary)] leading-relaxed">
            {t('login_terms_note') || 'By continuing you agree to our Terms of Service and Privacy Policy.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
