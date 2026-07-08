import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, DollarSign, Package, ShoppingBag, Users, ExternalLink } from 'lucide-react';
import type { Order, TFunction } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { subscribeAllOrders } from '../lib/orders';
import { AdminPageHeader } from '../components/admin/AdminPageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PageSpinner } from '../components/ui/Spinner';
import { formatMoney } from '../lib/format';

interface Props { t: TFunction; }

type Range = 'day' | 'month' | 'year';

function startOfRange(range: Range): Date {
  const d = new Date();
  if (range === 'day') {
    d.setHours(0, 0, 0, 0);
  } else if (range === 'month') {
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
  } else {
    d.setMonth(0, 1);
    d.setHours(0, 0, 0, 0);
  }
  return d;
}

/** Sales analytics for admins; developers also see GA setup guidance. */
const AdminAnalytics: React.FC<Props> = () => {
  const { isDeveloper } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>('month');
  const gaId = (import.meta.env.VITE_GA_MEASUREMENT_ID as string) || '';

  useEffect(() => {
    const unsub = subscribeAllOrders(
      (o) => { setOrders(o); setLoading(false); },
      () => setLoading(false),
    );
    return () => unsub();
  }, []);

  const stats = useMemo(() => {
    const from = startOfRange(range).toISOString();
    const inRange = orders.filter((o) => o.createdAt >= from);
    const paid = inRange.filter((o) => o.paymentStatus === 'paid');
    const revenue = paid.reduce((s, o) => s + (o.total || 0), 0);
    const itemsSold = paid.reduce((s, o) => s + o.items.reduce((n, it) => n + it.quantity, 0), 0);
    const orderCount = paid.length;
    const avgOrder = orderCount ? revenue / orderCount : 0;
    const pending = inRange.filter((o) => o.paymentStatus !== 'paid' && !['cancelled', 'refunded'].includes(o.status)).length;
    const byMethod: Record<string, number> = {};
    paid.forEach((o) => {
      byMethod[o.paymentMethod] = (byMethod[o.paymentMethod] || 0) + o.total;
    });
    return { revenue, itemsSold, orderCount, avgOrder, pending, byMethod, currency: paid[0]?.currency || orders[0]?.currency };
  }, [orders, range]);

  if (loading) return <PageSpinner />;

  return (
    <>
      <AdminPageHeader
        title="Analytics"
        actions={(
          <div className="flex gap-2">
            {(['day', 'month', 'year'] as Range[]).map((r) => (
              <Button key={r} size="sm" variant={range === r ? 'primary' : 'secondary'} onClick={() => setRange(r)}>
                {r === 'day' ? 'Today' : r === 'month' ? 'This month' : 'This year'}
              </Button>
            ))}
          </div>
        )}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat icon={<DollarSign size={18} />} label="Revenue (paid)" value={formatMoney(stats.revenue, { currency: stats.currency, compact: true })} />
        <Stat icon={<ShoppingBag size={18} />} label="Paid orders" value={String(stats.orderCount)} />
        <Stat icon={<Package size={18} />} label="Items sold" value={String(stats.itemsSold)} />
        <Stat icon={<BarChart3 size={18} />} label="Avg order" value={formatMoney(stats.avgOrder, { currency: stats.currency, compact: true })} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <Card className="p-5">
          <h3 className="font-semibold mb-3">Payment mix (paid)</h3>
          {Object.keys(stats.byMethod).length === 0 ? (
            <p className="text-sm text-[var(--color-text-secondary)]">No paid orders in this period.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {Object.entries(stats.byMethod).map(([method, total]) => (
                <li key={method} className="flex justify-between">
                  <span className="capitalize text-[var(--color-text-secondary)]">{method.replace(/_/g, ' ')}</span>
                  <span className="font-medium">{formatMoney(total, { currency: stats.currency })}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-[var(--color-text-secondary)] mt-4">Awaiting payment in period: {stats.pending}</p>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Users size={16} /> Site traffic (Google Analytics)</h3>
          {gaId ? (
            <div className="text-sm space-y-2">
              <p>Measurement ID: <code className="text-[var(--color-primary)]">{gaId}</code></p>
              <p className="text-[var(--color-text-secondary)]">
                Unique visitors and engagement are in GA4 (Reports → Acquisition / Engagement).
                The storefront only sends events after cookie consent.
              </p>
              <a
                href="https://analytics.google.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[var(--color-primary)] font-medium"
              >
                Open Google Analytics <ExternalLink size={14} />
              </a>
            </div>
          ) : (
            <div className="text-sm text-[var(--color-text-secondary)] space-y-2">
              <p>GA4 is not configured yet. Add <code>VITE_GA_MEASUREMENT_ID</code> in Vercel env (e.g. <code>G-XXXXXXXX</code>).</p>
              <ol className="list-decimal ms-5 space-y-1">
                <li>Create a GA4 property at analytics.google.com</li>
                <li>Add a Web data stream for raafat-furniture.vercel.app</li>
                <li>Copy the Measurement ID into Vercel → Environment Variables</li>
                <li>Redeploy — consent banner will gate tracking</li>
              </ol>
            </div>
          )}
          {isDeveloper && (
            <p className="text-xs text-[var(--color-text-secondary)] mt-4 border-t border-[var(--color-border)] pt-3">
              Developer tip: use GA4 “Active users” (not page views) for unique people. Enable enhanced measurement;
              our client already sets <code>anonymize_ip</code> and Consent Mode v2.
            </p>
          )}
        </Card>
      </div>
    </>
  );
};

const Stat: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <Card className="p-4">
    <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)] text-sm mb-1">{icon}{label}</div>
    <p className="font-heading text-2xl font-bold">{value}</p>
  </Card>
);

export default AdminAnalytics;
