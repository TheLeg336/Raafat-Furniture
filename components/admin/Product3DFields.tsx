import React, { useEffect, useRef, useState } from 'react';
import { Box, Camera, Upload, Plus, Trash2, Loader2, AlertTriangle, Check } from 'lucide-react';
import type { Model3D, ModelVariant, ScanJob } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeScans, subscribeScan, reconstructionConfigured, createHandoffScan } from '../../lib/scan';
import { uploadModel } from '../../lib/modelUpload';
import { localized } from '../../lib/format';
import { GuidedScanner } from '../scan/GuidedScanner';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';
import { useViewport } from '../../hooks/useViewport';
import { isArCapableDevice } from '../../lib/geo';
import { SITE_URL } from '../../lib/siteConfig';
import { DesktopHandoffSheet } from '../ui/DesktopHandoffSheet';

const blankVariant = (): ModelVariant => ({ id: Math.random().toString(36).slice(2, 8), label: '', colorHex: '#8a6a4a' });

interface Props {
  value: Model3D | null;
  onChange: (model: Model3D | null) => void;
}

export const Product3DFields: React.FC<Props> = ({ value, onChange }) => {
  const { user } = useAuth();
  const toast = useToast();
  const tier = useViewport();
  const fileRef = useRef<HTMLInputElement>(null);
  const [modelUrl, setModelUrl] = useState('');
  const [iosUrl, setIosUrl] = useState('');
  const [variants, setVariants] = useState<ModelVariant[]>([]);
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [handoffScanId, setHandoffScanId] = useState<string | null>(null);
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [scans, setScans] = useState<ScanJob[]>([]);

  const useMobileScanner = tier === 'mobile' || isArCapableDevice();

  useEffect(() => {
    if (value) {
      setModelUrl(value.url || '');
      setIosUrl(value.iosUrl || '');
      setVariants(value.variants || []);
    } else {
      setModelUrl('');
      setIosUrl('');
      setVariants([]);
    }
  }, [value]);

  useEffect(() => {
    const unsub = subscribeScans(setScans);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!handoffScanId) return;
    return subscribeScan(handoffScanId, (job) => {
      if (!job) return;
      if (job.modelUrl) {
        setModelUrl(job.modelUrl);
        syncParent(job.modelUrl, iosUrl, variants);
        toast.success('3D scan complete — model attached');
        setHandoffOpen(false);
        setHandoffScanId(null);
      } else if (job.status === 'failed') {
        toast.error(job.error || 'Scan failed on mobile');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handoffScanId]);

  const syncParent = (url: string, ios: string, vars: ModelVariant[]) => {
    if (!url.trim()) {
      onChange(null);
      return;
    }
    onChange({
      url: url.trim(),
      iosUrl: ios.trim() || undefined,
      variants: vars.filter((v) => localized(v.label).trim()).map((v) => ({ ...v, swatch: v.swatch || v.colorHex })),
      createdVia: value?.createdVia || 'upload',
      scanId: handoffScanId || value?.scanId,
    });
  };

  const startScan = async () => {
    if (!user) return;
    if (useMobileScanner) {
      setScanning(true);
      return;
    }
    try {
      const id = await createHandoffScan(user.email || user.uid);
      setHandoffScanId(id);
      setHandoffOpen(true);
    } catch (e: any) {
      toast.error(e?.message || 'Could not start scan handoff');
    }
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadModel(file);
      setModelUrl(url);
      syncParent(url, iosUrl, variants);
      toast.success('Model uploaded and optimized');
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed');
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const scanTone: Record<string, 'gold' | 'success' | 'info' | 'danger'> = {
    capturing: 'gold', uploading: 'gold', queued: 'gold', processing: 'info', ready: 'success', failed: 'danger',
  };

  const handoffUrl = handoffScanId ? `${SITE_URL}/m/scan/${handoffScanId}` : '';

  return (
    <div className="border border-[var(--color-surface-2)] rounded-xl p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Box size={18} className="text-[var(--color-primary)]" />
          <h3 className="font-semibold text-sm">3D model &amp; AR (optional)</h3>
        </div>
        <Button type="button" size="sm" variant="secondary" onClick={startScan} iconLeft={<Camera size={16} />}>
          Scan object
        </Button>
      </div>

      {!reconstructionConfigured() && (
        <p className="text-xs text-[var(--color-text-secondary)] flex items-start gap-2">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          Upload a finished GLB (from Polycam, Blender, etc.) or capture frames with guided scan. Models are optimized on upload.
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2 flex flex-wrap items-end gap-2">
          <Input
            label="Model URL (GLB)"
            value={modelUrl}
            onChange={(e) => { setModelUrl(e.target.value); syncParent(e.target.value, iosUrl, variants); }}
            placeholder="https://…/model.glb"
            className="flex-1 min-w-[200px]"
          />
          <input ref={fileRef} type="file" accept=".glb,.gltf,model/gltf-binary" onChange={onUpload} className="hidden" id="product-glb-upload" />
          <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()} loading={uploading} iconLeft={<Upload size={16} />}>
            Upload GLB
          </Button>
        </div>
        <Input
          label="iOS AR (USDZ, optional)"
          value={iosUrl}
          onChange={(e) => { setIosUrl(e.target.value); syncParent(modelUrl, e.target.value, variants); }}
          placeholder="https://…/model.usdz"
          className="sm:col-span-2"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Material / colour options</span>
          <Button type="button" size="sm" variant="ghost" onClick={() => {
            const next = [...variants, blankVariant()];
            setVariants(next);
            syncParent(modelUrl, iosUrl, next);
          }} iconLeft={<Plus size={14} />}>Add</Button>
        </div>
        {variants.length === 0 ? (
          <p className="text-xs text-[var(--color-text-secondary)]">No variants — customers see the model as-is.</p>
        ) : (
          <div className="space-y-2">
            {variants.map((v, i) => (
              <div key={v.id} className="flex flex-wrap items-end gap-2 p-2 rounded-lg bg-[var(--color-surface-2)]">
                <Input label="Label" value={localized(v.label)} onChange={(e) => {
                  const next = variants.map((x, j) => j === i ? { ...x, label: e.target.value } : x);
                  setVariants(next); syncParent(modelUrl, iosUrl, next);
                }} placeholder="Walnut" className="min-w-[100px]" />
                <input type="color" value={v.colorHex || '#8a6a4a'} onChange={(e) => {
                  const next = variants.map((x, j) => j === i ? { ...x, colorHex: e.target.value, swatch: e.target.value } : x);
                  setVariants(next); syncParent(modelUrl, iosUrl, next);
                }} className="w-10 h-10 rounded border border-[var(--color-border)]" aria-label="Colour" />
                <button type="button" onClick={() => {
                  const next = variants.filter((_, j) => j !== i);
                  setVariants(next); syncParent(modelUrl, iosUrl, next);
                }} className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-danger)]" aria-label="Remove"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {modelUrl && (
        <button type="button" className="text-xs text-[var(--color-danger)] underline" onClick={() => { setModelUrl(''); setIosUrl(''); setVariants([]); onChange(null); }}>
          Remove 3D model from this product
        </button>
      )}

      {scans.length > 0 && (
        <div className="pt-2 border-t border-[var(--color-surface-2)]">
          <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2">Recent scan jobs</p>
          <div className="space-y-1.5 max-h-36 overflow-y-auto" data-lenis-prevent>
            {scans.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center gap-2 text-xs">
                <Badge tone={scanTone[s.status] || 'neutral'}>{s.status}</Badge>
                <span className="text-[var(--color-text-secondary)]">{s.frameCount} frames</span>
                {s.status === 'processing' && <Loader2 size={12} className="animate-spin" />}
                {s.status === 'ready' && <Check size={12} className="text-[#3ba55d]" />}
                {s.status === 'failed' && <AlertTriangle size={12} className="text-[var(--color-danger)]" />}
                {s.modelUrl && (
                  <button type="button" className="underline text-[var(--color-primary)] ms-auto" onClick={() => { setModelUrl(s.modelUrl!); syncParent(s.modelUrl!, iosUrl, variants); }}>
                    Use model
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {scanning && user && (
        <GuidedScanner
          createdBy={user.email || user.uid}
          onComplete={() => { setScanning(false); toast.success('Scan saved'); }}
          onCancel={() => setScanning(false)}
        />
      )}

      {handoffUrl && (
        <DesktopHandoffSheet
          open={handoffOpen}
          onClose={() => { setHandoffOpen(false); }}
          title="Continue scan on your phone"
          description="Scan this QR code with your phone to capture the object. When the scan finishes, the 3D model will appear here automatically."
          url={handoffUrl}
          qrLabel="Scan to open the scanner"
        />
      )}
    </div>
  );
};

export default Product3DFields;
