import { useEffect, useMemo, useRef } from "react";

/**
 * DriftWall — a tilted 3D wall of image tiles that drift/loop continuously,
 * with per-column speed variance and a dim + edge-fade overlay. Adapted to this
 * project (JSX, no external dep) with the same prop API as the react-bits
 * component. Every column is filled (items repeat) so there are no gaps, and
 * tiles are clickable via onItemClick(index) to expand in a lightbox.
 */
export default function DriftWall({
  items,
  columns = 5,
  tileWidth = 200,
  tileHeight = 132,
  gap = 18,
  tilt = 16,
  turn = -14,
  perspective = 1200,
  depth = 120, // eslint-disable-line no-unused-vars
  speed = 42,
  direction = "up",
  variance = 0.45,
  parallax = 0.6,
  lift = 64,
  fade = 0.6,
  dim = 0.55,
  overlayColor = "#060010",
  radius = 14,
  roll = 0,
  pauseOnHover = false,
  grayscale = false,
  onItemClick,
}) {
  // pause the drift animation whenever the wall is off-screen (keeps the rest of
  // the page smooth and avoids compositing work when it can't be seen)
  const rootRef = useRef(null);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => el.setAttribute("data-inview", e.isIntersecting ? "true" : "false"),
      { rootMargin: "140px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // each tile's height matches its photo aspect (fixed column width) → no crop
  const hOf = (it) => (it && it.ar ? Math.round(tileWidth / it.ar) : tileHeight);
  const FILL_PX = 2300; // repeat items until a column overflows → no gaps (tall enough when zoomed out)
  const cols = useMemo(() => {
    const buckets = Array.from({ length: columns }, () => []);
    items.forEach((it, i) => buckets[i % columns].push(it));
    return buckets.map((b) => {
      if (!b.length) return b;
      const arr = [];
      let h = 0;
      let i = 0;
      while (h < FILL_PX || arr.length < 4) {
        const it = b[i % b.length];
        arr.push(it);
        h += hOf(it) + gap;
        i += 1;
      }
      return arr;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, columns, tileWidth, tileHeight, gap]);

  return (
    <div ref={rootRef} className="dw-root" data-inview="true" data-pause={pauseOnHover ? "true" : "false"} style={{ perspective: `${perspective}px` }}>
      <div
        className="dw-plane"
        style={{
          gap: `${gap}px`,
          transform: `translate(-50%, calc(-50% - ${lift}px)) rotateX(${tilt}deg) rotateZ(${turn}deg) rotateY(${roll}deg) scale(1.35)`,
        }}
      >
        {cols.map((colItems, ci) => {
          if (!colItems.length) return null;
          const track = [...colItems, ...colItems];
          const setPx = colItems.reduce((s, it) => s + hOf(it) + gap, 0);
          // vary speed per column, symmetric around the middle
          const factor = 1 + variance * ((ci % 2 ? 1 : -1) * ((ci + 1) / columns));
          const dur = Math.max((setPx / speed) * factor, 8);
          const delay = -parallax * dur * (ci / Math.max(columns - 1, 1));
          return (
            <div key={ci} className="dw-col" style={{ gap: `${gap}px`, width: tileWidth }}>
              <div
                className="dw-track"
                style={{
                  gap: `${gap}px`,
                  animationName: direction === "down" ? "driftwall-down" : "driftwall-up",
                  animationTimingFunction: "linear",
                  animationIterationCount: "infinite",
                  animationDuration: `${dur}s`,
                  animationDelay: `${delay}s`,
                }}
              >
                {track.map((it, ti) => (
                  <button
                    key={ti}
                    type="button"
                    onClick={() => onItemClick && onItemClick(it.index)}
                    aria-label={it.title ? `View ${it.title}` : "View installation"}
                    className="dw-tile"
                    style={{ width: tileWidth, height: hOf(it), borderRadius: radius }}
                  >
                    <span className="dw-crop" style={{ borderRadius: radius }}>
                      <img src={it.image} alt={it.title || ""} loading="lazy" decoding="async" draggable="false"
                        style={grayscale ? { filter: "grayscale(1)" } : undefined} />
                    </span>
                    {/* glow/ring/sheen — only its opacity animates on hover (GPU, no repaint) */}
                    <span className="dw-glow" style={{ borderRadius: radius }} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* dim tint + edge fade into the background */}
      <div className="pointer-events-none absolute inset-0" style={{ background: overlayColor, opacity: dim }} />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: fade,
          background: `linear-gradient(180deg, ${overlayColor} 0%, transparent 22%, transparent 78%, ${overlayColor} 100%)`,
        }}
      />
    </div>
  );
}
