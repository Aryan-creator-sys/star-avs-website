import { useEffect, useRef } from "react";
import { gsap } from "../lib/gsap";

/**
 * Figma-style custom cursor with a glass ring that trails the pointer with
 * inertia. A crisp dot tracks precisely; the ring lags and grows over
 * interactive elements. Desktop + fine-pointer only; leaves touch untouched.
 */
export default function CustomCursor() {
  const dot = useRef(null);
  const ring = useRef(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    document.body.classList.add("cursor-on");
    const dotX = gsap.quickTo(dot.current, "x", { duration: 0.08, ease: "power3" });
    const dotY = gsap.quickTo(dot.current, "y", { duration: 0.08, ease: "power3" });
    const ringX = gsap.quickTo(ring.current, "x", { duration: 0.5, ease: "power3" });
    const ringY = gsap.quickTo(ring.current, "y", { duration: 0.5, ease: "power3" });

    const move = (e) => {
      dotX(e.clientX); dotY(e.clientY);
      ringX(e.clientX); ringY(e.clientY);
    };
    const over = (e) => {
      if (e.target.closest("a,button,[data-cursor], input, textarea, select, label"))
        gsap.to(ring.current, { scale: 1.7, background: "rgba(16,16,18,0.08)", duration: 0.3, ease: "power3" });
    };
    const out = (e) => {
      if (e.target.closest("a,button,[data-cursor], input, textarea, select, label"))
        gsap.to(ring.current, { scale: 1, background: "rgba(255,255,255,0.14)", duration: 0.3, ease: "power3" });
    };
    const down = () => gsap.to(ring.current, { scale: 0.8, duration: 0.15 });
    const up = () => gsap.to(ring.current, { scale: 1, duration: 0.2 });

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    window.addEventListener("pointerout", out, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });

    return () => {
      document.body.classList.remove("cursor-on");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      window.removeEventListener("pointerout", out);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  return (
    <>
      <div ref={ring} className="cursor-ring" aria-hidden="true" />
      <div ref={dot} className="cursor-dot" aria-hidden="true" />
    </>
  );
}
