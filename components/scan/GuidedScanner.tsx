import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Check, X, RotateCw, Ruler, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  createScanJob,
  uploadFrame,
  patchScan,
  requestReconstruction,
  reconstructionConfigured,
} from '../../lib/scan';
import type { ScanJob } from '../../types';

interface Props {
  createdBy: string;
  targetFrames?: number;
  onComplete: (scanId: string) => void;
  onCancel: () => void;
}

type Phase = 'intro' | 'capturing' | 'dimensions' | 'uploading' | 'done' | 'error';

/**
 * Guided object capture. The user slowly walks around the object; the site auto-captures
 * frames at even angular intervals (gated by device heading when available, else a manual
 * shutter). Frames + real dimensions are uploaded as a ScanJob; reconstruction runs on a
 * pluggable backend (see lib/scan.ts).
 */
export const GuidedScanner: React.FC<Props> = ({
  createdBy,
  targetFrames = 32,
  onComplete,
  onCancel,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const framesRef = useRef<Blob[]>([]);
  const headingRef = useRef<{ start: number | null; last: number | null }>({ start: null, last: null });

  const [phase, setPhase] = useState<Phase>('intro');
  const [count, setCount] = useState(0);
  const [headingSupported, setHeadingSupported] = useState(false);
  const [hint, setHint] = useState('Move slowly around the object');
  const [error, setError] = useState('');
  const [dims, setDims] = useState({ width: '', height: '', depth: '', unit: 'cm' as 'cm' | 'm' });
  const [progressMsg, setProgressMsg] = useState('');

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((tk) => tk.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const canvas = document.createElement('canvas');
    // Downscale to keep upload sizes sane; long edge ~1280.
    const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        framesRef.current.push(blob);
        setCount(framesRef.current.length);
        if (framesRef.current.length >= targetFrames) {
          setPhase('dimensions');
          stopCamera();
        }
      },
      'image/jpeg',
      0.82,
    );
  }, [targetFrames, stopCamera]);

  // Heading-gated auto capture (when DeviceOrientation available).
  useEffect(() => {
    if (phase !== 'capturing' || !headingSupported) return;
    const step = 360 / targetFrames;
    const onOrient = (e: DeviceOrientationEvent) => {
      const alpha = (e as any).webkitCompassHeading ?? e.alpha;
      if (alpha == null) return;
      const h = headingRef.current;
      if (h.start == null) {
        h.start = alpha;
        h.last = alpha;
        captureFrame();
        return;
      }
      // shortest angular delta since last capture
      let delta = Math.abs(alpha - (h.last as number));
      if (delta > 180) delta = 360 - delta;
      if (delta >= step) {
        h.last = alpha;
        captureFrame();
        setHint('Keep moving — steady and slow');
      }
    };
    window.addEventListener('deviceorientation', onOrient as any, true);
    return () => window.removeEventListener('deviceorientation', onOrient as any, true);
  }, [phase, headingSupported, targetFrames, captureFrame]);

  const startCapture = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      // Ask for orientation permission on iOS 13+.
      let oriented = false;
      const DOE: any = (window as any).DeviceOrientationEvent;
      if (DOE && typeof DOE.requestPermission === 'function') {
        try {
          const res = await DOE.requestPermission();
          oriented = res === 'granted';
        } catch {
          oriented = false;
        }
      } else if (DOE) {
        oriented = true;
      }
      setHeadingSupported(oriented);
      setHint(oriented ? 'Walk slowly around the object — frames capture automatically' : 'Tap the shutter from each angle as you circle the object');
      framesRef.current = [];
      headingRef.current = { start: null, last: null };
      setCount(0);
      setPhase('capturing');
    } catch (e: any) {
      setError(e?.name === 'NotAllowedError' ? 'Camera permission denied.' : e?.message || 'Could not start camera.');
      setPhase('error');
    }
  };

  const finishUpload = async () => {
    setPhase('uploading');
    setProgressMsg('Creating scan…');
    try {
      const scanId = await createScanJob(createdBy);
      const frameUrls: string[] = [];
      for (let i = 0; i < framesRef.current.length; i++) {
        setProgressMsg(`Uploading frame ${i + 1} of ${framesRef.current.length}…`);
        // eslint-disable-next-line no-await-in-loop
        const url = await uploadFrame(scanId, i, framesRef.current[i]);
        frameUrls.push(url);
      }
      const realDimensions = {
        width: dims.width ? Number(dims.width) : undefined,
        height: dims.height ? Number(dims.height) : undefined,
        depth: dims.depth ? Number(dims.depth) : undefined,
        unit: dims.unit,
      };
      await patchScan(scanId, {
        status: 'uploading',
        frameCount: frameUrls.length,
        frameUrls,
        realDimensions,
      });
      const job: ScanJob = {
        id: scanId,
        createdBy,
        status: 'uploading',
        frameCount: frameUrls.length,
        frameUrls,
        realDimensions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const dispatched = await requestReconstruction(job);
      setProgressMsg(
        dispatched
          ? 'Reconstruction started. The 3D model will appear here when ready.'
          : 'Frames saved and queued. Attach the finished GLB in the scan list, or it completes automatically once a reconstruction service is connected.',
      );
      setPhase('done');
      setTimeout(() => onComplete(scanId), 1800);
    } catch (e: any) {
      setError(e?.message || 'Upload failed.');
      setPhase('error');
    }
  };

  const pct = Math.min(100, Math.round((count / targetFrames) * 100));

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col" style={{ zIndex: 'var(--z-modal)' as any }}>
      <div className="flex items-center justify-between p-4">
        <h2 className="font-heading text-xl font-bold">Scan an object</h2>
        <button onClick={() => { stopCamera(); onCancel(); }} aria-label="Close scanner" className="p-2 rounded-full hover:bg-white/10">
          <X size={22} />
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {/* Live camera */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${phase === 'capturing' ? '' : 'opacity-0'}`}
        />

        {/* INTRO */}
        {phase === 'intro' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 gap-5">
            <Camera size={48} className="text-[var(--color-primary)]" />
            <p className="max-w-sm text-white/80">
              Place the object on the floor or a table with space to walk around it, in even light.
              Move slowly in a full circle. {targetFrames} frames will be captured.
            </p>
            <Button onClick={startCapture} iconLeft={<Camera size={18} />}>Start camera</Button>
            {!reconstructionConfigured() && (
              <p className="text-xs text-white/50 max-w-xs">
                Note: a reconstruction service isn't connected yet — frames will be saved &amp; queued, and
                you can attach the finished 3D model afterwards.
              </p>
            )}
          </div>
        )}

        {/* CAPTURING overlay */}
        {phase === 'capturing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-between p-6 pointer-events-none">
            <div className="mt-2 px-4 py-2 rounded-[var(--radius-pill)] bg-black/50 backdrop-blur-md text-sm">{hint}</div>

            {/* Progress ring */}
            <div className="relative">
              <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
                <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6" />
                <circle
                  cx="80" cy="80" r="70" fill="none" stroke="var(--color-primary)" strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 70}
                  strokeDashoffset={2 * Math.PI * 70 * (1 - pct / 100)}
                  style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{count}</span>
                <span className="text-xs text-white/60">/ {targetFrames}</span>
              </div>
            </div>

            {!headingSupported && (
              <button
                onClick={captureFrame}
                className="pointer-events-auto w-[72px] h-[72px] rounded-full bg-white border-4 border-[var(--color-primary)] flex items-center justify-center active:scale-95 transition-transform"
                aria-label="Capture frame"
              >
                <Camera size={26} className="text-black" />
              </button>
            )}
            {headingSupported && (
              <div className="flex items-center gap-2 text-sm text-white/70"><RotateCw size={16} /> auto-capturing</div>
            )}
          </div>
        )}

        {/* DIMENSIONS */}
        {phase === 'dimensions' && (
          <div className="absolute inset-0 bg-[var(--color-background)] text-[var(--color-text-primary)] overflow-y-auto">
            <div className="max-w-md mx-auto px-6 py-8 flex flex-col gap-5">
              <div className="flex items-center gap-2 text-[var(--color-primary)]"><Check size={20} /><span className="font-semibold">{count} frames captured</span></div>
              <div className="flex items-center gap-2"><Ruler size={18} /><h3 className="font-heading text-lg font-bold">Real-world dimensions</h3></div>
              <p className="text-sm text-[var(--color-text-secondary)] -mt-2">
                Used so the model appears at accurate size in AR. Optional but recommended.
              </p>
              <div className="grid grid-cols-3 gap-3">
                <Input label="Width" inputMode="decimal" value={dims.width} onChange={(e) => setDims((d) => ({ ...d, width: e.target.value }))} />
                <Input label="Height" inputMode="decimal" value={dims.height} onChange={(e) => setDims((d) => ({ ...d, height: e.target.value }))} />
                <Input label="Depth" inputMode="decimal" value={dims.depth} onChange={(e) => setDims((d) => ({ ...d, depth: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                {(['cm', 'm'] as const).map((u) => (
                  <button
                    key={u}
                    onClick={() => setDims((d) => ({ ...d, unit: u }))}
                    className={`px-4 py-2 rounded-[var(--radius-pill)] border text-sm font-semibold ${dims.unit === u ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}
                  >
                    {u}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="ghost" onClick={() => { framesRef.current = []; setCount(0); setPhase('intro'); }}>Retake</Button>
                <Button fullWidth onClick={finishUpload} iconRight={<Check size={18} />}>Save scan</Button>
              </div>
            </div>
          </div>
        )}

        {/* UPLOADING / DONE / ERROR */}
        {(phase === 'uploading' || phase === 'done' || phase === 'error') && (
          <div className="absolute inset-0 bg-[var(--color-background)] text-[var(--color-text-primary)] flex flex-col items-center justify-center text-center px-8 gap-4">
            {phase === 'uploading' && <Loader2 size={40} className="text-[var(--color-primary)] animate-spin" />}
            {phase === 'done' && <Check size={44} className="text-[var(--color-primary)]" />}
            {phase === 'error' && <X size={44} className="text-[var(--color-danger)]" />}
            <p className="max-w-sm text-[var(--color-text-secondary)]">{phase === 'error' ? error : progressMsg}</p>
            {phase === 'error' && <Button onClick={() => setPhase('intro')}>Try again</Button>}
          </div>
        )}
      </div>
    </div>
  );
};

export default GuidedScanner;
