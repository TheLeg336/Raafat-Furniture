import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Globe2, Plus, Trash2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';
import { DEFAULT_DDP_CONFIG, normalizeDdpConfig, type DdpConfig } from '../../lib/ddp';

/** Editable DDP freight zones + per-country duty/VAT matrix (settings/shipping).
    Free-tier replacement for landed-cost SaaS — rates are owner-tuned estimates. */
export const DdpSettings: React.FC = () => {
  const toast = useToast();
  const [cfg, setCfg] = useState<DdpConfig>(DEFAULT_DDP_CONFIG);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!db) return;
    getDoc(doc(db, 'settings', 'shipping'))
      .then((s) => setCfg(normalizeDdpConfig(s.exists() ? s.data() : null)))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const save = async () => {
    if (!db) return;
    setBusy(true);
    try {
      await setDoc(doc(db, 'settings', 'shipping'), {
        enabled: cfg.enabled,
        volumetricDivisor: cfg.volumetricDivisor,
        zones: cfg.zones,
        rates: cfg.rates,
        defaultRate: cfg.defaultRate,
        updatedAt: new Date().toISOString(),
      });
      toast.success('DDP shipping settings saved');
    } catch { toast.error('Could not save (admin rights required).'); }
    setBusy(false);
  };

  const setZone = (i: number, patch: Partial<DdpConfig['zones'][0]>) =>
    setCfg((c) => ({ ...c, zones: c.zones.map((z, j) => (j === i ? { ...z, ...patch } : z)) }));
  const setRate = (cc: string, key: 'dutyPct' | 'vatPct', v: number) =>
    setCfg((c) => ({ ...c, rates: { ...c.rates, [cc]: { ...c.rates[cc], [key]: v } } }));

  const inputCls = 'w-full bg-[var(--color-surface-2)] text-[var(--color-text-primary)] rounded-lg px-2.5 py-2 text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none';

  return (
    <Card className="p-5 mt-6 space-y-4">
      <div className="flex items-center gap-2">
        <Globe2 size={18} className="text-[var(--color-primary)]" />
        <h2 className="font-semibold text-sm">International shipping & duties (DDP)</h2>
      </div>
      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
        When enabled, international checkout charges freight (per chargeable kg — the larger of real
        and volumetric weight L×W×H÷{cfg.volumetricDivisor}) plus that country's customs duty and
        import VAT, all prepaid (Delivered Duty Paid). Products need their packed box data
        (Catalog → listing → International shipping). Items without box data fall back to
        "shipping quoted after order". Rates below are estimates you control — tune them to your
        freight forwarder's real quotes.
      </p>

      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={cfg.enabled} onChange={(e) => setCfg((c) => ({ ...c, enabled: e.target.checked }))} className="w-4 h-4 accent-[var(--color-primary)]" />
        <span className="text-sm font-medium">Charge freight + duties at international checkout</span>
      </label>

      <div className="flex items-center gap-3">
        <span className="text-xs text-[var(--color-text-secondary)] shrink-0">Volumetric divisor (cm³/kg)</span>
        <input type="number" min="1000" step="500" value={cfg.volumetricDivisor} onChange={(e) => setCfg((c) => ({ ...c, volumetricDivisor: Number(e.target.value) || 5000 }))} className={`${inputCls} max-w-[120px]`} />
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)] mb-2">Freight zones (USD)</h3>
        <div className="flex flex-col gap-2">
          {cfg.zones.map((z, i) => (
            <div key={z.id} className="grid grid-cols-[1fr_2fr_80px_80px_32px] gap-2 items-center">
              <input value={z.name} onChange={(e) => setZone(i, { name: e.target.value })} className={inputCls} placeholder="Zone name" aria-label="Zone name" />
              <input value={z.countries.join(', ')} onChange={(e) => setZone(i, { countries: e.target.value.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean) })} className={inputCls} placeholder="US, CA (or * for rest)" aria-label="Zone countries" />
              <input type="number" min="0" step="0.1" value={z.perKgUSD} onChange={(e) => setZone(i, { perKgUSD: Number(e.target.value) || 0 })} className={inputCls} placeholder="$/kg" aria-label="USD per kg" />
              <input type="number" min="0" step="5" value={z.minUSD} onChange={(e) => setZone(i, { minUSD: Number(e.target.value) || 0 })} className={inputCls} placeholder="min $" aria-label="Minimum USD" />
              <button type="button" onClick={() => setCfg((c) => ({ ...c, zones: c.zones.filter((_, j) => j !== i) }))} className="p-1.5 text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] rounded-lg" aria-label="Remove zone"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setCfg((c) => ({ ...c, zones: [...c.zones, { id: `zone-${Date.now()}`, name: '', countries: [], perKgUSD: 0, minUSD: 0 }] }))} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)]"><Plus size={13} /> Add zone</button>
        <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">Columns: zone · ISO country codes (comma-separated, <code>*</code> = everything else) · USD per kg · minimum per shipment.</p>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)] mb-2">Customs duty + import VAT by country (% of CIF)</h3>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
          {Object.entries(cfg.rates).map(([cc, r]) => (
            <div key={cc} className="grid grid-cols-[44px_1fr_1fr_32px] gap-2 items-center">
              <span className="font-mono text-sm font-semibold">{cc}</span>
              <input type="number" min="0" step="0.5" value={r.dutyPct} onChange={(e) => setRate(cc, 'dutyPct', Number(e.target.value) || 0)} className={inputCls} aria-label={`${cc} duty %`} />
              <input type="number" min="0" step="0.5" value={r.vatPct} onChange={(e) => setRate(cc, 'vatPct', Number(e.target.value) || 0)} className={inputCls} aria-label={`${cc} import VAT %`} />
              <button type="button" onClick={() => setCfg((c) => { const rates = { ...c.rates }; delete rates[cc]; return { ...c, rates }; })} className="p-1.5 text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] rounded-lg" aria-label={`Remove ${cc}`}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
        <AddCountryRow onAdd={(cc) => setCfg((c) => ({ ...c, rates: { ...c.rates, [cc]: { dutyPct: c.defaultRate.dutyPct, vatPct: c.defaultRate.vatPct } } }))} />
        <div className="grid grid-cols-[auto_1fr_1fr] gap-2 items-center mt-2 max-w-sm">
          <span className="text-xs text-[var(--color-text-secondary)]">Any other country</span>
          <input type="number" min="0" step="0.5" value={cfg.defaultRate.dutyPct} onChange={(e) => setCfg((c) => ({ ...c, defaultRate: { ...c.defaultRate, dutyPct: Number(e.target.value) || 0 } }))} className={inputCls} aria-label="Default duty %" />
          <input type="number" min="0" step="0.5" value={cfg.defaultRate.vatPct} onChange={(e) => setCfg((c) => ({ ...c, defaultRate: { ...c.defaultRate, vatPct: Number(e.target.value) || 0 } }))} className={inputCls} aria-label="Default import VAT %" />
        </div>
        <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">Left column duty %, right column import VAT % — both applied on goods + freight (VAT after duty).</p>
      </div>

      <Button type="button" size="sm" loading={busy} disabled={!loaded} onClick={save}>Save DDP settings</Button>
    </Card>
  );
};

const AddCountryRow: React.FC<{ onAdd: (cc: string) => void }> = ({ onAdd }) => {
  const [cc, setCc] = useState('');
  return (
    <div className="flex items-center gap-2 mt-2">
      <input value={cc} onChange={(e) => setCc(e.target.value.toUpperCase().slice(0, 2))} placeholder="ISO2" className="w-16 bg-[var(--color-surface-2)] text-[var(--color-text-primary)] rounded-lg px-2.5 py-2 text-sm font-mono focus:ring-2 focus:ring-[var(--color-primary)] outline-none" aria-label="Country code" />
      <button type="button" disabled={!/^[A-Z]{2}$/.test(cc)} onClick={() => { onAdd(cc); setCc(''); }} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] disabled:opacity-40"><Plus size={13} /> Add country</button>
    </div>
  );
};

export default DdpSettings;
