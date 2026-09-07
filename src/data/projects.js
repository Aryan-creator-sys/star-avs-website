// ============================================================================
//  Projects / Installations gallery data.
//
//  These are 30 real Star AVS installation photographs (production assets live
//  in /public/images/projects). Categories are assigned from the photos.
//  Reviews and specifications are intentionally OMITTED — none are attached
//  unless a genuine, correctly-matched review/spec is provided. Never fabricate
//  customer names, reviews, room sizes, models or specs.
//
//  Fields:
//    id, title, category, image (full), thumb, alt
//    featured?  — larger tile in the editorial grid (hand-picked)
//    fullWidth? — full-row cinematic "pause" image (hand-picked)
//    hero?      — the single strongest image, shown large with subtle parallax
//    review?  { author, text }         (only if genuine)
//    specs?   { room, projector, speakers, screen }  (only if genuine)
// ============================================================================

const img = (n) => `/images/projects/${n}.jpg`;
const thumb = (n) => `/images/projects/${n}-thumb.jpg`;
const wall = (n) => `/images/projects/${n}-w.jpg`; // small web-sized tile for the drift wall

/**
 * @typedef {'home-theatre'|'living-room'|'boardroom'|'commercial'} Category
 */

export const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "home-theatre", label: "Home theatre" },
  { id: "living-room", label: "Living room" },
  { id: "boardroom", label: "Boardroom" },
  { id: "commercial", label: "Commercial" },
];

const CATEGORY_LABEL = {
  "home-theatre": "Home theatre",
  "living-room": "Living-room cinema",
  boardroom: "Boardroom AV",
  commercial: "Commercial AV",
};

// [ n, category, title, {featured, fullWidth, hero} ]
const RAW = [
  ["p27", "home-theatre", "Dedicated Home Cinema", { hero: true }],
  ["p05", "home-theatre", "Recliner Home Cinema", { featured: true }],
  ["p01", "home-theatre", "Home Theatre"],
  ["p02", "home-theatre", "Home Cinema Screen"],
  ["p03", "home-theatre", "Home Cinema"],
  ["p04", "home-theatre", "Cove-lit Home Theatre"],
  ["p06", "home-theatre", "Home Cinema"],
  ["p28", "home-theatre", "Reference Home Theatre", { fullWidth: true }],
  ["p08", "home-theatre", "Living Home Cinema"],
  ["p11", "home-theatre", "Acoustically-treated Cinema", { featured: true }],
  ["p12", "home-theatre", "Home Theatre"],
  ["p16", "home-theatre", "Acoustic Cinema Room"],
  ["p18", "home-theatre", "Private Home Theatre", { featured: true }],
  ["p19", "home-theatre", "Feature-wall Cinema", { fullWidth: true }],
  ["p21", "home-theatre", "Home Cinema"],
  ["p23", "home-theatre", "Ambient-lit Cinema"],
  ["p24", "home-theatre", "Dedicated Cinema Room", { featured: true }],
  ["p26", "living-room", "Living-room Cinema", { featured: true }],
  ["p13", "living-room", "Media & Gaming Lounge", { featured: true }],
  ["p29", "home-theatre", "Cinematic Home Theatre", { fullWidth: true }],
  ["p07", "commercial", "Commercial AV Fit-out"],
  ["p09", "commercial", "Commercial AV"],
  ["p10", "boardroom", "Boardroom AV"],
  ["p14", "commercial", "Large-format Display"],
  ["p15", "commercial", "Showroom Display Wall"],
  ["p17", "commercial", "Auditorium Projection"],
  ["p20", "commercial", "Corporate AV"],
  ["p22", "commercial", "Presentation Space"],
  ["p25", "boardroom", "Boardroom AV"],
];

// Aspect ratio (width / height) of each source photo — used to size gallery
// tiles to the image so nothing is cropped or stretched.
const AR = {
  p01: 1.53, p02: 2.0, p03: 1.5, p04: 1.27, p05: 1.16, p06: 1.83, p07: 1.85,
  p08: 1.46, p09: 1.14, p10: 0.7, p11: 1.79, p12: 1.51, p13: 1.15, p14: 1.19,
  p15: 1.09, p16: 0.8, p17: 1.41, p18: 1.48, p19: 2.02, p20: 1.2, p21: 0.95,
  p22: 0.87, p23: 0.84, p24: 1.44, p25: 0.75, p26: 1.18, p27: 1.21, p28: 1.88, p29: 1.2,
};

export const PROJECTS = RAW.map(([n, category, title, opts = {}]) => ({
  id: n,
  title,
  category,
  image: img(n),
  thumb: thumb(n),
  wall: wall(n),
  ar: AR[n] || 1.5,
  alt: `${title} — ${CATEGORY_LABEL[category]} installation by Star AVS, Bangalore.`,
  ...opts,
}));

export const HERO_PROJECT = PROJECTS.find((p) => p.hero) || PROJECTS[0];
export const GRID_PROJECTS = PROJECTS.filter((p) => !p.hero);

// Curated 12 strongest HOME-THEATRE installations for the card-fan showcase.
// Order matters: at rest the fan shows the first 7 — index 0 is the far-left
// card, index 6 the far-right card, index 3 the centre. p04 (blue-cove) leads
// on the left; p26 (teal-sofa lounge) sits at the right of the visible fan.
const TOP12_IDS = ["p04", "p29", "p28", "p05", "p11", "p18", "p26", "p16", "p23", "p27", "p19", "p01"];
export const TOP_HOME_THEATRE = TOP12_IDS
  .map((id) => PROJECTS.find((p) => p.id === id))
  .filter(Boolean);

// The next 10 installations (after the fan's 12) for the circular gallery.
const NEXT10_IDS = ["p02", "p03", "p06", "p08", "p12", "p21", "p26", "p13", "p07", "p09"];
export const NEXT_10 = NEXT10_IDS
  .map((id) => PROJECTS.find((p) => p.id === id))
  .filter(Boolean);

