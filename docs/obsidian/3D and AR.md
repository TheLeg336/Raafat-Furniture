---
type: feature
tags: [3d, ar, scan, cloudinary]
---

# 3D and AR

## Product 3D

- `<model-viewer>` via `components/ModelViewer3D.tsx`
- GLB URL stored on product `model3d.url` (Cloudinary — [[Cloudinary]])
- Variants: `colorHex`, `gltfVariant`, `materialName`
- Product color/material selectors sync to variant when labels match

## AR

- Mobile: `activateAR()` on capable devices
- Desktop: QR handoff to `?ar=1` on product URL

## Admin: upload GLB

`components/admin/Product3DFields.tsx` → upload → `lib/modelUpload.ts` → Cloudinary `models/`

## Admin: scan object

`components/scan/GuidedScanner.tsx`

- Portaled fullscreen overlay (z-index 2100, above nav)
- Camera with getUserMedia fallbacks
- **Manual guided capture**: 4 prompted passes — eye level (12), high angle (8), low angle (6), details (4) = 30 shots, manual shutter, 1920px JPEG
- Frames → Cloudinary `scans/{scanId}/`
- Metadata → Firestore `scans` collection (carries `productId` when started from an existing product)
- Reconstruction: local `scan-worker/` (preferred, free) or `VITE_PHOTOGRAMMETRY_API_URL`
- Manual fallback: **Attach GLB** button per queued scan in `Product3DFields`

## Scan worker (local PC, free)

`scan-worker/` — Node app run on any GPU PC (see its README):

- Watches Firestore `scans` for `status == 'queued'` (jobs wait until PC is on)
- Meshroom (CUDA) → obj2gltf → gltf-transform optimize → scaled to `realDimensions`
- Optional Blender USDZ for iPhone AR
- Uploads to Cloudinary `models/`, sets scan `ready`, auto-attaches to `products/{productId}.model3d`
- Dashboard with pending jobs + live log: http://localhost:8787

## Mobile handoff

Desktop starts scan → QR → `/m/scan/:scanId` on phone

## Related

- [[Cloudinary]]
- [[Roles and Permissions]]
- [[Changelog 2026-07-08]]
