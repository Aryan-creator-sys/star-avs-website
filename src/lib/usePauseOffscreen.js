import { useEffect } from "react";

/**
 * Sets data-offscreen="true" on the element while it's outside the viewport so
 * purely-decorative continuous CSS animations inside it (marquees, the contact
 * wave) can be paused — freeing the compositor for on-screen work. Resuming is
 * seamless (CSS animations continue from where they paused), so there is no
 * visual change whatsoever. No-op if IntersectionObserver is unavailable.
 */
export default function usePauseOffscreen(ref, rootMargin = "200px") {
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => el.setAttribute("data-offscreen", e.isIntersecting ? "false" : "true"),
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
}
