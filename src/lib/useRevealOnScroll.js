import { useEffect, useRef, useState } from "react";

// One shared IntersectionObserver for every card that uses this hook.
let observer = null;
const callbacks = new WeakMap();

function getObserver() {
  if (observer) return observer;
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const cb = callbacks.get(e.target);
          if (cb) cb();
          observer.unobserve(e.target);
          callbacks.delete(e.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
  );
  return observer;
}

/**
 * Reveal an element once as it scrolls into view. Returns { ref, revealed }.
 * Respects prefers-reduced-motion (reveals immediately). Reveal is permanent.
 */
export default function useRevealOnScroll() {
  const ref = useRef(null);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(true);
      return;
    }
    const obs = getObserver();
    callbacks.set(el, () => setRevealed(true));
    obs.observe(el);
    return () => {
      try { obs.unobserve(el); } catch { /* ignore */ }
      callbacks.delete(el);
    };
  }, []);
  return { ref, revealed };
}
