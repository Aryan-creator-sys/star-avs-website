import { useState } from "react";
import useRevealOnScroll from "../../lib/useRevealOnScroll";

const CATEGORY_LABEL = {
  "home-theatre": "Home theatre",
  "living-room": "Living room",
  boardroom: "Boardroom",
  commercial: "Commercial",
};

const SPEEDS = [0.85, 1.15, 0.95, 1.1]; // subtle per-tile parallax variation

function spanClasses(project) {
  if (project.fullWidth) return "col-span-2 md:col-span-4 lg:col-span-6";
  if (project.featured) return "col-span-2 md:col-span-4 lg:col-span-3";
  return "col-span-1 md:col-span-2 lg:col-span-2";
}
function heightClasses(project) {
  if (project.fullWidth) return "h-[48vh] md:h-[62vh]";
  if (project.featured) return "aspect-[4/3] lg:aspect-[16/10]";
  return "aspect-[4/3]";
}

/**
 * A single installation tile. Semantic <button>, reveal-on-scroll, restrained
 * hover (scale on a wrapper), image-in-frame parallax (the image translates
 * inside a fixed frame — no layout shift), and a clean dark fallback.
 */
export default function ProjectCard({ project, index, parallax, onOpen, registerRef }) {
  const { ref, revealed } = useRevealOnScroll();
  const [failed, setFailed] = useState(false);

  return (
    <button
      type="button"
      ref={(el) => { ref.current = el; if (registerRef) registerRef(project.id, el); }}
      onClick={() => onOpen(project.id)}
      aria-label={`View installation: ${project.title}, ${CATEGORY_LABEL[project.category]}`}
      style={{ transitionDelay: revealed ? `${(index % 3) * 70}ms` : "0ms" }}
      className={`group relative block overflow-hidden rounded-lg bg-[#0e0e12] outline-none transition-[opacity,transform] duration-[650ms] ease-cine focus-visible:ring-2 focus-visible:ring-[#ff2e2e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f6f4] ${spanClasses(project)} ${heightClasses(project)} ${revealed ? "opacity-100 translate-y-0" : "translate-y-5 opacity-0"}`}
    >
      {failed ? (
        <span className="flex h-full w-full items-center justify-center bg-[#111114] text-xs text-white/30">Image unavailable</span>
      ) : (
        <span className="absolute inset-0 block transition-[transform,filter] duration-[600ms] ease-cine group-hover:scale-[1.02] group-hover:brightness-[1.05]">
          <img
            src={project.thumb}
            alt={project.alt}
            loading="lazy"
            decoding="async"
            data-par={parallax ? SPEEDS[index % SPEEDS.length] : 0}
            onError={() => setFailed(true)}
            className="absolute left-0 top-1/2 h-[112%] w-full -translate-y-1/2 object-cover will-change-transform"
          />
        </span>
      )}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/45 to-transparent px-3 pb-2.5 pt-8 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <span className="text-[0.7rem] font-medium tracking-wide text-white/90">{project.title}</span>
        <span className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-[#ff8a8a]">{CATEGORY_LABEL[project.category]}</span>
      </span>
    </button>
  );
}
