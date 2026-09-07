import { CALL_HREF, whatsappHref } from "../../lib/avassist/contact";

/** Shown only after a meaningful recommendation — the lead hand-off. */
export default function ConsultationCTA({ text, onClose }) {
  return (
    <div className="rounded-xl border border-[#ff2e2e]/30 bg-gradient-to-b from-[#ff2e2e]/[0.08] to-transparent p-3.5">
      <p className="text-[0.62rem] font-semibold uppercase tracking-wider text-[#ff6a6a]">Ready to take this further?</p>
      {text && <p className="mt-1 text-[0.82rem] leading-snug text-white/85">{text}</p>}
      <div className="mt-3 flex flex-col gap-2">
        <a href="#contact" onClick={onClose} className={solidBtn}>Request a site consultation</a>
        <div className="flex gap-2">
          <a href={CALL_HREF} className={`${ghostBtn} flex-1`}>📞 Call</a>
          <a href={whatsappHref(text)} target="_blank" rel="noopener noreferrer" className={`${ghostBtn} flex-1`}>WhatsApp</a>
        </div>
      </div>
    </div>
  );
}

const solidBtn =
  "flex items-center justify-center rounded-full bg-white px-4 py-2.5 text-[0.82rem] font-semibold text-[#101012] transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff2e2e]";
const ghostBtn =
  "flex items-center justify-center gap-1.5 rounded-full border border-white/20 bg-white/[0.04] px-4 py-2.5 text-[0.8rem] font-semibold text-white/90 transition-colors hover:border-white/40";
