import { useLayoutEffect, useRef } from "react";
import { gsap } from "../lib/gsap";

/**
 * Brief §08 Brightness — demonstrate, don't state.
 * Room starts dark → projector activates → screen lights up → image appears →
 * the cinema becomes the focus. Lumen figure appears afterwards as a small detail.
 * Uses our own installation photo (a lit screen in a dark room).
 */
export default function Brightness() {
  const root = useRef(null);

  useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      gsap.from(".br-copy > *", {
        yPercent: 40, autoAlpha: 0, duration: 0.9, ease: "power3.out", stagger: 0.08,
        scrollTrigger: { trigger: root.current, start: "top 70%" },
      });
      if (reduce) {
        gsap.set(".br-dark", { autoAlpha: 0 });
        gsap.set(".br-glow", { autoAlpha: 0.8 });
        return;
      }
      // scrub: room dark → screen lights up
      gsap.timeline({
        scrollTrigger: { trigger: ".br-frame", start: "top 80%", end: "center center", scrub: 1 },
      })
        .to(".br-dark", { autoAlpha: 0, duration: 1 }, 0)      // darkness lifts
        .fromTo(".br-glow", { autoAlpha: 0 }, { autoAlpha: 0.9, duration: 1 }, 0) // screen glow blooms
        .fromTo(".br-img", { scale: 1.08 }, { scale: 1, duration: 1 }, 0);
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="brightness" ref={root} className="relative bg-[#f6f6f4] px-6 py-[14vh]">
      <div className="mx-auto max-w-[1180px]">
        <div className="br-copy mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-4 text-[0.72rem] font-medium uppercase tracking-[0.35em] text-black/60">Brightness</p>
          <h2 className="font-display text-display font-semibold tracking-tightest text-[#101012]">Made for the big screen.</h2>
          <p className="mx-auto mt-5 max-w-lg text-black/60 md:text-lg">
            A large image needs real brightness to stay impactful, immersive and alive — even with the lights up.
          </p>
        </div>

        <div className="br-frame relative overflow-hidden rounded-[20px]" style={{ boxShadow: "0 30px 80px rgba(0,0,0,0.14)" }}>
          <img
            className="br-img aspect-video w-full object-cover will-change-transform"
            src="/images/showcase-sport.png"
            alt="A bright projected image lighting up a dark home-cinema room"
            loading="lazy"
          />
          {/* screen bloom */}
          <div className="br-glow pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(60% 55% at 62% 45%, rgba(255,248,230,0.22), transparent 70%)", mixBlendMode: "screen" }} />
          {/* darkness that lifts as you scroll */}
          <div className="br-dark pointer-events-none absolute inset-0" style={{ background: "rgba(3,3,4,0.86)" }} />
        </div>

        <p className="mt-5 text-center text-[0.68rem] font-medium uppercase tracking-[0.3em] text-black/55">
          3,200 ANSI LUMENS · BenQ TK710
        </p>
      </div>
    </section>
  );
}
