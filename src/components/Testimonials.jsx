import { useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";
import { TESTIMONIALS, REVIEW_RATING } from "../data/site";

/** Counts up to `end` once scrolled into view (respects reduced motion). */
function CountUp({ end, decimals = 0, duration = 1400, suffix = "", className }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const done = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setVal(end); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !done.current) {
          done.current = true;
          const t0 = performance.now();
          const tick = (now) => {
            const p = Math.min((now - t0) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setVal(end * eased);
            if (p < 1) requestAnimationFrame(tick);
            else setVal(end);
          };
          requestAnimationFrame(tick);
        }
      });
    }, { threshold: 0.4 });
    io.observe(el);
    // safety net: never leave the counter stuck at 0 if the observer never fires
    const fallback = setTimeout(() => { if (!done.current) { done.current = true; setVal(end); } }, 4000);
    return () => { io.disconnect(); clearTimeout(fallback); };
  }, [end, duration]);
  return (
    <span ref={ref} className={className}>
      {val.toFixed(decimals)}{suffix}
    </span>
  );
}

/**
 * Testimonials — a staggered card carousel (adapted from a shadcn reference into
 * this project's JSX + white/black/red theme). There are no customer photos, so
 * each card leads with an initials monogram and a 5-star row instead of an
 * image, which keeps the layout intentional rather than empty. A Justdial
 * rating badge sits above the deck.
 */

const SQRT_5000 = Math.sqrt(5000);

function initials(name) {
  return name
    .replace(/&/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function Stars({ center }) {
  return (
    <div className="mb-3 flex gap-0.5 text-[0.8rem] text-[#ff2e2e]" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i}>★</span>
      ))}
    </div>
  );
}

function TestimonialCard({ position, testimonial, handleMove, cardSize, onExpand }) {
  const isCenter = position === 0;
  const onClick = () => {
    // side cards navigate (unchanged everywhere); the centre card opens the full
    // review — but ONLY on phones (<640), so desktop behaviour is untouched.
    if (isCenter) {
      if (window.innerWidth < 640) onExpand(testimonial);
    } else {
      handleMove(position);
    }
  };
  return (
    <div
      onClick={onClick}
      className={[
        "absolute left-1/2 top-1/2 flex cursor-pointer flex-col border p-5 transition-all duration-500 ease-cine sm:p-8",
        isCenter
          ? "z-10 border-[#101012] bg-[#101012] text-white"
          : "z-0 border-black/10 bg-white text-[#101012] hover:border-[#ff2e2e]/50",
      ].join(" ")}
      style={{
        width: cardSize,
        height: cardSize,
        clipPath:
          "polygon(50px 0%, calc(100% - 50px) 0%, 100% 50px, 100% 100%, calc(100% - 50px) 100%, 50px 100%, 0 100%, 0 0)",
        transform: `
          translate(-50%, -50%)
          translateX(${(cardSize / 1.5) * position}px)
          translateY(${isCenter ? -65 : position % 2 ? 15 : -15}px)
          rotate(${isCenter ? 0 : position % 2 ? 2.5 : -2.5}deg)
        `,
        boxShadow: isCenter ? "0px 8px 0px 4px rgba(255,46,46,0.35)" : "0px 0px 0px 0px transparent",
      }}
      aria-hidden={!isCenter}
    >
      {/* diagonal accent by the top-right notch (from the reference) */}
      <span
        className={`absolute block origin-top-right rotate-45 ${isCenter ? "bg-white/20" : "bg-black/10"}`}
        style={{ right: -2, top: 48, width: SQRT_5000, height: 2 }}
      />

      {/* monogram avatar (no photos available) */}
      <div
        className={`mb-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[0.8rem] font-semibold sm:mb-4 sm:h-12 sm:w-12 sm:text-[0.9rem] ${
          isCenter ? "bg-white/10 text-white" : "bg-[#101012]/[0.06] text-[#101012]"
        }`}
        style={{ boxShadow: isCenter ? "3px 3px 0px rgba(255,46,46,0.4)" : "3px 3px 0px rgba(16,16,18,0.08)" }}
      >
        {initials(testimonial.by)}
      </div>

      <Stars center={isCenter} />

      <h3 className={`line-clamp-2 overflow-hidden pr-1 text-[0.8rem] font-medium leading-snug sm:line-clamp-6 sm:text-[1rem] ${isCenter ? "text-white" : "text-[#101012]"}`}>
        “{testimonial.text}”
      </h3>

      <p className={`absolute bottom-5 left-5 right-5 mt-2 text-[0.72rem] sm:bottom-8 sm:left-8 sm:right-8 sm:text-[0.8rem] ${isCenter ? "text-white/70" : "text-black/50"}`}>
        <span className="font-semibold not-italic">{testimonial.by}</span>
        {testimonial.role ? <span className="italic"> — {testimonial.role}</span> : null}
      </p>

      {/* phone-only affordance: the centre card is tappable to read the full review */}
      {isCenter && (
        <span className="absolute right-4 top-4 rounded-full bg-white/15 px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-wide text-white/80 sm:hidden">
          Tap to read
        </span>
      )}
    </div>
  );
}

export default function Testimonials() {
  const [cardSize, setCardSize] = useState(365);
  const [expanded, setExpanded] = useState(null); // full-review modal (phones)
  const [list, setList] = useState(TESTIMONIALS.map((t, i) => ({ ...t, tempId: i })));

  const handleMove = (steps) => {
    setList((prev) => {
      const next = [...prev];
      if (steps > 0) {
        for (let i = steps; i > 0; i--) {
          const item = next.shift();
          if (!item) break;
          next.push({ ...item, tempId: Math.random() });
        }
      } else {
        for (let i = steps; i < 0; i++) {
          const item = next.pop();
          if (!item) break;
          next.unshift({ ...item, tempId: Math.random() });
        }
      }
      return next;
    });
  };

  useEffect(() => {
    // Desktop (>=640) unchanged at 365. Phones get smaller cards so more of the
    // deck peeks through at once (4-6 visible, matching the desktop feel).
    const update = () => {
      const w = window.innerWidth;
      setCardSize(w >= 640 ? 365 : w >= 380 ? 205 : 180);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // full-review modal: lock scroll + close on Escape while open
  useEffect(() => {
    if (!expanded) return;
    const lenis = window.__lenis;
    lenis && lenis.stop();
    const onKey = (e) => { if (e.key === "Escape") setExpanded(null); };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      lenis && lenis.start();
    };
  }, [expanded]);

  return (
    <section id="testimonials" className="relative bg-[#f6f6f4] px-6 pt-[5vh] pb-[2vh]">
      <Reveal className="mx-auto max-w-[900px] text-center">
        <p className="mb-4 text-[0.72rem] font-medium uppercase tracking-[0.35em] text-black/55">Testimonials</p>
        <h2 className="font-display text-[clamp(1.9rem,4vw,3rem)] font-light leading-[1.1] tracking-tight text-[#101012]">
          Trusted by homeowners <span className="font-semibold">&amp; businesses</span>
        </h2>
        {/* Justdial rating badge — animated counters */}
        <div className="mt-5 inline-flex items-center gap-2.5 rounded-full border border-black/10 bg-white px-4 py-2 shadow-sm">
          <CountUp end={parseFloat(REVIEW_RATING.score)} decimals={1} className="text-[1.05rem] font-semibold text-[#101012]" />
          <span className="text-[#ff2e2e]">★</span>
          <span className="text-[0.82rem] font-medium text-[#101012]">{REVIEW_RATING.source} rating</span>
          <span className="hidden text-[0.78rem] text-black/45 sm:inline">
            · Based on <CountUp end={200} suffix="+" className="font-medium text-black/60" /> customer ratings
          </span>
        </div>
      </Reveal>

      {/* staggered deck */}
      <div className="relative mt-[7vh] w-full overflow-hidden" style={{ height: cardSize + 180 }}>
        {list.map((t, index) => {
          const position = list.length % 2 ? index - (list.length + 1) / 2 : index - list.length / 2;
          return (
            <TestimonialCard key={t.tempId} testimonial={t} handleMove={handleMove} position={position} cardSize={cardSize} onExpand={setExpanded} />
          );
        })}

        {/* controls */}
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          <button
            onClick={() => handleMove(-1)}
            aria-label="Previous testimonial"
            className="flex h-12 w-12 items-center justify-center border-2 border-black/15 bg-white text-[#101012] transition-colors hover:border-[#ff2e2e] hover:bg-[#ff2e2e] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff2e2e]"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button
            onClick={() => handleMove(1)}
            aria-label="Next testimonial"
            className="flex h-12 w-12 items-center justify-center border-2 border-black/15 bg-white text-[#101012] transition-colors hover:border-[#ff2e2e] hover:bg-[#ff2e2e] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff2e2e]"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>
      </div>

      {/* full-review modal (opened by tapping the centre card on phones) */}
      {expanded && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm sm:hidden"
          onClick={() => setExpanded(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Customer review"
        >
          <div
            className="relative max-h-[80vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-[#101012] p-6 text-white shadow-[0_20px_60px_-12px_rgba(0,0,0,0.6)]"
            onClick={(e) => e.stopPropagation()}
            data-lenis-prevent
          >
            <button
              onClick={() => setExpanded(null)}
              aria-label="Close review"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-lg text-white/80 transition-colors hover:bg-white/20"
            >
              ×
            </button>
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-[0.85rem] font-semibold text-white">
              {initials(expanded.by)}
            </div>
            <div className="mb-3 flex gap-0.5 text-[0.85rem] text-[#ff2e2e]" aria-label="5 out of 5 stars">
              {Array.from({ length: 5 }).map((_, i) => <span key={i}>★</span>)}
            </div>
            <p className="text-[0.95rem] leading-relaxed text-white">“{expanded.text}”</p>
            <p className="mt-4 text-[0.8rem] text-white/70">
              <span className="font-semibold not-italic">{expanded.by}</span>
              {expanded.role ? <span className="italic"> — {expanded.role}</span> : null}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
