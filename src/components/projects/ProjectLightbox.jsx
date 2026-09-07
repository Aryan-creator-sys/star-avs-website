import { useEffect, useRef, useState } from "react";

const CATEGORY_LABEL = {
  "home-theatre": "Home theatre",
  "living-room": "Living-room cinema",
  boardroom: "Boardroom AV",
  commercial: "Commercial AV",
};

/**
 * Full-screen premium lightbox. 95% black; desktop 60/40 photo/details; mobile
 * stacked with swipe. Keyboard (←/→/Esc), prev/next, click-outside, focus trap,
 * visible focus, focus returned to the originating card on close. Hi-res image
 * loads only when opened (the grid stays on thumbnails). The page itself never
 * scrolls while open, so scroll position is preserved on close.
 */
export default function ProjectLightbox({ project, hasPrev, hasNext, onPrev, onNext, onClose }) {
  const panelRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const touch = useRef({ x: 0, y: 0, active: false });

  useEffect(() => setLoaded(false), [project && project.id]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
      else if (e.key === "ArrowRight" && hasNext) { e.preventDefault(); onNext(); }
      else if (e.key === "ArrowLeft" && hasPrev) { e.preventDefault(); onPrev(); }
      else if (e.key === "Tab") {
        // focus trap
        const nodes = panelRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!nodes || !nodes.length) return;
        const list = Array.from(nodes).filter((n) => !n.disabled && n.offsetParent !== null);
        if (!list.length) return;
        const first = list[0], last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    // move focus into the dialog
    const t = setTimeout(() => {
      const closeBtn = panelRef.current?.querySelector("[data-close]");
      closeBtn && closeBtn.focus();
    }, 30);
    return () => { document.removeEventListener("keydown", onKey); clearTimeout(t); };
  }, [hasPrev, hasNext, onPrev, onNext, onClose]);

  if (!project) return null;

  const onTouchStart = (e) => { const t = e.touches[0]; touch.current = { x: t.clientX, y: t.clientY, active: true }; };
  const onTouchEnd = (e) => {
    if (!touch.current.active) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.current.x, dy = t.clientY - touch.current.y;
    touch.current.active = false;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0 && hasNext) onNext();
      else if (dx > 0 && hasPrev) onPrev();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${project.title} — ${CATEGORY_LABEL[project.category]}`}
      data-lenis-prevent
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onWheel={(e) => e.stopPropagation()}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-3 sm:p-6"
      style={{ animation: "avassist-panel-in 0.28s cubic-bezier(0.22,0.61,0.36,1)" }}
    >
      <div ref={panelRef} className="relative flex max-h-full w-full max-w-[1200px] flex-col overflow-hidden rounded-xl md:flex-row">
        {/* close */}
        <button data-close type="button" onClick={onClose} aria-label="Close"
          className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white/80 backdrop-blur transition-colors hover:bg-black/70 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff2e2e]">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>

        {/* photo (≈60%) */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black md:basis-[60%]"
          onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {/* blurred thumb placeholder until the hi-res loads */}
          <img src={project.thumb} alt="" aria-hidden="true"
            className={`absolute inset-0 h-full w-full object-contain blur-lg transition-opacity duration-500 ${loaded ? "opacity-0" : "opacity-60"}`} />
          <img src={project.image} alt={project.alt} onLoad={() => setLoaded(true)}
            className={`relative max-h-[70vh] w-full object-contain transition-opacity duration-500 md:max-h-[86vh] ${loaded ? "opacity-100" : "opacity-0"}`} />

          {/* prev / next */}
          {hasPrev && (
            <button type="button" onClick={onPrev} aria-label="Previous installation"
              className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white/85 backdrop-blur transition-colors hover:bg-black/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff2e2e]">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
          )}
          {hasNext && (
            <button type="button" onClick={onNext} aria-label="Next installation"
              className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white/85 backdrop-blur transition-colors hover:bg-black/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff2e2e]">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          )}
        </div>

        {/* details (≈40%) */}
        <div className="flex shrink-0 flex-col justify-center gap-3 bg-[#0b0b0e] p-6 text-white md:basis-[40%] md:p-8">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-[#ff8a8a]">{CATEGORY_LABEL[project.category]}</p>
          <h3 className="font-display text-[clamp(1.4rem,2.4vw,2rem)] font-light leading-tight text-white">{project.title}</h3>

          {project.review && (
            <div className="mt-1 border-l-2 border-[#ff2e2e] pl-3">
              <p className="text-[0.8rem] text-[#ff2e2e]">★★★★★</p>
              <p className="mt-1 text-[0.9rem] leading-snug text-white/85">“{project.review.text}”</p>
              <p className="mt-1 text-[0.78rem] text-white/45">— {project.review.author}</p>
            </div>
          )}

          {project.specs && (
            <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[0.82rem]">
              {project.specs.room && (<><dt className="text-white/45">Room</dt><dd className="text-white/85">{project.specs.room}</dd></>)}
              {project.specs.projector && (<><dt className="text-white/45">Projector</dt><dd className="text-white/85">{project.specs.projector}</dd></>)}
              {project.specs.speakers && (<><dt className="text-white/45">Speakers</dt><dd className="text-white/85">{project.specs.speakers}</dd></>)}
              {project.specs.screen && (<><dt className="text-white/45">Screen</dt><dd className="text-white/85">{project.specs.screen}</dd></>)}
            </dl>
          )}

          <p className="mt-1 text-[0.78rem] text-white/40">Star Audio Visual Systems · Bangalore</p>
          <a href="#contact" onClick={onClose}
            className="mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[0.82rem] font-semibold text-[#101012] transition-transform hover:-translate-y-0.5">
            Enquire about a similar setup →
          </a>
        </div>
      </div>
    </div>
  );
}
