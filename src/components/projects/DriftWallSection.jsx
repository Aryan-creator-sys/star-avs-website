import { useCallback, useMemo, useState } from "react";
import DriftWall from "./DriftWall";
import ProjectLightbox from "./ProjectLightbox";
import { PROJECTS } from "../../data/projects";

/**
 * A drift-wall showcase of all installations, sitting right above Contact.
 * Every tile is filled (images repeat, no gaps); clicking a tile expands it in
 * the shared lightbox with prev/next through all projects.
 */
export default function DriftWallSection() {
  // stable reference so the wall never rebuilds/restarts on lightbox open/close
  const items = useMemo(() => PROJECTS.map((p, i) => ({ image: p.wall, title: p.title, index: i })), []);
  const [openIndex, setOpenIndex] = useState(-1);
  const open = useCallback((i) => setOpenIndex(i), []);
  const close = useCallback(() => setOpenIndex(-1), []);
  const prev = useCallback(() => setOpenIndex((i) => (i > 0 ? i - 1 : i)), []);
  const next = useCallback(() => setOpenIndex((i) => (i < PROJECTS.length - 1 ? i + 1 : i)), []);
  const current = openIndex >= 0 ? PROJECTS[openIndex] : null;

  return (
    <section id="wall" className="relative h-[100svh] min-h-[720px] overflow-hidden bg-[#060010]">
      <DriftWall
        items={items}
        columns={6}
        tileWidth={224}
        tileHeight={150}
        gap={20}
        tilt={16}
        turn={-14}
        perspective={1300}
        depth={120}
        speed={42}
        direction="up"
        variance={0.45}
        parallax={0.6}
        lift={40}
        fade={0.6}
        dim={0.42}
        overlayColor="#060010"
        radius={14}
        roll={0}
        pauseOnHover={false}
        grayscale={false}
        onItemClick={open}
      />

      {/* heading overlay (doesn't block tile clicks) */}
      <div className="pointer-events-none absolute inset-x-0 top-[12%] z-10 px-6 text-center">
        <p className="mb-3 text-[0.72rem] font-medium uppercase tracking-[0.35em] text-white/45">More work</p>
        <h2 className="font-display text-[clamp(2rem,4.4vw,3.4rem)] font-light leading-[1.05] tracking-tight text-white">
          Many other <span className="font-semibold">projects</span>
        </h2>
        <p className="mt-3 text-[0.85rem] text-white/50">Tap any image to view it full-screen</p>
      </div>

      {current && (
        <ProjectLightbox
          project={current}
          hasPrev={openIndex > 0}
          hasNext={openIndex < PROJECTS.length - 1}
          onPrev={prev}
          onNext={next}
          onClose={close}
        />
      )}
    </section>
  );
}
