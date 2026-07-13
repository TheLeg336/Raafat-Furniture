import React, { useEffect, useState } from 'react';
import { Hash } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import Card from '../ui/Card';
import { PageSpinner } from '../ui/Spinner';

/**
 * Order-number capacity gauge. Every order reserves a unique CC######XN code
 * (orderNumbers/{n}); the reservation is what guarantees no number is ever
 * reused. This shows how many are consumed against the total combinations per
 * country prefix (10^6 × 26 letters × 26 initials = 676,000,000).
 */
export const OrderNumberCapacity: React.FC = () => {
  const [stats, setStats] = useState<{ used: number; totalPerCountry: number } | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    apiFetch<{ used: number; totalPerCountry: number }>('/api/admin/order-numbers/stats', undefined, 'GET')
      .then(setStats)
      .catch((e) => setErr(e?.message || 'Could not load capacity.'));
  }, []);

  if (err) return <Card className="p-5"><p className="text-sm text-[var(--color-danger)]">{err}</p></Card>;
  if (!stats) return <Card className="p-5"><PageSpinner /></Card>;

  const { used, totalPerCountry } = stats;
  // Bar reflects the shared per-prefix space; realistically you will never
  // approach it, so we floor the visible fill so the gauge is always legible.
  const pct = totalPerCountry > 0 ? (used / totalPerCountry) * 100 : 0;
  const shownPct = Math.max(pct, used > 0 ? 0.6 : 0);
  const fmt = (n: number) => n.toLocaleString('en-US');

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Hash size={18} className="text-[var(--color-primary)]" />
        <h2 className="font-semibold text-sm">Order-number capacity</h2>
      </div>
      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
        Every order permanently reserves a unique code (<code>CC######XN</code>) so no number is ever
        reused. This is usage against the total unique combinations available per country prefix.
      </p>

      <div>
        <div className="h-4 w-full rounded-full bg-[var(--color-surface-2)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-500"
            style={{ width: `${Math.min(100, shownPct)}%` }}
            role="progressbar"
            aria-valuenow={used}
            aria-valuemin={0}
            aria-valuemax={totalPerCountry}
          />
        </div>
        <div className="flex justify-between items-baseline mt-2">
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">{fmt(used)} used</span>
          <span className="text-xs text-[var(--color-text-secondary)]">of {fmt(totalPerCountry)} per country</span>
        </div>
        <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">
          {pct < 0.001 ? '< 0.001' : pct.toFixed(4)}% consumed · {fmt(totalPerCountry - used)} remaining
        </p>
      </div>
    </Card>
  );
};

export default OrderNumberCapacity;
