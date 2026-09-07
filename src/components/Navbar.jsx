import { useEffect, useRef, useState } from "react";
import { NAV, COMPANY, ASSETS } from "../data/site";

/**
 * Direction-aware top bar.
 *  · Over the hero: no bar, logo always visible; Menu/Enquire fade in past ~half.
 *  · Past the hero: scrolling DOWN hides the bar entirely; scrolling UP reveals it
 *    WITH a frosted white bar. Logo → dark, controls → light glass.
 */
export default function Navbar() {
  const [y, setY] = useState(0);
  const [dir, setDir] = useState("up");
  const [open, setOpen] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const cy = window.scrollY;
      if (Math.abs(cy - lastY.current) > 4) {
        setDir(cy > lastY.current ? "down" : "up");
        lastY.current = cy;
      }
      setY(cy);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const vh = Math.max((typeof window !== "undefined" ? window.innerHeight : 800) || 0, 600);
  const atHero = y < vh * 0.9;
  const over = atHero; // dark hero styling
  const headerHidden = !atHero && dir === "down";
  const whiteBar = !atHero && dir === "up";
  const showButtons = atHero ? y > vh * 0.5 : true;
  const collapsed = y > vh * 0.4; // logo -> just the symbol once scrolling begins

  const toHome = (e) => {
    e.preventDefault();
    setOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const ctrl = over ? "glass-dark" : "glass";
  const logoFilter = { filter: "brightness(0) invert(1) drop-shadow(0 2px 8px rgba(0,0,0,0.4))" };
  const gate = `transition-all duration-500 ease-cine ${showButtons ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"}`;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[70] transition-all duration-500 ease-cine ${headerHidden ? "pointer-events-none -translate-y-full opacity-0" : "translate-y-0 opacity-100"}`}
      >
        <div className="grid h-[76px] grid-cols-[1fr_auto_1fr] items-center px-5 md:px-8">
          {/* left — menu button (gated over hero; shown in bar past hero) */}
          <div className="flex justify-start">
            <button onClick={() => setOpen(true)} aria-label="Open menu" className={`${ctrl} ${gate} flex h-11 items-center gap-2.5 rounded-full px-4`}>
              <span className="flex flex-col gap-[3px]">
                <span className={`h-[2px] w-4 ${over ? "bg-white" : "bg-[#101012]"}`} />
                <span className={`h-[2px] w-4 ${over ? "bg-white" : "bg-[#101012]"}`} />
              </span>
              <span className="hidden text-sm font-semibold sm:inline">Menu</span>
            </button>
          </div>

          {/* center — logo (ALWAYS visible); full lockup crossfades to just the
              symbol mark as the user scrolls */}
          <a href="#hero" onClick={toHome} aria-label={`${COMPANY.short} — home`}
            className={`relative flex items-center justify-center transition-all duration-300 ${over ? "" : "glass rounded-full px-5 py-2"}`}>
            {/* full lockup — defines the footprint */}
            <img
              src={ASSETS.logo}
              alt={COMPANY.name}
              className={`h-9 w-auto transition-opacity duration-500 md:h-11 ${collapsed ? "opacity-0" : "opacity-100"}`}
              style={over ? logoFilter : undefined}
            />
            {/* symbol only — the dedicated symbol PNG (rendered all-white over
                the hero via the invert filter; natural on the frosted bar) */}
            <img
              aria-hidden="true"
              src={ASSETS.logoSymbol}
              alt=""
              className={`pointer-events-none absolute left-1/2 top-1/2 h-8 w-auto -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500 md:h-9 ${collapsed ? "opacity-100" : "opacity-0"}`}
              style={over ? logoFilter : undefined}
            />
          </a>

          {/* right — enquire (gated over hero; shown in bar past hero) */}
          <div className="flex justify-end">
            <a href="#contact" className={`${ctrl} ${gate} rounded-full px-5 py-2.5 text-sm font-semibold`}>
              Enquire
            </a>
          </div>
        </div>
      </header>

      {/* side drawer */}
      <div
        className={`fixed inset-0 z-[85] transition-opacity duration-500 ${open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
        aria-hidden={!open}
      >
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <nav
          className={`glass absolute left-0 top-0 flex h-full w-[min(84vw,380px)] flex-col p-8 transition-transform duration-500 ease-cine ${open ? "translate-x-0" : "-translate-x-full"}`}
          aria-label="Primary"
          style={{ borderRadius: 0 }}
        >
          <div className="mb-10 flex items-center justify-between">
            <img src={ASSETS.logo} alt={COMPANY.name} className="h-9 w-auto" />
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="text-2xl text-[#101012]">×</button>
          </div>
          <div className="flex flex-col">
            {NAV.map((n, i) => (
              <a key={n.href} href={n.href} onClick={() => setOpen(false)}
                className="group flex items-baseline gap-4 border-b border-black/10 py-4 font-display text-2xl font-semibold tracking-tight text-[#101012]">
                <span className="text-xs tabular-nums text-black/40">{String(i + 1).padStart(2, "0")}</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">{n.label}</span>
              </a>
            ))}
          </div>
          <a href="#contact" onClick={() => setOpen(false)} className="mt-auto rounded-full bg-[#101012] px-6 py-3.5 text-center font-semibold text-white">
            Enquire now
          </a>
        </nav>
      </div>
    </>
  );
}
