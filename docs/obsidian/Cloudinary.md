---
type: integration
tags: [cloudinary, files, upload]
---

# Cloudinary

**All file hosting** for this project. Firebase Storage is not used.

## What goes to Cloudinary

| Asset | Folder | Resource type |
|-------|--------|---------------|
| Product images | default | `image` |
| Hero / category images | default | `image` |
| GLB 3D models | `models/` | `raw` (or `auto`) |
| Scan frames | `scans/{scanId}/` | `image` |

## Code

- `lib/cloudinaryUpload.ts` — shared upload helpers
- `lib/modelUpload.ts` — GLB optimize + upload
- `lib/scan.ts` — scan frame upload
- `pages/Admin.tsx` — product image uploads
- `server/app.ts` — `/api/cloudinary/delete` (server secret)

## Env

```
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
CLOUDINARY_API_KEY=      # server only
CLOUDINARY_API_SECRET=   # server only
```

## GLB upload requirement

In Cloudinary dashboard → Upload presets → your **unsigned** preset:

- Enable **Raw** (or **Auto**) resource types
- Allow `.glb` / large files as needed

If upload fails with "not allowed", fix preset — not Firestore rules.

## Related

- [[3D and AR]]
- [[Environment Variables]]
- [[Roles and Permissions]]
