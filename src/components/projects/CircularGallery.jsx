import { useState, useEffect, useRef } from "react";

/**
 * Circular 3D gallery (adapted from a 21st.dev/shadcn TSX component into this
 * project's JSX). Rotation is driven by scrolling THROUGH the section (scoped
 * to `scrollRef`, not the whole page) and gently auto-rotates when idle. The
 * stage scales down on smaller viewports. Clicking a front-facing card calls
 * onItemClick(index) so the parent can open the lightbox (expand).
 *
 * items: [{ common, binomial, photo: { url, text, pos, by } }]
 */

function getScale(width) {
  if (width < 480) return 0.42;
  if (width < 640) return 0.52;
  if (width < 768) return 0.64;
  if (width < 1024) return 0.82;
  return 1.0;
}

export default function CircularGallery({ items, radius = 600, autoRotateSpeed = 0.02, scrollRef, onItemClick }) {
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const isScrolling = useRef(false);
  const scrollTimeout = useRef(null);
  const rafRef = useRef(null);

  // responsive scale
  useEffect(() => {
    const onResize = () => setScale(getScale(window.innerWidth));
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // scroll-driven rotation, scoped to the section wrapper
  useEffect(() => {
    const handleScroll = () => {
      const wrap = scrollRef && scrollRef.current;
      let progress = 0;
      if (wrap) {
        const rect = wrap.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
        progress = total > 0 ? scrolled / total : 0;
      } else {
        const sh = document.documentElement.scrollHeight - window.innerHeight;
        progress = sh > 0 ? window.scrollY / sh : 0;
      }
      isScrolling.current = true;
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      setRotation(progress * 360);
      scrollTimeout.current = setTimeout(() => { isScrolling.current = false; }, 150);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [scrollRef]);

  // idle auto-rotate (respects reduced motion)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tick = () => {
      if (!isScrolling.current) setRotation((r) => r + autoRotateSpeed);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [autoRotateSpeed]);

  const anglePerItem = 360 / items.length;

  return (
    <div role="region" aria-label="Installations 3D gallery" className="relative flex h-full w-full items-center justify-center" style={{ perspective: "2000px" }}>
      <div className="relative h-full w-full" style={{ transform: `scale(${scale}) rotateY(${rotation}deg)`, transformStyle: "preserve-3d" }}>
        {items.map((item, i) => {
          const itemAngle = i * anglePerItem;
          const relativeAngle = (itemAngle + (rotation % 360) + 360) % 360;
          const normalizedAngle = Math.abs(relativeAngle > 180 ? 360 - relativeAngle : relativeAngle);
          const opacity = Math.max(0.28, 1 - normalizedAngle / 180);
          const isFront = normalizedAngle < 60; // only near-front cards are clickable
          return (
            <button
              key={item.photo.url}
              type="button"
              aria-label={item.common}
              onClick={() => onItemClick && onItemClick(i)}
              className="absolute h-[400px] w-[300px] cursor-pointer outline-none"
              style={{
                transform: `rotateY(${itemAngle}deg) translateZ(${radius}px)`,
                left: "50%",
                top: "50%",
                marginLeft: "-150px",
                marginTop: "-200px",
                opacity,
                pointerEvents: isFront ? "auto" : "none",
                transition: "opacity 0.3s linear",
              }}
            >
              <div className="group relative h-full w-full overflow-hidden rounded-xl border border-white/10 bg-[#0e0e12] shadow-2xl">
                <img src={item.photo.url} alt={item.photo.text} loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  style={{ objectPosition: item.photo.pos || "center" }} />
                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/85 to-transparent p-4 text-left text-white">
                  <h3 className="font-display text-lg font-light tracking-tight">{item.common}</h3>
                  <em className="text-[0.72rem] uppercase not-italic tracking-[0.25em] text-[#ff8a8a]">{item.binomial}</em>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
