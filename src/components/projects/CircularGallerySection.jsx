import { useCallback, useRef, useState } from "react";
import CircularGallery from "./CircularGallery";
import ProjectLightbox from "./ProjectLightbox";
import { NEXT_10 } from "../../data/projects";

const CATEGORY_LABEL = {
  "home-theatre": "Home theatre",
  "living-room": "Living room",
  boardroom: "Boardroom",
  commercial: "Commercial",
};

/**
 * A circular 3D gallery of the next 10 installations. Scrolling through the tall
 * wrapper rotates the ring (inner viewport is sticky); it gently auto-rotates
 * when idle. Clicking a card opens the shared lightbox (expand) with prev/next.
 */
export default function CircularGallerySection() {
  const wrapperRef = useRef(null);
  const projects = NEXT_10;
  const items = projects.map((p) => ({
    common: p.title,
    binomial: CATEGORY_LABEL[p.category],
    photo: { url: p.thumb, text: p.alt, by: "Star AVS" },
  }));

  const [openIndex, setOpenIndex] = useState(-1);
  const open = useCallback((i) => setOpenIndex(i), []);
  const close = useCallback(() => setOpenIndex(-1), []);
  const prev = useCallback(() => setOpenIndex((i) => (i > 0 ? i - 1 : i)), []);
  const next = useCallback(() => setOpenIndex((i) => (i < projects.length - 1 ? i + 1 : i)), [projects.length]);
  const current = openIndex >= 0 ? projects[openIndex] : null;

  return (
    <section id="work-more" className="relative bg-[#09090f]">
      {/* tall wrapper drives the rotation; inner viewport is sticky */}
      <div ref={wrapperRef} className="relative h-[240vh]">
        <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-[10%] z-10 px-6 text-center">
            <p className="mb-3 text-[0.72rem] font-medium uppercase tracking-[0.35em] text-white/45">More projects</p>
            <h2 className="font-display text-[clamp(1.8rem,4vw,3rem)] font-light leading-[1.05] tracking-tight text-white">
              Explore <span className="font-semibold">the collection</span>
            </h2>
            <p className="mt-3 text-[0.85rem] text-white/45">Scroll to rotate · tap a card to view</p>
          </div>
          <div className="h-full w-full">
            <CircularGallery items={items} scrollRef={wrapperRef} radius={600} onItemClick={open} />
          </div>
        </div>
      </div>

      {current && (
        <ProjectLightbox
          project={current}
          hasPrev={openIndex > 0}
          hasNext={openIndex < projects.length - 1}
          onPrev={prev}
          onNext={next}
          onClose={close}
        />
      )}
    </section>
  );
}
