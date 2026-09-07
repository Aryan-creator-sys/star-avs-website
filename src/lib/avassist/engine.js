// ============================================================================
//  STAR AV ASSIST — orchestration engine (intent-first).
//
//  respond(text, session) -> { blocks, patch }
//
//  Architecture (per requirement): understand INTENT first, read conversation
//  context, extract info, decide the response type, retrieve product data only
//  when relevant, and ONLY show a product card when appropriate. A product name
//  in a message does NOT mean "recommend this product" — "my TK710 is
//  flickering" is troubleshooting, not shopping.
//
//  Deterministic and works with no AI API; structured so an AI provider can be
//  swapped in (see systemPrompt.js) while reusing this classification + the
//  message-block schema.
// ============================================================================

import { extractEntities, formatINR, formatPriceRange, normalize, parseSymptom, isOwnedContext, cues, SYMPTOMS } from "./parse";
import { screenDimensions, throwRangeForDiagonal, maxDiagonalForThrow, seatingDistanceFt } from "./calc";
import { recommendProjectors, explainPick, estimateThrowFromRoom } from "./recommend";
import { recommendAudio, buildSystem, buildBudget } from "./build";
import { matchTroubleshooter } from "./troubleshoot";
import { findAllProjectorsByName, PROJECTORS } from "../../data/avProducts";

// ---- block helpers ---------------------------------------------------------
const T = (text) => ({ type: "text", text });
const quick = (title, actions) => ({ type: "quick", title, actions });
const escalate = (text) => ({ type: "escalation", text });
const cta = (text) => ({ type: "cta", text });
const productsBlock = (items, title) => ({ type: "products", title, items });

const USAGE_CHIPS = [
  { id: "u-movies", label: "Movies", emoji: "🎬" },
  { id: "u-gaming", label: "Gaming", emoji: "🎮" },
  { id: "u-sports", label: "Sports", emoji: "🏏" },
  { id: "u-corporate", label: "Presentations", emoji: "📊" },
];
const AMBIENT_CHIPS = [
  { id: "a-dark", label: "Dark room", emoji: "🌑" },
  { id: "a-dim", label: "Some light", emoji: "🌗" },
  { id: "a-bright", label: "Bright room", emoji: "☀️" },
];
const BUDGET_CHIPS = [
  { id: "b-1", label: "Up to ₹1.5L", emoji: "" },
  { id: "b-2", label: "₹2–3 lakh", emoji: "" },
  { id: "b-5", label: "₹5 lakh+", emoji: "" },
];

const ACTION_TEXT = {
  "u-movies": "movies", "u-gaming": "gaming", "u-sports": "sports", "u-corporate": "presentations",
  "a-dark": "dark dedicated room", "a-dim": "some light", "a-bright": "bright room with windows",
  "b-1": "₹1.5 lakh", "b-2": "₹3 lakh", "b-5": "₹5 lakh",
  "ts-every": "it happens on every source, including the projector's own menu",
  "ts-one": "only through one device / source",
};

export const QUICK_ACTIONS = [
  { id: "qa-projector", label: "Recommend a Projector", emoji: "📽" },
  { id: "qa-theatre", label: "Plan My Home Theatre", emoji: "🎬" },
  { id: "qa-compare", label: "Compare Models", emoji: "🔍" },
  { id: "qa-screen", label: "Calculate Screen Size", emoji: "📐" },
  { id: "qa-audio", label: "Recommend Audio", emoji: "🔊" },
  { id: "qa-install", label: "Installation Help", emoji: "🛠" },
  { id: "qa-budget", label: "Build Within My Budget", emoji: "💰" },
  { id: "qa-ask", label: "Ask an AV Question", emoji: "💬" },
];

export function greeting() {
  return [
    T("Hi — I'm STAR AV Assist. Tell me what you're after in plain words (e.g. “something for IPL in a bright hall”, “TK710 good?”, or “my projector is flickering”) and I'll help like an AV consultant would."),
    quick("Quick start", QUICK_ACTIONS),
  ];
}

export function actionToInput(id) {
  const map = {
    "qa-projector": { text: "Recommend a projector" },
    "qa-theatre": { text: "Plan my home theatre" },
    "qa-compare": { text: "Compare models" },
    "qa-screen": { text: "Calculate screen size" },
    "qa-audio": { text: "Recommend an audio system" },
    "qa-install": { text: "Installation help" },
    "qa-budget": { text: "Build within my budget" },
    "qa-ask": { text: "Ask an AV question" },
  };
  if (map[id]) return map[id];
  if (ACTION_TEXT[id]) return { text: ACTION_TEXT[id] };
  return { text: id };
}

// ===========================================================================
//  MAIN
// ===========================================================================
export function respond(rawText, session = {}) {
  const text = (rawText || "").trim();
  const norm = normalize(text);
  const patch = extractEntities(text);
  const models = findAllProjectorsByName(text);
  const symptom = parseSymptom(norm);
  const owned = isOwnedContext(norm);
  const c = cues(norm);
  const s = { ...session, ...patch };

  const intent = classify({ norm, s, session, patch, models, symptom, owned, c });

  let out;
  switch (intent) {
    case "human": out = handleHuman(); break;
    case "troubleshoot": out = handleTroubleshoot({ text, norm, s, session, models, symptom, owned }); break;
    case "install": out = handleInstall({ norm, s, models }); break;
    case "compare": out = handleCompare({ text, s, models }); break;
    case "pricing-service": out = handlePricingService(); break;
    case "pricing": out = handlePricing({ s, models }); break;
    case "info-superlative": out = handleSuperlative({ norm }); break;
    case "info": out = handleInfo({ norm, s, models }); break;
    case "recommend-upgrade": out = handleUpgrade({ s, models }); break;
    case "system": out = handleSystem({ s }); break;
    case "budget": out = handleBudget({ s }); break;
    case "recommend": out = handleRecommend({ text, norm, s, models, c }); break;
    case "roomsetup": out = handleRoomSetup({ s, patch }); break;
    case "tvVsProjector": out = { blocks: handleTvVsProjector(s), extra: {} }; break;
    default: out = handleAsk({ norm, s });
  }

  // remember discussed products + domain
  const extra = { ...out.extra };
  if (models.length) {
    extra.productsConsidered = Array.from(new Set([...(session.productsConsidered || []), ...models.map((m) => m.id)]));
    extra.lastDomain = "projector";
  }
  if (owned && models[0]) extra.ownedEquipment = models[0].id;

  return { blocks: out.blocks, patch: { ...patch, ...extra } };
}

// ===========================================================================
//  CLASSIFIER
// ===========================================================================
function classify({ norm, s, session, patch, models, symptom, owned, c }) {
  const entityOnly = Object.keys(patch).length > 0;
  const pending = session.pendingIntent;

  if (c.human) return "human";

  // continuing a troubleshooting diagnosis (user answering our question)
  if (pending === "troubleshoot" && !c.shopping && !c.compare && !c.design) return "troubleshoot";
  if (symptom) return "troubleshoot";

  // service pricing must beat generic install help ("how much does installation cost")
  if (c.serviceCost) return "pricing-service";

  if (c.install) return "install";

  if (/\b(tv|television)\b/.test(norm) && /\bprojector\b/.test(norm) && /\b(or|vs|versus)\b/.test(norm)) return "tvVsProjector";

  if (c.compare && (models.length >= 1 || /\bvs\b|versus|compare/.test(norm))) return "compare";

  if (c.priceQ) return "pricing";

  if (c.superlative) return "info-superlative";

  if (c.upgrade && (owned || models.length)) return "recommend-upgrade";

  // specific spec question about a model → information (no sales card)
  if (c.infoQ && models.length && !c.shopping) return "info";

  // full-system design / budget build
  const designish = c.design || /\b(home theat|home cinema|complete system|build (me|my|a)|design (me|my|a)|full (setup|system))\b/.test(norm);
  if (designish || (/budget/.test(norm) && /(build|within|allocate|split|home theat|system)/.test(norm))) {
    return s.budget || /budget|within|under|allocate|split/.test(norm) ? "budget" : "system";
  }

  if (c.shopping) return "recommend";

  // a named model with an evaluative tone ("tk710 good?", "is X worth it")
  if (models.length && c.evaluative) return "recommend";

  // bare model mention, no other cue → give information, not a hard sell
  if (models.length && !entityOnly) return "info";

  // pure follow-up ("which one is better", "what about the benq one")
  if (c.followup && (session.lastDomain === "projector" || (session.productsConsidered || []).length)) return "recommend";

  // just supplied info (room/screen/budget/etc.)
  if (entityOnly) {
    if (pending && pending !== "troubleshoot") return pending; // continue a flow (recommend/system/budget/calc)
    return "roomsetup";
  }

  if (pending && pending !== "troubleshoot") return pending;
  return "ask";
}

// ===========================================================================
//  HANDLERS
// ===========================================================================
function handleHuman() {
  return {
    blocks: [T("Of course — our AV team can help you directly."), escalate("Tell them what you're planning and they'll take it from here.")],
    extra: { pendingIntent: null },
  };
}

function handleTroubleshoot({ text, norm, s, session, models, symptom, owned }) {
  const equip = models[0] ? `${models[0].brand} ${models[0].model}` : owned ? "your projector" : "it";

  // step 2 — the user is answering our diagnostic question
  if (session.pendingIntent === "troubleshoot" && session.issue && !symptom) {
    const step2 = step2ForSymptom(session.issue.symptom, norm);
    return {
      blocks: [
        T(step2.lead),
        { type: "troubleshoot", intro: step2.intro, steps: step2.steps, escalateHint: step2.escalate },
        escalate(step2.escalate),
      ],
      extra: { pendingIntent: null, issue: null },
    };
  }

  // step 1 — acknowledge, keep it a diagnosis (no sales card), ask ONE question
  const sym = symptom || SYMPTOMS.find((x) => x.key === (session.issue && session.issue.symptom)) || SYMPTOMS[0];
  const blocks = [
    T(`Got it — let's troubleshoot the ${symptomLabel(sym.key)} on ${equip}, rather than look at another projector.`),
    T(sym.q),
  ];
  if (sym.key === "flicker" || sym.key === "nosignal") {
    blocks.push(quick("Quick answer", [
      { id: "ts-every", label: "Every source", emoji: "" },
      { id: "ts-one", label: "Only one device", emoji: "" },
    ]));
  }
  return { blocks, extra: { pendingIntent: "troubleshoot", issue: { symptom: sym.key, model: models[0] ? models[0].id : session.ownedEquipment || null } } };
}

function handleInstall({ norm, s, models }) {
  const model = models[0] || lastProduct(s);
  const aspect = s.aspect || "16:9";

  // "how far from the screen" — compute throw if we know the model + screen
  if (/how far|throw distance|distance from|far (from|should)/.test(norm)) {
    if (model && s.screenSize) {
      const tr = throwRangeForDiagonal(s.screenSize, model, aspect);
      if (tr) return {
        blocks: [{ type: "calc", title: `${model.brand} ${model.model} — placement for a ${s.screenSize}\" screen`, rows: [
          { label: "Mount the lens", value: `${tr.minFt}–${tr.maxFt} ft from the screen` },
          { label: "Adjust within that range using", value: `${model.zoom || "the zoom"}${model.lensShift ? " + lens shift" : ""}` },
        ], note: "Approximate — final placement is confirmed on site." }, escalate("Our team can confirm exact placement and mount for your room.")],
        extra: { pendingIntent: null },
      };
    }
    if (model) return { blocks: [T(`Throw distance for the ${model.model} depends on your screen size. What size screen are you planning (e.g. 120\")?`)], extra: { pendingIntent: "install" } };
    return { blocks: [T("Throw distance depends on the projector and screen size. Which projector and what screen size are you planning?")], extra: { pendingIntent: "install" } };
  }

  // ceiling mount
  if (/ceiling|mount|inverted|bracket/.test(norm)) {
    return {
      blocks: [
        T(`Yes — ${model ? `the ${model.model}` : "the projectors we work with"} can be ceiling-mounted (inverted) on a standard adjustable projector mount, with the image flipped in the menu. The key is squaring it to the screen and getting the throw distance right for your screen size so you avoid heavy keystone.`),
        escalate("Ceiling runs, concealed cabling and alignment are things our team handles cleanly on site."),
      ],
      extra: { pendingIntent: null },
    };
  }

  // long HDMI / cabling
  if (/cable|hdmi|wiring|run|conceal/.test(norm)) {
    return {
      blocks: [T("For HDMI runs beyond ~7–10 m (especially 4K/120), use a certified active or fibre-optic HDMI cable rather than a passive one — that's the usual cause of dropouts on long runs. In-wall runs should use conduit so cables can be upgraded later."), escalate("We can spec and conceal the right cabling for your layout.")],
      extra: { pendingIntent: null },
    };
  }

  // screen height / general
  if (/how high|screen height|mount.*screen|height/.test(norm)) {
    return {
      blocks: [T("As a rule of thumb, set the screen so the centre sits near seated eye level — typically the bottom edge about 60–90 cm off the floor for a home cinema, adjusted for your seating and any rows behind. It varies with room and seating, so it's worth confirming on site.")],
      extra: { pendingIntent: null },
    };
  }

  // atmos in ceiling / other
  if (/atmos|ceiling speaker|in-?ceiling/.test(norm)) {
    return {
      blocks: [T("Yes — in-ceiling height speakers are the clean way to do Dolby Atmos in a false ceiling. They're positioned ahead of and behind the main seats and wired back to an Atmos-capable AV receiver. The false ceiling makes concealment easy."), escalate("Our team can plan the exact height-speaker layout for your room.")],
      extra: { pendingIntent: null },
    };
  }

  return {
    blocks: [T("Happy to help with installation — ceiling mounting, throw distance, screen height, cable runs, subwoofer placement or Atmos in a false ceiling. What's the specific setup you're planning?")],
    extra: { pendingIntent: "install" },
  };
}

function handleCompare({ text, s, models }) {
  if (models.length >= 2) {
    const [a, b] = models;
    return { blocks: [{ type: "comparison", a, b, rows: comparisonRows(a, b), verdict: comparisonVerdict(a, b, s) }, T(specNote())], extra: { pendingIntent: null, lastDomain: "projector" } };
  }
  if (models.length === 1) {
    const a = models[0];
    const others = PROJECTORS.filter((p) => p.id !== a.id).slice(0, 3);
    return {
      blocks: [
        T(`I can compare the ${a.model}, but I only have verified data for the models in our catalogue — I don't have that second model on file. Want me to compare the ${a.model} against one of these?`),
        quick("Compare with", others.map((p) => ({ id: `${a.model} vs ${p.model}`, label: p.model, emoji: "🔍" }))),
      ],
      extra: { pendingIntent: null },
    };
  }
  return {
    blocks: [T("Which two would you like me to compare? For example “TK710 vs HT4550i”."), quick("Popular comparisons", [
      { id: "TK710 vs HT4550i", label: "TK710 vs HT4550i", emoji: "🔍" },
      { id: "EH-LS12000B vs VPL-XW5000ES", label: "LS12000 vs XW5000ES", emoji: "🔍" },
    ])],
    extra: { pendingIntent: null },
  };
}

function handlePricingService() {
  return {
    blocks: [
      T("Installation pricing depends on the room, equipment and complexity of the setup — cabling, mounting, acoustics and calibration all vary. Our team can give you a proper quote after understanding your requirements; I won't guess a number."),
      escalate("Share your setup with the team for an accurate installation quote."),
    ],
    extra: { pendingIntent: null },
  };
}

function handlePricing({ s, models }) {
  const model = models[0] || lastProduct(s);
  if (!model) {
    return { blocks: [T("Which product's price would you like — a projector, screen, AVR or speakers?")], extra: { pendingIntent: "pricing" } };
  }
  const range = formatPriceRange(model.price);
  return {
    blocks: [
      T(`The ${model.brand} ${model.model} is ${range}, depending on the dealer and current offers — prices float a bit, so treat this as indicative rather than a fixed quote. For the exact current price, our team can confirm.`),
    ],
    extra: { pendingIntent: null, lastDomain: "projector" },
  };
}

function handleSuperlative({ norm }) {
  let pick, label;
  if (/cheap/.test(norm)) { pick = [...PROJECTORS].sort((a, b) => a.price - b.price)[0]; label = "most affordable"; }
  else if (/bright/.test(norm)) { pick = [...PROJECTORS].filter((p) => p.brightness).sort((a, b) => b.brightness - a.brightness)[0]; label = "brightest"; }
  else { pick = [...PROJECTORS].sort((a, b) => b.price - a.price)[0]; label = "most premium"; }
  const spec = label === "brightest" ? `${pick.brightness} ${pick.brightnessUnit || "lumens"}` : formatPriceRange(pick.price);
  return {
    blocks: [
      T(`Our ${label} projector is the ${pick.brand} ${pick.model} (${spec}). ${pick.notes || ""}`.trim()),
      T("But “best” really depends on your room and use — tell me your budget, main use and how bright the room is and I'll tell you whether it's actually right for you."),
    ],
    extra: { pendingIntent: null, lastDomain: "projector", productsConsidered: [pick.id] },
  };
}

function handleInfo({ norm, s, models }) {
  const model = models[0] || lastProduct(s);
  if (!model) return handleAsk({ norm, s });

  // specific spec asked?
  if (/how bright|lumens|brightness/.test(norm)) return specAnswer(model, model.brightness ? `${model.brightness} ${model.brightnessUnit || "lumens"}` : null, "brightness");
  if (/resolution|4k|1080|native/.test(norm)) return specAnswer(model, model.resolution, "resolution");
  if (/throw ratio|throw/.test(norm)) return specAnswer(model, model.throwRatioMin ? `a throw ratio of ${model.throwRatioMin}–${model.throwRatioMax} (${model.zoom || "zoom"})` : null, "throw ratio");
  if (/hdmi 2\.1|refresh|hz|input lag|gaming/.test(norm)) return specAnswer(model, `${model.hdmi21 ? "HDMI 2.1, " : ""}${model.refreshRateHz ? model.refreshRateHz + "Hz, " : ""}${model.inputLagMs != null ? model.inputLagMs + " ms input lag" : ""}`.replace(/,\s*$/, "") || null, "gaming spec");
  if (/price|cost|how much|mrp/.test(norm)) return handlePricing({ s, models });

  // otherwise a concise overview + a card (they named a specific model)
  const overview = `The ${model.brand} ${model.model} is ${model.resolution}${model.brightness ? `, ${model.brightness} ${model.brightnessUnit || "lumens"}` : ""}${model.lightSource ? `, ${model.lightSource.toLowerCase()}` : ""}. Best for ${(model.bestFor || []).join(", ") || "a range of uses"}.`;
  return {
    blocks: [
      T(overview),
      productsBlock([{ tier: "OVERVIEW", product: model, reason: model.notes }]),
      T("Want me to check whether it fits your room, or compare it with another model?"),
    ],
    extra: { pendingIntent: null, lastDomain: "projector", productsConsidered: [model.id] },
  };
}

function specAnswer(model, value, what) {
  const blocks = value
    ? [T(`The ${model.brand} ${model.model} — ${value}.`)]
    : [T(`I don't have a verified ${what} figure for the ${model.model} on file yet, so I won't guess. Our team can confirm it from the manufacturer spec.`)];
  return { blocks, extra: { pendingIntent: null, lastDomain: "projector", productsConsidered: [model.id] } };
}

function handleUpgrade({ s, models }) {
  const owned = models[0] || lastProduct(s);
  if (!owned) return handleRecommend({ text: "", norm: "", s, models: [], c: {} });
  // recommend genuinely better options, excluding the owned model
  const picks = recommendProjectors({ ...s, budget: s.budget || 1e9 })
    .filter((p) => p.product.id !== owned.id)
    .filter((p) => (p.product.cinema || 0) >= (owned.cinema || 0) || p.product.price > owned.price)
    .slice(0, 2)
    .map((p) => ({ ...p, tier: p.tier === "BEST MATCH" ? "WORTH THE UPGRADE" : p.tier, reason: explainPick(p, s) }));
  if (!picks.length) {
    return { blocks: [T(`Honestly, the ${owned.model} is already a strong projector — unless you have a specific frustration (brightness, gaming lag, colour, screen size), an upgrade may not be worth it. What's making you consider a change?`)], extra: { pendingIntent: "recommend" } };
  }
  return {
    blocks: [
      T(`Since you already have the ${owned.model}, an upgrade only makes sense if it fixes something specific. Here's what would be a genuine step up:`),
      productsBlock(picks),
      T(specNote()),
      T("What would you most want to improve over the " + owned.model + " — brightness, cinema picture, gaming, or a bigger screen? That'll tell me if it's worth it."),
    ],
    extra: { pendingIntent: null, lastDomain: "projector" },
  };
}

function handleRecommend({ text, norm, s, models, c }) {
  // evaluating a specific named model ("is the TK710 good for IPL?")
  if (models.length === 1 && (c.evaluative || (s.usage && s.usage.length) || /good for|for (ipl|cricket|sport|gaming|movie)/.test(norm))) {
    const p = models[0];
    const use = s.usage && s.usage.length ? s.usage : null;
    const verdict = evaluateFor(p, use);
    const blocks = [
      T(verdict),
      productsBlock([{ tier: "IN FOCUS", product: p, reason: explainPick({ product: p, reasons: [p.notes] }, s) }]),
      T(`It's ${formatPriceRange(p.price)}, depending on the dealer and current offers.`),
    ];
    blocks.push(T(missingQuestionForModel(s)));
    return { blocks, extra: { pendingIntent: "recommend", lastDomain: "projector", productsConsidered: [p.id] } };
  }

  // generic recommendation — slot-fill the single most useful missing item
  if (!s.budget) return withQuick([T("Happy to recommend the right projector. Roughly what budget are you working with?")], "Budget", BUDGET_CHIPS, "recommend");
  if (!s.usage) return withQuick([T("Got it. What will you use it for most?")], "Main use", USAGE_CHIPS, "recommend");
  if (!s.ambient) return withQuick([T("Last thing — how much light is in the room? It sets how bright the projector needs to be.")], "Room light", AMBIENT_CHIPS, "recommend");

  const picks = recommendProjectors(s).map((pk) => ({ ...pk, reason: explainPick(pk, s) }));
  const blocks = [T(introLine(s)), productsBlock(picks), T(specNote())];
  if (s.screenSize && (s.throwDistance || s.room)) {
    const dist = s.throwDistance || estimateThrowFromRoom(s.room);
    blocks.push(T(`Sized around ~${dist} ft of throw for a ${s.screenSize}\" screen — placement is confirmed precisely on site.`));
  }
  blocks.push(cta("Ready to take this further? Our AV team can turn this into a professionally installed system."));
  return { blocks, extra: { pendingIntent: null, lastDomain: "projector", productsConsidered: picks.map((p) => p.product.id) } };
}

function handleSystem({ s }) {
  if (!s.budget) return withQuick([T("Let's design your system. What total budget are you working with?")], "Budget", BUDGET_CHIPS, "system");
  if (!s.room) return { blocks: [T("What are your room dimensions (e.g. “20 × 15 ft”)?")], extra: { pendingIntent: "system" } };
  if (!s.usage) return withQuick([T("And the main use?")], "Main use", USAGE_CHIPS, "system");
  const sys = buildSystem(s);
  return {
    blocks: [T("Here's a complete STAR AV system matched to your room, budget and use:"), { type: "system", sections: sys.sections, total: sys.total, rationale: sys.rationale }, T(specNote()), T(installNote()), cta("Ready to take this further? Our team can survey the room and install it end-to-end.")],
    extra: { pendingIntent: null },
  };
}

function handleBudget({ s }) {
  if (!s.budget) return withQuick([T("What total budget would you like me to work within?")], "Budget", BUDGET_CHIPS, "budget");
  const b = buildBudget(s);
  return {
    blocks: [T(`Here's how I'd allocate ${formatINR(b.budget)} across the equipment — prioritising what matters most for your use:`), { type: "budget", rows: b.rows, total: b.total, budget: b.budget, note: b.note }, T(specNote()), T(installNote()), cta("Our AV team can fine-tune this to your exact room and install it.")],
    extra: { pendingIntent: null },
  };
}

function handleRoomSetup({ s, patch }) {
  const bits = [];
  if (patch.room) bits.push(`a ${patch.room.widthFt}×${patch.room.lengthFt} ft room`);
  if (patch.screenSize) bits.push(`a ${patch.screenSize}\" screen`);
  if (patch.ambient) bits.push(`a ${patch.ambient} room`);
  if (patch.budget) bits.push(`a ${formatINR(patch.budget)} budget`);
  if (patch.usage) bits.push(`${patch.usage.join(" + ")}`);
  const ack = bits.length ? `Noted — ${bits.join(", ")}. ` : "Noted. ";
  // ask the single most useful next thing toward a recommendation
  if (!s.usage) return withQuick([T(ack + "What will you mainly watch — movies, sports, gaming or presentations?")], "Main use", USAGE_CHIPS, "recommend");
  if (!s.budget) return withQuick([T(ack + "Roughly what budget are you working with?")], "Budget", BUDGET_CHIPS, "recommend");
  if (!s.ambient) return withQuick([T(ack + "How much light does the room get?")], "Room light", AMBIENT_CHIPS, "recommend");
  return handleRecommend({ text: "", norm: "", s, models: [], c: {} });
}

function handleAsk({ norm, s }) {
  if (!norm || /^(hi|hello|hey|yo|hola|namaste)\b/.test(norm)) return { blocks: greeting(), extra: { pendingIntent: null } };
  return {
    blocks: [
      T("I can help with projector or screen recommendations, comparisons, screen-size and throw-distance maths, full home-theatre or budget builds, audio layouts, and troubleshooting an existing setup. What would you like to do?"),
      quick("Where shall we start?", [
        { id: "qa-projector", label: "Recommend a Projector", emoji: "📽" },
        { id: "qa-theatre", label: "Plan Home Theatre", emoji: "🎬" },
        { id: "qa-compare", label: "Compare Models", emoji: "🔍" },
        { id: "qa-audio", label: "Recommend Audio", emoji: "🔊" },
      ]),
      escalate("Prefer a person? Our AV team is happy to help directly."),
    ],
    extra: { pendingIntent: null },
  };
}

function handleTvVsProjector(s) {
  return [
    T("Short version: a projector wins for big-screen cinema feel (100\"+), especially in a room you can darken; a TV (OLED/Mini-LED) wins for bright rooms, everyday viewing and sizes up to ~85\"."),
    T(s.ambient === "bright"
      ? "Since your room is bright, a large Mini-LED TV or a projector on an ALR screen would both work — the TV is the safer bet for daylight."
      : "If you can control the light, a 4K projector on a 100–120\" screen gives the most cinematic result for the money."),
    cta("Tell me your room size, light and budget and I'll recommend the exact display."),
  ];
}

// ===========================================================================
//  small builders
// ===========================================================================
function withQuick(blocks, title, actions, pending) {
  return { blocks: [...blocks, quick(title, actions)], extra: { pendingIntent: pending } };
}
function lastProduct(s) {
  const ids = s.productsConsidered || [];
  const id = ids[ids.length - 1];
  return id ? PROJECTORS.find((p) => p.id === id) : null;
}
function symptomLabel(k) {
  return { flicker: "flickering", washed: "washed-out picture", dark: "dark image", nosignal: "no-signal issue", blurry: "blurriness", lag: "input lag", nosound: "sound issue", hdmi: "HDMI dropout", overheat: "shutdown/overheating" }[k] || "issue";
}
function evaluateFor(p, use) {
  const u = (use && use[0]) || null;
  if (u && p[u] != null) {
    const score = p[u];
    const good = score >= 4 ? "a strong choice" : score >= 3 ? "a reasonable choice" : "not the ideal pick";
    let extra = "";
    if (u === "sports" || u === "gaming") extra = " Its brightness helps for sport/gaming, especially with some ambient light.";
    if (u === "cinema") extra = " It leans towards a cinematic picture in a darker room.";
    return `The ${p.brand} ${p.model} is ${good} for ${labelU(u)}.${extra}`;
  }
  return `The ${p.brand} ${p.model} — ${p.notes || "a capable all-rounder."}`;
}
function missingQuestionForModel(s) {
  if (!s.screenSize) return "If you tell me your screen size and how bright the room gets, I can say whether I'd stick with it or suggest something brighter.";
  if (!s.ambient) return "How bright does the room get during viewing? That decides whether it's bright enough or you'd want more punch.";
  return "Want me to check it against your room and screen size, or compare it with an alternative?";
}
function introLine(s) {
  const use = s.usage ? s.usage.map(labelU).join(" + ") : "your setup";
  return `Based on ${formatINR(s.budget)} for ${use}${s.ambient ? ` in a ${s.ambient} room` : ""}, here's what I'd recommend:`;
}
function specNote() {
  return "Specs are from our product database and are indicative — Star AV confirms final specifications and pricing before purchase.";
}
function installNote() {
  return "Installation isn't included above — it depends on the room, wiring and complexity, so the team quotes that separately after understanding the setup.";
}
function labelU(u) {
  return { gaming: "gaming", cinema: "movies", sports: "sports", corporate: "presentations" }[u] || u;
}

// troubleshooting step-2 content (targeted, using their answer where useful)
function step2ForSymptom(key, answer) {
  const sourceSide = /one device|only |netflix|fire ?tv|stick|set.?top|console|ps5|xbox|laptop|source/.test(answer);
  const projSide = /every|all|menu|itself|even the menu|on-screen/.test(answer);
  const maps = {
    flicker: sourceSide
      ? { lead: "That points to the source or the cable rather than the projector.", intro: "Try these in order:", steps: ["Swap in a certified High/Ultra-High-Speed HDMI cable — cheap cables cause flicker at 4K.", "Try a different HDMI port on the projector.", "In the source device, set output to 4K/60 (or 1080p) to test whether it's a bandwidth issue.", "If it uses an adapter/extender, bypass it and connect directly."], escalate: "If it persists after a good cable and a direct connection, our team can test it on site." }
      : { lead: "If it's on every source including the menu, it's the projector side.", intro: "Try these:", steps: ["Set a fixed refresh rate and turn off any dynamic/eco brightness or lamp-saving mode.", "Check the power source — a weak extension or shared circuit can cause flicker.", "If it's lamp-based and several years old, an ageing lamp can flicker as it wears.", "Note whether it changes with picture mode."], escalate: "If it still flickers on the menu, it likely needs a service check — our team can help." },
    nosignal: sourceSide
      ? { lead: "So the projector itself is fine (its menu shows).", intro: "It's the source/handshake:", steps: ["Reseat the HDMI at both ends; try another port and cable.", "Power the display on first, then the source, so HDCP negotiates.", "If an AVR/switch is in between, connect the source directly to test.", "Match the source resolution to something standard (4K/60 or 1080p)."], escalate: "If it still won't sync, it's usually cabling/handshake — quick for our team to fix." }
      : { lead: "If even the projector's own menu doesn't appear, that's a projector/power issue.", intro: "Check:", steps: ["Confirm power and that it's fully on (not standby) with the lamp/laser indicator steady.", "Try the remote and the on-unit buttons to open the menu.", "If nothing displays at all, note any indicator light patterns."], escalate: "No menu at all usually needs a service look — our team can assist." },
    washed: { lead: "Washed-out usually comes down to light hitting the screen and picture mode.", intro: "Try these:", steps: ["Control ambient light on the screen (curtains/blinds), especially any light landing directly on it.", "Switch to a brighter/vivid picture mode for daytime, and a cinema mode for evening.", "If daytime sport is the main use, an ambient-light-rejecting (ALR) screen makes a big difference.", "Check the lamp/laser hasn't dropped to an eco setting."], escalate: "For a bright-room fix (ALR screen + calibration), our team can advise on your room." },
    dark: { lead: "Let's rule out settings before anything else.", intro: "Check:", steps: ["Take it out of eco/economy lamp mode into normal/bright.", "Confirm the picture mode isn't a very dark 'cinema' preset for a bright room.", "Clean the lens and check throw distance/screen size aren't oversized for the projector's brightness.", "If lamp-based and old, brightness fades with age."], escalate: "If it's still dim after that, our team can measure output and advise." },
    lag: { lead: "Input lag is almost always a mode setting.", intro: "Do this:", steps: ["Turn on Game/Fast mode in the projector's picture menu.", "Turn off heavy processing (noise reduction, motion smoothing).", "Match the source to a supported refresh the projector accepts for low-lag mode."], escalate: "If it still feels laggy, our team can verify the chain end-to-end." },
    nosound: { lead: "Let's find where the audio should be coming from.", intro: "Check:", steps: ["If via an AVR/soundbar, confirm the source feeds audio to it and the right input is selected.", "For eARC/ARC through a TV, enable eARC (ARC can't carry lossless Atmos).", "Check the source's audio output (bitstream vs PCM) matches the receiver.", "Confirm the projector/AVR isn't muted or on the wrong input."], escalate: "Audio routing quirks are quick for our team to sort out." },
    hdmi: { lead: "Dropouts are usually bandwidth or handshake.", intro: "Try:", steps: ["For 4K/120 or long runs, use a certified Ultra-High-Speed or fibre-optic HDMI cable.", "Test a direct source→projector connection to rule out the AVR/switch.", "Lower the output to 4K/60 to see if the dropouts stop (a bandwidth clue).", "Power devices on in the right order for HDCP."], escalate: "For long in-wall runs we can spec an optical cable or extender." },
    overheat: { lead: "Shutdowns usually mean heat or power.", intro: "Check:", steps: ["Clear the air vents and clean the dust filter.", "Give it breathing room — don't box it into a tight cabinet.", "Make sure it's on a stable power source.", "Note whether it shuts off after a consistent time."], escalate: "If it keeps cutting out after cleaning, it should be serviced — our team can help." },
  };
  return maps[key] || { lead: "Thanks — that helps.", intro: "A few things to check:", steps: ["Confirm cables and inputs.", "Test with a different source.", "Note when exactly it happens."], escalate: "If it persists, our AV team can take a proper look." };
}

// comparison helpers
function comparisonRows(a, b) {
  const F = (p, key, suffix = "") => (p[key] == null ? "—" : `${p[key]}${suffix}`);
  return [
    { label: "Price (approx)", a: formatPriceRange(a.price), b: formatPriceRange(b.price) },
    { label: "Resolution", a: a.resolution, b: b.resolution },
    { label: "Brightness", a: F(a, "brightness", ` ${a.brightnessUnit || ""}`), b: F(b, "brightness", ` ${b.brightnessUnit || ""}`) },
    { label: "Light source", a: F(a, "lightSource"), b: F(b, "lightSource") },
    { label: "Throw ratio", a: `${a.throwRatioMin}–${a.throwRatioMax}`, b: `${b.throwRatioMin}–${b.throwRatioMax}` },
    { label: "Lens shift", a: F(a, "lensShift"), b: F(b, "lensShift") },
    { label: "HDMI 2.1", a: a.hdmi21 ? "Yes" : "No", b: b.hdmi21 ? "Yes" : "No" },
    { label: "Input lag", a: F(a, "inputLagMs", " ms"), b: F(b, "inputLagMs", " ms") },
    { label: "Gaming", a: stars(a.gaming), b: stars(b.gaming) },
    { label: "Cinema", a: stars(a.cinema), b: stars(b.cinema) },
  ];
}
function comparisonVerdict(a, b, s) {
  const use = s.usage && s.usage[0];
  if (use && a[use] != null && b[use] != null && a[use] !== b[use]) {
    const win = a[use] > b[use] ? a : b;
    return `For ${labelU(use)}, the ${win.brand} ${win.model} is the stronger pick. ${cheaper(a, b)}`;
  }
  const win = (a.cinema || 0) >= (b.cinema || 0) ? a : b;
  return `For a home cinema the ${win.brand} ${win.model} has the edge on picture; the other suits you better if it fits your placement or gaming needs. ${cheaper(a, b)} Tell me your room, light and budget for a definitive call.`;
}
function cheaper(a, b) {
  const lo = a.price <= b.price ? a : b;
  return `The ${lo.brand} ${lo.model} is the more affordable of the two.`;
}
function stars(n) {
  if (n == null) return "—";
  return "★".repeat(n) + "☆".repeat(5 - n);
}
