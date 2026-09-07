import { CALL_HREF, PHONE_LABEL, whatsappHref } from "../../lib/avassist/contact";

/**
 * Direct contact links for the Star AVS team (WhatsApp primary, Call secondary).
 * These are just links — no lead submission, no "handoff", nothing is sent on
 * the user's behalf. The user chooses to message/call the team themselves.
 */
export default function HumanEscalation({ text, message }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
      {text && <p className="mb-2.5 text-[0.8rem] leading-snug text-white/80">{text}</p>}
      <div className="flex flex-col gap-2">
        <a href={whatsappHref(message)} target="_blank" rel="noopener noreferrer" className={solidBtn}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.38a9.86 9.86 0 0 0 4.74 1.21c5.46 0 9.9-4.44 9.9-9.9S17.5 2 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.16 8.16 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.24-8.23 4.54 0 8.23 3.69 8.23 8.23 0 4.54-3.69 8.23-8.23 8.23z" />
          </svg>
          Message Star AVS on WhatsApp
        </a>
        <a href={CALL_HREF} className={ghostBtn} aria-label={`Call the Star AVS team on ${PHONE_LABEL}`}>
          📞 Or call the team
        </a>
      </div>
    </div>
  );
}

const solidBtn =
  "flex items-center justify-center gap-2 rounded-full bg-[#ff2e2e] px-4 py-2.5 text-[0.82rem] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white";
const ghostBtn =
  "flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.04] px-4 py-2.5 text-[0.82rem] font-semibold text-white/90 transition-colors hover:border-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff2e2e]";
