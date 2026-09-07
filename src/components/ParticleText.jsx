import { useEffect, useRef } from "react";

/**
 * Particle text (hero-only). The headline is rendered to an offscreen canvas,
 * sampled into particles that scatter in and gather into the letters, drift
 * idly, and repel from the pointer, then return smoothly. Supports multi-line
 * ("\n") and left/centre alignment. One rAF loop, refs only (no per-frame
 * React state). Respects prefers-reduced-motion. Re-samples on resize.
 */
export default function ParticleText({
  text = "Star",
  particleSize = 2.4,
  density = 4,
  color = "#f4f4f6",
  highlightColor = "#c9a24b",
  scatter = 190,
  gatherDuration = 1600,
  stagger = 420,
  pointerRepel = 42,
  repelRadius = 120,
  idleDrift = 0.8,
  fontWeight = 800,
  fontFamily = "inherit",
  align = "center",
  valign = "center",
  padX = 2,
  padBottom = 10,
  maxFontPx = 240,
  fillRatio = 0.62,
  glow = false,
  className = "",
}) {
  const wrap = useRef(null);
  const canvas = useRef(null);

  useEffect(() => {
    const host = wrap.current;
    const cvs = canvas.current;
    if (!host || !cvs) return;
    const ctx = cvs.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover:hover) and (pointer:fine)").matches;

    let particles = [];
    let raf = 0;
    let startT = 0;
    let seeded = false;
    let lastW = 0, lastH = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    const mouse = { x: -9999, y: -9999 };
    const lines = String(text).split("\n");
    const resolvedFamily = fontFamily === "inherit" ? getComputedStyle(host).fontFamily : fontFamily;

    function build(initial) {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;
      lastW = w; lastH = h;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cvs.width = w * dpr;
      cvs.height = h * dpr;
      cvs.style.width = w + "px";
      cvs.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // fit font primarily by width (so a tall full-hero canvas doesn't blow it up)
      const targetW = w * (align === "left" ? 0.72 : 0.92);
      let fontPx = Math.min(maxFontPx, h);
      ctx.font = `${fontWeight} ${fontPx}px ${resolvedFamily}`;
      while (lines.some((l) => ctx.measureText(l).width > targetW) && fontPx > 12) {
        fontPx -= 2;
        ctx.font = `${fontWeight} ${fontPx}px ${resolvedFamily}`;
      }
      // cap total height so it stays a compact heading within a large canvas
      while (fontPx * 1.04 * lines.length > h * fillRatio && fontPx > 12) fontPx -= 2;

      const lineH = fontPx * 1.04;
      const totalH = lineH * lines.length;
      const startY =
        valign === "bottom"
          ? h - padBottom - totalH + lineH / 2
          : (h - totalH) / 2 + lineH / 2;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#fff";
      ctx.textAlign = align;
      ctx.textBaseline = "middle";
      ctx.font = `${fontWeight} ${fontPx}px ${resolvedFamily}`;
      const x = align === "left" ? padX : w / 2;
      lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineH));

      const img = ctx.getImageData(0, 0, w * dpr, h * dpr).data;
      const step = Math.max(2, Math.round(7 / density)) * Math.max(1, Math.round(dpr));
      const next = [];
      for (let y = 0; y < h * dpr; y += step) {
        for (let x2 = 0; x2 < w * dpr; x2 += step) {
          if (img[(y * w * dpr + x2) * 4 + 3] > 128) {
            const tx = x2 / dpr, ty = y / dpr;
            next.push({
              tx, ty,
              x: reduce || !initial ? tx : tx + (Math.random() - 0.5) * scatter * 2,
              y: reduce || !initial ? ty : ty + (Math.random() - 0.5) * scatter * 2,
              delay: initial ? Math.random() * stagger : 0,
              ph: Math.random() * Math.PI * 2,
            });
          }
        }
      }
      particles = next;
      seeded = true;
      ctx.clearRect(0, 0, w, h);
    }

    function draw(now) {
      raf = requestAnimationFrame(draw);
      if (!startT) startT = now;
      const t = now - startT;
      const w = cvs.width / dpr, h = cvs.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.shadowBlur = glow ? 2.5 : 0;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const gp = Math.max(0, Math.min(1, (t - p.delay) / gatherDuration));
        const ease = 1 - Math.pow(1 - gp, 3);
        p.x += (p.tx - p.x) * (0.06 + 0.12 * ease);
        p.y += (p.ty - p.y) * (0.06 + 0.12 * ease);
        if (gp >= 1 && idleDrift) {
          p.ph += 0.02;
          p.x += Math.cos(p.ph) * idleDrift * 0.15;
          p.y += Math.sin(p.ph) * idleDrift * 0.15;
        }
        let hot = false;
        if (fine) {
          const dx = p.x - mouse.x, dy = p.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < repelRadius) {
            const f = (1 - dist / repelRadius) * pointerRepel;
            p.x += (dx / (dist || 1)) * f;
            p.y += (dy / (dist || 1)) * f;
            hot = true;
          }
        }
        ctx.fillStyle = hot ? highlightColor : color;
        ctx.shadowColor = hot ? highlightColor : color;
        ctx.fillRect(p.x, p.y, particleSize, particleSize);
      }
    }

    const onMove = (e) => {
      const r = cvs.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999; };

    build(true);
    if (reduce) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = color;
      particles.forEach((p) => ctx.fillRect(p.tx, p.ty, particleSize, particleSize));
    } else {
      raf = requestAnimationFrame(draw);
    }
    // track pointer globally so repulsion works even though copy sits over the canvas
    if (fine) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerleave", onLeave);
    }
    // when the (variable) webfont finishes loading, re-sample so the particles
    // trace the real Cabinet Grotesk glyphs rather than the fallback shapes.
    let fontsCancelled = false;
    if (!reduce && document.fonts && typeof document.fonts.ready?.then === "function") {
      document.fonts.ready.then(() => {
        if (fontsCancelled || !host.clientWidth || !host.clientHeight) return;
        build(false); // keep positions, just retarget onto the correct glyphs
      });
    }

    // rebuild only on a *real* size change; never restart the gather on spurious
    // 0-width / unchanged fires (which would keep re-scattering the particles)
    const ro = new ResizeObserver(() => {
      const w = host.clientWidth, h = host.clientHeight;
      if (!w || !h) return;
      if (!seeded) { startT = 0; build(true); return; } // first real size → scatter in
      if (w === lastW && h === lastH) return;
      build(false);
    });
    ro.observe(host);

    return () => {
      fontsCancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, [text, particleSize, density, color, highlightColor, scatter, gatherDuration, stagger, pointerRepel, repelRadius, idleDrift, fontWeight, fontFamily, align, valign, padX, padBottom, maxFontPx, fillRatio, glow]);

  return (
    <div ref={wrap} className={`relative h-full w-full ${className}`}>
      <canvas ref={canvas} className="pointer-events-none block h-full w-full" />
    </div>
  );
}
