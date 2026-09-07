import { useState } from "react";
import { CALL_HREF, whatsappHref } from "../../lib/avassist/contact";

/**
 * Compact floating concierge, bottom-right. Tapping it expands a small stack of
 * three options — STAR AV ASSIST, WhatsApp, Call — coexisting with the site's
 * existing contact methods (reuses the real numbers).
 */
export default function AssistantLauncher({ onOpenAssist }) {
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
          onClick={() => { setExpanded(false); onOpenAssist(); }}
          title="STAR AV ASSIST"
          sub="Ask the digital AV consultant"
          accent
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#ff2e2e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" /><circle cx="12" cy="12" r="3.2" />
            </svg>
          }
        />
        <Option
          href={whatsappHref()}
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
        aria-label={expanded ? "Close contact options" : "Open STAR AV Assist and contact options"}
        className="glass-dark group flex h-14 items-center gap-2.5 rounded-full pl-4 pr-5 transition-transform duration-300 hover:-translate-y-0.5"
      >
        <span className={`flex h-6 w-6 items-center justify-center transition-transform duration-300 ${expanded ? "rotate-45" : ""}`}>
          {expanded ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="#ff2e2e" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" /><circle cx="12" cy="12" r="3.2" />
            </svg>
          )}
        </span>
        <span className="text-[0.82rem] font-semibold tracking-tight text-white">AV Assist</span>
      </button>
    </div>
  );
}

function Option({ href, external, onClick, title, sub, icon, accent }) {
  const inner = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05]">{icon}</span>
      <span className="text-left">
        <span className={`block text-[0.8rem] font-semibold leading-tight ${accent ? "text-white" : "text-white/90"}`}>{title}</span>
        <span className="block text-[0.66rem] leading-tight text-white/45">{sub}</span>
      </span>
    </>
  );
  const cls =
    "glass-dark flex w-[248px] items-center gap-3 rounded-2xl px-3 py-2.5 transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff2e2e]";
  if (href) {
    return (
      <a href={href} onClick={onClick} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <button onClick={onClick} className={cls}>{inner}</button>
  );
}
