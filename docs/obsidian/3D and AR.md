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
- Frames → Cloudinary `scans/{scanId}/`
- Metadata → Firestore `scans` collection
- Optional: `VITE_PHOTOGRAMMETRY_API_URL` for auto reconstruction

## Mobile handoff

Desktop starts scan → QR → `/m/scan/:scanId` on phone

## Related

- [[Cloudinary]]
- [[Roles and Permissions]]
- [[Changelog 2026-07-08]]
