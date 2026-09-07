// ============================================================================
//  STAR AVS — single source of truth.
//  Edit copy, brands, services and contact here. Swap assets by replacing the
//  files in /public/images and /public/videos (filenames are referenced below).
//  Facts (company, brands, address, since-year) are taken from the existing
//  Star AVS listings; phone/email are placeholders — set the real values.
// ============================================================================

export const ASSETS = {
  logo: "/images/logo-dark.png",
  logoSymbol: "/images/logo-symbol.png", // arrow-S mark only (transparent)
  heroRoom: "/images/showcase-sport.png", // football living-room (hero reveal)
  projector: "/images/projector-hero.png", // 3/4 angle (used in product showcase)
  projectorFront: "/images/projector-front.png", // front-facing (hero parallax)
  heroVideo: "/videos/hero-video.mp4", // replace with /public/videos/hero-video.mp4
  // projected still shown before the video "comes alive" in the hero
  projectedStill: "/images/installation-01.png",
  installations: [
    { src: "/images/installation-01.png", title: "Living-room cinema", tag: "Home Cinema" },
    { src: "/images/installation-04.png", title: "Dedicated theatre, tower array", tag: "Home Cinema" },
    { src: "/images/installation-10.png", title: "Stone feature-wall cinema", tag: "Home Cinema" },
    { src: "/images/installation-02.png", title: "Corporate boardroom AV", tag: "Commercial AV" },
    { src: "/images/installation-08.png", title: "Acoustic-treated room", tag: "Acoustics" },
    { src: "/images/installation-05.png", title: "Recliner home cinema", tag: "Home Cinema" },
    { src: "/images/installation-06.png", title: "Conference-room projection", tag: "Commercial AV" },
    { src: "/images/installation-11.png", title: "Ambient-lit private cinema", tag: "Home Cinema" },
  ],
};

export const COMPANY = {
  name: "Star Audio Video Solutions",
  short: "Star AVS",
  tagline: "The AV Experts",
  since: 2012,
  city: "Bengaluru",
  rating: "4.5",
  reviews: "200+",
  // Address from public listings (Austin Town). Verify before publishing.
  address:
    "#34/1, 2nd Floor, A Cross, A & B Block, Off Palm Grove Road, Austin Town, Bengaluru 560047",
  // Real published numbers (from the client brief)
  phones: [
    { label: "+91 81050 55008", tel: "+918105055008" },
    { label: "+91 84318 55777", tel: "+918431855777" },
    { label: "080 2556 0155", tel: "+918025560155" },
  ],
  phone: "+91 81050 55008",
  phoneHref: "tel:+918105055008",
  // Lokesh's registered WhatsApp number (wa.me format: country code + number)
  whatsapp: "917942965574",
  email: "info@staravs.co.in",
  justdial:
    "https://www.justdial.com/Bangalore/Star-Audio-Video-Solutions-Near-Chaiteniya-Delcisy-Hotel-Off-Plam-Grove-Road-And-Ch-Austin-Town/080PXX80-XX80-120926203625-Z8L5_BZDET",
  aboutText:
    "Since 2012, Star Audio Video Solutions has been creating exceptional AV experiences across Bangalore. As authorized dealers for leading brands, we combine premium technology with expert guidance to recommend the right solution for every space and budget. From installation to dedicated after-sales support, we're here to make your experience seamless from start to finish.",
};

export const NAV = [
  { label: "Experience", href: "#movie" },
  { label: "Detail", href: "#quality" },
  { label: "Sizes", href: "#screen-size" },
  { label: "Work", href: "#work" },
  { label: "Brands", href: "#brands" },
  { label: "Contact", href: "#contact" },
];

export const SOLUTIONS = [
  {
    id: "home-cinema",
    kicker: "01 — Home Cinema",
    title: "Private cinemas, engineered end-to-end.",
    copy: "Turn a room into a true theatre — projection, screen, surround sound, acoustics, seating and lighting, designed around your space and budget.",
    image: "/images/installation-05.png",
  },
  {
    id: "projectors",
    kicker: "02 — Projectors & Screens",
    title: "Light that behaves like a screen.",
    copy: "Authorised supply, calibration and installation of 4K laser and lamp projectors with fixed and motorised screens — for homes, offices and events.",
    image: "/images/installation-10.png",
  },
  {
    id: "audio",
    kicker: "03 — Audio & Acoustics",
    title: "Sound you feel, not just hear.",
    copy: "Surround systems, AV receivers and whole-home audio, paired with room acoustics and treatment tuned for reference-grade sound.",
    image: "/images/installation-04.png",
  },
  {
    id: "commercial",
    kicker: "04 — Commercial AV",
    title: "Boardrooms that just work.",
    copy: "Displays, projection, video conferencing and control systems for conference rooms, training spaces and auditoriums — integrated and supported.",
    image: "/images/installation-02.png",
  },
];

// Feature beats for the pinned product-experience section.
export const EXPERIENCE = [
  {
    stat: "4K",
    unit: "UHD Laser",
    title: "True 4K, laser bright.",
    copy: "Razor-sharp 4K resolution with a long-life laser light source — brilliant in a living room, cinematic in a blackout theatre.",
  },
  {
    stat: "HDR10",
    unit: "+ Dolby-ready audio",
    title: "Cinematic colour and depth.",
    copy: "High dynamic range for deeper contrast and lifelike colour, matched with immersive object-based sound.",
  },
  {
    stat: "∞",
    unit: "Every budget",
    title: "From first cinema to reference build.",
    copy: "One team for the whole chain — specified, installed and calibrated, then supported for the long run.",
  },
];

// Big cinematic feature videos (brief §02 Movie, §04 Sports).
// Replace `video` with your own licensed footage; `poster` shows before it loads.
export const FEATURES = [
  {
    id: "movie",
    kicker: "4K UHD Projection",
    headline: "Cinema, at home.",
    copy: "Lose yourself in every frame. Rich detail, deep contrast and cinematic colour make your favourite films feel bigger than ever.",
    video: "/videos/showcase-04.mp4",
    poster: "/images/poster-04.jpg",
    indicator: "DOLBY ATMOS · HDR",
    dolby: true, // brief §02: official Dolby asset from dealer kit goes bottom-of-video
    mood: "slow",
    narrow: true, // render a bit smaller (per client note)
  },
  {
    id: "sports",
    kicker: "Big-screen sports",
    headline: "Every point. Every moment.",
    copy: "From the first serve to match point, watch the action unfold with the clarity and scale of a true big-screen experience.",
    video: "/videos/showcase-01.mp4",
    poster: "/images/poster-01.jpg",
    indicator: "4K · SMOOTH MOTION",
    dolby: false,
    mood: "energetic",
  },
];

// Projection-quality showcase — the "see what our systems produce" story.
// Replace `src` with your own 4K projection photography (2400px+ wide, 16:9).
export const SHOWCASE = [
  { id: "cinema", num: "01", label: "Cinema", headline: "The screen is the cinema.", src: "/images/showcase/showcase-cinema.jpg" },
  { id: "nature", num: "02", label: "Nature", headline: "Every detail matters.", src: "/images/showcase/showcase-nature.jpg" },
  { id: "architecture", num: "03", label: "Architecture", headline: "Built for the big screen.", src: "/images/showcase/showcase-architecture.jpg" },
  { id: "landscape", num: "04", label: "Landscape", headline: "A window into another world.", src: "/images/showcase/showcase-landscape.jpg" },
];

// Small looping motion accents (demonstrate 4K motion). Replace with your own clips.
export const SHOWCASE_CLIPS = [
  { src: "/videos/showcase-03.mp4", label: "4K · CINEMATIC" },
  { src: "/videos/showcase-02.mp4", label: "4K · MOTION" },
];

// Definitive brand list (from the company's own brand wall) — official logos.
export const BRANDS = [
  { name: "Canon", logo: "/images/brands/canon.svg" },
  { name: "Epson", logo: "/images/brands/epson.svg" },
  { name: "Sony", logo: "/images/brands/sony.svg" },
  { name: "BenQ", logo: "/images/brands/benq.svg" },
  { name: "Hitachi", logo: "/images/brands/hitachi.svg" },
  { name: "Casio", logo: "/images/brands/casio.svg" },
  { name: "3M", logo: "/images/brands/3m.svg" },
];

// About Us — the company text broken into 4 scroll-advancing chunks, each with
// its own installation backdrop. Swap the images for the exact uploads later.
export const ABOUT_SLIDES = [
  {
    tag: "Since 2012",
    text: "Star Audio Video Solutions has been creating exceptional AV experiences across Bangalore.",
    img: "/images/installation-12.png",
  },
  {
    tag: "Authorized dealers",
    text: "We pair premium technology from leading global brands with genuine expert guidance.",
    img: "/images/installation-11.png",
  },
  {
    tag: "Every space & budget",
    text: "The right solution for every room and every budget — designed entirely around you.",
    img: "/images/installation-10.png",
  },
  {
    tag: "End to end",
    text: "From installation to dedicated after-sales support — seamless from start to finish.",
    img: "/images/installation-03.png",
  },
];

export const ABOUT_POINTS = [
  {
    k: "Since 2012",
    v: "Over a decade specifying, installing and calibrating audio-visual systems across Bengaluru.",
  },
  {
    k: "Home & Commercial",
    v: "A single team for private home cinemas and corporate AV — design through to service.",
  },
  {
    k: "Rated 4.5 / 5",
    v: "200+ verified customer reviews for honest advice, clean installs and dependable support.",
  },
  {
    k: "Every budget",
    v: "Entry-level to reference-grade — the right system for your room and your spend.",
  },
];

// Customer testimonials (from Star AV's own reviews). No photos are available,
// so the UI uses initials monograms. Rating shown from the client's Justdial.
export const REVIEW_RATING = {
  score: "4.7",
  source: "Justdial",
  basis: "Based on 200+ customer ratings",
};

export const TESTIMONIALS = [
  {
    by: "Amal Upadhyay",
    role: "Personal Cinema",
    text: "Very professional team. Lokesh made sure the work was finished before the promised day — competent, transparent, and they delivered more than promised. A must-recommend for a state-of-the-art personal cinema.",
  },
  {
    by: "Sandeep Shah",
    role: "Home Theatre",
    text: "Free home consultation and a great projector + sound system for our living room. The 120-inch screen is cleanly installed — I love watching sports and movies on it. Great investment!",
  },
  {
    by: "Amit Satapathy",
    role: "Home Theatre",
    text: "Very nicely set up for our home. Lokesh sir suggested the best option within our budget — we bought the BenQ 4K projector and it's been one of our best investments.",
  },
  {
    by: "Sreejith",
    role: "Office AV Installation",
    text: "Excellent setup — audio and video very nicely integrated, with the projector and screen cleanly installed. Superb integration and a great solution provided.",
  },
  {
    by: "Suneeth",
    role: "Denon + Atmos",
    text: "Mr. Lokesh has vast experience and is well informed about audio-video technology and products. He listened to my requirement and suggested the right product at the best price. Delivered and installed on time, as promised.",
  },
  {
    by: "Mahima Solanki",
    role: "Verified review",
    text: "Surely 5 stars. They are certainly the best in the projector industry.",
  },
  {
    by: "Tarsh Mehta & Rituraj Purohit",
    role: "Projectors",
    text: "They have a wide range of projectors to choose from, at very affordable prices.",
  },
];
