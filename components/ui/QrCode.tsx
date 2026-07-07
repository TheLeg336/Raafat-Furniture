import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QrCodeProps {
  value: string;
  size?: number;
  className?: string;
  label?: string;
}

/** Renders a QR code to canvas for desktop → phone handoff flows. */
export const QrCode: React.FC<QrCodeProps> = ({ value, size = 220, className = '', label }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    QRCode.toCanvas(canvas, value, {
      width: size,
      margin: 2,
      color: { dark: '#14213D', light: '#FFFFFF' },
    }).catch(() => { /* invalid url */ });
  }, [value, size]);

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <canvas ref={canvasRef} role="img" aria-label={label || 'QR code'} className="rounded-xl bg-white p-2 shadow-md" />
      {label && <p className="text-sm text-center text-[var(--color-text-secondary)] max-w-xs">{label}</p>}
    </div>
  );
};

export default QrCode;
