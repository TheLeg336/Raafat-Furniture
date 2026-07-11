import React, { useEffect, useRef, useState } from 'react';
import { Box, Camera, Upload, Plus, Trash2, Loader2, AlertTriangle, Check } from 'lucide-react';
import type { Model3D, ModelVariant, ScanJob } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeScans, subscribeScan, reconstructionConfigured, createScanJob, attachModelToScan } from '../../lib/scan';
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
  /** Firestore id of the product being edited — lets the scan worker auto-attach the finished model. */
  productId?: string;
}

type DimState = { width: string; height: string; depth: string; unit: 'cm' | 'm' };

const emptyDims = (): DimState => ({ width: '', height: '', depth: '', unit: 'cm' });

function dimsFromModel(d?: Model3D['dimensions']): DimState {
  if (!d) return emptyDims();
  return {
    width: d.width != null ? String(d.width) : '',
    height: d.height != null ? String(d.height) : '',
    depth: d.depth != null ? String(d.depth) : '',
    unit: d.unit === 'm' ? 'm' : 'cm',
  };
}

function parseDims(d: DimState): Model3D['dimensions'] | undefined {
  const num = (s: string) => {
    const n = Number(s);
    return s.trim() && Number.isFinite(n) && n > 0 ? n : undefined;
  };
  const width = num(d.width);
  const height = num(d.height);
  const depth = num(d.depth);
  if (width == null && height == null && depth == null) return undefined;
  return { unit: d.unit, ...(width != null ? { width } : {}), ...(height != null ? { height } : {}), ...(depth != null ? { depth } : {}) };
}

export const Product3DFields: React.FC<Props> = ({ value, onChange, productId }) => {
  const { user } = useAuth();
  const toast = useToast();
  const tier = useViewport();
  const fileRef = useRef<HTMLInputElement>(null);
  const attachRef = useRef<HTMLInputElement>(null);
  const attachScanIdRef = useRef<string | null>(null);
  const [attachingScanId, setAttachingScanId] = useState<string | null>(null);
  const [modelUrl, setModelUrl] = useState('');
  const [iosUrl, setIosUrl] = useState('');
  const [variants, setVariants] = useState<ModelVariant[]>([]);
  const [dims, setDims] = useState<DimState>(emptyDims());
  const [createdVia, setCreatedVia] = useState<'upload' | 'scan'>('upload');
  const [scanId, setScanId] = useState<string | undefined>();
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
      setDims(dimsFromModel(value.dimensions));
      setCreatedVia(value.createdVia || 'upload');
      setScanId(value.scanId);
    } else {
      setModelUrl('');
      setIosUrl('');
      setVariants([]);
      setDims(emptyDims());
      setCreatedVia('upload');
      setScanId(undefined);
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
        applyScanModel(job);
        toast.success('3D scan complete — model attached');
        setHandoffOpen(false);
        setHandoffScanId(null);
      } else if (job.status === 'queued' && job.frameCount > 0) {
        toast.success('Frames saved on phone — attach a finished GLB when ready');
      } else if (job.status === 'failed') {
        toast.error(job.error || 'Scan failed on mobile');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handoffScanId]);

  const syncParent = (
    url: string,
    ios: string,
    vars: ModelVariant[],
    nextDims: DimState = dims,
    via: 'upload' | 'scan' = createdVia,
    nextScanId: string | undefined = scanId,
  ) => {
    if (!url.trim()) {
      onChange(null);
      return;
    }
    const next: Model3D = {
      url: url.trim(),
      variants: vars.filter((v) => localized(v.label).trim()).map((v) => ({ ...v, swatch: v.swatch || v.colorHex })),
      createdVia: via,
    };
    if (ios.trim()) next.iosUrl = ios.trim();
    if (nextScanId) next.scanId = nextScanId;
    const parsed = parseDims(nextDims);
    if (parsed) next.dimensions = parsed;
    onChange(next);
  };

  const applyScanModel = (job: ScanJob) => {
    if (!job.modelUrl) return;
    const fromScan: DimState = job.realDimensions
      ? {
          width: job.realDimensions.width != null ? String(job.realDimensions.width) : '',
          height: job.realDimensions.height != null ? String(job.realDimensions.height) : '',
          depth: job.realDimensions.depth != null ? String(job.realDimensions.depth) : '',
          unit: job.realDimensions.unit === 'm' ? 'm' : 'cm',
        }
      : dims;
    setModelUrl(job.modelUrl);
    setDims(fromScan);
    setCreatedVia('scan');
    setScanId(job.id);
    syncParent(job.modelUrl, iosUrl, variants, fromScan, 'scan', job.id);
  };

  const startScan = async () => {
    if (!user) return;
    if (useMobileScanner) {
      setScanning(true);
      return;
    }
    try {
      const id = await createScanJob(user.email || user.uid, { handoff: true, productId });
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
      setCreatedVia('upload');
      syncParent(url, iosUrl, variants, dims, 'upload', scanId);
      toast.success('Model uploaded and optimized');
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed');
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const onAttachGlb = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const scanJobId = attachScanIdRef.current;
    if (attachRef.current) attachRef.current.value = '';
    if (!file || !scanJobId) return;
    setAttachingScanId(scanJobId);
    try {
      const url = await attachModelToScan(scanJobId, file);
      const job = scans.find((s) => s.id === scanJobId);
      applyScanModel({ ...(job as ScanJob), id: scanJobId, modelUrl: url, status: 'ready' });
      toast.success('GLB attached to scan and applied to this product');
    } catch (err: any) {
      toast.error(err?.message || 'Attach failed');
    }
    setAttachingScanId(null);
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
          <input ref={attachRef} type="file" accept=".glb,.gltf,model/gltf-binary" onChange={onAttachGlb} className="hidden" id="scan-glb-attach" />
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

      <div className="space-y-2">
        <span className="text-sm font-medium">Real-world size (for accurate AR)</span>
        <p className="text-xs text-[var(--color-text-secondary)]">
          Export the GLB so 1 unit = 1 metre. Enter the physical size here so AR matches the room. Leave blank if the file is already correctly scaled.
        </p>
        <div className="grid grid-cols-3 gap-2">
          <Input label="Width" inputMode="decimal" value={dims.width} onChange={(e) => {
            const next = { ...dims, width: e.target.value };
            setDims(next); syncParent(modelUrl, iosUrl, variants, next);
          }} />
          <Input label="Height" inputMode="decimal" value={dims.height} onChange={(e) => {
            const next = { ...dims, height: e.target.value };
            setDims(next); syncParent(modelUrl, iosUrl, variants, next);
          }} />
          <Input label="Depth" inputMode="decimal" value={dims.depth} onChange={(e) => {
            const next = { ...dims, depth: e.target.value };
            setDims(next); syncParent(modelUrl, iosUrl, variants, next);
          }} />
        </div>
        <div className="flex gap-2">
          {(['cm', 'm'] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => {
                const next = { ...dims, unit: u };
                setDims(next); syncParent(modelUrl, iosUrl, variants, next);
              }}
              className={`px-3 py-1.5 rounded-[var(--radius-pill)] border text-xs font-semibold ${dims.unit === u ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}
            >
              {u}
            </button>
          ))}
        </div>
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
                <Input label="GLB material name (optional)" value={v.materialName || ''} onChange={(e) => {
                  const next = variants.map((x, j) => j === i ? { ...x, materialName: e.target.value || undefined } : x);
                  setVariants(next); syncParent(modelUrl, iosUrl, next);
                }} placeholder="Matches glTF material" className="min-w-[120px]" />
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
        <button type="button" className="text-xs text-[var(--color-danger)] underline" onClick={() => {
          setModelUrl(''); setIosUrl(''); setVariants([]); setDims(emptyDims()); setCreatedVia('upload'); setScanId(undefined); onChange(null);
        }}>
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
                {s.modelUrl ? (
                  <button type="button" className="underline text-[var(--color-primary)] ms-auto" onClick={() => applyScanModel(s)}>
                    Use model
                  </button>
                ) : (
                  <button
                    type="button"
                    className="underline text-[var(--color-primary)] ms-auto disabled:opacity-50"
                    disabled={attachingScanId === s.id}
                    onClick={() => { attachScanIdRef.current = s.id; attachRef.current?.click(); }}
                  >
                    {attachingScanId === s.id ? 'Attaching…' : 'Attach GLB'}
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
          productId={productId}
          onComplete={(id) => {
            setScanning(false);
            setScanId(id);
            setCreatedVia('scan');
            toast.success('Scan saved — upload or attach a finished GLB when ready');
          }}
          onCancel={() => setScanning(false)}
        />
      )}

      {handoffUrl && (
        <DesktopHandoffSheet
          open={handoffOpen}
          onClose={() => { setHandoffOpen(false); }}
          title="Continue scan on your phone"
          description="Scan this QR code with your phone (sign in as admin on the phone). Frames upload to Cloudinary; attach a finished GLB here, or wait if a reconstruction service is connected."
          url={handoffUrl}
          qrLabel="Scan to open the scanner"
        />
      )}
    </div>
  );
};

export default Product3DFields;
