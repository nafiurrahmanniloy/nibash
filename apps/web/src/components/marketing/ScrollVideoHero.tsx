'use client';

/**
 * ScrollVideoHero — full-bleed, scroll-scrubbed hero (client component).
 *
 * Scrubbing a <video> via currentTime is unreliable (browsers only repaint
 * keyframes on fast seeks, so the frame sticks). Instead the clip is pre-extracted
 * into an image sequence (public/scroll-frames/frame-NNN.jpg) and the frame
 * matching scroll progress is drawn onto a <canvas>.
 *
 * Performance: the scroll path is fully IMPERATIVE — no React state per scroll
 * event. One rAF reads scroll, draws the canvas, and writes caption opacity/
 * transform straight to the DOM. Frames are decoded up front so drawImage is
 * instant (no black flashes / lag). A sticky stage pins the canvas while captions
 * crossfade. Honors prefers-reduced-motion (single static frame + static text).
 */
import { useEffect, useRef, useState } from 'react';

export type HeroCaption = { title: string; subtitle?: string };

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

export function ScrollVideoHero({
  frameCount = 120,
  framePath = '/scroll-frames',
  captions,
  /** Scroll length of the section, in svh. Longer = slower, smoother scrub. */
  scrollHeightVh = 500,
}: {
  frameCount?: number;
  framePath?: string;
  captions: HeroCaption[];
  scrollHeightVh?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const cueRef = useRef<HTMLDivElement | null>(null);

  const imagesRef = useRef<HTMLImageElement[]>([]);
  const loadedRef = useRef<boolean[]>([]);
  const lastDrawnRef = useRef(-1);
  const reduceMotionRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const n = captions.length;
  const step = n > 1 ? 1 / (n - 1) : 1;

  // Reduced-motion preference (mirrored into a ref for the scroll loop).
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const set = (v: boolean) => { reduceMotionRef.current = v; setReduceMotion(v); };
    set(mq.matches);
    const onChange = (e: MediaQueryListEvent) => set(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const frameSrc = (i: number) =>
    `${framePath}/frame-${String(i).padStart(3, '0')}.jpg`;

  // Cover-fit draw of one frame onto the canvas (crops to fill).
  const drawFrame = (index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const loaded = loadedRef.current;
    let idx = index;
    if (!loaded[idx]) {
      // Snap to the nearest loaded frame so we never draw black.
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
    const targetW = Math.round(cw * dpr);
    const targetH = Math.round(ch * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.drawImage(img, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
    lastDrawnRef.current = idx;
  };

  // Imperatively apply caption + cue state for a given progress.
  const applyProgress = (p: number) => {
    for (let i = 0; i < n; i++) {
      const el = captionRefs.current[i];
      if (!el) continue;
      const center = n > 1 ? i * step : 0.5;
      const o = clamp(1 - Math.abs(p - center) / step, 0, 1);
      el.style.opacity = String(o);
      el.style.transform = `translate3d(0, ${(1 - o) * 22}px, 0)`;
      el.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
    }
    if (cueRef.current) cueRef.current.style.opacity = String(clamp(1 - p * 6, 0, 1));
  };

  // Preload + decode the frame sequence.
  useEffect(() => {
    loadedRef.current = new Array(frameCount).fill(false);
    imagesRef.current = new Array(frameCount);
    lastDrawnRef.current = -1;
    let cancelled = false;
    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      img.decoding = 'async';
      if (i === 0) img.fetchPriority = 'high';
      const markReady = () => {
        if (cancelled) return;
        loadedRef.current[i] = true;
        if (lastDrawnRef.current < 0) { drawFrame(0); setReady(true); }
      };
      img.onload = () => {
        // Decode before marking loaded so the first drawImage can't jank.
        if (img.decode) img.decode().then(markReady).catch(markReady);
        else markReady();
      };
      img.src = frameSrc(i);
      imagesRef.current[i] = img;
    }
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameCount, framePath]);

  // Single rAF-driven scroll loop. No React re-renders here.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = wrapRef.current;
      if (!el) return;
      const rm = reduceMotionRef.current;
      let p = 0;
      if (!rm) {
        const rect = el.getBoundingClientRect();
        const scrollable = rect.height - window.innerHeight;
        p = scrollable > 0 ? clamp(-rect.top / scrollable, 0, 1) : 0;
      }
      drawFrame(rm ? 0 : Math.round(p * (frameCount - 1)));
      applyProgress(rm ? 0 : p);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    const onResize = () => { lastDrawnRef.current = -1; onScroll(); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (raf) cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameCount, reduceMotion]);

  return (
    <section
      ref={wrapRef}
      aria-label="Nibash intro"
      className="relative w-full"
      style={{ height: reduceMotion ? '100svh' : `${scrollHeightVh}svh` }}
    >
      {/* Sticky stage pinned to the viewport while the wrapper scrolls past. */}
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden bg-surface-base">
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 h-full w-full transition-opacity duration-700"
          style={{ opacity: ready ? 1 : 0 }}
        />

        {/* Legibility gradient — lighter than before so the footage stays bright. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/10 to-black/45"
        />

        {/* Caption layers — crossfade, written imperatively from the scroll loop. */}
        <div className="absolute inset-0">
          {captions.map((c, i) => {
            const Heading = i === 0 ? 'h1' : 'h2';
            return (
              <div
                key={i}
                ref={(el) => { captionRefs.current[i] = el; }}
                className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center will-change-[opacity,transform]"
                style={{ opacity: i === 0 ? 1 : 0, pointerEvents: i === 0 ? 'auto' : 'none' }}
                aria-hidden={i !== 0}
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
            ref={cueRef}
            aria-hidden="true"
            className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-2 text-white/85 transition-opacity"
          >
            <span className="text-xs font-medium uppercase tracking-widest">Scroll</span>
            <span className="h-9 w-5 rounded-pill border-2 border-white/70">
              <span className="mx-auto mt-1.5 block h-1.5 w-1.5 animate-bounce rounded-full bg-white/80" />
            </span>
          </div>
        ) : null}

        {/* Tall bottom fade into the page surface for a seamless handoff. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-surface-base"
        />
      </div>
    </section>
  );
}
