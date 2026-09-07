import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "../lib/gsap";

/**
 * Brief §09 Screen size — make the advantage of projection over a TV obvious.
 * Selector 100" / 120" / 150": the screen grows, the projected image grows,
 * room perspective shifts subtly, dimensions update. Smooth and cinematic.
 */
const SIZES = [
  { label: '100"', scale: 0.66, w: "2.21 m", h: "1.24 m" },
  { label: '120"', scale: 0.82, w: "2.66 m", h: "1.49 m" },
  { label: '150"', scale: 1.0, w: "3.32 m", h: "1.87 m" },
];

export default function ScreenSize() {
  const [i, setI] = useState(1);
  const root = useRef(null);
  const screen = useRef(null);

  const select = (n) => {
    setI(n);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (screen.current) {
      gsap.to(screen.current, {
        scale: SIZES[n].scale,
        duration: reduce ? 0 : 0.9,
        ease: "power3.inOut",
      });
    }
  };

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(screen.current, { scale: SIZES[i].scale });
      gsap.from(".ss-copy > *", {
        yPercent: 40, autoAlpha: 0, duration: 0.9, ease: "power3.out", stagger: 0.08,
        scrollTrigger: { trigger: root.current, start: "top 72%" },
      });
    }, root);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section id="screen-size" ref={root} className="relative overflow-hidden bg-[#f6f6f4] px-6 py-[14vh]">
      <div className="mx-auto max-w-[1180px]">
        <div className="ss-copy mb-10 max-w-2xl">
          <p className="mb-4 text-[0.72rem] font-medium uppercase tracking-[0.35em] text-black/60">Screen size</p>
          <h2 className="font-display text-display font-semibold tracking-tightest text-[#101012]">Why stop at 85 inches?</h2>
          <p className="mt-5 max-w-lg text-black/60 md:text-lg">
            A television has a ceiling. Projection doesn't. Choose your wall.
          </p>
        </div>

        {/* room + growing screen */}
        <div className="relative mx-auto aspect-[16/9] w-full max-w-[1000px] overflow-hidden rounded-[16px] bg-[#0e0e10]"
          style={{ perspective: "1400px", boxShadow: "0 40px 120px rgba(0,0,0,0.28)" }}>
          {/* room backdrop */}
          <img src="/images/installation-10.png" alt="" aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-30" loading="lazy" />
          <div className="absolute inset-0" style={{ background: "radial-gradient(120% 100% at 50% 120%, #000, transparent 70%)" }} />
          {/* the screen */}
          <div ref={screen}
            className="absolute left-1/2 top-1/2 aspect-video w-[64%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[3px] will-change-transform"
            style={{ boxShadow: "0 30px 90px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)" }}>
            <img src="/images/showcase/showcase-landscape.jpg" alt="Projected image" className="h-full w-full object-cover" loading="lazy" />
            <div className="pointer-events-none absolute inset-0" style={{ boxShadow: "inset 0 0 60px rgba(0,0,0,0.4)" }} />
          </div>
          {/* dimension badge */}
          <div className="absolute bottom-4 left-4 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white/85 backdrop-blur">
            <span className="font-display font-semibold text-gold-soft">{SIZES[i].label}</span>
            <span className="ml-2 tabular-nums text-white/60">{SIZES[i].w} × {SIZES[i].h}</span>
          </div>
        </div>

        {/* selector */}
        <div className="mt-8 flex justify-center gap-3">
          {SIZES.map((s, n) => (
            <button key={s.label} onClick={() => select(n)}
              className={`rounded-full border px-6 py-2.5 font-display text-sm font-semibold tracking-tight transition-colors ${
                i === n ? "border-gold bg-gold/10 text-[#101012]" : "border-black/15 text-black/55 hover:text-[#101012]"
              }`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
