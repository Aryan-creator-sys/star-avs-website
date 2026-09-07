import { useLayoutEffect, useRef } from "react";
import { gsap } from "../lib/gsap";
import { COMPANY } from "../data/site";

export default function Intro() {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const ctx = gsap.context(() => {
      const words = gsap.utils.toArray(".intro-word");
      gsap.from(words, {
        yPercent: 120,
        opacity: 0,
        duration: 1,
        ease: "power4.out",
        stagger: 0.08,
        scrollTrigger: { trigger: ref.current, start: "top 70%" },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  const line = "Beyond a dealer — a home-cinema studio.";
  return (
    <section id="intro" ref={ref} className="relative bg-[#f6f6f4] px-6 py-[16vh] md:py-[22vh]">
      <div className="mx-auto max-w-[1100px]">
        <p className="mb-8 text-[0.72rem] font-medium uppercase tracking-[0.35em] text-black/60">
          Since {COMPANY.since} · {COMPANY.city}
        </p>
        <h2 className="font-display text-display font-semibold leading-[1.05] tracking-tightest text-[#101012]">
          {line.split(" ").map((w, i) => (
            <span key={i} className="mr-[0.25em] inline-block overflow-hidden align-bottom">
              <span className="intro-word inline-block">{w}</span>
            </span>
          ))}
        </h2>
        <div className="mt-12 grid gap-8 border-t border-black/10 pt-10 md:grid-cols-[1.2fr_1fr] md:gap-20">
          <p className="text-lg leading-relaxed text-black/65 md:text-xl">
            {COMPANY.name} designs, supplies and installs complete audio-visual
            systems — from private home theatres to corporate boardrooms. One team
            for the whole journey: specification, acoustics, installation,
            calibration and long-term support.
          </p>
          <div className="flex items-end">
            <p className="text-sm leading-relaxed text-black/60">
              Rated {COMPANY.rating}/5 across {COMPANY.reviews} verified reviews for
              honest guidance, clean installations and dependable service.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
