import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, Shield, BarChart3, Megaphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { getConsent, hasDecided, acceptAll, rejectAll, setConsent } from '../lib/consent';
import type { TFunction } from '../types';

export const OPEN_COOKIE_SETTINGS = 'rf-open-cookie-settings';
/** Footer (or anywhere) calls this to reopen preferences. */
export const openCookieSettings = () => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS));

interface Props { t?: TFunction; }

export const CookieConsent: React.FC<Props> = ({ t }) => {
  const tr = (k: string, fb: string) => (t ? t(k) : fb);
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    setShowBanner(!hasDecided());
    const c = getConsent();
    setAnalytics(c.analytics);
    setMarketing(c.marketing);
    const open = () => {
      const cur = getConsent();
      setAnalytics(cur.analytics);
      setMarketing(cur.marketing);
      setShowSettings(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS, open);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS, open);
  }, []);

  const onAcceptAll = () => { acceptAll(); setShowBanner(false); };
  const onRejectAll = () => { rejectAll(); setShowBanner(false); };
  const onSavePrefs = () => { setConsent({ analytics, marketing }); setShowBanner(false); setShowSettings(false); };

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 inset-x-0 sm:bottom-4 sm:inset-x-4 md:left-auto md:right-4 md:max-w-md"
            style={{ zIndex: 'var(--z-toast)' as any }}
            role="dialog"
            aria-label={tr('cookie_title', 'Cookie preferences')}
          >
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-2xl)] sm:rounded-[var(--radius-lg)] p-6">
              <div className="flex items-center gap-2 mb-2 text-[var(--color-primary)]">
                <Cookie size={20} />
                <h2 className="font-heading text-lg font-bold text-[var(--color-text-primary)]">{tr('cookie_title', 'We value your privacy')}</h2>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {tr('cookie_body', 'We use essential cookies to run the store, and optional analytics cookies to improve it — only with your consent.')}{' '}
                <Link to="/legal/cookies" className="text-[var(--color-primary)] hover:underline">{tr('cookie_learn', 'Learn more')}</Link>.
              </p>
              <div className="flex flex-wrap gap-2 mt-5">
                <Button size="sm" onClick={onAcceptAll}>{tr('cookie_accept', 'Accept all')}</Button>
                <Button size="sm" variant="secondary" onClick={onRejectAll}>{tr('cookie_reject', 'Reject non-essential')}</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowSettings(true)}>{tr('cookie_customize', 'Customize')}</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal open={showSettings} onClose={() => setShowSettings(false)} title={tr('cookie_settings', 'Cookie settings')} size="md">
        <div className="flex flex-col gap-4">
          <ConsentRow
            icon={<Shield size={18} />}
            title={tr('cookie_necessary', 'Strictly necessary')}
            desc={tr('cookie_necessary_desc', 'Authentication, cart, theme & language, security. Always on.')}
            checked disabled
          />
          <ConsentRow
            icon={<BarChart3 size={18} />}
            title={tr('cookie_analytics', 'Analytics')}
            desc={tr('cookie_analytics_desc', 'Helps us understand usage so we can improve the store. IP-anonymised.')}
            checked={analytics}
            onChange={setAnalytics}
          />
          <ConsentRow
            icon={<Megaphone size={18} />}
            title={tr('cookie_marketing', 'Marketing')}
            desc={tr('cookie_marketing_desc', 'Currently unused. Reserved for future advertising — off by default.')}
            checked={marketing}
            onChange={setMarketing}
          />
          <div className="flex flex-wrap gap-2 justify-end pt-2">
            <Button variant="ghost" size="sm" onClick={onRejectAll}>{tr('cookie_reject', 'Reject non-essential')}</Button>
            <Button size="sm" onClick={onSavePrefs}>{tr('cookie_save', 'Save preferences')}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

const ConsentRow: React.FC<{
  icon: React.ReactNode; title: string; desc: string; checked: boolean; disabled?: boolean; onChange?: (v: boolean) => void;
}> = ({ icon, title, desc, checked, disabled, onChange }) => (
  <div className="flex items-start gap-3 p-4 rounded-[var(--radius-md)] border border-[var(--color-border)]">
    <span className="text-[var(--color-primary)] mt-0.5">{icon}</span>
    <div className="flex-1">
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">{desc}</p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={title}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`shrink-0 w-12 h-7 rounded-full p-1 transition-colors ${checked ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border-strong)]'} ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  </div>
);

export default CookieConsent;
