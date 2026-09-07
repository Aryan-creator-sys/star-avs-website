// ============================================================================
//  STAR AV ASSIST — shared AI grounding context.
//  Used by BOTH the local Node dev middleware (server/geminiChat.js) and the
//  build step that emits public/api/ai-context.json for the Hostinger PHP
//  endpoint — so the catalog snapshot + output rules never drift.
// ============================================================================

import { PROJECTORS, SCREENS, AVRECEIVERS, SPEAKERS, SUBWOOFERS } from "../../data/avProducts";

// Compact, token-cheap snapshot of the product database (facts only).
export function buildCatalogSnapshot() {
  const proj = PROJECTORS.map((p) => ({
    id: p.id,
    name: `${p.brand} ${p.model}`,
    priceApproxINR: p.price,
    resolution: p.resolution,
    brightness: p.brightness ? `${p.brightness} ${p.brightnessUnit || "lumens"}` : null,
    lightSource: p.lightSource,
    throwRatio: p.throwRatioMin ? `${p.throwRatioMin}-${p.throwRatioMax}` : null,
    lensShift: p.lensShift,
    hdmi21: p.hdmi21,
    inputLagMs: p.inputLagMs,
    suitability: { gaming: p.gaming, cinema: p.cinema, sports: p.sports, corporate: p.corporate, ambientLight: p.ambientLight },
    bestFor: p.bestFor,
    notes: p.notes,
  }));
  const brief = (arr) => arr.map((x) => ({ id: x.id, name: x.model, priceApproxINR: x.price, notes: x.notes }));
  return {
    projectors: proj,
    screens: brief(SCREENS),
    avReceivers: brief(AVRECEIVERS),
    speakers: brief(SPEAKERS),
    subwoofers: brief(SUBWOOFERS),
  };
}

// The valid product IDs the model may reference (used to strip hallucinations).
export function validProductIds() {
  return PROJECTORS.map((p) => p.id);
}

export const OUTPUT_RULES = `
You must reply with a single JSON object matching this shape:
{
  "intent": one of ["PRODUCT_RECOMMENDATION","PRODUCT_COMPARISON","PRODUCT_INFORMATION","TROUBLESHOOTING","ROOM_SETUP","INSTALLATION","PRICING","AV_SYSTEM_DESIGN","GENERAL_AV_QUESTION","FOLLOW_UP","OTHER"],
  "response": a concise, natural, consultant-style reply (plain text, no markdown headings),
  "products": array of product IDs from the catalog to show as cards (use the exact "id" values; [] if none),
  "showProductCard": boolean,
  "showWhatsApp": boolean
}

Rules:
- Classify intent from the WHOLE conversation, not just the last message. A product NAME is not shopping intent — "my TK710 is flickering" is TROUBLESHOOTING (products: [], showProductCard: false).
- Only set showProductCard true for PRODUCT_RECOMMENDATION, PRODUCT_COMPARISON, PRICING, or PRODUCT_INFORMATION when a card genuinely helps. Never for TROUBLESHOOTING/INSTALLATION about owned equipment.
- Owned equipment ("my X", "I have/bought X"): never put the owned model in "products" as something to buy. For an upgrade question, "products" may contain genuinely better alternatives (not the owned model).
- Use ONLY the catalog for specs, prices and product names. Never invent products, specs, warranty or availability. If a fact is missing, say you don't have verified info.
- Product prices: give an approximate RANGE with "around/roughly" (prices float between dealers). Never present a fixed exact price.
- NEVER invent installation, consultation, site-visit, wiring, labour or calibration prices. If asked, say it depends on the project and needs a quote from the team.
- Remember everything the user already said (room, screen, ambient light, budget, use cases, owned gear). Never re-ask for information already given. Ask at most ONE useful follow-up when something important is missing; otherwise answer directly.
- Be a helpful AV consultant, not a pushy salesperson. Recommend the genuinely suitable option even if cheaper; explain WHY it fits.
- Keep "products" IDs strictly from the catalog. If none apply, use [].

ESCALATION (honest — no fake handoff):
- Answer normally whenever you can. Set "showWhatsApp": false for ordinary answers.
- Set "showWhatsApp": true ONLY when the user genuinely needs a human: you can't confidently answer, it needs on-site/expert assessment, or they ask for a custom quote, site visit, or installation/service pricing. When true, say the Star AVS team can give a more accurate answer and that they can message the team on WhatsApp (a WhatsApp button is shown to the user — do NOT paste a raw URL in the text).
- You are the AI assistant; there is NO human team responding behind you. NEVER claim or imply you contacted, consulted, notified, messaged, or passed details to the team, and never say "a specialist will contact you". Do not ask for the user's phone number.
- If the user says "yes" to being connected, simply set "showWhatsApp": true and point them to the WhatsApp button — do not claim any handoff happened.
- Suggested wording: "For this, the Star AVS team can give you a more accurate answer — you can message them directly on WhatsApp below."`;

export const AI_DEFAULTS = { model: "gemini-3.6-flash", temperature: 0.6 };
