import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DriftWall from "./DriftWall";
import ProjectLightbox from "./ProjectLightbox";
import { PROJECTS, FAN_IDS } from "../../data/projects";

/**
 * A drift-wall showcase of the installations NOT shown in the fan carousel — so
 * the wall and the fan never repeat the same photo. All photos are the real
 * Refined-folder installation images (pNN, small `-w` variants for the wall).
 * Every tile is filled (images repeat, no gaps); clicking a tile expands it in
 * the shared lightbox with prev/next through the wall's set.
 */
export default function DriftWallSection() {
  // wall set = every project except the ones already used in the fan
  const wallProjects = useMemo(() => {
    const list = PROJECTS.filter((p) => !FAN_IDS.includes(p.id));
    // keep the US Open / tennis projection (p17) in a centre column: the wall
    // fills columns round-robin (index % 6), so index 3 → a centre column.
    const idx = list.findIndex((p) => p.id === "p17");
    if (idx > -1 && idx !== 3) {
      const [item] = list.splice(idx, 1);
      list.splice(3, 0, item);
    }
    return list;
  }, []);
  // stable reference so the wall never rebuilds/restarts on lightbox open/close
  const items = useMemo(() => wallProjects.map((p, i) => ({ image: p.wall, title: p.title, index: i })), [wallProjects]);
  const [openIndex, setOpenIndex] = useState(-1);
  const open = useCallback((i) => setOpenIndex(i), []);
  const close = useCallback(() => setOpenIndex(-1), []);
  const prev = useCallback(() => setOpenIndex((i) => (i > 0 ? i - 1 : i)), []);
  const next = useCallback(() => setOpenIndex((i) => (i < wallProjects.length - 1 ? i + 1 : i)), [wallProjects.length]);
  const current = openIndex >= 0 ? wallProjects[openIndex] : null;

  // Fix late image pop-in: lazy-loading keys off an element's layout box, but the
  // tiles move via CSS transform (which lazy-load ignores), so tiles drifting in
  // from the bottom start loading/decoding only at entry. Instead we arm the REAL
  // <img> elements when the wall approaches (~2.5 screens away): their src is set
  // and they load eagerly, so each element's own network load + render-size decode
  // finishes before it drifts into view. ~29 files / ~1MB, only on approach — no
  // initial-load cost. The tile DOM stays mounted/stable (no recycle/remount).
  // Phone-only: smaller tiles + a more zoomed-out plane so more of the wall is
  // visible at once (desktop keeps 224 / 1.35). Driven by innerWidth.
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const update = () => setPhone(window.innerWidth < 640);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const tileW = phone ? 132 : 224;
  const wallScale = phone ? 1.0 : 1.35;

  const sectionRef = useRef(null);
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (armed) return;
    // Fallback: if IntersectionObserver isn't available, just load now so the
    // wall always works.
    if (typeof IntersectionObserver === "undefined") {
      setArmed(true);
      return;
    }
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setArmed(true); io.disconnect(); } },
      { rootMargin: "2500px 0px" } // ~2–3 screens ahead: time to load+decode ~1MB before visible
    );
    io.observe(el);
    return () => io.disconnect();
  }, [armed]);

  return (
    <section ref={sectionRef} id="wall" className="relative h-[100svh] min-h-[720px] overflow-hidden bg-[#060010]">
      <DriftWall
        items={items}
        frozen={openIndex >= 0}
        preloadReady={armed}
        columns={6}
        scale={wallScale}
        tileWidth={tileW}
        tileHeight={Math.round(tileW * 0.67)}
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
          hasNext={openIndex < wallProjects.length - 1}
          onPrev={prev}
          onNext={next}
          onClose={close}
        />
      )}
    </section>
  );
}
