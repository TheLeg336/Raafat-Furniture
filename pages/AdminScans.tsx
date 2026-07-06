import React, { useEffect, useRef, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Box, Camera, Upload, Plus, Trash2, Check, Clock, Loader2, AlertTriangle } from 'lucide-react';
import type { Model3D, ModelVariant, Product, ScanJob, TFunction } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useProducts } from '../hooks/useProducts';
import { db, storage } from '../lib/firebase';
import { subscribeScans, reconstructionConfigured } from '../lib/scan';
import { AdminPageHeader } from '../components/admin/AdminPageHeader';
import { GuidedScanner } from '../components/scan/GuidedScanner';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import { formatDate, localized } from '../lib/format';

interface Props { t: TFunction; }

const scanTone: Record<string, 'gold' | 'success' | 'info' | 'danger'> = {
  capturing: 'gold', uploading: 'gold', queued: 'gold', processing: 'info', ready: 'success', failed: 'danger',
};

async function uploadModel(file: File): Promise<string> {
  if (!storage) throw new Error('Storage not configured');
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const r = storageRef(storage, `models/${Date.now()}-${safe}`);
  await uploadBytes(r, file, { contentType: file.type || 'model/gltf-binary' });
  return getDownloadURL(r);
}

const blankVariant = (): ModelVariant => ({ id: Math.random().toString(36).slice(2, 8), label: '', colorHex: '#8a6a4a' });

const AdminScans: React.FC<Props> = () => {
  const { isAdmin, user } = useAuth();
  const { products } = useProducts();
  const toast = useToast();
  const [scans, setScans] = useState<ScanJob[]>([]);
  const [scanning, setScanning] = useState(false);

  // 3D attach form
  const [productId, setProductId] = useState('');
  const [modelUrl, setModelUrl] = useState('');
  const [iosUrl, setIosUrl] = useState('');
  const [variants, setVariants] = useState<ModelVariant[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAdmin) return;
    const unsub = subscribeScans(setScans);
    return () => unsub();
  }, [isAdmin]);

  // Prefill when picking a product that already has a model.
  useEffect(() => {
    const p = products.find((x) => String(x.id) === productId);
    if (p?.model3d) {
      setModelUrl(p.model3d.url || '');
      setIosUrl(p.model3d.iosUrl || '');
      setVariants(p.model3d.variants || []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadModel(file);
      setModelUrl(url);
      toast.success('Model uploaded');
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed');
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const saveModel = async () => {
    if (!db || !productId || !modelUrl) { toast.error('Pick a product and a model URL'); return; }
    setSaving(true);
    try {
      const model: Model3D = {
        url: modelUrl.trim(),
        iosUrl: iosUrl.trim() || undefined,
        variants: variants.filter((v) => localized(v.label).trim()).map((v) => ({ ...v, swatch: v.swatch || v.colorHex })),
        createdVia: 'upload',
      };
      await updateDoc(doc(db, 'products', productId), { model3d: model });
      toast.success('3D model attached to product');
    } catch (e: any) {
      toast.error(e?.message || 'Save failed');
    }
    setSaving(false);
  };

  const removeModel = async () => {
    if (!db || !productId) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'products', productId), { model3d: null });
      setModelUrl(''); setIosUrl(''); setVariants([]);
      toast.success('3D model removed');
    } catch (e: any) { toast.error(e?.message || 'Failed'); }
    setSaving(false);
  };

  return (
    <>
      <AdminPageHeader
        title="Scans & 3D"
        description="Capture objects, upload GLB models, and attach them to products."
        actions={<Button size="sm" onClick={() => setScanning(true)} iconLeft={<Camera size={18} />}>Scan object</Button>}
      />

      {!reconstructionConfigured() && (
        <Card inset className="p-4 mb-8 flex items-start gap-3 text-sm">
          <AlertTriangle size={18} className="text-[var(--color-primary)] mt-0.5 shrink-0" />
          <p className="text-[var(--color-text-secondary)]">
            A photogrammetry reconstruction service isn’t connected. Guided scans capture &amp; upload frames and queue them;
            once you have a finished <strong>GLB</strong> (from your reconstruction service, Polycam, Luma, etc.) upload it below
            and attach it to a product. Set <code>VITE_PHOTOGRAMMETRY_API_URL</code> to automate this step.
          </p>
        </Card>
      )}

      {/* Attach 3D model to a product */}
      <Card className="p-6 mb-10">
        <div className="flex items-center gap-2 mb-5"><Box size={20} className="text-[var(--color-primary)]" /><h2 className="font-heading text-xl font-bold">Attach a 3D model to a product</h2></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Select label="Product" value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="">Choose a product…</option>
            {products.map((p: Product) => <option key={p.id} value={String(p.id)}>{localized(p.name) || p.nameKey || String(p.id)}</option>)}
          </Select>
          <div className="flex items-end gap-2">
            <Input label="Model URL (GLB / glTF)" value={modelUrl} onChange={(e) => setModelUrl(e.target.value)} placeholder="https://…/model.glb" className="flex-1" />
            <input ref={fileRef} type="file" accept=".glb,.gltf,model/gltf-binary,model/gltf+json" onChange={onUpload} className="hidden" id="glb-upload" />
            <Button variant="secondary" onClick={() => fileRef.current?.click()} loading={uploading} iconLeft={<Upload size={16} />}>Upload</Button>
          </div>
          <Input label="iOS AR file (USDZ, optional)" value={iosUrl} onChange={(e) => setIosUrl(e.target.value)} placeholder="https://…/model.usdz" className="sm:col-span-2" />
        </div>

        {/* Variants */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Material / colour options</h3>
            <Button size="sm" variant="ghost" onClick={() => setVariants((v) => [...v, blankVariant()])} iconLeft={<Plus size={15} />}>Add option</Button>
          </div>
          <div className="flex flex-col gap-3">
            {variants.length === 0 && <p className="text-sm text-[var(--color-text-secondary)]">No options — users see the model as-is. Add options so they can switch materials/colours live.</p>}
            {variants.map((v, i) => (
              <div key={v.id} className="flex flex-wrap items-end gap-2 p-3 rounded-[var(--radius-md)] bg-[var(--color-surface-2)]">
                <Input label="Label" value={localized(v.label)} onChange={(e) => setVariants((arr) => arr.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} placeholder="Walnut" className="min-w-[120px]" />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Colour</label>
                  <input type="color" value={v.colorHex || '#8a6a4a'} onChange={(e) => setVariants((arr) => arr.map((x, j) => j === i ? { ...x, colorHex: e.target.value, swatch: e.target.value } : x))} className="w-12 h-11 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-transparent cursor-pointer" />
                </div>
                <Input label="GLB material name (optional)" value={v.materialName || ''} onChange={(e) => setVariants((arr) => arr.map((x, j) => j === i ? { ...x, materialName: e.target.value } : x))} placeholder="Body" className="min-w-[140px]" />
                <Input label="glTF variant (optional)" value={v.gltfVariant || ''} onChange={(e) => setVariants((arr) => arr.map((x, j) => j === i ? { ...x, gltfVariant: e.target.value } : x))} placeholder="Walnut" className="min-w-[120px]" />
                <button onClick={() => setVariants((arr) => arr.filter((_, j) => j !== i))} className="p-2.5 text-[var(--color-text-secondary)] hover:text-[var(--color-danger)]" aria-label="Remove option"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button onClick={saveModel} loading={saving} disabled={!productId || !modelUrl} iconLeft={<Check size={17} />}>Save 3D model</Button>
          {productId && modelUrl && <Button variant="ghost" onClick={removeModel} className="text-[var(--color-danger)]">Remove model</Button>}
        </div>
      </Card>

      {/* Scan jobs */}
      <div className="flex items-center gap-2 mb-4"><Camera size={18} className="text-[var(--color-primary)]" /><h2 className="font-heading text-xl font-bold">Scan jobs</h2></div>
      {scans.length === 0 ? (
        <Card className="p-10 text-center text-[var(--color-text-secondary)]">No scans yet. Tap “Scan an object” to capture one.</Card>
      ) : (
        <div className="flex flex-col gap-2">
          {scans.map((s) => (
            <Card key={s.id} className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center shrink-0">
                {s.status === 'ready' ? <Check size={18} className="text-[#3ba55d]" /> : s.status === 'failed' ? <AlertTriangle size={18} className="text-[var(--color-danger)]" /> : s.status === 'processing' ? <Loader2 size={18} className="animate-spin text-[var(--color-primary)]" /> : <Clock size={18} className="text-[var(--color-text-secondary)]" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><Badge tone={scanTone[s.status] || 'neutral'}>{s.status}</Badge><span className="text-sm text-[var(--color-text-secondary)]">{s.frameCount} frames · {formatDate(s.createdAt, true)}</span></div>
                {s.realDimensions && <p className="text-xs text-[var(--color-text-secondary)] mt-1">{s.realDimensions.width}×{s.realDimensions.height}×{s.realDimensions.depth} {s.realDimensions.unit}</p>}
                {s.error && <p className="text-xs text-[var(--color-danger)] mt-1">{s.error}</p>}
              </div>
              {s.modelUrl && <Button size="sm" variant="secondary" onClick={() => { setModelUrl(s.modelUrl!); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Use model</Button>}
            </Card>
          ))}
        </div>
      )}

      {scanning && user && (
        <GuidedScanner
          createdBy={user.email || user.uid}
          onComplete={() => { setScanning(false); toast.success('Scan saved'); }}
          onCancel={() => setScanning(false)}
        />
      )}
    </>
  );
};

export default AdminScans;
