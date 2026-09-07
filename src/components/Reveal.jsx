import { useLayoutEffect, useRef } from "react";
import { gsap } from "../lib/gsap";

/**
 * Subtle scroll reveal (used for supporting content, not the primary hero motion).
 */
export default function Reveal({ children, y = 34, delay = 0, className = "", as: Tag = "div" }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { autoAlpha: 0, y },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          delay,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%" },
        }
      );
    }, ref);
    return () => ctx.revert();
  }, [y, delay]);
  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
