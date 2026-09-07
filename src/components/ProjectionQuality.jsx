import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "../lib/gsap";
import { ASSETS, SHOWCASE, SHOWCASE_CLIPS } from "../data/site";

/**
 * "See the projection quality" — a cinematic product story, not a card grid.
 *
 *  · A projector sits in a dark room and throws a subtle beam onto a large screen.
 *  · The screen shows sharp 4K content; categories switch with a cinematic
 *    clip/scale transition (same projection system, different content).
 *  · Desktop mouse interactions (GSAP ticker, no per-frame React state):
 *      – projector tilts toward the cursor with inertia
 *      – the projected image parallaxes for depth
 *      – a "NATIVE 4K" detail loupe follows the cursor showing the SAME image
 *        magnified, proving sharpness without a paragraph of copy.
 *  · Small looping clips demonstrate 4K motion.
 * Mobile / reduced-motion: static screen + tap-to-switch, no loupe.
 */
export default function ProjectionQuality() {
  const [active, setActive] = useState(0);
  const root = useRef(null);
  const projRef = useRef(null);
  const imgA = useRef(null);
  const imgB = useRef(null);
  const loupe = useRef(null);
  const screenRef = useRef(null);
  const cur = useRef(0); // which layer is showing (0=A,1=B)
  const desktop = useRef(false);

  // ---- category transition (cinematic, not a plain fade) ----
  const transitionTo = (i) => {
    const layers = [imgA.current, imgB.current];
    const next = cur.current === 0 ? 1 : 0;
    const nextEl = layers[next];
    const curEl = layers[cur.current];
    nextEl.style.backgroundImage = `url(${SHOWCASE[i].src})`;
    gsap.set(nextEl, { clipPath: "inset(0 0 0 100%)", scale: 1.12, autoAlpha: 1 });
    gsap.to(nextEl, { clipPath: "inset(0 0 0 0%)", scale: 1, duration: 0.9, ease: "power3.inOut" });
    gsap.to(curEl, { scale: 1.06, autoAlpha: 0, duration: 0.7, ease: "power2.inOut" });
    if (loupe.current) loupe.current.style.backgroundImage = `url(${SHOWCASE[i].src})`;
    cur.current = next;
  };

  const select = (i) => {
    if (i === active) return;
    setActive(i);
    if (desktop.current) transitionTo(i);
  };

  useLayoutEffect(() => {
    desktop.current =
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      // seed first image
      imgA.current.style.backgroundImage = `url(${SHOWCASE[0].src})`;
      gsap.set(imgA.current, { autoAlpha: 1 });
      gsap.set(imgB.current, { autoAlpha: 0 });
      if (loupe.current) loupe.current.style.backgroundImage = `url(${SHOWCASE[0].src})`;

      // reveal the composition on scroll (beam + screen brighten)
      gsap.from(".pq-screen", { autoAlpha: 0, scale: 0.92, duration: 1.1, ease: "power3.out",
        scrollTrigger: { trigger: root.current, start: "top 70%" } });
      gsap.fromTo(".pq-beam", { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.2, ease: "power2.out",
        scrollTrigger: { trigger: root.current, start: "top 65%" } });
      gsap.from(".pq-headline", { yPercent: 40, autoAlpha: 0, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: root.current, start: "top 60%" } });

      if (!desktop.current) return;

      // ---- mouse-driven interactions on the GSAP ticker ----
      const screen = screenRef.current;
      const st = { tx: 0, ty: 0, inside: false, rx: 0, ry: 0 };

      const projRotX = gsap.quickTo(projRef.current, "rotationX", { duration: 0.9, ease: "power3" });
      const projRotY = gsap.quickTo(projRef.current, "rotationY", { duration: 0.9, ease: "power3" });
      const paraX = gsap.quickTo(".pq-imglayer", "xPercent", { duration: 0.9, ease: "power3" });
      const paraY = gsap.quickTo(".pq-imglayer", "yPercent", { duration: 0.9, ease: "power3" });
      const loupeX = gsap.quickTo(loupe.current, "x", { duration: 0.35, ease: "power3" });
      const loupeY = gsap.quickTo(loupe.current, "y", { duration: 0.35, ease: "power3" });

      const onWin = (e) => {
        // global cursor → projector tilt (subtle, whole section)
        const r = root.current.getBoundingClientRect();
        const nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        st.tx = e.clientX; st.ty = e.clientY;
        projRotY(gsap.utils.clamp(-5, 5, nx * 5));
        projRotX(gsap.utils.clamp(-4, 4, -ny * 4));
      };
      window.addEventListener("pointermove", onWin, { passive: true });

      const onEnter = () => { st.inside = true; gsap.to(loupe.current, { autoAlpha: 1, scale: 1, duration: 0.4, ease: "power3.out" }); };
      const onLeave = () => { st.inside = false; gsap.to(loupe.current, { autoAlpha: 0, scale: 0.6, duration: 0.35, ease: "power2.in" }); paraX(0); paraY(0); };
      const onMove = (e) => {
        const r = screen.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;   // 0..1
        const py = (e.clientY - r.top) / r.height;
        // parallax (subtle depth)
        paraX(gsap.utils.clamp(-3, 3, (px - 0.5) * -4));
        paraY(gsap.utils.clamp(-3, 3, (py - 0.5) * -4));
        // loupe position (follows cursor, offset so it doesn't hide the point)
        loupeX(e.clientX - r.left);
        loupeY(e.clientY - r.top);
        // magnified background position (same image, ~3.2x)
        loupe.current.style.backgroundPosition = `${px * 100}% ${py * 100}%`;
      };
      screen.addEventListener("pointerenter", onEnter);
      screen.addEventListener("pointerleave", onLeave);
      screen.addEventListener("pointermove", onMove, { passive: true });

      return () => {
        window.removeEventListener("pointermove", onWin);
        screen.removeEventListener("pointerenter", onEnter);
        screen.removeEventListener("pointerleave", onLeave);
        screen.removeEventListener("pointermove", onMove);
      };
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section id="quality" ref={root} className="relative overflow-hidden bg-[#f6f6f4] px-6 py-[16vh]">
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(70% 50% at 60% 40%, rgba(201,162,75,0.06), transparent 70%)" }} />

      <div className="relative mx-auto max-w-[1280px]">
        {/* heading */}
        <div className="pq-headline mb-12 max-w-2xl">
          <p className="mb-4 text-[0.72rem] font-medium uppercase tracking-[0.35em] text-black/60">
            Every detail
          </p>
          <h2 className="font-display text-display font-semibold tracking-tightest text-[#101012]">
            See more. Miss nothing.
          </h2>
          <p className="mt-5 max-w-lg text-black/60">
            Fine textures and lifelike imagery come alive at cinematic scale. Move across the
            screen to inspect the detail — what a calibrated 4K projector really resolves.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_260px]">
          {/* ---- the projection stage ---- */}
          <div className="relative">
            <div className="relative aspect-[16/9] w-full" style={{ perspective: "1400px" }}>
              {/* subtle beam from projector to screen */}
              <div className="pq-beam pointer-events-none absolute -left-[6%] top-1/2 z-[2] hidden h-[60%] w-[70%] -translate-y-1/2 md:block"
                style={{
                  background: "linear-gradient(90deg, rgba(255,246,224,0.16), rgba(255,246,224,0.04) 55%, transparent)",
                  clipPath: "polygon(0 42%, 100% 6%, 100% 94%, 0 58%)", filter: "blur(6px)",
                }} />

              {/* the screen */}
              <div ref={screenRef}
                className="pq-screen group absolute inset-0 z-[3] overflow-hidden rounded-[4px] bg-black"
                style={{ boxShadow: "0 50px 140px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)" }}>
                <div ref={imgA} className="pq-imglayer absolute inset-0 will-change-transform"
                  style={{ backgroundSize: "cover", backgroundPosition: "center", transform: "scale(1.02)" }} />
                <div ref={imgB} className="pq-imglayer absolute inset-0 will-change-transform"
                  style={{ backgroundSize: "cover", backgroundPosition: "center" }} />
                {/* faint screen vignette so it reads as a lit surface in a dark room */}
                <div className="pointer-events-none absolute inset-0" style={{ boxShadow: "inset 0 0 120px rgba(0,0,0,0.45)" }} />

                {/* 4K detail loupe */}
                <div ref={loupe}
                  className="pointer-events-none absolute left-0 top-0 z-[6] hidden h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full md:block"
                  style={{
                    backgroundSize: "320%", backgroundRepeat: "no-repeat",
                    boxShadow: "0 0 0 2px rgba(255,255,255,0.5), 0 20px 50px rgba(0,0,0,0.6)",
                    opacity: 0,
                  }}>
                  <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#101012] px-3 py-1 text-[0.6rem] font-semibold tracking-[0.15em] text-white">
                    NATIVE 4K
                  </span>
                </div>
              </div>

              {/* projector (foreground, tilts to cursor) */}
              <img ref={projRef} src={ASSETS.projector} alt="4K laser projector"
                className="pointer-events-none absolute -bottom-[9%] left-[-4%] z-[5] w-[24%] max-w-[200px] will-change-transform"
                style={{ filter: "drop-shadow(0 30px 40px rgba(0,0,0,0.8))", transformPerspective: 1000 }} />
            </div>

            {/* category switcher */}
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2">
              {SHOWCASE.map((s, i) => (
                <button key={s.id} onClick={() => select(i)}
                  className={`group flex items-baseline gap-2 text-left transition-colors ${
                    active === i ? "text-[#101012]" : "text-black/45 hover:text-black/70"
                  }`}>
                  <span className={`font-display text-xs tabular-nums ${active === i ? "text-gold-soft" : "text-black/45"}`}>{s.num}</span>
                  <span className="font-display text-lg font-semibold tracking-tight">{s.label}</span>
                </button>
              ))}
            </div>
            <p className="pq-caption mt-3 font-display text-xl font-medium text-black/70">
              {SHOWCASE[active].headline}
            </p>
          </div>

          {/* ---- side: 4K motion clips + spec line ---- */}
          <aside className="flex flex-col gap-4">
            {SHOWCASE_CLIPS.map((c, i) => (
              <div key={i} className="relative overflow-hidden rounded-[4px]"
                style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.06)" }}>
                <video className="aspect-video w-full object-cover" src={c.src} autoPlay muted loop playsInline preload="metadata" />
                <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[0.6rem] font-semibold tracking-[0.15em] text-gold-soft backdrop-blur">
                  {c.label}
                </span>
              </div>
            ))}
            <div className="mt-2 space-y-4 border-t border-black/10 pt-5">
              {[["4K UHD", "8.3M pixels resolved"], ["HDR", "Deeper contrast, truer colour"], ["Calibrated", "Tuned to your room"]].map(([k, v]) => (
                <div key={k}>
                  <p className="font-display text-sm font-semibold text-[#101012]">{k}</p>
                  <p className="text-xs text-black/55">{v}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
