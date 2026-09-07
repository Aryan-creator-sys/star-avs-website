// ============================================================================
//  STAR AV ASSIST — entity extraction from free-text messages.
//  Pulls room dimensions, budget, screen size, throw distance, usage, ambient
//  light and aspect ratio so the assistant can remember context across turns.
// ============================================================================

// "15 x 12", "15 by 12 ft", "20×15×10" (w × l × h)
export function parseRoom(text) {
  const m = text.match(/(\d{1,2}(?:\.\d)?)\s*(?:ft|feet|')?\s*(?:x|×|by)\s*(\d{1,2}(?:\.\d)?)\s*(?:ft|feet|')?(?:\s*(?:x|×|by)\s*(\d{1,2}(?:\.\d)?)\s*(?:ft|feet|')?)?/i);
  if (!m) return null;
  const room = { widthFt: parseFloat(m[1]), lengthFt: parseFloat(m[2]) };
  if (m[3]) room.heightFt = parseFloat(m[3]);
  // sanity: rooms are ~6–60 ft
  if (room.widthFt < 5 || room.widthFt > 80 || room.lengthFt < 5 || room.lengthFt > 120) return null;
  return room;
}

// "₹5 lakh", "5,00,000", "Rs 3.5L", "300000", "3 lakhs", "5cr"
export function parseBudget(text) {
  const t = text.toLowerCase();
  let m = t.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(cr|crore|lakh|lakhs|lac|lacs|l|k)\b/i);
  if (m) {
    const n = parseFloat(m[1]);
    const unit = m[2].toLowerCase();
    if (unit === "cr" || unit === "crore") return Math.round(n * 1e7);
    if (unit === "k") return Math.round(n * 1e3);
    if (unit === "l" || unit.startsWith("la")) return Math.round(n * 1e5);
  }
  // bare grouped number with a currency hint
  m = t.match(/(?:₹|rs\.?|inr|budget|around|under|upto|up to)\s*([\d,]{4,})/i);
  if (m) {
    const n = parseInt(m[1].replace(/,/g, ""), 10);
    if (n >= 1000) return n;
  }
  return null;
}

// "120 inch", "120\"", "100 in screen"
export function parseScreenSize(text) {
  const m = text.match(/(\d{2,3})\s*(?:inch|inches|in|"|”)\b/i);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n >= 40 && n <= 300) return n;
  }
  return null;
}

// "12 ft throw", "throw distance of 12 feet", "12 feet away"
export function parseThrow(text) {
  const m = text.match(/(?:throw[^\d]{0,12}|distance[^\d]{0,12}|)(\d{1,2}(?:\.\d)?)\s*(?:ft|feet|')\s*(?:throw|away|from|back)?/i);
  if (m && /throw|distance|away|from|back/i.test(text)) {
    const n = parseFloat(m[1]);
    if (n >= 3 && n <= 40) return n;
  }
  return null;
}

export function parseAspect(text) {
  if (/2\.3\d|2\.4|cinemascope|scope|ultrawide/i.test(text)) return "2.35:1";
  if (/4:3|four by three/i.test(text)) return "4:3";
  if (/16:9|sixteen by nine|widescreen/i.test(text)) return "16:9";
  return null;
}

export function parseAmbient(text) {
  const t = text.toLowerCase();
  if (/(bright|daylight|sunlight|sunlit|sunny|gets sun|lots of light|living room with light|big windows|windows)/.test(t)) return "bright";
  if (/(dedicated|blackout|dark room|no light|light[- ]?controlled|basement)/.test(t)) return "dark";
  if (/(dim|some light|evening|curtains|blinds)/.test(t)) return "dim";
  return null;
}

// usage tags
export function parseUsage(text) {
  const t = text.toLowerCase();
  const usage = [];
  if (/(game|gaming|console|ps5|xbox|120hz|fps)/.test(t)) usage.push("gaming");
  if (/(movie|film|cinema|netflix|blu-?ray|hdr)/.test(t)) usage.push("cinema");
  if (/(sport|cricket|football|match|ipl)/.test(t)) usage.push("sports");
  if (/(office|corporate|presentation|meeting|boardroom|conference|classroom)/.test(t)) usage.push("corporate");
  return usage.length ? Array.from(new Set(usage)) : null;
}

// Extract everything present in a message into a session patch.
export function extractEntities(text) {
  const patch = {};
  const room = parseRoom(text);
  if (room) patch.room = room;
  const budget = parseBudget(text);
  if (budget) patch.budget = budget;
  const screen = parseScreenSize(text);
  if (screen) patch.screenSize = screen;
  const thr = parseThrow(text);
  if (thr) patch.throwDistance = thr;
  const aspect = parseAspect(text);
  if (aspect) patch.aspect = aspect;
  const ambient = parseAmbient(text);
  if (ambient) patch.ambient = ambient;
  const usage = parseUsage(text);
  if (usage) patch.usage = usage;
  return patch;
}

export function formatINR(n) {
  if (n == null) return "—";
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export function formatINRRange(min, max) {
  return `${formatINR(min)} – ${formatINR(max)}`;
}

// Approximate market range for a product (prices float between dealers).
export function formatPriceRange(p) {
  if (p == null) return null;
  const lo = p * 0.85;
  const hi = p;
  if (hi >= 1e5) {
    const a = lo / 1e5, b = hi / 1e5;
    const fa = a % 1 ? a.toFixed(1) : String(a);
    const fb = b % 1 ? b.toFixed(1) : String(b);
    return `around ₹${fa}–${fb} lakh`;
  }
  return `around ₹${Math.round(lo).toLocaleString("en-IN")}–${Math.round(hi).toLocaleString("en-IN")}`;
}

// ---- lightweight NLU: normalise casual/abbreviated text -------------------
const ABBREV = [
  [/\bprojs\b/g, "projectors"], [/\bproj\b/g, "projector"], [/\bprojector s\b/g, "projectors"],
  [/\bgud\b/g, "good"], [/\bgd\b/g, "good"], [/\bplz\b/g, "please"], [/\bpls\b/g, "please"],
  [/\bht\b/g, "home theatre"], [/\btheater\b/g, "theatre"], [/\bbnq\b/g, "benq"],
  [/\bspkr\b/g, "speaker"], [/\brec\b/g, "receiver"], [/\bwud\b/g, "would"], [/\bshud\b/g, "should"],
  [/\btheatre s\b/g, "theatres"],
];
export function normalize(text) {
  let t = (text || "").toLowerCase();
  ABBREV.forEach(([re, to]) => (t = t.replace(re, to)));
  return t.replace(/\s+/g, " ").trim();
}

// ---- symptoms (troubleshooting) — each carries its first diagnostic Q ------
export const SYMPTOMS = [
  { key: "flicker", re: /flicker|flickering|blink(ing)?/, q: "Does the flickering happen on every source — including the projector's own menu — or only through one device (a Fire TV Stick, set-top box, console)?" },
  { key: "washed", re: /washed[ -]?out|faded|dull|low contrast|looks? gr[ae]y|greyish|colou?rs? look off/, q: "Does it look washed out mainly in daylight/bright conditions, or in a dark room too?" },
  { key: "dark", re: /too dark|very dark|not bright enough|dark image|dim(?!mer)/, q: "Is it dark on everything, and how bright is the room when it looks dark? Also, which picture/eco mode is it on?" },
  { key: "nosignal", re: /no signal|no image|nothing (on|showing|displaying)|black screen|not displaying|no display/, q: "Does the projector's own menu appear when you press Menu on the remote, or is the screen black even then?" },
  { key: "blurry", re: /blurry|blur|out of focus|fuzzy|not sharp|soft image/, q: "Is the whole image soft, or only part of it (one side or a corner)?" },
  { key: "lag", re: /input lag|laggy|lag\b|delay|latency|slow to respond/, q: "Is this for gaming, and is Game/Fast mode switched on in the projector's picture menu?" },
  { key: "nosound", re: /no sound|no audio|sound (not|isn'?t) working|audio (not|isn'?t)|can'?t hear/, q: "Should the sound come from the projector's own speaker, an AV receiver, or a soundbar?" },
  { key: "hdmi", re: /hdmi (drop|dropping|cutting|keeps|disconnect)|signal drop|keeps disconnecting|cuts out/, q: "What resolution/refresh are you running (e.g. 4K/60 or 4K/120), and how long is the HDMI cable?" },
  { key: "overheat", re: /overheat|shutting down|turns off|switches off|keeps turning off|heating up/, q: "Does it switch off after a fairly consistent time, and are the vents/air filter clear of dust?" },
];
export function parseSymptom(t) {
  return SYMPTOMS.find((s) => s.re.test(t)) || null;
}

// ---- owned / existing equipment -------------------------------------------
export const OWNED_RE =
  /\b(my|our)\s+(projector|tv|screen|system|setup|avr|receiver|soundbar)\b|\bi (already )?(have|own|bought|got|installed|purchased)\b|\bthe (projector|one|screen) i (have|own|bought)\b|\bmy\s+[a-z]{2,}[- ]?\d{2,}[a-z0-9]*/;
export function isOwnedContext(t) {
  return OWNED_RE.test(t);
}

// ---- intent cues -----------------------------------------------------------
export function cues(t) {
  return {
    human: /\b(talk|speak|connect|call)\b[^.]{0,24}(someone|human|person|team|expert|agent)|contact (a )?human|real person/.test(t),
    compare: /\bvs\b|\bversus\b|\bcompare\b|comparison|difference between|which (is |one is )?(better|best)\b[^?]*\bor\b|\bx\b vs/.test(t),
    priceQ: /\bhow much\b|price of|what(?:'s| is)? the price|cost of|what does (it|the).* cost|\bmrp\b|how much (is|does|for|are)/.test(t),
    install: /\b(install|installation|mount|mounting|ceiling|throw distance|how far|cable|wiring|conceal|placement|where (should|do) i (put|place|mount)|how high should)\b/.test(t),
    design: /\b(home theatre|home cinema|design (a|my|me)|build (a|me|my)|complete (system|setup)|system for (my|the)|set ?up (a|my) (home|theatre|cinema|system))\b/.test(t),
    shopping: /\b(recommend|suggest|which (projector|one|model|screen|is best)|should i (buy|get|choose)|looking for|need (a|an|something|to buy)|want (a|an|to buy|something)|best (projector|option|one|model|for)|good for|help me (choose|pick|buy)|thinking (of|about) (buying|getting)|planning to buy)\b/.test(t),
    infoQ: /\b(how bright|how many lumens|what(?:'s| is)? the (brightness|resolution|throw|lumens|price)|resolution|throw ratio|specs?|spec sheet|does it (have|support)|is it (4k|hdr|laser|native)|refresh rate|input lag|how (heavy|big|loud)|native 4k)\b/.test(t),
    superlative: /\b(most expensive|cheapest|brightest|priciest|top (of the range|end)|flagship|highest end|best one you have)\b/.test(t),
    upgrade: /\b(upgrade|replace|worth (it|upgrading|replacing)|should i (upgrade|replace)|time to upgrade)\b/.test(t),
    followup: /\b(what about|how about|and the|the (benq|epson|sony|other) one|that one|which one|is that|what of)\b/.test(t),
    evaluative: /\b(good|worth it|any good|decent|reliable|suitable|work for|ok for|okay for|fine for)\b|\bgood\?|\?\s*$/.test(t),
    serviceCost: /\b(installation|consultation|site visit|labour|labor|wiring|calibration|service|setup) (cost|charge|fee|price|pricing)|how much (to|for) (install|setup|set up|calibrat)|cost (to|of) (install|setup|set up)/.test(t),
  };
}
