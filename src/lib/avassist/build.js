// ============================================================================
//  STAR AV ASSIST — audio configuration, complete-system builder, budget builder
// ============================================================================

import { PROJECTORS, SCREENS, AVRECEIVERS, SUBWOOFERS, MEDIA_PLAYERS } from "../../data/avProducts";
import { recommendProjectors, estimateThrowFromRoom } from "./recommend";

// --- Audio configuration from room size ------------------------------------
export function recommendAudio(session = {}) {
  const room = session.room;
  const area = room ? room.widthFt * room.lengthFt : null;
  let config, layout, note;

  if (session.audioPref === "soundbar") {
    return {
      config: "Atmos soundbar + wireless sub",
      layout: ["Soundbar (LCR + up-firing height)", "Wireless subwoofer"],
      note: "Cleanest option when in-wall/in-ceiling wiring isn't practical.",
    };
  }

  if (!area || area < 150) {
    config = "5.1";
    layout = ["Front L/R (bookshelf)", "Centre", "2× surround", "Subwoofer"];
    note = "5.1 is the sweet spot for a compact room.";
  } else if (area < 320) {
    config = "5.1.2";
    layout = ["Front L/R", "Centre", "2× surround", "2× in-ceiling height (Atmos)", "Subwoofer"];
    note = "Adds Dolby Atmos height for immersive movies without crowding the room.";
  } else {
    config = "7.1.4";
    layout = ["Front L/R (floor-standing)", "Centre", "2× surround", "2× rear surround", "4× in-ceiling height", "Subwoofer (12\")"];
    note = "A large room supports full 7.1.4 immersive Atmos.";
  }
  return { config, layout, note, area };
}

// --- Complete system builder ------------------------------------------------
export function buildSystem(session = {}) {
  const picks = recommendProjectors(session);
  const display = picks[0] ? picks[0].product : null;
  const audio = recommendAudio(session);

  // screen: pick nearest size to requested (or 120" default), prefer ALR in bright rooms
  const wantSize = session.screenSize || 120;
  let screenPool = SCREENS.slice();
  if (session.ambient === "bright") screenPool.sort((a, b) => (b.alr === true) - (a.alr === true));
  const screen = screenPool.sort((a, b) => Math.abs(a.sizeIn - wantSize) - Math.abs(b.sizeIn - wantSize))[0];

  // AVR sized to audio config
  const avr = avrForConfig(audio.config);
  const sub = SUBWOOFERS.find((s) => (audio.config.startsWith("7") ? s.id === "sub-12" : s.id === "sub-10")) || SUBWOOFERS[0];
  const source = MEDIA_PLAYERS[0];

  const sections = [];
  if (display) sections.push({ label: "DISPLAY", name: `${display.brand} ${display.model}`, detail: display.resolution + ", " + fmtLumens(display), price: display.price });
  if (screen) sections.push({ label: "SCREEN", name: screen.model, detail: `${screen.type}${screen.alr ? " · ALR" : ""}`, price: screen.price });
  sections.push({ label: "AUDIO", name: audio.config + " speaker package", detail: audio.layout.join(" · "), price: audioPackagePrice(audio.config) });
  if (avr) sections.push({ label: "AVR", name: avr.model, detail: `${avr.channels} · ${avr.hdmi21 ? "HDMI 2.1" : "HDMI 2.0"}`, price: avr.price });
  if (sub) sections.push({ label: "SUBWOOFER", name: sub.model, detail: sub.notes, price: sub.price });
  if (source) sections.push({ label: "SOURCES", name: source.model, detail: source.notes, price: source.price });
  // Installation is intentionally NOT priced — it's quoted after a site survey.
  sections.push({ label: "INSTALLATION", name: "Mounting, cabling & calibration", detail: "Quoted separately after a site survey — depends on room, wiring & complexity", price: null });

  const subtotal = sections.reduce((s, x) => s + (x.price || 0), 0);
  const total = { min: Math.round(subtotal * 0.95), max: Math.round(subtotal * 1.15) };

  const rationale = buildRationale(session, display, screen, audio);
  return { sections, total, rationale };
}

// --- Budget builder: allocate a fixed budget sensibly -----------------------
export function buildBudget(session = {}) {
  const budget = session.budget;
  if (!budget) return null;
  const usage = session.usage || ["cinema"];
  const gamingFocus = usage.includes("gaming");

  // allocation weights (display gets the most; installation always reserved)
  const alloc = {
    display: 0.4,
    screen: 0.12,
    avr: 0.13,
    speakers: 0.16,
    subwoofer: 0.08,
    sources: 0.03,
    installation: 0.08,
  };
  const rows = [];
  const disp = pickWithin("projector", budget * alloc.display, session);
  rows.push({ label: "Projector", name: disp ? `${disp.brand} ${disp.model}` : "Best-fit projector", price: disp ? disp.price : Math.round(budget * alloc.display) });
  const scr = nearest(SCREENS, session.screenSize || 120);
  rows.push({ label: "Screen", name: scr.model, price: scr.price });
  const audio = recommendAudio(session);
  const avr = avrForConfig(audio.config);
  rows.push({ label: "AVR", name: avr.model, price: avr.price });
  rows.push({ label: "Speakers", name: `${audio.config} package`, price: audioPackagePrice(audio.config) });
  const sub = SUBWOOFERS.find((s) => audio.config.startsWith("7") ? s.id === "sub-12" : s.id === "sub-10") || SUBWOOFERS[0];
  rows.push({ label: "Subwoofer", name: sub.model, price: sub.price });
  rows.push({ label: "Sources", name: MEDIA_PLAYERS[0].model, price: MEDIA_PLAYERS[0].price });

  // Equipment total only — installation is quoted separately (never invented).
  const total = rows.reduce((s, r) => s + r.price, 0);
  const base =
    total > budget
      ? "This slightly exceeds the equipment budget — we've prioritised what matters most; Star AV can tune it to land on target."
      : total < budget * 0.85
      ? "We've kept some headroom rather than spending for the sake of it — that can go toward acoustics, better speakers or a larger screen."
      : "Balanced allocation across the equipment that matters most for your use.";
  const note = base + " Installation (mounting, cabling, calibration) is quoted separately after understanding the room.";
  return { rows, total, budget, note, gamingFocus };
}

// --- helpers ----------------------------------------------------------------
function avrForConfig(config) {
  if (config.startsWith("7.1.4") || config.startsWith("5.1.4")) return AVRECEIVERS.find((a) => a.channels === "9.2");
  if (config.includes(".2") || config.startsWith("5.1.2") || config.startsWith("7.1")) return AVRECEIVERS.find((a) => a.channels === "7.2");
  return AVRECEIVERS.find((a) => a.channels === "5.2");
}
function audioPackagePrice(config) {
  // rough package pricing by channel count using DB component prices
  const bookshelf = 45000, centre = 35000, sub = 45000, height = 40000, floor = 110000, surroundExtra = 45000;
  if (config === "5.1") return bookshelf + centre;
  if (config === "5.1.2") return bookshelf + centre + height;
  if (config === "7.1.4") return floor + centre + surroundExtra + height * 2;
  return bookshelf + centre;
}
function fmtLumens(p) {
  return p.brightness ? `${p.brightness} ${p.brightnessUnit || "lumens"}` : "brightness not specified";
}
function nearest(list, sizeIn) {
  return list.slice().sort((a, b) => Math.abs((a.sizeIn || 0) - sizeIn) - Math.abs((b.sizeIn || 0) - sizeIn))[0];
}
function pickWithin(category, cap, session) {
  const pool = PROJECTORS.filter((p) => p.price <= cap * 1.1);
  if (!pool.length) return null;
  const picks = recommendProjectors({ ...session, budget: cap * 1.1 });
  return picks[0] ? picks[0].product : pool.sort((a, b) => b.price - a.price)[0];
}
function buildRationale(session, display, screen, audio) {
  const bits = [];
  if (display) bits.push(`The ${display.brand} ${display.model} anchors the picture`);
  if (screen) bits.push(`paired with a ${screen.sizeIn}\" ${screen.type.toLowerCase()} screen`);
  bits.push(`and a ${audio.config} layout so sound matches the scale of the image`);
  if (session.ambient === "bright") bits.push("with an ambient-light-rejecting screen chosen for your brighter room");
  return bits.join(", ") + ". Every part is matched so nothing bottlenecks the rest.";
}
