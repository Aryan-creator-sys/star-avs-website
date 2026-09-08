import { useState } from "react";
import { COMPANY } from "../data/site";

/**
 * Lightweight floating Help button (bottom-right). Tapping it reveals WhatsApp
 * and Call options — no chatbot, no backend. Reuses the site's real numbers and
 * the existing glass-dark styling so it matches the rest of the UI.
 */
const CALL_TEL =
  (COMPANY.phones && COMPANY.phones[0] && COMPANY.phones[0].tel) || COMPANY.phone || "";
const CALL_HREF = CALL_TEL ? `tel:${CALL_TEL}` : COMPANY.phoneHref || "#contact";
const WHATSAPP_HREF = `https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent(
  "Hi Star AV, I'd like help planning an AV / home-cinema system."
)}`;

function Option({ href, title, sub, icon, external }) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="glass-dark flex w-[248px] items-center gap-3 rounded-2xl px-3 py-2.5 transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff2e2e]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05]">{icon}</span>
      <span className="text-left">
        <span className="block text-[0.8rem] font-semibold leading-tight text-white/90">{title}</span>
        <span className="block text-[0.66rem] leading-tight text-white/45">{sub}</span>
      </span>
    </a>
  );
}

export default function HelpButton() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-[80] flex flex-col items-end gap-2.5"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      {/* expandable options */}
      <div
        className={`flex flex-col items-end gap-2 transition-all duration-300 ${
          expanded ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
        }`}
      >
        <Option
          href={WHATSAPP_HREF}
          external
          title="WhatsApp"
          sub="Message the Star AV team"
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#ff2e2e" aria-hidden="true">
              <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.38a9.86 9.86 0 0 0 4.74 1.21c5.46 0 9.9-4.44 9.9-9.9S17.5 2 12.04 2zm4.5 11.99c-.25.7-1.45 1.34-2 1.42-.53.08-1.18.11-1.9-.12-.44-.14-1-.32-1.72-.63-3.03-1.31-5-4.36-5.16-4.56-.15-.2-1.22-1.62-1.22-3.1 0-1.47.77-2.2 1.05-2.5.28-.3.6-.37.8-.37.2 0 .4 0 .57.01.18.01.43-.07.67.51.25.6.84 2.07.91 2.22.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.44.52-.15.15-.3.31-.13.6.17.3.76 1.25 1.63 2.02 1.12 1 2.07 1.31 2.37 1.46.3.15.47.13.64-.08.17-.2.74-.86.94-1.16.2-.3.4-.25.67-.15.27.1 1.71.81 2 .96.3.15.5.22.57.35.07.12.07.72-.18 1.42z" />
            </svg>
          }
        />
        <Option
          href={CALL_HREF}
          title="Call"
          sub="Speak with the Star AV team"
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          }
        />
      </div>

      {/* main launcher button */}
      <button
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label={expanded ? "Close contact options" : "Open contact options"}
        className="glass-dark group flex h-14 items-center gap-2.5 rounded-full pl-4 pr-5 transition-transform duration-300 hover:-translate-y-0.5"
      >
        <span className={`flex h-6 w-6 items-center justify-center transition-transform duration-300 ${expanded ? "rotate-45" : ""}`}>
          {expanded ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="#ff2e2e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          )}
        </span>
        <span className="text-[0.82rem] font-semibold tracking-tight text-white">Help</span>
      </button>
    </div>
  );
}
