import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Sparkles } from 'lucide-react';
import type { TFunction } from '../types';
import { LOGIN_PATH } from '../lib/paths';
import { useAuth } from '../contexts/AuthContext';
import { useLaunch } from '../contexts/LaunchContext';
import LogoIcon from './LogoIcon';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface Props {
  t: TFunction;
}

/** Full-site overlay when coming-soon mode is on. Signed-in admins bypass; /login stays reachable. */
export const ComingSoonOverlay: React.FC<Props> = ({ t }) => {
  const { status, loading } = useLaunch();
  const { isAdmin, loading: authLoading } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const onLoginPath = location.pathname === LOGIN_PATH;
  const blocked = !loading && !authLoading && status.comingSoon && !isAdmin && !onLoginPath;

  if (!blocked) return null;

  const scheduledLabel = status.scheduledAt
    ? new Date(status.scheduledAt).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })
    : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/launch/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone: phone || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save');
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="coming-soon-title"
    >
      <div className="absolute inset-0 bg-[var(--color-background)]/80 backdrop-blur-md" aria-hidden />

      <div className="relative w-full max-w-md glass-card rounded-[var(--radius-lg)] p-6 sm:p-8 shadow-2xl border border-[var(--color-surface-2)] text-center animate-fade-in">
        <div className="flex justify-center mb-4">
          <LogoIcon size={48} className="rounded-xl" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-semibold uppercase tracking-wider mb-4">
          <Sparkles size={14} />
          {t('coming_soon_title') || 'Coming Soon'}
        </div>

        <h2 id="coming-soon-title" className="font-heading text-2xl sm:text-3xl font-bold mb-3">
          {t('coming_soon_title') || 'Coming Soon'}
        </h2>

        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
          {status.message || t('coming_soon_body') || 'We are putting the finishing touches on something special.'}
        </p>

        {scheduledLabel && (
          <p className="text-xs text-[var(--color-text-secondary)] mb-5">
            <span className="font-semibold text-[var(--color-text-primary)]">
              {t('coming_soon_scheduled') || 'Planned opening'}:
            </span>{' '}
            {scheduledLabel}
          </p>
        )}

        {!open && !done && (
          <Button type="button" className="w-full" iconLeft={<Bell size={16} />} onClick={() => setOpen(true)}>
            {t('coming_soon_notify') || 'Notify me'}
          </Button>
        )}

        {done && (
          <p className="text-sm text-[var(--color-primary)] font-medium py-2">
            {t('coming_soon_success') || 'You are on the list. We will email you when we launch.'}
          </p>
        )}

        {open && !done && (
          <form onSubmit={submit} className="text-start space-y-3 mt-2">
            <Input
              label={t('coming_soon_name') || 'Your name'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
            <Input
              label={t('coming_soon_email') || 'Email address'}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label={t('coming_soon_phone') || 'Phone (optional)'}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
            {error && <p className="text-xs text-[var(--color-danger,#dc2626)]">{error}</p>}
            <Button type="submit" className="w-full" loading={busy}>
              {t('coming_soon_notify') || 'Notify me'}
            </Button>
          </form>
        )}

        <p className="mt-6 text-xs text-[var(--color-text-secondary)]">
          <Link to={LOGIN_PATH} className="underline hover:text-[var(--color-primary)]">
            {t('coming_soon_sign_in') || 'Team member? Sign in'}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ComingSoonOverlay;
