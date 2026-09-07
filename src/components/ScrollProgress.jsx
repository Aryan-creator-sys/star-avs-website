import { useEffect, useRef } from "react";

/**
 * Thin scroll-progress bar (recommended for scroll-storytelling patterns so the
 * narrative stays legible). rAF-driven, transform-only, no per-frame React state.
 */
export default function ScrollProgress() {
  const bar = useRef(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div className="fixed inset-x-0 top-0 z-[70] h-0.5 bg-transparent" aria-hidden="true">
      <div
        ref={bar}
        className="h-full origin-left bg-gradient-to-r from-gold to-gold-soft"
        style={{ transform: "scaleX(0)", willChange: "transform" }}
      />
    </div>
  );
}
