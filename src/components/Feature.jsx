import { useLayoutEffect, useRef } from "react";
import { gsap } from "../lib/gsap";

/**
 * Brief §01 structural unit, repeated per feature:
 *   SMALL LABEL → LARGE HEADLINE → SHORT DESCRIPTION → LARGE VIDEO → TECH INDICATOR
 *
 * mood="slow"      → §03 movie animation: video enters + scales gently, headline reveals.
 * mood="energetic" → §05 sports animation: dynamic entrance + scroll-velocity parallax.
 * Full-bleed video, never inside a card. Respects reduced motion; lazy media.
 */
export default function Feature({ data, index }) {
  const root = useRef(null);
  const videoRef = useRef(null);

  useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const video = videoRef.current;

    const ctx = gsap.context(() => {
      // reveal label/headline/copy
      gsap.from(".ft-reveal", {
        yPercent: 60, autoAlpha: 0, duration: 0.9, ease: "power3.out", stagger: 0.08,
        scrollTrigger: { trigger: root.current, start: "top 68%" },
      });

      if (reduce) return;

      const slow = data.mood === "slow";
      // video enters + scales as it moves through the viewport (not a plain fade)
      gsap.fromTo(
        ".ft-video",
        { scale: slow ? 1.14 : 1.2, yPercent: slow ? 8 : 14, autoAlpha: 0.35 },
        {
          scale: 1, yPercent: 0, autoAlpha: 1, ease: "none",
          scrollTrigger: { trigger: ".ft-frame", start: "top 90%", end: "center center", scrub: slow ? 1.2 : 0.6 },
        }
      );
      // continued subtle parallax drift after it's in view (energetic = more)
      gsap.to(".ft-video", {
        yPercent: slow ? -6 : -12, ease: "none",
        scrollTrigger: { trigger: ".ft-frame", start: "center center", end: "bottom top", scrub: slow ? 1.2 : 0.5 },
      });

      // play only while visible (perf)
      ScrollTriggerPlay(video, root.current);
    }, root);

    return () => ctx.revert();
  }, [data]);

  return (
    <section
      id={data.id}
      ref={root}
      className="relative bg-[#f6f6f4] px-6 py-[14vh]"
    >
      <div className="mx-auto max-w-[1180px]">
        {/* label → headline → description */}
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <p className="ft-reveal mb-4 flex items-center justify-center gap-3 text-[0.72rem] font-medium uppercase tracking-[0.35em] text-black/60">
            <span className="font-display tabular-nums text-gold">{String(index).padStart(2, "0")}</span>
            {data.kicker}
          </p>
          <h2 className="ft-reveal font-display text-display font-semibold tracking-tightest text-[#101012]">
            {data.headline}
          </h2>
          <p className="ft-reveal mx-auto mt-5 max-w-xl text-black/60 md:text-lg">{data.copy}</p>
        </div>

        {/* large cinematic video */}
        <div className={`ft-frame relative overflow-hidden rounded-[20px] ${data.narrow ? "mx-auto max-w-[920px]" : ""}`} style={{ boxShadow: "0 30px 80px rgba(0,0,0,0.14)" }}>
          <video
            ref={videoRef}
            className="ft-video aspect-video w-full object-cover will-change-transform"
            src={data.video}
            poster={data.poster}
            muted
            loop
            playsInline
            preload="none"
          />
          {/* Dolby mark — brief §02: replace with the official file from the BenQ dealer kit */}
          {data.dolby && (
            <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-[0.7rem] font-semibold tracking-[0.3em] text-white/85"
              data-note="replace-with-official-dolby-asset">
              ▉▉ DOLBY ATMOS
            </div>
          )}
        </div>

        {/* technical indicator */}
        <p className="mt-5 text-center text-[0.68rem] font-medium uppercase tracking-[0.3em] text-black/55">
          {data.indicator}
        </p>
      </div>
    </section>
  );
}

// play/pause video with an IntersectionObserver (cheaper than a ScrollTrigger here)
function ScrollTriggerPlay(video, root) {
  if (!video) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) video.play().catch(() => {});
        else video.pause();
      });
    },
    { threshold: 0.25 }
  );
  io.observe(root);
}
