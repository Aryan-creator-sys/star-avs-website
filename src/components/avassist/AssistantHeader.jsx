/** Panel header — brand mark, title/subtitle, accessible close button. */
export default function AssistantHeader({ onClose }) {
  return (
    <div className="flex items-center gap-3 border-b border-white/10 bg-black/40 px-4 py-3">
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/12 bg-white/[0.04]">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#ff2e2e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
          <circle cx="12" cy="12" r="3.2" />
        </svg>
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#ff2e2e] ring-2 ring-black" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-[0.92rem] font-semibold leading-tight tracking-tight text-white">STAR AV ASSIST</p>
        <p className="truncate text-[0.68rem] text-white/45">Your digital AV consultant</p>
      </div>
      <button
        onClick={onClose}
        aria-label="Close STAR AV Assist"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff2e2e]"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}
