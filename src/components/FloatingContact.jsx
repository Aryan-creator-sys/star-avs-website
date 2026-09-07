import { useEffect, useState } from "react";
import { COMPANY } from "../data/site";

/**
 * Fixed contact dock, bottom-left: WhatsApp + a phone button that expands to
 * show all published numbers. Only appears once the user scrolls past the hero.
 */
export default function FloatingContact() {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > Math.max(window.innerHeight || 0, 600) * 0.9);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const wa = `https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent(
    "Hi Star AVS, I'd like to enquire about a projector / home cinema."
  )}`;

  return (
    <div
      className={`fixed bottom-5 right-5 z-[80] flex flex-col items-end gap-3 transition-all duration-500 ease-out ${
        shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
      aria-hidden={!shown}
    >
      {/* expandable phone numbers */}
      {open && (
        <div className="glass flex flex-col gap-1 rounded-2xl p-2" role="menu" aria-label="Call us">
          {COMPANY.phones.map((p) => (
            <a key={p.tel} href={`tel:${p.tel}`}
              className="rounded-xl px-4 py-2 text-sm font-medium text-[#101012] transition-colors hover:bg-black/5">
              {p.label}
            </a>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* WhatsApp */}
        <a href={wa} target="_blank" rel="noopener" aria-label="Chat on WhatsApp"
          className="glass flex h-14 w-14 items-center justify-center rounded-full">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="#101012" aria-hidden="true">
            <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.38a9.86 9.86 0 0 0 4.74 1.21c5.46 0 9.9-4.44 9.9-9.9S17.5 2 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.16 8.16 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.24-8.23 4.54 0 8.23 3.69 8.23 8.23 0 4.54-3.69 8.23-8.23 8.23zm4.5-6.16c-.25-.12-1.47-.72-1.7-.8-.23-.09-.4-.13-.56.12-.17.25-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29z" />
          </svg>
        </a>
        {/* Phone (toggles numbers) */}
        <button onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label="Call us"
          className="glass flex h-14 items-center gap-2 rounded-full px-5">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#101012" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <span className="text-sm font-semibold text-[#101012]">Call</span>
        </button>
      </div>
    </div>
  );
}
