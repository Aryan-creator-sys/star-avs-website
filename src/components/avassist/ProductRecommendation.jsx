import { formatINR } from "../../lib/avassist/parse";

/**
 * Product recommendation card — dark, premium, restrained. Shows only the specs
 * that exist in the database (never fabricated) plus the practical reason STAR
 * recommends it for this customer.
 */
export default function ProductRecommendation({ item, onSend }) {
  const p = item.product;
  const tier = item.tier;
  const specs = [
    p.resolution,
    p.brightness ? `${p.brightness} ${p.brightnessUnit || "lumens"}` : null,
    p.lightSource,
    p.throwRatioMin ? `${p.throwRatioMin}–${p.throwRatioMax} throw` : null,
  ].filter(Boolean);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[0.98rem] font-semibold leading-tight text-white">
            {p.brand} {p.model}
          </p>
          {p.price != null && (
            <p className="mt-0.5 text-xs text-white/50">
              {formatINR(p.price)} {p.priceApprox && <span className="text-white/35">approx</span>}
            </p>
          )}
        </div>
        {tier && (
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider ${tierClass(tier)}`}>
            {tier}
          </span>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {specs.map((sp, i) => (
          <span key={i} className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[0.66rem] text-white/70">
            {sp}
          </span>
        ))}
      </div>

      {p.bestFor && p.bestFor.length > 0 && (
        <p className="mt-2.5 text-[0.72rem] text-white/55">
          <span className="text-white/40">Best for </span>
          {p.bestFor.join(" · ")}
        </p>
      )}

      {item.reason && (
        <div className="mt-2.5 rounded-lg border-l-2 border-[#ff2e2e] bg-white/[0.03] px-3 py-2">
          <p className="text-[0.62rem] font-semibold uppercase tracking-wider text-[#ff6a6a]">Why STAR recommends it</p>
          <p className="mt-1 text-[0.78rem] leading-snug text-white/80">{item.reason}</p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => onSend(`Compare the ${p.model}`)} className={pillBtn}>Compare</button>
        {p.productUrl && (
          <a href={p.productUrl} target="_blank" rel="noopener noreferrer" className={pillBtn}>View Product</a>
        )}
        <button onClick={() => onSend(`Can the ${p.model} be ceiling mounted, and how far from the screen?`)} className={pillBtn}>
          Ask About Installation
        </button>
      </div>
    </div>
  );
}

const pillBtn =
  "rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[0.72rem] font-medium text-white/80 transition-colors hover:border-white/35 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff2e2e]";

function tierClass(tier) {
  if (/BEST/.test(tier)) return "border-[#ff2e2e]/60 bg-[#ff2e2e]/10 text-[#ff8a8a]";
  if (/PREMIUM/.test(tier)) return "border-white/25 bg-white/[0.06] text-white/80";
  return "border-white/15 bg-white/[0.03] text-white/55";
}
