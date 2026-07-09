import { useEffect, useRef, useState } from 'react';

/**
 * Desktop-only document scrollbar: fixed overlay (no layout gutter),
 * hidden at rest, fades in while scrolling. Mobile/tablet use CSS hide.
 */
export const OverlayScrollbar: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [metrics, setMetrics] = useState({ top: 0, height: 0, show: false });
  const hideTimer = useRef<number | null>(null);
  const drag = useRef<{ startY: number; startScroll: number } | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine) and (min-width: 1024px)');

    const measure = () => {
      if (!mq.matches) {
        setMetrics({ top: 0, height: 0, show: false });
        return;
      }
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const viewH = window.innerHeight;
      const docH = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
      );
      if (docH <= viewH + 2) {
        setMetrics({ top: 0, height: 0, show: false });
        return;
      }
      const trackPad = 8;
      const trackH = viewH - trackPad * 2;
      const thumbH = Math.max(40, (viewH / docH) * trackH);
      const maxTop = trackH - thumbH;
      const thumbTop = trackPad + (scrollTop / (docH - viewH)) * maxTop;
      setMetrics({ top: thumbTop, height: thumbH, show: true });
    };

    const flash = () => {
      if (!mq.matches) return;
      measure();
      setVisible(true);
      if (hideTimer.current != null) window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => {
        setVisible(false);
        hideTimer.current = null;
      }, 900);
    };

    const onScroll = () => flash();
    const onResize = () => measure();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    mq.addEventListener?.('change', onResize);
    measure();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      mq.removeEventListener?.('change', onResize);
      if (hideTimer.current != null) window.clearTimeout(hideTimer.current);
    };
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!drag.current) return;
      const viewH = window.innerHeight;
      const docH = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
      );
      const trackPad = 8;
      const trackH = viewH - trackPad * 2;
      const thumbH = Math.max(40, (viewH / docH) * trackH);
      const maxTop = trackH - thumbH;
      const delta = e.clientY - drag.current.startY;
      const scrollRange = docH - viewH;
      const next = drag.current.startScroll + (delta / maxTop) * scrollRange;
      window.scrollTo({ top: Math.max(0, Math.min(scrollRange, next)), behavior: 'auto' });
    };
    const onUp = () => { drag.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  if (!metrics.show) return null;

  return (
    <div
      className="rf-overlay-scrollbar"
      aria-hidden
      data-visible={visible ? 'true' : 'false'}
    >
      <button
        type="button"
        className="rf-overlay-scrollbar__thumb"
        style={{ top: metrics.top, height: metrics.height }}
        tabIndex={-1}
        onMouseDown={(e) => {
          e.preventDefault();
          drag.current = {
            startY: e.clientY,
            startScroll: window.scrollY || document.documentElement.scrollTop,
          };
          setVisible(true);
        }}
      />
    </div>
  );
};

export default OverlayScrollbar;
