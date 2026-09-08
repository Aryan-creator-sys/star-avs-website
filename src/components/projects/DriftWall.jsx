import { memo, useEffect, useMemo, useRef } from "react";

/**
 * DriftWall — a tilted 3D wall of image tiles that drift/loop continuously,
 * with per-column speed variance and a dim + edge-fade overlay. Adapted to this
 * project (JSX, no external dep) with the same prop API as the react-bits
 * component. Every column is filled (items repeat) so there are no gaps, and
 * tiles are clickable via onItemClick(index) to expand in a lightbox.
 *
 * Wrapped in React.memo so opening/paging the lightbox (which changes the
 * parent's state) never re-renders the whole wall. `frozen` pauses the drift
 * while the lightbox covers it — invisible, but frees the GPU so the expand
 * animation is smooth.
 */
function DriftWall({
  items,
  frozen = false,
  preloadReady = true,
  scale = 1.35,
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
  const FILL_PX = 1100; // fill each column with a safe margin for a seamless loop
  // (was over-filled ~4x; fewer tiles = far less continuous GPU compositing,
  // which is the safe way to lighten the wall without changing how it looks)
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
    <div ref={rootRef} className="dw-root" data-inview="true" data-pause={pauseOnHover ? "true" : "false"} data-frozen={frozen ? "true" : "false"} style={{ perspective: `${perspective}px` }}>
      <div
        className="dw-plane"
        style={{
          gap: `${gap}px`,
          transform: `translate(-50%, calc(-50% - ${lift}px)) rotateX(${tilt}deg) rotateZ(${turn}deg) rotateY(${roll}deg) scale(${scale})`,
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
                      {/* Approach-gated eager load: src is unset until the wall
                          nears the viewport (preloadReady), so nothing is fetched
                          at initial page load. Once armed the REAL element loads
                          eagerly and decodes at its render size ahead of entry, so
                          the tile is paint-ready before it drifts in — no pop-in.
                          The element itself never remounts (stable key), so once
                          loaded it stays ready for every loop pass. */}
                      <img src={preloadReady ? it.image : undefined} alt={it.title || ""}
                        loading="eager" decoding="async" draggable="false"
                        style={grayscale ? { filter: "grayscale(1)" } : undefined} />
                    </span>
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

export default memo(DriftWall);
