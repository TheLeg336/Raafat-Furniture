import React, { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Rocket, Power, RefreshCw, Users } from 'lucide-react';
import type { TFunction } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useLaunch } from '../contexts/LaunchContext';
import { apiFetch } from '../lib/api';
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

const AdminDev: React.FC<Props> = () => {
  const { isDeveloper } = useAuth();
  const { status, refresh } = useLaunch();
  const toast = useToast();

  const [comingSoon, setComingSoon] = useState(false);
  const [message, setMessage] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [launching, setLaunching] = useState(false);

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

  useEffect(() => {
    if (isDeveloper) loadWaitlist();
  }, [isDeveloper, loadWaitlist]);

  if (!isDeveloper) return <Navigate to={adminPath()} replace />;

  const saveSettings = async () => {
    setSaving(true);
    try {
      await apiFetch('/api/launch/settings', {
        comingSoon,
        message: message.trim(),
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      }, 'PATCH');
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

  const pending = waitlist.filter((w) => !w.notifiedAt).length;

  return (
    <>
      <AdminPageHeader
        title="Dev"
        description="Schedule downtime, collect waitlist signups, and launch with a branded email blast."
      />

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
  );
};

export default AdminDev;
