import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { View, Box, RotateCcw, Move3d, ShoppingCart, Check, ArrowLeft } from 'lucide-react';
import type { Model3D, ModelVariant, TFunction } from '../types';
import { localized } from '../lib/format';
import { trackEvent } from '../lib/analytics';
import { isArCapableDevice } from '../lib/geo';
import { DesktopHandoffSheet } from './ui/DesktopHandoffSheet';

interface Props {
  model: Model3D;
  productName: string;
  /** Full URL to this product page — used for desktop AR QR handoff. */
  productPageUrl?: string;
  /** When true (e.g. ?ar=1), auto-open AR on capable devices. */
  autoAr?: boolean;
  /** Product color/material selectors — matched to model variants when possible. */
  preferredColor?: string;
  preferredMaterial?: string;
  /** Shown in the in-AR overlay and used for the Quick Look banner. */
  priceLabel?: string;
  /** Enables the in-AR "Add to cart" action (WebXR overlay + Quick Look banner tap-through). */
  onAddToCart?: () => void;
  t?: TFunction;
  className?: string;
}

/** Convert "#RRGGBB" to a model-viewer base-colour-factor array [r,g,b,a] in 0..1. */
function hexToFactor(hex?: string): [number, number, number, number] | null {
  if (!hex) return null;
  const m = hex.replace('#', '');
  if (m.length !== 6) return null;
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  return [r, g, b, 1];
}

function matchVariant(
  variants: ModelVariant[] | undefined,
  preferredColor?: string,
  preferredMaterial?: string,
): ModelVariant | undefined {
  if (!variants?.length) return undefined;
  const norm = (s: string) => s.trim().toLowerCase();
  const color = preferredColor ? norm(preferredColor) : '';
  const material = preferredMaterial ? norm(preferredMaterial) : '';
  if (color || material) {
    const hit = variants.find((v) => {
      const label = norm(localized(v.label));
      return (color && (label.includes(color) || color.includes(label)))
        || (material && (label.includes(material) || material.includes(label) || (v.materialName && norm(v.materialName).includes(material))));
    });
    if (hit) return hit;
  }
  return variants[0];
}

export const ModelViewer3D: React.FC<Props> = ({
  model, productName, productPageUrl, autoAr, preferredColor, preferredMaterial, onAddToCart, t, className = '',
}) => {
  const ref = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [arQrOpen, setArQrOpen] = useState(false);
  // WebXR AR session state — model-viewer children become the DOM overlay while presenting.
  const [arActive, setArActive] = useState(false);
  const [arAdded, setArAdded] = useState(false);
  const initial = matchVariant(model.variants, preferredColor, preferredMaterial);
  const [activeVariant, setActiveVariant] = useState<string | null>(initial?.id ?? model.variants?.[0]?.id ?? null);
  const tr = (k: string, fallback: string) => (t ? t(k) : fallback);
  const arUrl = productPageUrl ? `${productPageUrl}${productPageUrl.includes('?') ? '&' : '?'}ar=1` : '';

  const applyVariant = (variant: ModelVariant) => {
    const mv = ref.current;
    if (!mv || !mv.model) return;
    try {
      if (variant.gltfVariant && Array.isArray(mv.availableVariants) && mv.availableVariants.includes(variant.gltfVariant)) {
        mv.variantName = variant.gltfVariant;
        return;
      }
      const materials = mv.model.materials || [];
      const target =
        materials.find((m: any) => m.name === variant.materialName) || materials[0];
      if (!target) return;
      const pbr = target.pbrMetallicRoughness;
      const factor = hexToFactor(variant.colorHex);
      if (factor && pbr?.setBaseColorFactor) pbr.setBaseColorFactor(factor);
      if (variant.roughness != null && pbr?.setRoughnessFactor) pbr.setRoughnessFactor(variant.roughness);
      if (variant.metalness != null && pbr?.setMetallicFactor) pbr.setMetallicFactor(variant.metalness);
    } catch { /* unsupported */ }
  };

  /** Scale the loaded mesh so its longest axis matches real-world dimensions (metres). */
  const applyRealWorldScale = (mv: any) => {
    const d = model.dimensions;
    if (!d || !mv?.getDimensions) return;
    const toM = (n?: number) => {
      if (n == null || !Number.isFinite(n) || n <= 0) return null;
      return d.unit === 'cm' ? n / 100 : n;
    };
    const targetW = toM(d.width);
    const targetH = toM(d.height);
    const targetD = toM(d.depth);
    if (targetW == null && targetH == null && targetD == null) return;
    try {
      const size = mv.getDimensions();
      const sx = Math.abs(size?.x) || 0;
      const sy = Math.abs(size?.y) || 0;
      const sz = Math.abs(size?.z) || 0;
      if (sx < 1e-6 && sy < 1e-6 && sz < 1e-6) return;
      const ratios: number[] = [];
      if (targetW != null && sx > 1e-6) ratios.push(targetW / sx);
      if (targetH != null && sy > 1e-6) ratios.push(targetH / sy);
      if (targetD != null && sz > 1e-6) ratios.push(targetD / sz);
      if (!ratios.length) return;
      // Uniform scale from the average of known axes — keeps proportions, matches room size.
      const factor = ratios.reduce((a, b) => a + b, 0) / ratios.length;
      if (!Number.isFinite(factor) || factor <= 0) return;
      mv.scale = `${factor} ${factor} ${factor}`;
    } catch { /* getDimensions unavailable */ }
  };

  useEffect(() => {
    const mv = ref.current;
    if (!mv) return;
    const onLoad = () => {
      setLoaded(true);
      applyRealWorldScale(mv);
      const matched = matchVariant(model.variants, preferredColor, preferredMaterial);
      const first = matched || model.variants?.find((v) => v.id === activeVariant) || model.variants?.[0];
      if (first) {
        setActiveVariant(first.id);
        applyVariant(first);
      }
      if (autoAr && isArCapableDevice()) {
        window.setTimeout(() => {
          try { mv.activateAR?.(); } catch { /* no-op */ }
        }, 600);
      }
    };
    mv.addEventListener('load', onLoad);
    const onArStatus = (e: any) => {
      const s = e?.detail?.status;
      setArActive(s === 'session-started' || s === 'object-placed');
      if (s === 'not-presenting' || s === 'failed') setArAdded(false);
    };
    mv.addEventListener('ar-status', onArStatus);
    return () => {
      mv.removeEventListener('load', onLoad);
      mv.removeEventListener('ar-status', onArStatus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model.url, autoAr, model.dimensions?.width, model.dimensions?.height, model.dimensions?.depth, model.dimensions?.unit]);

  // Keep 3D/AR in sync when the customer picks a product color or material.
  useEffect(() => {
    if (!loaded) return;
    const matched = matchVariant(model.variants, preferredColor, preferredMaterial);
    if (!matched || matched.id === activeVariant) return;
    setActiveVariant(matched.id);
    applyVariant(matched);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferredColor, preferredMaterial, loaded]);

  const onPickVariant = (v: ModelVariant) => {
    setActiveVariant(v.id);
    applyVariant(v);
    trackEvent('select_material', { product: productName, material: localized(v.label) });
  };

  const enterAR = () => {
    if (!isArCapableDevice() && arUrl) {
      setArQrOpen(true);
      trackEvent('view_in_ar_qr', { product: productName });
      return;
    }
    try {
      ref.current?.activateAR?.();
      trackEvent('view_in_ar', { product: productName });
    } catch { /* no-op */ }
  };

  const resetView = () => {
    const mv = ref.current;
    if (mv) mv.cameraOrbit = '0deg 75deg 105%';
  };

  const arAddToCart = () => {
    if (!onAddToCart) return;
    onAddToCart();
    setArAdded(true);
    window.setTimeout(() => setArAdded(false), 2000);
  };

  // iPhone Quick Look: native AR is an OS view (no web UI possible), but Apple
  // supports a branded banner via URL fragment — title, subtitle, call-to-action.
  // Tapping the banner returns the shopper to this product page.
  const iosSrc = (() => {
    if (!model.iosUrl) return undefined;
    if (model.iosUrl.includes('#')) return model.iosUrl;
    const p = new URLSearchParams();
    p.set('checkoutTitle', productName);
    p.set('checkoutSubtitle', 'Raafat Furniture — handcrafted in Egypt');
    p.set('callToAction', (t && t('add_to_cart')) || 'Add to Cart');
    if (productPageUrl) p.set('canonicalWebPageURL', productPageUrl);
    return `${model.iosUrl}#${p.toString()}`;
  })();

  return (
    <div className={`relative w-full ${className}`}>
      {/* @ts-ignore — web component */}
      <model-viewer
        ref={ref}
        src={model.url}
        ios-src={iosSrc}
        poster={model.poster}
        alt={model.alt || `3D model of ${productName}`}
        // @ts-expect-error model-viewer accepts crossorigin
        crossorigin="anonymous"
        camera-controls
        touch-action="pan-y"
        auto-rotate
        rotation-per-second="18deg"
        interaction-prompt="auto"
        shadow-intensity="1"
        shadow-softness="0.85"
        exposure="1.05"
        environment-image="neutral"
        ar
        ar-modes="webxr scene-viewer quick-look"
        ar-scale="fixed"
        ar-placement="floor"
        loading="eager"
        reveal="auto"
        style={{
          width: '100%',
          height: '100%',
          minHeight: '420px',
          background:
            'radial-gradient(120% 120% at 50% 20%, var(--color-surface) 0%, var(--color-surface-2) 100%)',
          borderRadius: 'var(--radius-lg)',
          '--poster-color': 'transparent',
        } as React.CSSProperties}
      >
        {/* Hide default model-viewer AR chrome — we use our own gold CTA */}
        <button slot="ar-button" style={{ display: 'none' }} tabIndex={-1} aria-hidden />
        <div slot="progress-bar" />

        {/* In-AR branded overlay (WebXR only — native Scene Viewer / Quick Look
            cannot host site UI). Children of <model-viewer> are shown as the DOM
            overlay while an AR session presents. */}
        {arActive && (
          <div className="fixed inset-0 z-[100] pointer-events-none flex flex-col justify-between">
            {/* top brand bar — quiet, unintrusive */}
            <div className="mx-auto mt-[max(0.75rem,env(safe-area-inset-top))] flex items-center gap-2 rounded-[var(--radius-pill)] bg-black/45 backdrop-blur-md px-4 py-2">
              <span className="font-heading text-sm font-bold tracking-[0.18em] text-white">RAAFAT</span>
              <span className="text-[10px] tracking-[0.3em] text-[#E8C547] font-semibold">FURNITURE</span>
            </div>

            {/* bottom actions — back (liquid glass) + add to cart */}
            <div className="mb-[max(1.25rem,env(safe-area-inset-bottom))] px-5 flex items-center justify-center gap-3">
              {onAddToCart && (
                <button
                  onClick={arAddToCart}
                  className="pointer-events-auto inline-flex items-center gap-2 rounded-[var(--radius-pill)] px-6 py-3 font-bold shadow-lg transition-all bg-[#E8C547] text-[#14213D]"
                >
                  {arAdded ? <Check size={18} /> : <ShoppingCart size={18} />}
                  {arAdded ? (tr('added_to_cart', 'Added to cart')) : (tr('add_to_cart', 'Add to Cart'))}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Liquid-glass back button — slotted so model-viewer wires it to end the
            WebXR session. Fixed bottom-left, beside the centered Add to Cart. */}
        <button
          slot="exit-webxr-ar-button"
          aria-label={tr('ar_back', 'Back')}
          style={{
            position: 'fixed',
            insetInlineStart: '1.25rem',
            bottom: 'max(1.25rem, env(safe-area-inset-bottom))',
            zIndex: 101,
            display: arActive ? 'inline-flex' : 'none',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            borderRadius: '999px',
            background: 'rgba(255,255,255,0.14)',
            border: '1px solid rgba(255,255,255,0.35)',
            backdropFilter: 'blur(18px) saturate(160%)',
            WebkitBackdropFilter: 'blur(18px) saturate(160%)',
            color: '#fff',
            fontWeight: 700,
            boxShadow: '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.25)',
            pointerEvents: 'auto',
          }}
        >
          <ArrowLeft size={18} />
          {tr('ar_back', 'Back')}
        </button>
      </model-viewer>

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 sm:p-4">
        <div className="flex justify-between items-start">
          <span className="pointer-events-auto inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[var(--color-surface)]/85 backdrop-blur-md border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)]">
            <Box size={13} /> {tr('viewer_3d_badge', '3D')}
          </span>
          <button
            onClick={resetView}
            className="pointer-events-auto p-2 rounded-full bg-[var(--color-surface)]/85 backdrop-blur-md border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
            aria-label={tr('viewer_reset', 'Reset view')}
            title={tr('viewer_reset', 'Reset view')}
          >
            <RotateCcw size={15} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {model.variants && model.variants.length > 0 && (
            <div className="pointer-events-auto self-center flex items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-surface)]/85 backdrop-blur-md border border-[var(--color-border)] px-2.5 py-2 overflow-x-auto max-w-full scrollbar-hide">
              {model.variants.map((v) => {
                const isActive = v.id === activeVariant;
                const swatch = v.swatch || v.colorHex;
                return (
                  <button
                    key={v.id}
                    onClick={() => onPickVariant(v)}
                    title={localized(v.label)}
                    aria-label={localized(v.label)}
                    aria-pressed={isActive}
                    className={`shrink-0 w-8 h-8 rounded-full border-2 transition-transform ${
                      isActive
                        ? 'border-[var(--color-primary)] scale-110'
                        : 'border-[var(--color-border)] hover:scale-105'
                    }`}
                    style={
                      swatch && swatch.startsWith('#')
                        ? { backgroundColor: swatch }
                        : swatch
                          ? { backgroundImage: `url(${swatch})`, backgroundSize: 'cover' }
                          : { backgroundColor: 'var(--color-surface-2)' }
                    }
                  />
                );
              })}
            </div>
          )}

          <motion.button
            onClick={enterAR}
            whileTap={{ scale: 0.96 }}
            className="pointer-events-auto self-center inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-primary)] text-[var(--color-ink-on-gold)] font-bold px-5 py-2.5 shadow-[var(--gold-glow)]"
          >
            <Move3d size={17} />
            {tr('viewer_view_in_ar', 'View in your space')}
          </motion.button>
        </div>
      </div>

      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <View size={28} className="text-[var(--color-text-secondary)] animate-pulse" />
        </div>
      )}

      {arUrl && (
        <DesktopHandoffSheet
          open={arQrOpen}
          onClose={() => setArQrOpen(false)}
          title={tr('viewer_ar_qr_title', 'View in AR on your phone')}
          description={tr('viewer_ar_qr_desc', 'Scan this code with your phone to open the model in augmented reality. Your room, your piece — seamlessly.')}
          url={arUrl}
          qrLabel={tr('viewer_ar_qr_hint', 'Scan to open AR')}
        />
      )}
    </div>
  );
};

export default ModelViewer3D;
