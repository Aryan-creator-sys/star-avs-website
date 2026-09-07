import QuickActions from "./QuickActions";
import ProductRecommendation from "./ProductRecommendation";
import ProductComparison from "./ProductComparison";
import HumanEscalation from "./HumanEscalation";
import ConsultationCTA from "./ConsultationCTA";
import { formatINR, formatINRRange } from "../../lib/avassist/parse";

/**
 * Renders one chat message. User messages are a simple bubble; assistant
 * messages render an array of typed blocks (text/products/comparison/calc/…).
 */
export default function ChatMessage({ msg, onAction, onSend, onClose }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-white/[0.10] px-3.5 py-2 text-[0.82rem] leading-snug text-white">
          {msg.text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2.5">
      {msg.blocks.map((b, i) => (
        <Block key={i} b={b} onAction={onAction} onSend={onSend} onClose={onClose} />
      ))}
    </div>
  );
}

function Block({ b, onAction, onSend, onClose }) {
  switch (b.type) {
    case "text":
      return <p className="whitespace-pre-line text-[0.82rem] leading-relaxed text-white/80">{b.text}</p>;

    case "quick":
      return <QuickActions title={b.title} actions={b.actions} onAction={onAction} />;

    case "products":
      return (
        <div className="flex flex-col gap-2">
          {b.title && <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-white/40">{b.title}</p>}
          {b.items.map((it, i) => (
            <ProductRecommendation key={i} item={it} onSend={onSend} />
          ))}
        </div>
      );

    case "comparison":
      return <ProductComparison block={b} />;

    case "calc":
      return (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
          <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-white/55">{b.title}</p>
          <div className="mt-2 flex flex-col gap-1.5">
            {b.rows.map((r, i) => (
              <div key={i} className="flex items-baseline justify-between gap-3 text-[0.78rem]">
                <span className="text-white/45">{r.label}</span>
                <span className="text-right font-medium text-white/90">{r.value}</span>
              </div>
            ))}
          </div>
          {b.note && <p className="mt-2.5 text-[0.68rem] italic text-white/40">{b.note}</p>}
        </div>
      );

    case "system":
      return (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-[#ff6a6a]">STAR AV recommended system</p>
          <div className="mt-2.5 flex flex-col divide-y divide-white/[0.06]">
            {b.sections.map((s, i) => (
              <div key={i} className="flex items-start justify-between gap-3 py-2">
                <div>
                  <p className="text-[0.6rem] font-semibold uppercase tracking-wider text-white/40">{s.label}</p>
                  <p className="text-[0.82rem] font-medium text-white/90">{s.name}</p>
                  {s.detail && <p className="mt-0.5 text-[0.68rem] leading-snug text-white/45">{s.detail}</p>}
                </div>
                {s.price != null && <span className="shrink-0 text-[0.74rem] text-white/60">{formatINR(s.price)}</span>}
              </div>
            ))}
          </div>
          {b.total && (
            <div className="mt-2.5 flex items-center justify-between border-t border-white/10 pt-2.5">
              <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-white/55">Estimated investment</span>
              <span className="text-[0.9rem] font-semibold text-white">{formatINRRange(b.total.min, b.total.max)}</span>
            </div>
          )}
          {b.rationale && <p className="mt-2.5 text-[0.74rem] leading-snug text-white/60">{b.rationale}</p>}
        </div>
      );

    case "budget":
      return (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-[#ff6a6a]">Budget allocation</p>
          <div className="mt-2.5 flex flex-col gap-1.5">
            {b.rows.map((r, i) => (
              <div key={i} className="flex items-baseline justify-between gap-3 text-[0.8rem]">
                <div>
                  <span className="text-white/45">{r.label}</span>
                  {r.name && <span className="ml-2 text-white/75">{r.name}</span>}
                </div>
                <span className="shrink-0 font-medium text-white/90">{formatINR(r.price)}</span>
              </div>
            ))}
          </div>
          <div className="mt-2.5 flex items-center justify-between border-t border-white/10 pt-2.5">
            <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-white/55">Total</span>
            <span className="text-[0.9rem] font-semibold text-white">{formatINR(b.total)}</span>
          </div>
          {b.note && <p className="mt-2 text-[0.72rem] leading-snug text-white/50">{b.note}</p>}
        </div>
      );

    case "troubleshoot":
      return (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
          <p className="text-[0.82rem] text-white/80">{b.intro}</p>
          <ol className="mt-2 flex flex-col gap-1.5">
            {b.steps.map((s, i) => (
              <li key={i} className="flex gap-2 text-[0.78rem] leading-snug text-white/75">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#ff2e2e]/20 text-[0.6rem] font-semibold text-[#ff8a8a]">{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>
      );

    case "escalation":
      return <HumanEscalation text={b.text} message={b.message} />;

    case "cta":
      return <ConsultationCTA text={b.text} onClose={onClose} />;

    default:
      return null;
  }
}
