/** Elegant quick-action chips (start-flows / in-conversation options). */
export default function QuickActions({ title, actions, onAction }) {
  return (
    <div>
      {title && <p className="mb-2 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-white/40">{title}</p>}
      <div className="flex flex-wrap gap-1.5">
        {actions.map((a) => (
          <button
            key={a.id}
            onClick={() => onAction(a.id, a.label)}
            className="group flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[0.76rem] font-medium text-white/80 transition-all hover:border-[#ff2e2e]/50 hover:bg-white/[0.07] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff2e2e]"
          >
            {a.emoji && <span className="text-[0.85rem] leading-none">{a.emoji}</span>}
            <span>{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
