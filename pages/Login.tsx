import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, ArrowLeft } from 'lucide-react';
import { type TFunction } from '../types';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { PageSpinner } from '../components/ui/Spinner';

interface LoginProps { t: TFunction; }

const Login: React.FC<LoginProps> = ({ t }) => {
  const { user, isAdmin, loading, loginWithGoogle, loginWithEmail, signupWithEmail } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const toast = useToast();

  const [isSignUp, setIsSignUp] = useState(params.get('signup') === 'true' || sessionStorage.getItem('isSignUp') === 'true');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { sessionStorage.setItem('isSignUp', String(isSignUp)); }, [isSignUp]);
  useEffect(() => {
    if (!loading && user) navigate(isAdmin ? '/admin' : '/');
  }, [user, isAdmin, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (isSignUp && password.length < 6) { setError(t('password_too_short') || 'Password must be at least 6 characters.'); return; }
    setSubmitting(true);
    try {
      if (isSignUp) await signupWithEmail(email, password);
      else await loginWithEmail(email, password);
    } catch (err: any) {
      const msg = friendlyAuthError(err?.code) || err?.message || 'Authentication failed.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try { await loginWithGoogle(); }
    catch (err: any) { toast.error(friendlyAuthError(err?.code) || 'Google sign-in failed.'); }
  };

  if (loading || user) return <PageSpinner />;

  const fieldCls =
    'w-full ps-11 pe-4 py-3 bg-transparent text-[var(--color-text-primary)] border border-[var(--color-border-strong)] rounded-[var(--radius-md)] outline-none transition-[box-shadow,border-color] focus:border-transparent focus:shadow-[0_0_0_2px_var(--color-primary)] placeholder:text-[var(--color-text-secondary)]';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6 relative overflow-hidden bg-[var(--color-background)]">
      {/* Single calm brand wash — not decorative glass, just atmosphere */}
      <div className="absolute -top-1/4 -end-1/4 w-[60vmax] h-[60vmax] rounded-full pointer-events-none opacity-60"
        style={{ background: 'radial-gradient(circle, hsla(var(--color-primary-hsl-values),0.10) 0%, transparent 60%)' }} aria-hidden="true" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
        className="relative w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-2xl)] px-7 py-8 md:px-10 md:py-12"
      >
        <Link to="/" className="absolute top-5 start-5 p-2 rounded-full text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-2)] transition-colors" aria-label={t('product_return_home') || 'Home'}>
          <ArrowLeft size={20} />
        </Link>

        <div className="text-center mb-8">
          <div className="font-heading text-2xl tracking-wide text-[var(--color-secondary)] dark:text-[var(--color-primary)]">RAAFAT</div>
          <div className="h-0.5 w-10 bg-[var(--color-primary)] mx-auto mt-2 mb-6 rounded-full" />
          <h1 className="font-heading text-3xl font-bold text-balance">
            {isSignUp ? (t('login_create_account') || 'Create your account') : (t('login_welcome_back') || 'Welcome back')}
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-2">
            {isSignUp ? (t('login_signup_desc') || 'Save your wishlist and track orders.') : (t('login_signin_desc') || 'Sign in to continue.')}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-[var(--color-danger-bg)] border border-[var(--color-danger)] text-[var(--color-danger)] rounded-[var(--radius-md)] text-sm" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-5">
          <div className="relative">
            <Mail size={18} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none" />
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldCls} placeholder={t('login_email') || 'Email'} aria-label={t('login_email') || 'Email'} />
          </div>
          <div className="relative">
            <Lock size={18} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none" />
            <input type="password" required autoComplete={isSignUp ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} className={fieldCls} placeholder={t('login_password') || 'Password'} aria-label={t('login_password') || 'Password'} />
          </div>
          <Button type="submit" loading={submitting} fullWidth size="lg">
            {isSignUp ? (t('login_btn_create') || 'Create account') : (t('login_btn_signin') || 'Sign in')}
          </Button>
        </form>

        <div className="flex items-center gap-4 mb-5">
          <div className="flex-1 h-px bg-[var(--color-border)]" />
          <span className="text-[var(--color-text-secondary)] text-xs">{t('login_or_continue') || 'or'}</span>
          <div className="flex-1 h-px bg-[var(--color-border)]" />
        </div>

        <Button variant="secondary" fullWidth onClick={handleGoogle} type="button"
          iconLeft={<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="w-5 h-5" />}>
          {t('login_google') || 'Continue with Google'}
        </Button>

        <p className="text-center text-[var(--color-text-secondary)] text-sm mt-6">
          <button onClick={() => setIsSignUp((v) => !v)} className="text-[var(--color-primary)] hover:underline font-medium">
            {isSignUp ? (t('login_already_have') || 'Already have an account? Sign in') : (t('login_dont_have') || "Don't have an account? Create one")}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

function friendlyAuthError(code?: string): string | null {
  switch (code) {
    case 'auth/invalid-email': return 'That email address looks invalid.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Email or password is incorrect.';
    case 'auth/email-already-in-use': return 'An account with this email already exists.';
    case 'auth/weak-password': return 'Please choose a stronger password (6+ characters).';
    case 'auth/too-many-requests': return 'Too many attempts. Please try again later.';
    case 'auth/popup-closed-by-user': return 'Sign-in was cancelled.';
    default: return null;
  }
}

export default Login;
