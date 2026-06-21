'use client';

/**
 * ScrollVideoHero — full-bleed, scroll-scrubbed hero (client component).
 *
 * Scrubbing a <video> via currentTime is unreliable (the browser only repaints
 * keyframes, so fast scroll leaves the frame stuck). Instead we pre-extract the
 * clip into an image sequence (public/scroll-frames/frame-NNN.jpg) and draw the
 * frame matching scroll progress onto a <canvas> — instant, smooth, no seeking.
 *
 * A sticky inner stage keeps the canvas pinned to the viewport while the captions
 * crossfade over it. Pure presentation: copy comes in via `captions`. Honors
 * prefers-reduced-motion by drawing a single static frame with static text.
 */
import { useEffect, useRef, useState } from 'react';

export type HeroCaption = { title: string; subtitle?: string };

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

export function ScrollVideoHero({
  frameCount = 120,
  framePath = '/scroll-frames',
  captions,
  /** Total scroll length of the section, in svh. Higher = slower, longer scrub. */
  scrollHeightVh = 360,
}: {
  frameCount?: number;
  framePath?: string;
  captions: HeroCaption[];
  scrollHeightVh?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const loadedRef = useRef<boolean[]>([]);
  const lastDrawnRef = useRef(-1);

  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Reduced-motion preference.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const frameSrc = (i: number) =>
    `${framePath}/frame-${String(i).padStart(3, '0')}.jpg`;

  // Cover-fit draw of one frame onto the canvas (crops to fill, never letterboxes).
  const drawFrame = (index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const loaded = loadedRef.current;
    // Snap to the nearest already-loaded frame so we never draw a blank.
    let idx = index;
    if (!loaded[idx]) {
      let best = -1;
      for (let d = 1; d < frameCount; d++) {
        if (loaded[idx - d]) { best = idx - d; break; }
        if (loaded[idx + d]) { best = idx + d; break; }
      }
      if (best < 0) return;
      idx = best;
    }
    if (idx === lastDrawnRef.current) return;
    const img = imagesRef.current[idx];
    const ctx = canvas.getContext('2d');
    if (!ctx || !img) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
    }
    const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = (canvas.width - dw) / 2;
    const dy = (canvas.height - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
    lastDrawnRef.current = idx;
  };

  // Preload the frame sequence.
  useEffect(() => {
    loadedRef.current = new Array(frameCount).fill(false);
    imagesRef.current = new Array(frameCount);
    let cancelled = false;
    let loadedCount = 0;
    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        if (cancelled) return;
        loadedRef.current[i] = true;
        loadedCount++;
        // First frame in → paint immediately so there's never a black flash.
        if (i === 0 || lastDrawnRef.current < 0) drawFrame(lastDrawnRef.current < 0 ? 0 : lastDrawnRef.current);
        if (loadedCount === 1) setReady(true);
      };
      img.src = frameSrc(i);
      imagesRef.current[i] = img;
    }
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameCount, framePath]);

  // Track scroll progress and redraw the matching frame.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = wrapRef.current;
      if (!el) return;
      let p = 0;
      if (!reduceMotion) {
        const rect = el.getBoundingClientRect();
        const scrollable = rect.height - window.innerHeight;
        p = scrollable > 0 ? clamp(-rect.top / scrollable, 0, 1) : 0;
      }
      setProgress(p);
      const frame = reduceMotion ? 0 : Math.round(p * (frameCount - 1));
      drawFrame(frame);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => { lastDrawnRef.current = -1; onScroll(); });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion, frameCount]);

  const n = captions.length;
  const step = n > 1 ? 1 / (n - 1) : 1;

  return (
    <section
      ref={wrapRef}
      aria-label="Nibash intro"
      className="relative w-full"
      style={{ height: reduceMotion ? '100svh' : `${scrollHeightVh}svh` }}
    >
      {/* Sticky stage pinned to the viewport while the wrapper scrolls past. */}
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden bg-black">
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 h-full w-full transition-opacity duration-500"
          style={{ opacity: ready ? 1 : 0 }}
        />

        {/* Legibility gradient over the footage. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/70"
        />

        {/* Caption layers — crossfade as scroll progress passes each center. */}
        <div className="absolute inset-0">
          {captions.map((c, i) => {
            const center = n > 1 ? i * step : 0.5;
            const opacity = reduceMotion
              ? i === 0 ? 1 : 0
              : clamp(1 - Math.abs(progress - center) / step, 0, 1);
            const Heading = i === 0 ? 'h1' : 'h2';
            return (
              <div
                key={i}
                className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
                style={{
                  opacity,
                  transform: `translateY(${(1 - opacity) * 24}px)`,
                  pointerEvents: opacity > 0.5 ? 'auto' : 'none',
                }}
                aria-hidden={opacity < 0.5}
              >
                <Heading className="font-display text-4xl font-bold text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)] md:text-6xl">
                  {c.title}
                </Heading>
                {c.subtitle ? (
                  <p className="mt-4 max-w-2xl text-lg text-white/90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] md:text-xl">
                    {c.subtitle}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Scroll cue — fades out once the user starts scrubbing. */}
        {!reduceMotion ? (
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-2 text-white/80 transition-opacity duration-300"
            style={{ opacity: clamp(1 - progress * 6, 0, 1) }}
          >
            <span className="text-xs font-medium uppercase tracking-widest">Scroll</span>
            <span className="h-9 w-5 rounded-pill border-2 border-white/70">
              <span className="mx-auto mt-1.5 block h-1.5 w-1.5 animate-bounce rounded-full bg-white/80" />
            </span>
          </div>
        ) : null}

        {/* Bottom fade into the page surface below for a smooth handoff. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-surface-base"
        />
      </div>
    </section>
  );
}
