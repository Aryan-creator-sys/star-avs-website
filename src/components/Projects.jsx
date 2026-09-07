import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "../lib/gsap";
import { ASSETS } from "../data/site";

/**
 * Client Work — an editorial index with a single floating preview image that:
 *  · follows the cursor with inertia (gsap.quickTo lerp)
 *  · morphs between projects (two stacked layers, clip-path reveal — never destroyed)
 *  · tilts / skews with pointer velocity, settling with damping
 *  · scales 0.85→1 on enter, →0 on exit; a "VIEW →" label rides with it
 *  · magnetically eases toward the hovered row
 * All motion runs on the GSAP ticker via refs — no React state on mousemove.
 * Distortion + preview are desktop-only; respects prefers-reduced-motion.
 */
export default function Projects() {
  const items = ASSETS.installations;
  const filters = useMemo(() => ["All", ...Array.from(new Set(items.map((i) => i.tag)))], [items]);
  const [active, setActive] = useState("All");

  const root = useRef(null);
  const previewRef = useRef(null);
  const layerA = useRef(null);
  const layerB = useRef(null);
  const labelRef = useRef(null);
  const rowsRef = useRef(null);

  // mutable interaction state (no re-renders)
  const st = useRef({
    x: 0, y: 0, tx: 0, ty: 0, px: 0, py: 0, vel: 0,
    shown: false, curLayer: 0, curSrc: null, hoverEl: null,
  }).current;

  const visible = useMemo(
    () => items.filter((i) => active === "All" || i.tag === active),
    [items, active]
  );

  useLayoutEffect(() => {
    const desktop = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!desktop || reduce) return; // touch / reduced-motion: plain list, no floating preview

    const ctx = gsap.context(() => {
      const preview = previewRef.current;
      const label = labelRef.current;
      gsap.set(preview, { xPercent: -50, yPercent: -50, scale: 0.85, autoAlpha: 0 });
      gsap.set(label, { xPercent: -50, yPercent: -50, scale: 0.85, autoAlpha: 0 });

      const xTo = gsap.quickTo(preview, "x", { duration: 0.55, ease: "power3" });
      const yTo = gsap.quickTo(preview, "y", { duration: 0.55, ease: "power3" });
      const rotTo = gsap.quickTo(preview, "rotation", { duration: 0.6, ease: "power3" });
      const skewTo = gsap.quickTo(preview, "skewX", { duration: 0.6, ease: "power3" });
      const lxTo = gsap.quickTo(label, "x", { duration: 0.75, ease: "power3" });
      const lyTo = gsap.quickTo(label, "y", { duration: 0.75, ease: "power3" });

      const onMove = (e) => {
        st.tx = e.clientX;
        st.ty = e.clientY;
      };
      window.addEventListener("pointermove", onMove, { passive: true });

      const tick = () => {
        // velocity from smoothed target delta
        const dx = st.tx - st.px;
        const dy = st.ty - st.py;
        st.px = st.tx;
        st.py = st.ty;
        const speed = Math.min(Math.hypot(dx, dy), 90);
        st.vel += (speed - st.vel) * 0.12;

        if (st.shown && st.hoverEl) {
          // magnetic pull a touch toward the hovered image centre
          const r = st.hoverEl.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          const gx = st.tx + (cx - st.tx) * 0.12;
          const gy = st.ty + (cy - st.ty) * 0.12;
          xTo(gx);
          yTo(gy);
          lxTo(st.tx + 14);
          lyTo(st.ty + 14);
          // velocity → tilt + skew (restrained)
          rotTo(gsap.utils.clamp(-6, 6, dx * 0.12));
          skewTo(gsap.utils.clamp(-5, 5, dx * 0.06));
        }
      };
      gsap.ticker.add(tick);

      // morph preview to a new src using the two stacked layers + clip reveal
      const layers = [layerA.current, layerB.current];
      const setImage = (src) => {
        if (src === st.curSrc) return;
        st.curSrc = src;
        const next = (st.curLayer + 1) % 2;
        const nextEl = layers[next];
        const curEl = layers[st.curLayer];
        nextEl.src = src;
        gsap.set(nextEl, { clipPath: "inset(0 0 100% 0)", autoAlpha: 1, scale: 1.06 });
        gsap.to(nextEl, { clipPath: "inset(0 0 0% 0)", scale: 1, duration: 0.55, ease: "power3.out" });
        gsap.to(curEl, { autoAlpha: 0, duration: 0.4, ease: "power2.out", delay: 0.1 });
        st.curLayer = next;
      };

      const rows = gsap.utils.toArray(".proj-row", rowsRef.current);
      const enterHandlers = [];
      rows.forEach((row) => {
        const src = row.dataset.src;
        const onEnter = () => {
          st.hoverEl = row;
          setImage(src);
          if (!st.shown) {
            st.shown = true;
            gsap.to(preview, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "power3.out", overwrite: true });
            gsap.to(label, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "power3.out", overwrite: true });
          }
          gsap.to(row.querySelector(".proj-title"), { xPercent: 2, color: "#101012", duration: 0.4, ease: "power2.out" });
        };
        const onLeave = () => {
          gsap.to(row.querySelector(".proj-title"), { xPercent: 0, color: "", duration: 0.4, ease: "power2.out" });
        };
        row.addEventListener("pointerenter", onEnter);
        row.addEventListener("pointerleave", onLeave);
        enterHandlers.push([row, onEnter, onLeave]);
      });

      // exit the whole gallery: preview follows briefly, then shrinks away
      const gallery = rowsRef.current;
      const onGalleryLeave = () => {
        st.shown = false;
        st.hoverEl = null;
        gsap.to(preview, { autoAlpha: 0, scale: 0.7, duration: 0.45, ease: "power3.in", overwrite: true });
        gsap.to(label, { autoAlpha: 0, scale: 0.7, duration: 0.4, ease: "power3.in", overwrite: true });
      };
      gallery.addEventListener("pointerleave", onGalleryLeave);

      // scroll: numbers + titles reveal progressively
      gsap.from(".proj-row", {
        yPercent: 40,
        autoAlpha: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.06,
        scrollTrigger: { trigger: rowsRef.current, start: "top 78%" },
      });

      return () => {
        window.removeEventListener("pointermove", onMove);
        gsap.ticker.remove(tick);
        enterHandlers.forEach(([row, en, lv]) => {
          row.removeEventListener("pointerenter", en);
          row.removeEventListener("pointerleave", lv);
        });
        gallery.removeEventListener("pointerleave", onGalleryLeave);
      };
    }, root);

    return () => ctx.revert();
  }, [visible.length, active, st]);

  return (
    <section id="work" ref={root} className="relative bg-[#f6f6f4] px-6 py-[14vh]">
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-10 max-w-2xl md:mb-16">
          <p className="mb-4 text-[0.72rem] font-medium uppercase tracking-[0.35em] text-black/60">
            From the technology to the experience
          </p>
          <h2 className="font-display text-display font-semibold tracking-tightest text-[#101012]">
            Real installations.
          </h2>
          <p className="mt-5 text-black/60">
            You've seen what the technology can do. This is what we actually build.
          </p>
        </div>

        {/* editorial index */}
        <div ref={rowsRef} className="border-t border-black/10">
          {visible.map((p, i) => (
            <a
              key={p.src}
              href="#contact"
              data-src={p.src}
              className="proj-row group grid grid-cols-[auto_1fr_auto] items-center gap-6 border-b border-black/10 py-7 md:py-9"
            >
              <span className="proj-num font-display text-sm tabular-nums text-black/55">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="proj-title font-display text-[clamp(1.5rem,4vw,3rem)] font-semibold leading-none tracking-tightest text-black/70 transition-colors">
                {p.title}
              </span>
              <span className="text-xs uppercase tracking-[0.2em] text-black/55 md:text-sm">{p.tag}</span>
            </a>
          ))}
        </div>

        {/* mobile / reduced-motion: simple image grid fallback */}
        <div className="mt-10 grid grid-cols-2 gap-3 md:hidden">
          {visible.map((p) => (
            <div key={p.src} className="relative aspect-[4/3] overflow-hidden rounded-xl">
              <img src={p.src} alt={p.title} loading="lazy" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      {/* floating preview (desktop) — two stacked layers for seamless morphing */}
      <div
        ref={previewRef}
        className="pointer-events-none fixed left-0 top-0 z-[60] hidden h-[300px] w-[420px] overflow-hidden rounded-xl shadow-2xl md:block"
        style={{ willChange: "transform" }}
        aria-hidden="true"
      >
        <img ref={layerA} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <img ref={layerB} alt="" className="absolute inset-0 h-full w-full object-cover opacity-0" />
      </div>
      <div
        ref={labelRef}
        className="pointer-events-none fixed left-0 top-0 z-[61] hidden select-none rounded-full bg-[#101012] px-4 py-2 text-xs font-semibold tracking-wide text-white md:block"
        style={{ willChange: "transform" }}
        aria-hidden="true"
      >
        VIEW →
      </div>
    </section>
  );
}
