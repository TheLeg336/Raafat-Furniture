import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User as UserIcon, ArrowLeft } from 'lucide-react';

import { type TFunction } from '../types';

interface LoginProps {
  t: TFunction;
}

const Login: React.FC<LoginProps> = ({ t }) => {
  const { user, isAdmin, loading, loginWithGoogle, loginWithEmail, signupWithEmail } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(() => {
    return sessionStorage.getItem('isSignUp') === 'true';
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    sessionStorage.setItem('isSignUp', isSignUp.toString());
  }, [isSignUp]);

  useEffect(() => {
    if (!loading && user) {
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  }, [user, isAdmin, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      if (isSignUp) {
        await signupWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred with Google Sign-In.');
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)] p-6 relative overflow-hidden">
      {/* Liquid Glass Background Blobs */}
      <motion.div 
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--color-primary)] opacity-20 rounded-full blur-[100px] z-0"
      />
      <motion.div 
        animate={{
          x: [0, -80, 0],
          y: [0, 120, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-[var(--color-primary)] opacity-15 rounded-full blur-[100px] z-0"
      />
      <motion.div 
        animate={{
          x: [0, 50, 0],
          y: [0, -100, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-[var(--color-secondary)] opacity-10 rounded-full blur-[80px] z-0"
      />

      <div className="bg-white/5 backdrop-blur-2xl border border-white/10 px-10 py-12 rounded-3xl shadow-2xl max-w-md w-full text-center relative z-10">
        <button 
          onClick={() => navigate('/')}
          className="absolute top-6 left-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
          title="Go Back"
        >
          <span className="block"><ArrowLeft size={20} /></span>
        </button>

        <div className="relative z-10">
          <div className="w-16 h-16 bg-[var(--color-primary)]/20 text-[var(--color-primary)] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[var(--color-primary)]/20">
            <UserIcon size={32} />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-[var(--color-text-primary)]">
            {isSignUp ? t('login_create_account') : t('login_welcome_back')}
          </h1>
          <p className="text-[var(--color-text-secondary)] mb-8">
            {isSignUp ? t('login_signup_desc') : t('login_signin_desc')}
          </p>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-[var(--color-text-secondary)]" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full ps-10 pe-4 py-3 bg-transparent border border-[var(--color-secondary)]/30 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none text-[var(--color-text-primary)] transition-all"
                placeholder={t('login_email')}
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-[var(--color-text-secondary)]" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full ps-10 pe-4 py-3 bg-transparent border border-[var(--color-secondary)]/30 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none text-[var(--color-text-primary)] transition-all"
                placeholder={t('login_password')}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-[var(--color-primary)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                isSignUp ? t('login_btn_create') : t('login_btn_signin')
              )}
            </button>
          </form>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 border-t border-[var(--color-secondary)]/30"></div>
            <span className="text-[var(--color-text-secondary)] text-sm font-medium">{t('login_or_continue')}</span>
            <div className="flex-1 border-t border-[var(--color-secondary)]/30"></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full py-3 px-4 bg-transparent border border-[var(--color-secondary)]/30 rounded-xl text-[var(--color-text-primary)] font-medium hover:bg-[var(--color-text-primary)]/5 transition-colors flex items-center justify-center gap-3 mb-6"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            {t('login_google')}
          </button>

          <p className="text-[var(--color-text-secondary)] text-sm">
            {isSignUp ? (
              <button onClick={() => setIsSignUp(false)} className="text-[var(--color-primary)] hover:underline font-medium">
                {t('login_already_have')}
              </button>
            ) : (
              <button onClick={() => setIsSignUp(true)} className="text-[var(--color-primary)] hover:underline font-medium">
                {t('login_dont_have')}
              </button>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
