import { useLayoutEffect, useRef } from "react";
import { gsap } from "../lib/gsap";
import HexSurface from "./HexSurface";

/**
 * Hero (scope-locked). One cohesive composition:
 *  1. HexSurface — the primary, cursor-reactive AV hex-scale surface (behind).
 *  2. A clean thin headline + a muted services line, bottom-left on the stage.
 * All styles inline/Tailwind, isolated to this section.
 */
export default function Hero() {
  const root = useRef(null);
  const ringsWrap = useRef(null);

  useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      if (reduce) {
        gsap.set(ringsWrap.current, { autoAlpha: 0.85 });
        return;
      }
      gsap.fromTo(ringsWrap.current, { autoAlpha: 0 }, { autoAlpha: 0.9, duration: 2.4, ease: "power2.out" });
      gsap.from(".hero-in", { y: 26, autoAlpha: 0, duration: 1, ease: "power3.out", stagger: 0.12, delay: 0.6 });
      gsap.from(".hero-scroll", { autoAlpha: 0, duration: 1, delay: 1.5 });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="hero" className="relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-[#09090f]">
      {/* PRIMARY: interactive hex-scale surface — a dense charcoal/red field of
          3D scales that flow, breathe and rise/redden under the pointer */}
      <div ref={ringsWrap} className="absolute inset-0" style={{ opacity: 0 }}>
        <HexSurface />
      </div>

      {/* legibility gradient toward the bottom-left (no card) */}
      <div className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(130% 105% at 16% 112%, rgba(0,0,0,0.74), transparent 52%)" }} />

      {/* bottom-left composition — clean thin headline + a muted services line */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[6] px-6 pb-[8vh] md:px-14 md:pb-[10vh]">
        <h1 className="hero-in font-display max-w-[920px] text-[clamp(2.9rem,8.2vw,6.4rem)] font-extralight uppercase leading-[0.98] tracking-tight text-white">
          Technology<br />Integrated.
        </h1>

        <p className="hero-in mt-5 text-[0.72rem] font-medium uppercase tracking-[0.28em] text-white/55 md:text-sm md:tracking-[0.3em]">
          Home Cinema <span className="mx-2 text-[#ff2e2e]">·</span> Office &amp; Commercial Spaces
          <span className="mx-2 text-[#ff2e2e]">·</span> Gaming Experience
          <span className="mx-2 text-[#ff2e2e]">·</span> AV Solutions
        </p>
      </div>

      {/* SCROLL cue, bottom-right — animated mouse icon, no text */}
      <div className="hero-scroll absolute bottom-7 right-8 z-[6] hidden md:block">
        <svg width="26" height="42" viewBox="0 0 26 42" fill="none" aria-hidden="true">
          <rect x="1" y="1" width="24" height="40" rx="12" stroke="rgba(255,255,255,0.45)" strokeWidth="1.6" />
          <circle cx="13" cy="11" r="2.1" fill="rgba(255,255,255,0.75)">
            <animate attributeName="cy" values="10;20;10" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0.2;1" dur="1.8s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>
    </section>
  );
}
