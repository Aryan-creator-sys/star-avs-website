# Star AVS — cinematic website (React + Vite)

A premium, cinematic redesign for **Star Audio Video Solutions** (Bengaluru).
Stack: **React + Vite + Tailwind CSS + GSAP + ScrollTrigger + Lenis**.

## Run

```bash
cd staravs
npm install
npm run dev      # http://localhost:5178
npm run build    # production build in /dist
```

## The hero (highest-priority interaction)

`src/components/Hero.jsx` is a **~560vh pinned, scrub-driven** sequence — one
continuous "camera travels into the projection", not fade-swaps:

```
projector (angled)  →  camera approaches  →  projector aims + light beam
→  cinema screen lights  →  camera passes the projector toward the screen
→  projected image expands past the frame  →  becomes the full-screen 4K video
```

The projected surface is the `<video>` element the whole time, so "image → video"
is a single continuous scale (no cut/fade). Scrolling slow/fast/backwards all read
naturally because the timeline is `scrub`bed and smoothed by Lenis.

## Replacing assets (very easy)

Everything points at `/public` via **one file**: `src/data/site.js` (`ASSETS`).
Drop replacements in with the same names — no component edits needed:

```
public/
  images/
    projector-hero.png     ← the hero / product projector (transparent PNG)
    logo.png               ← company logo
    installation-01..08.png← project photos (Client Work gallery)
  videos/
    hero-video.mp4         ← the cinematic 4K clip the projection becomes
  models/                  ← (reserved for a 3D projector, if added later)
```

> The current assets are the company's real logo + installation photos and a
> placeholder projector image/clip, used so the site is fully populated. Swap the
> projector render and drop a true 4K clip into `hero-video.mp4` for final polish.

## Structure

```
src/
  App.jsx                    section composition + smooth scroll
  data/site.js               ← single source of truth (copy, brands, contact, assets)
  lib/gsap.js                GSAP + ScrollTrigger (registered)
  lib/useSmoothScroll.js     Lenis ↔ GSAP ticker integration
  components/
    Navbar.jsx               transparent → solid, mobile menu
    Hero.jsx                 cinematic projector scroll sequence
    Intro.jsx                large-type introduction
    Solutions.jsx            immersive service sections (parallax)
    ProductShowcase.jsx      pinned product-experience beats
    Projects.jsx             Client Work — floating-preview mouse interaction
    Brands.jsx               brand wall
    About.jsx                why Star AVS
    Contact.jsx              dramatic CTA + real contact
    Footer.jsx
    Reveal.jsx               shared subtle scroll reveal
```

## Client Work interactions (`Projects.jsx`)

Desktop-only, GSAP-ticker driven (no per-frame React re-renders):
inertial cursor-following **floating preview** that **morphs** between projects
(two stacked layers + clip-path reveal), velocity-based tilt/skew, magnetic pull
to the hovered row, a **VIEW →** label, and category filtering. Touch and
`prefers-reduced-motion` fall back to a clean image grid.

## Content / facts to confirm before publishing

`src/data/site.js` — **phone, WhatsApp and email are placeholders** (`+91 00000…`).
Address, since-2012, the 4.5★/200+ rating and the brand list (Canon, 3M, Casio,
Epson, Hitachi, BenQ) are from the company's own listings/brand wall. Brands are
shown as wordmarks — drop official logo files in and swap for `<img>` if desired.

## Notes
- `window.gsap`, `window.ScrollTrigger`, `window.__lenis` are exposed for QA — remove for production if you prefer.
```
