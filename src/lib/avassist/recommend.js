// ============================================================================
//  STAR AV ASSIST — projector recommendation engine.
//  Scores each projector against the customer's budget, usage, room/throw,
//  screen size and ambient light, then returns ranked, explained picks.
//  It never invents specs — it only reasons over the product database.
// ============================================================================

import { PROJECTORS } from "../../data/avProducts";
import { throwRangeForDiagonal, brightnessVerdict } from "./calc";

// session: { budget, usage:[], ambient, screenSize, throwDistance, room, aspect }
export function recommendProjectors(session = {}) {
  const aspect = session.aspect || "16:9";
  const usage = session.usage && session.usage.length ? session.usage : ["cinema"];

  const scored = PROJECTORS.map((p) => {
    let score = 0;
    const reasons = [];

    // --- budget (soft) ---
    if (session.budget) {
      if (p.price <= session.budget) {
        score += 30;
        const headroom = 1 - p.price / session.budget;
        if (headroom > 0.35) reasons.push("comfortably within budget");
        else reasons.push("fits your budget");
      } else if (p.price <= session.budget * 1.15) {
        score += 12;
        reasons.push("slightly above budget but close");
      } else {
        score -= 25; // over budget
      }
    }

    // --- usage suitability ---
    let usageScore = 0;
    usage.forEach((u) => {
      const v = p[u];
      if (v != null) usageScore += v;
    });
    usageScore = usageScore / usage.length; // avg 1–5
    score += usageScore * 8;
    const topUse = usage.map((u) => ({ u, v: p[u] || 0 })).sort((a, b) => b.v - a.v)[0];
    if (topUse && topUse.v >= 4) reasons.push(`strong for ${labelUsage(topUse.u)}`);

    // --- ambient light ---
    if (session.ambient) {
      const bv = brightnessVerdict(p, session.ambient);
      if (bv.ok === true) { score += 12; }
      else if (bv.ok === false) { score -= 12; reasons.push(bv.text); }
    }

    // --- throw / room fit (can it make the wanted image from the distance?) ---
    if (session.screenSize && (session.throwDistance || session.room)) {
      const dist = session.throwDistance || estimateThrowFromRoom(session.room);
      const range = throwRangeForDiagonal(session.screenSize, p, aspect);
      if (dist && range) {
        if (dist >= range.minFt && dist <= range.maxFt) {
          score += 22;
          reasons.push(`can throw a ${session.screenSize}\" image from your ~${dist} ft`);
        } else {
          score -= 14;
          reasons.push(
            `needs ${range.minFt}–${range.maxFt} ft for ${session.screenSize}\" (you have ~${dist} ft)`
          );
        }
      }
    } else if (session.screenSize) {
      if (session.screenSize >= (p.screenSizeMinIn || 0) && session.screenSize <= (p.screenSizeMaxIn || 999)) {
        score += 6;
      }
    }

    // gentle nudge: prefer 4K for large screens
    if (session.screenSize && session.screenSize >= 110 && /4k/i.test(p.resolution)) score += 6;

    return { product: p, score, reasons: dedupe(reasons), usageScore };
  });

  const ranked = scored.sort((a, b) => b.score - a.score);
  const inBudget = session.budget ? ranked.filter((r) => r.product.price <= session.budget * 1.15) : ranked;
  const pool = inBudget.length ? inBudget : ranked;

  const best = pool[0];
  // Alternative: next best that isn't the same model and ideally cheaper/different strength
  const alternative = pool.find((r) => r.product.id !== best.product.id);
  // Premium: highest-priced strong performer above best's price (aspirational upsell, still relevant)
  const premium = ranked
    .filter((r) => r.product.id !== best.product.id && r.product.id !== (alternative && alternative.product.id))
    .filter((r) => r.product.price > best.product.price)
    .sort((a, b) => b.score - a.score)[0];

  const picks = [];
  if (best) picks.push({ tier: "BEST MATCH", ...best });
  if (alternative && alternative.product.id !== best.product.id) picks.push({ tier: "ALTERNATIVE", ...alternative });
  if (premium) picks.push({ tier: "PREMIUM OPTION", ...premium });
  return picks;
}

// If we only know the room, assume the projector sits near the back wall:
// usable throw ≈ room length minus ~1.5 ft for the unit/clearance.
export function estimateThrowFromRoom(room) {
  if (!room || !room.lengthFt) return null;
  return Math.max(room.lengthFt - 1.5, 3);
}

function labelUsage(u) {
  return { gaming: "gaming", cinema: "movies", sports: "sports", corporate: "presentations" }[u] || u;
}
function dedupe(arr) {
  return Array.from(new Set(arr));
}

// A concise, human explanation for a pick given the session.
export function explainPick(pick, session) {
  const p = pick.product;
  const bits = [];
  if (pick.reasons.length) bits.push(pick.reasons.slice(0, 2).join("; "));
  if (session.usage && session.usage.length) {
    bits.push(`matched to ${session.usage.map(labelUsage).join(" + ")}`);
  }
  if (!bits.length) bits.push(p.notes || "a well-rounded pick for your setup");
  return capitalise(bits.join(" — ")) + ".";
}
function capitalise(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
