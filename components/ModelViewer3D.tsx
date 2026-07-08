import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { View, Box, RotateCcw, Move3d } from 'lucide-react';
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
  model, productName, productPageUrl, autoAr, preferredColor, preferredMaterial, t, className = '',
}) => {
  const ref = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [arQrOpen, setArQrOpen] = useState(false);
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

  useEffect(() => {
    const mv = ref.current;
    if (!mv) return;
    const onLoad = () => {
      setLoaded(true);
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
    return () => mv.removeEventListener('load', onLoad);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model.url, autoAr]);

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

  return (
    <div className={`relative w-full ${className}`}>
      {/* @ts-ignore — web component */}
      <model-viewer
        ref={ref}
        src={model.url}
        ios-src={model.iosUrl}
        poster={model.poster}
        alt={model.alt || `3D model of ${productName}`}
        camera-controls
        touch-action="pan-y"
        auto-rotate
        rotation-per-second="18deg"
        interaction-prompt="auto"
        shadow-intensity="1"
        shadow-softness="0.85"
        exposure="1"
        ar
        ar-modes="webxr scene-viewer quick-look"
        ar-scale="fixed"
        ar-placement="floor"
        loading="lazy"
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
        <div slot="progress-bar" />
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
