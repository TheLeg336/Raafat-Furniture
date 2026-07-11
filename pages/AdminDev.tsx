import React, { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Rocket, Power, RefreshCw, Users, AlertTriangle, CheckCircle2, Bug, CreditCard } from 'lucide-react';
import type { TFunction } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useLaunch } from '../contexts/LaunchContext';
import { apiFetch, clearPaymentsConfigCache } from '../lib/api';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  subscribeClientErrors,
  resolveClientError,
  type ClientErrorReport,
} from '../lib/clientErrors';
import { AdminPageHeader } from '../components/admin/AdminPageHeader';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageSpinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { adminPath } from '../lib/paths';

interface Props {
  t: TFunction;
}

interface WaitlistEntry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  notifiedAt?: string;
}

type DevPanel = 'launch' | 'errors';

type MethodFlags = { stripe: boolean; paymob: boolean; instapay: boolean; bank_transfer: boolean };

const AdminDev: React.FC<Props> = () => {
  const { user, isDeveloper } = useAuth();
  const { status, refresh } = useLaunch();
  const toast = useToast();

  const [panel, setPanel] = useState<DevPanel>('launch');
  const [comingSoon, setComingSoon] = useState(false);
  const [message, setMessage] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [launching, setLaunching] = useState(false);

  const [errors, setErrors] = useState<ClientErrorReport[]>([]);
  const [errorsLoading, setErrorsLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);

  const [methods, setMethods] = useState<MethodFlags>({
    stripe: true, paymob: true, instapay: true, bank_transfer: true,
  });
  const [envReady, setEnvReady] = useState<{ stripe: boolean; paymob: boolean }>({ stripe: false, paymob: false });
  const [serverConfigured, setServerConfigured] = useState(true);
  const [savingMethods, setSavingMethods] = useState(false);

  useEffect(() => {
    setComingSoon(status.comingSoon);
    setMessage(status.message || '');
    if (status.scheduledAt) {
      const d = new Date(status.scheduledAt);
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setScheduledAt(local);
    } else {
      setScheduledAt('');
    }
  }, [status]);

  const loadWaitlist = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await apiFetch<{ entries: WaitlistEntry[] }>('/api/launch/waitlist', undefined, 'GET');
      setWaitlist(data.entries || []);
    } catch {
      setWaitlist([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadPaymentMethods = useCallback(async () => {
    try {
      // Firestore is the source of truth for saved toggles; /api/config only
      // supplies env readiness. (The server returns default methods when it has
      // no service account — never let that overwrite what the dev saved.)
      let haveSaved = false;
      if (db) {
        const snap = await getDoc(doc(db, 'settings', 'payments'));
        if (snap.exists()) {
          const m = snap.data()?.methods;
          if (m && typeof m === 'object') {
            haveSaved = true;
            setMethods({
              stripe: m.stripe !== false,
              paymob: m.paymob !== false,
              instapay: m.instapay !== false,
              bank_transfer: m.bank_transfer !== false,
            });
          }
        }
      }
      const raw = await fetch('/api/config').then((r) => r.json()).catch(() => null);
      if (raw?.env) setEnvReady({ stripe: !!raw.env.stripe, paymob: !!raw.env.paymob });
      else if (raw) setEnvReady({ stripe: !!raw.stripe, paymob: !!raw.paymob });
      if (raw) setServerConfigured(raw.ordersConfigured !== false);
      if (!haveSaved && raw?.methods) {
        setMethods({
          stripe: raw.methods.stripe !== false,
          paymob: raw.methods.paymob !== false,
          instapay: raw.methods.instapay !== false,
          bank_transfer: raw.methods.bank_transfer !== false,
        });
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (isDeveloper) {
      loadWaitlist();
      loadPaymentMethods();
    }
  }, [isDeveloper, loadWaitlist, loadPaymentMethods]);

  useEffect(() => {
    if (!isDeveloper) return;
    setErrorsLoading(true);
    const unsub = subscribeClientErrors((rows) => {
      setErrors(rows);
      setErrorsLoading(false);
    });
    return () => unsub();
  }, [isDeveloper]);

  if (!isDeveloper) return <Navigate to={adminPath()} replace />;

  const unresolved = errors.filter((e) => !e.resolved);
  const visibleErrors = showResolved ? errors : unresolved;

  const saveSettings = async () => {
    setSaving(true);
    const payload = {
      comingSoon,
      message: message.trim(),
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      updatedAt: new Date().toISOString(),
    };
    try {
      try {
        await apiFetch('/api/launch/settings', {
          comingSoon: payload.comingSoon,
          message: payload.message,
          scheduledAt: payload.scheduledAt,
        }, 'POST');
      } catch (apiErr) {
        if (!db) throw apiErr;
        await setDoc(doc(db, 'settings', 'launch'), payload, { merge: true });
      }
      await refresh();
      toast.success(comingSoon ? 'Coming soon mode enabled' : 'Coming soon mode disabled');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const goLive = async () => {
    if (!confirm('Launch the site and email everyone on the waitlist?')) return;
    setLaunching(true);
    try {
      const result = await apiFetch<{ sent: number; failed: number }>('/api/launch/go-live');
      await refresh();
      await loadWaitlist();
      toast.success(`Site is live. ${result.sent} emails sent${result.failed ? `, ${result.failed} failed` : ''}.`);
      setComingSoon(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLaunching(false);
    }
  };

  const savePaymentMethods = async () => {
    if (!db) {
      toast.error('Database not configured');
      return;
    }
    setSavingMethods(true);
    try {
      await setDoc(doc(db, 'settings', 'payments'), { methods, updatedAt: new Date().toISOString() }, { merge: true });
      clearPaymentsConfigCache();
      // Bust any other open tabs' session cache by writing a bump key
      try { sessionStorage.setItem('rf_payments_config_bump', String(Date.now())); } catch { /* ignore */ }
      toast.success('Checkout payment options updated — open checkout (or refresh) to see the change');
    } catch (e) {
      toast.error((e as Error).message || 'Could not save');
    } finally {
      setSavingMethods(false);
    }
  };

  const toggleMethod = (key: keyof MethodFlags) => {
    setMethods((m) => ({ ...m, [key]: !m[key] }));
  };

  const markResolved = async (id: string) => {
    setResolvingId(id);
    try {
      await resolveClientError(id, user?.email || 'developer');
      toast.success('Marked completed');
    } catch (e) {
      toast.error((e as Error).message || 'Could not resolve');
    } finally {
      setResolvingId(null);
    }
  };

  const pending = waitlist.filter((w) => !w.notifiedAt).length;

  return (
    <>
      <AdminPageHeader
        title="Dev"
        description="Launch controls, waitlist, and silent client error reports."
      />

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={() => setPanel('launch')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-pill)] text-sm font-semibold border transition-colors ${
            panel === 'launch'
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
              : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'
          }`}
        >
          <Rocket size={16} /> Launch
        </button>
        <button
          type="button"
          onClick={() => setPanel('errors')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-pill)] text-sm font-semibold border transition-colors relative ${
            panel === 'errors'
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
              : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'
          }`}
        >
          <Bug size={16} /> Errors
          {unresolved.length > 0 && (
            <span className="absolute -top-1.5 -end-1.5 min-w-[1.15rem] h-[1.15rem] px-1 rounded-full bg-[var(--color-danger)] text-white text-[10px] font-bold flex items-center justify-center">
              {unresolved.length > 99 ? '99+' : unresolved.length}
            </span>
          )}
        </button>
      </div>

      {panel === 'errors' ? (
        <div className="space-y-4">
          <Card className="p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-[var(--color-primary)]" />
                <h2 className="font-semibold text-sm">Client error inbox</h2>
                {unresolved.length > 0 && <Badge tone="danger">{unresolved.length} open</Badge>}
              </div>
              <label className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] cursor-pointer">
                <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
                Show completed
              </label>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Silent reports from the storefront (no customer toast). Includes error message, where they were,
              and where they were trying to go when known. No form values, payments, or camera frames.
              Deploy latest <code className="text-[var(--color-primary)]">firestore.rules</code> so writes are accepted.
            </p>
          </Card>

          {errorsLoading ? (
            <PageSpinner />
          ) : visibleErrors.length === 0 ? (
            <Card className="p-8 text-center text-sm text-[var(--color-text-secondary)]">
              {showResolved ? 'No error reports yet.' : 'No unresolved errors. Nice.'}
            </Card>
          ) : (
            <div className="space-y-3">
              {visibleErrors.map((row) => (
                <Card key={row.id} className={`p-4 space-y-2 ${row.resolved ? 'opacity-70' : ''}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm break-words">{row.message}</p>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                        {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
                        {' · '}
                        <span className="font-mono">{row.source}</span>
                        {row.name ? ` · ${row.name}` : ''}
                        {row.signedIn ? ' · signed in' : ' · guest'}
                        {row.roleHint && row.roleHint !== 'unknown' ? ` · ${row.roleHint}` : ''}
                      </p>
                    </div>
                    {row.resolved ? (
                      <Badge tone="success">Completed</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={resolvingId === row.id}
                        iconLeft={<CheckCircle2 size={14} />}
                        onClick={() => markResolved(row.id)}
                      >
                        Mark completed
                      </Button>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-[var(--radius-sm)] bg-[var(--color-surface-2)]">
                      <p className="font-semibold mb-0.5">Where they were</p>
                      <p className="font-mono break-all text-[var(--color-text-secondary)]">{row.path || '—'}</p>
                    </div>
                    <div className="p-2 rounded-[var(--radius-sm)] bg-[var(--color-surface-2)]">
                      <p className="font-semibold mb-0.5">Trying to go</p>
                      <p className="font-mono break-all text-[var(--color-text-secondary)]">{row.intendedPath || '—'}</p>
                    </div>
                  </div>
                  {row.stack && (
                    <pre className="text-[10px] leading-snug overflow-x-auto max-h-28 p-2 rounded-[var(--radius-sm)] bg-black/80 text-white/80">{row.stack}</pre>
                  )}
                  {row.userAgent && (
                    <p className="text-[10px] text-[var(--color-text-secondary)] truncate" title={row.userAgent}>{row.userAgent}</p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold text-sm">Coming soon mode</h2>
                <Badge tone={comingSoon ? 'gold' : 'success'}>{comingSoon ? 'Active' : 'Off'}</Badge>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={comingSoon}
                  onChange={(e) => setComingSoon(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--color-surface-2)]"
                />
                <span className="text-sm">Show coming soon overlay to visitors (admins can still sign in)</span>
              </label>

              <Input
                label="Planned opening (optional)"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />

              <Textarea
                label="Overlay message (optional)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="We are putting the finishing touches on something special."
              />

              <div className="flex flex-wrap gap-2 pt-1">
                <Button type="button" loading={saving} iconLeft={<Power size={16} />} onClick={saveSettings}>
                  Save settings
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  iconLeft={<RefreshCw size={16} />}
                  onClick={() => { refresh(); loadWaitlist(); }}
                >
                  Refresh
                </Button>
              </div>
            </Card>

            <Card className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-[var(--color-primary)]" />
                <h2 className="font-semibold text-sm">Waitlist</h2>
                <Badge>{waitlist.length}</Badge>
                {pending > 0 && <Badge tone="gold">{pending} pending</Badge>}
              </div>

              <p className="text-sm text-[var(--color-text-secondary)]">
                Visitors who tap Notify me while coming soon is on are stored here. Launch sends each person a branded email with an Explore button and a plain link fallback.
              </p>

              <Button
                type="button"
                className="w-full"
                loading={launching}
                iconLeft={<Rocket size={16} />}
                onClick={goLive}
              >
                Launch &amp; notify waitlist
              </Button>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Opens the site to everyone and emails anyone not yet notified. You can enable coming soon again later without re-emailing people who were already notified.
              </p>
            </Card>
          </div>

          <Card className="p-5 mt-6 space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-[var(--color-primary)]" />
              <h2 className="font-semibold text-sm">Checkout payment options</h2>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Turn methods on or off for customers. Card rails still need their API keys in Vercel env —
              disabling here only hides them at checkout. InstaPay address and bank details are edited under Team.
            </p>
            {!serverConfigured && (
              <p className="text-xs text-[var(--color-danger)] leading-relaxed border border-[var(--color-danger)]/40 rounded-[var(--radius-md)] p-3">
                The server cannot read these settings: FIREBASE_SERVICE_ACCOUNT is missing in the Vercel
                environment, so checkout ignores the toggles below (and ordering is disabled). Add the env
                var in Vercel → Settings → Environment Variables, then redeploy.
              </p>
            )}
            <div className="grid sm:grid-cols-2 gap-3">
              {([
                { key: 'stripe' as const, label: 'Stripe (international cards)', hint: envReady.stripe ? 'Env keys present' : 'Missing STRIPE_SECRET_KEY' },
                { key: 'paymob' as const, label: 'Paymob (Egypt cards)', hint: envReady.paymob ? 'Env keys present' : 'Missing Paymob env keys' },
                { key: 'instapay' as const, label: 'InstaPay', hint: 'Egypt transfers' },
                { key: 'bank_transfer' as const, label: 'Bank transfer', hint: 'Manual reference check' },
              ]).map((row) => (
                <label
                  key={row.key}
                  className={`flex items-start gap-3 p-3 rounded-[var(--radius-md)] border cursor-pointer transition-colors ${
                    methods[row.key] ? 'border-[var(--color-primary)] bg-[hsla(var(--color-primary-hsl-values),0.06)]' : 'border-[var(--color-border)]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={methods[row.key]}
                    onChange={() => toggleMethod(row.key)}
                    className="mt-1 w-4 h-4 accent-[var(--color-primary)]"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{row.label}</span>
                    <span className="block text-[11px] text-[var(--color-text-secondary)] mt-0.5">{row.hint}</span>
                  </span>
                </label>
              ))}
            </div>
            <Button type="button" size="sm" loading={savingMethods} onClick={savePaymentMethods}>
              Save payment options
            </Button>
          </Card>

          <Card className="p-5 mt-6">
            <h2 className="font-semibold text-sm mb-4">Recent signups</h2>
            {loadingList ? (
              <PageSpinner />
            ) : waitlist.length === 0 ? (
              <p className="text-sm text-[var(--color-text-secondary)]">No signups yet.</p>
            ) : (
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-sm min-w-[480px]">
                  <thead>
                    <tr className="text-left text-[var(--color-text-secondary)] border-b border-[var(--color-surface-2)]">
                      <th className="py-2 px-2 font-medium">Name</th>
                      <th className="py-2 px-2 font-medium">Email</th>
                      <th className="py-2 px-2 font-medium">Signed up</th>
                      <th className="py-2 px-2 font-medium">Notified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waitlist.slice(0, 50).map((row) => (
                      <tr key={row.id} className="border-b border-[var(--color-surface-2)]/60">
                        <td className="py-2 px-2">{row.name}</td>
                        <td className="py-2 px-2">{row.email}</td>
                        <td className="py-2 px-2 text-[var(--color-text-secondary)]">
                          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-2 px-2">
                          {row.notifiedAt ? (
                            <Badge tone="success">Yes</Badge>
                          ) : (
                            <Badge tone="gold">Pending</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </>
  );
};

export default AdminDev;
