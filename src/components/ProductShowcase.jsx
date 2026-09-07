import { useLayoutEffect, useRef } from "react";
import { gsap } from "../lib/gsap";
import { ASSETS, EXPERIENCE } from "../data/site";

/**
 * Pinned product-experience section. The projector holds centre while feature
 * beats swap, the product scales / shifts perspective, and the backdrop warms.
 */
export default function ProductShowcase() {
  const root = useRef(null);

  useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      const beats = gsap.utils.toArray(".ps-beat");
      gsap.set(beats, { autoAlpha: 0, y: 30 });
      gsap.set(beats[0], { autoAlpha: 1, y: 0 });

      if (reduce) {
        gsap.set(beats, { autoAlpha: 1, y: 0, position: "relative" });
        return;
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "+=300%",
          scrub: 1,
          pin: ".ps-stage",
          anticipatePin: 1,
        },
      });

      // continuous product motion across the whole section
      tl.to(".ps-product", { rotateY: 24, scale: 1.12, xPercent: -6, ease: "none", duration: 3 }, 0)
        .to(".ps-glow", { scale: 1.5, opacity: 0.9, ease: "none", duration: 3 }, 0);

      // crossfade the three beats + warm the backdrop
      const bg = ["#f6f6f4", "#0c0a08", "#0a0808"];
      beats.forEach((b, i) => {
        if (i === 0) return;
        const at = i / beats.length;
        tl.to(beats[i - 1], { autoAlpha: 0, y: -30, duration: 0.25 }, at)
          .to(beats[i], { autoAlpha: 1, y: 0, duration: 0.3 }, at + 0.02)
          .to(".ps-stage", { backgroundColor: bg[i] || bg[0], duration: 0.3 }, at);
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="experience" ref={root} className="relative h-[300vh] bg-[#f6f6f4]">
      <div className="ps-stage relative flex h-screen w-full items-center overflow-hidden" style={{ backgroundColor: "#f6f6f4" }}>
        <div className="mx-auto grid w-full max-w-[1180px] grid-cols-1 items-center gap-8 px-6 md:grid-cols-2">
          {/* product */}
          <div className="relative order-2 flex items-center justify-center md:order-1">
            <div
              className="ps-glow absolute h-[70%] w-[70%] rounded-full opacity-60"
              style={{ background: "radial-gradient(circle, rgba(201,162,75,0.35), transparent 65%)", filter: "blur(20px)" }}
            />
            <img
              src={ASSETS.projector}
              alt="4K laser projector"
              className="ps-product relative w-[min(80vw,520px)] will-change-transform"
              style={{ filter: "drop-shadow(0 40px 70px rgba(0,0,0,0.7))", transformPerspective: 1000 }}
            />
          </div>

          {/* beats */}
          <div className="relative order-1 min-h-[240px] md:order-2">
            {EXPERIENCE.map((b, i) => (
              <div key={i} className="ps-beat md:absolute md:inset-0 md:flex md:flex-col md:justify-center">
                <div className="mb-6 flex items-baseline gap-3">
                  <span className="font-display text-[clamp(3rem,8vw,6rem)] font-bold leading-none tracking-tightest text-gold">
                    {b.stat}
                  </span>
                  <span className="text-sm uppercase tracking-[0.2em] text-black/60">{b.unit}</span>
                </div>
                <h3 className="font-display text-[clamp(1.6rem,3.4vw,2.6rem)] font-semibold tracking-tightest text-[#101012]">
                  {b.title}
                </h3>
                <p className="mt-4 max-w-md text-black/55 md:text-lg">{b.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
