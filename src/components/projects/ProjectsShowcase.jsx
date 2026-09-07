import { useCallback, useEffect, useRef, useState } from "react";
import Reveal from "../Reveal";
import ProjectLightbox from "./ProjectLightbox";
import { PROJECTS } from "../../data/projects";

const CATEGORY_LABEL = {
  "home-theatre": "Home theatre",
  "living-room": "Living-room cinema",
  boardroom: "Boardroom AV",
  commercial: "Commercial AV",
};

/**
 * Projects — a premium showcase of all installations: one large cinematic image
 * with a 01/NN counter and prev/next, a thumbnail rail of every project, and
 * click-to-expand into the full-screen lightbox. Clean, landscape-friendly,
 * keyboard accessible. No animation libraries.
 */
export default function ProjectsShowcase() {
  const projects = PROJECTS;
  const total = projects.length;
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const railRef = useRef(null);
  const touch = useRef({ x: 0, active: false });

  const current = projects[index];

  const go = useCallback((i) => setIndex(((i % total) + total) % total), [total]);
  const prev = useCallback(() => go(index - 1), [go, index]);
  const next = useCallback(() => go(index + 1), [go, index]);

  // reset fade + preload neighbours on change
  useEffect(() => {
    setLoaded(false);
    [index - 1, index + 1].forEach((n) => {
      const p = projects[((n % total) + total) % total];
      if (p) { const im = new Image(); im.src = p.image; }
    });
  }, [index, projects, total]);

  // keep active thumbnail in view
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const el = rail.querySelector(`[data-idx="${index}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [index]);

  const onTouchStart = (e) => { touch.current = { x: e.touches[0].clientX, active: true }; };
  const onTouchEnd = (e) => {
    if (!touch.current.active) return;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    touch.current.active = false;
    if (Math.abs(dx) > 50) { dx < 0 ? next() : prev(); }
  };

  return (
    <section id="work" className="relative bg-[#f6f6f4] px-6 py-[12vh]">
      <div className="mx-auto max-w-[1200px]">
        <Reveal className="mb-8 text-center">
          <p className="mb-3 text-[0.72rem] font-medium uppercase tracking-[0.35em] text-black/55">Projects</p>
          <h2 className="font-display text-[clamp(2rem,4.4vw,3.4rem)] font-light leading-[1.05] tracking-tight text-[#101012]">
            Our <span className="font-semibold">installations</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[0.95rem] leading-relaxed text-black/55">
            A selection of home cinema, residential and commercial AV installations across Bangalore.
          </p>
        </Reveal>

        {/* large showcase */}
        <div
          className="group relative overflow-hidden rounded-2xl bg-[#0b0b0e] shadow-[0_30px_60px_-24px_rgba(0,0,0,0.4)]"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") { e.preventDefault(); next(); }
            else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
          }}
        >
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={`View ${current.title} full-screen`}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            className="relative block h-[46vh] w-full cursor-zoom-in outline-none sm:h-[56vh] lg:h-[64vh] focus-visible:ring-2 focus-visible:ring-[#ff2e2e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f6f4]"
          >
            {/* instant blurred backdrop, then the sharp image fades in */}
            <img src={current.thumb} alt="" aria-hidden="true"
              className={`absolute inset-0 h-full w-full scale-105 object-cover blur-xl transition-opacity duration-500 ${loaded ? "opacity-0" : "opacity-70"}`} />
            <img key={current.id} src={current.image} alt={current.alt} onLoad={() => setLoaded(true)}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`} />

            {/* legibility gradient + meta */}
            <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent px-5 pb-5 pt-20 sm:px-7 sm:pb-7">
              <span className="block font-display text-xl font-light tracking-tight text-white sm:text-2xl">{current.title}</span>
              <span className="mt-1 block text-[0.66rem] font-semibold uppercase tracking-[0.25em] text-[#ff8a8a]">{CATEGORY_LABEL[current.category]}</span>
            </span>

            {/* counter + expand hint */}
            <span className="pointer-events-none absolute right-4 top-4 rounded-full bg-black/45 px-3 py-1 text-[0.7rem] font-medium tabular-nums text-white/90 backdrop-blur sm:right-6 sm:top-6">
              {String(index + 1).padStart(2, "0")} / {total}
            </span>
            <span className="pointer-events-none absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1 text-[0.68rem] font-medium text-white/80 opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100 sm:left-6 sm:top-6">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
              View full-screen
            </span>
          </button>

          {/* arrows */}
          <button type="button" onClick={prev} aria-label="Previous installation"
            className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white/90 backdrop-blur transition-colors hover:bg-black/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff2e2e] sm:left-5">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button type="button" onClick={next} aria-label="Next installation"
            className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white/90 backdrop-blur transition-colors hover:bg-black/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff2e2e] sm:right-5">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>

        {/* thumbnail rail — all projects */}
        <div ref={railRef} className="mt-4 flex gap-2.5 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }} aria-label="All installations">
          {projects.map((p, i) => (
            <button
              key={p.id}
              type="button"
              data-idx={i}
              onClick={() => go(i)}
              aria-label={`Show ${p.title}`}
              aria-current={i === index}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-md outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[#ff2e2e] sm:h-[4.5rem] sm:w-28 ${
                i === index ? "ring-2 ring-[#ff2e2e] ring-offset-2 ring-offset-[#f6f6f4]" : "opacity-55 hover:opacity-100"
              }`}
            >
              <img src={p.thumb} alt={p.alt} loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {open && (
        <ProjectLightbox
          project={current}
          hasPrev={index > 0}
          hasNext={index < total - 1}
          onPrev={() => go(index - 1)}
          onNext={() => go(index + 1)}
          onClose={() => setOpen(false)}
        />
      )}
    </section>
  );
}
