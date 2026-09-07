import { useLayoutEffect, useRef } from "react";
import { gsap } from "../lib/gsap";
import { SOLUTIONS } from "../data/site";

function SolutionRow({ item, index }) {
  const ref = useRef(null);
  const flip = index % 2 === 1;

  useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const ctx = gsap.context(() => {
      // parallax image + reveal text
      gsap.fromTo(
        ".sol-media img",
        { scale: 1.18, yPercent: -6 },
        {
          scale: 1,
          yPercent: 6,
          ease: "none",
          scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: true },
        }
      );
      gsap.from(".sol-copy > *", {
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: { trigger: ref.current, start: "top 72%" },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={ref}
      className={`grid items-center gap-8 md:grid-cols-2 md:gap-16 ${flip ? "md:[direction:rtl]" : ""}`}
    >
      <div className="sol-media relative aspect-[4/3] overflow-hidden rounded-2xl [direction:ltr]">
        <img src={item.image} alt={item.title} className="h-full w-full object-cover will-change-transform" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>
      <div className="sol-copy [direction:ltr]">
        <p className="mb-4 text-[0.72rem] font-medium uppercase tracking-[0.3em] text-black/60">{item.kicker}</p>
        <h3 className="font-display text-[clamp(1.8rem,3.6vw,3rem)] font-semibold leading-[1.05] tracking-tightest text-[#101012]">
          {item.title}
        </h3>
        <p className="mt-5 max-w-md text-black/55 md:text-lg">{item.copy}</p>
        <a href="#contact" className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#101012]">
          Explore
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </a>
      </div>
    </div>
  );
}

export default function Solutions() {
  return (
    <section id="solutions" className="relative bg-[#f6f6f4] px-6 py-[12vh]">
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-16 max-w-2xl md:mb-24">
          <p className="mb-4 text-[0.72rem] font-medium uppercase tracking-[0.35em] text-black/60">Solutions</p>
          <h2 className="font-display text-display font-semibold tracking-tightest text-[#101012]">
            One studio. The whole chain.
          </h2>
        </div>
        <div className="flex flex-col gap-24 md:gap-40">
          {SOLUTIONS.map((item, i) => (
            <SolutionRow key={item.id} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
