/**
 * Side-by-side projector comparison + a STAR AV verdict tuned to the customer's
 * use case (rather than just restating the spec sheet).
 */
export default function ProductComparison({ block }) {
  const { a, b, rows, verdict } = block;
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
      <div className="grid grid-cols-[1.1fr_1fr_1fr] gap-2 text-[0.72rem]">
        <div />
        <div className="text-center font-semibold text-white">{a.brand} {a.model}</div>
        <div className="text-center font-semibold text-white">{b.brand} {b.model}</div>
        {rows.map((r, i) => (
          <Row key={i} r={r} zebra={i % 2 === 0} />
        ))}
      </div>
      <div className="mt-3 rounded-lg border-l-2 border-[#ff2e2e] bg-white/[0.03] px-3 py-2">
        <p className="text-[0.62rem] font-semibold uppercase tracking-wider text-[#ff6a6a]">STAR AV verdict</p>
        <p className="mt-1 text-[0.8rem] leading-snug text-white/85">{verdict}</p>
      </div>
    </div>
  );
}

function Row({ r, zebra }) {
  const bg = zebra ? "bg-white/[0.02]" : "";
  return (
    <>
      <div className={`rounded-l-md px-2 py-1.5 text-white/45 ${bg}`}>{r.label}</div>
      <div className={`px-2 py-1.5 text-center text-white/85 ${bg}`}>{r.a}</div>
      <div className={`rounded-r-md px-2 py-1.5 text-center text-white/85 ${bg}`}>{r.b}</div>
    </>
  );
}
