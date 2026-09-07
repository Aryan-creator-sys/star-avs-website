import { useLayoutEffect, useRef } from "react";
import { gsap } from "../lib/gsap";
import { ASSETS } from "../data/site";

/**
 * Projector → living-room parallax (moved below "Why stop at 85 inches?").
 * A front-facing projector on a minimal stand; on scroll a scrubbed timeline
 * performs a continuous camera push — layers move at different rates, the
 * projector grows and eases aside, and the living-room behind is revealed.
 */
export default function ProjectorScene() {
  const root = useRef(null);
  const projRef = useRef(null);

  useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const desktop = window.matchMedia("(hover:hover) and (pointer:fine)").matches;

    const ctx = gsap.context(() => {
      gsap.set("#ps-room", { scale: 1.06, autoAlpha: 0, filter: "blur(6px)" });
      gsap.set("#ps-proj", { scale: 0.92, yPercent: 0, autoAlpha: 1 });
      gsap.set("#ps-stand", { autoAlpha: 1 });
      gsap.set("#ps-glow", { autoAlpha: 0.5 });

      if (reduce) {
        gsap.set("#ps-room", { autoAlpha: 0.5, filter: "blur(0px)", scale: 1.1 });
        return;
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "+=420%",
          scrub: 1,
          pin: "#ps-stage",
          anticipatePin: 1,
        },
      });

      tl.to("#ps-copy", { autoAlpha: 0, yPercent: -30, duration: 0.22, ease: "power1.in" }, 0)
        .to("#ps-far", { scale: 1.25, ease: "none", duration: 1 }, 0)
        .to("#ps-room", { autoAlpha: 1, filter: "blur(0px)", scale: 1.5, ease: "none", duration: 1 }, 0)
        .to("#ps-proj", { scale: 1.5, yPercent: 6, ease: "power1.in", duration: 0.6 }, 0)
        .to("#ps-proj", { scale: 2.9, yPercent: 26, xPercent: -8, autoAlpha: 0, ease: "power2.in", duration: 0.4 }, 0.58)
        .to("#ps-stand", { autoAlpha: 0, yPercent: 40, duration: 0.4 }, 0.55)
        .to("#ps-glow", { autoAlpha: 0, duration: 0.5 }, 0.5)
        .fromTo("#ps-arrive", { autoAlpha: 0, yPercent: 20 }, { autoAlpha: 1, yPercent: 0, ease: "power2.out", duration: 0.3 }, 0.74);

      if (desktop) {
        const rx = gsap.quickTo(projRef.current, "rotationX", { duration: 0.9, ease: "power3" });
        const ry = gsap.quickTo(projRef.current, "rotationY", { duration: 0.9, ease: "power3" });
        const onMove = (e) => {
          const nx = e.clientX / window.innerWidth - 0.5;
          const ny = e.clientY / window.innerHeight - 0.5;
          ry(gsap.utils.clamp(-5, 5, nx * 10));
          rx(gsap.utils.clamp(-4, 4, -ny * 8));
        };
        window.addEventListener("pointermove", onMove, { passive: true });
        return () => window.removeEventListener("pointermove", onMove);
      }
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="projector-scene" className="relative h-[420vh] bg-[#f6f6f4]">
      <div id="ps-stage" className="relative h-[100svh] min-h-[600px] w-full overflow-hidden">
        <div id="ps-far" className="absolute inset-0 will-change-transform"
          style={{ background: "radial-gradient(120% 90% at 50% 30%, #ffffff, #eceae4 70%, #e4e2db)" }} />
        <div id="ps-room" className="absolute inset-0 will-change-transform">
          <img src={ASSETS.heroRoom} alt="" aria-hidden="true" className="h-full w-full object-cover" />
          <div className="absolute inset-0" style={{ background: "radial-gradient(90% 80% at 50% 45%, transparent 40%, rgba(10,10,12,0.35))" }} />
        </div>
        <div id="ps-glow" className="pointer-events-none absolute left-1/2 top-[52%] h-[46vh] w-[46vh] -translate-x-1/2 -translate-y-1/2 rounded-full will-change-transform"
          style={{ background: "radial-gradient(circle, rgba(201,162,75,0.18), transparent 65%)", filter: "blur(30px)" }} />
        <div className="absolute left-1/2 top-1/2 z-[6] -translate-x-1/2 -translate-y-1/2" style={{ perspective: "1400px" }}>
          <img id="ps-proj" ref={projRef} src={ASSETS.projectorFront} alt="BenQ 4K laser projector, front view"
            className="w-[min(46vw,520px)] will-change-transform"
            style={{ filter: "drop-shadow(0 40px 50px rgba(0,0,0,0.28))", transformPerspective: 1000 }} />
          <div id="ps-stand" className="will-change-transform">
            <div className="mx-auto h-[10px] w-[min(40vw,440px)] rounded-b-md bg-gradient-to-b from-[#dedcd5] to-[#cbc9c1]" />
            <div className="mx-auto mt-3 h-3 w-[min(34vw,380px)] rounded-[50%] bg-black/10 blur-md" />
          </div>
        </div>
        <div id="ps-copy" className="absolute inset-x-0 top-[15%] z-[8] px-6 text-center">
          <p className="mb-4 text-[0.72rem] font-semibold uppercase tracking-[0.35em] text-black/55">Step inside</p>
          <h2 className="font-display text-hero font-semibold tracking-tightest text-[#101012]">
            Step into
            <br /> the picture.
          </h2>
        </div>
        <div id="ps-arrive" className="pointer-events-none absolute inset-x-0 bottom-[14%] z-[8] px-6 text-center">
          <h2 className="font-display text-display font-semibold tracking-tightest text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.65)]">
            Your room. Your cinema.
          </h2>
        </div>
      </div>
    </section>
  );
}
