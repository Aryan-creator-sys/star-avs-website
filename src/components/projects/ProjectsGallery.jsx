import { useCallback, useState } from "react";
import Reveal from "../Reveal";
import CardFanCarousel from "./CardFanCarousel";
import ProjectLightbox from "./ProjectLightbox";
import { TOP_HOME_THEATRE } from "../../data/projects";

/**
 * Projects / Installations — a card-fan showcase of the 12 strongest home-theatre
 * installations. Clicking a card opens the full-screen lightbox (expand), with
 * prev/next through the 12. Real photos only; no fabricated reviews/specs.
 */
export default function ProjectsGallery() {
  // Only the top 7 installations — shown all at once in the fan (no pagination).
  const projects = TOP_HOME_THEATRE.slice(0, 7);
  const cards = projects.map((p) => ({ imgUrl: p.thumb, alt: p.alt }));
  const [openIndex, setOpenIndex] = useState(-1);

  const open = useCallback((i) => setOpenIndex(i), []);
  const close = useCallback(() => setOpenIndex(-1), []);
  const prev = useCallback(() => setOpenIndex((i) => (i > 0 ? i - 1 : i)), []);
  const next = useCallback(() => setOpenIndex((i) => (i < projects.length - 1 ? i + 1 : i)), [projects.length]);

  const current = openIndex >= 0 ? projects[openIndex] : null;

  return (
    <section id="work" className="relative overflow-hidden bg-[#f6f6f4] px-6 pt-[1vh] pb-24 md:pb-[14vh]">
      <div className="mx-auto max-w-[1280px]">
        <Reveal className="text-center">
          <p className="mb-3 text-[0.72rem] font-medium uppercase tracking-[0.35em] text-black/55">Projects</p>
          <h2 className="font-display text-[clamp(2rem,4.4vw,3.4rem)] font-light leading-[1.05] tracking-tight text-[#101012]">
            Our <span className="font-semibold">installations</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[0.95rem] leading-relaxed text-black/55">
            View some of our proudest home installations — tap any image to see it full-screen.
          </p>
          <p className="mt-1 text-[0.8rem] tracking-wide text-black/40">30+ installations · Bangalore</p>
        </Reveal>
      </div>

      <div className="mt-2">
        <CardFanCarousel cards={cards} onCardClick={open} />
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
