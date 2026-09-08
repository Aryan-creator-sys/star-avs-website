import Reveal from "./Reveal";

// Extra installations for the moving slideshow (grayscale, half the row-2 height).
const SLIDESHOW = [
  "/images/installation-05.jpg",
  "/images/installation-07.jpg",
  "/images/installation-03.jpg",
  "/images/installation-04.jpg",
  "/images/installation-01.jpg",
];

/**
 * "Our approach" — two mirrored editorial rows. Each pairs a large B&W
 * installation image (bleeding to one edge, no rounding) with a statement that
 * carries a vertical rule. Grayscale matches the white/black theme.
 */
export default function Values() {
  return (
    <section id="approach" className="relative overflow-hidden bg-[#f6f6f4] pt-[2vh] pb-[8vh] sm:py-[8vh]">
      {/* ROW 1 — text left, image bleeds right */}
      <div className="grid items-center gap-10 md:grid-cols-[0.85fr_1.15fr] md:gap-12">
        <Reveal className="order-2 px-6 md:order-1 md:pl-12 lg:pl-20">
          <div className="flex gap-6">
            <div className="w-px shrink-0 self-stretch bg-black/25" />
            <div>
              <p className="mb-4 text-[0.72rem] font-medium uppercase tracking-[0.35em] text-black/55">Our approach</p>
              <p className="font-display text-[clamp(1.7rem,3.1vw,2.6rem)] font-light leading-[1.18] tracking-tight text-[#101012]">
                <span className="font-extrabold text-[#ff2e2e]">50+ installations.</span>{" "}
                From intelligent corporate spaces to immersive home cinemas — AV systems designed for every environment.
              </p>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.1} className="order-1 md:order-2">
          <figure>
            <img src="/images/installation-12.jpg" alt="Home cinema installation with a large projected screen" loading="lazy"
              className="h-[52vh] w-full object-cover md:h-[78vh]" style={{ filter: "grayscale(1) contrast(1.05)" }} />
            <figcaption className="mt-3 px-6 text-xs tracking-wide text-black/45 md:px-0">
              Client: Sandeep Shah — TK710 installation with Dolby Atmos speakers (2026)
            </figcaption>
          </figure>
        </Reveal>
      </div>

      {/* ROW 2 — smaller image bleeds left (top), compact text sits low (speaker line) */}
      <div className="mt-[1vh] grid items-stretch gap-6 md:grid-cols-[1.05fr_0.95fr] md:gap-12">
        <Reveal className="order-1">
          <figure>
            <img src="/images/installation-11.jpg" alt="Dedicated home theatre with tower speakers and a large screen" loading="lazy"
              className="h-[38vh] w-full object-cover md:h-[52vh]" style={{ filter: "grayscale(1) contrast(1.05)" }} />
            <figcaption className="mt-3 px-6 text-xs tracking-wide text-black/45 md:pl-12 lg:pl-20">
              Client: Anonymous — 120&quot; Epson projector installation
            </figcaption>
          </figure>
        </Reveal>
        <Reveal delay={0.1} className="order-2 flex flex-col justify-end px-6 pb-[3vh] md:pr-12 lg:pr-20">
          <div className="flex gap-4">
            <div className="w-px shrink-0 self-stretch bg-black/25" />
            <div>
              <p className="mb-2 text-[0.66rem] font-medium uppercase tracking-[0.32em] text-black/55">Craftsmanship</p>
              <p className="font-display text-[clamp(1.05rem,1.9vw,1.45rem)] font-light leading-[1.25] tracking-tight text-[#101012]">
                <span className="font-extrabold text-[#ff2e2e]">Clean cabling.</span>{" "}
                Concealed casing and a flawless finish — the craft is in the details you never notice.
              </p>
            </div>
          </div>
        </Reveal>
      </div>

      {/* moving slideshow of more installations — ~half the row-2 image height */}
      <div className="marquee marquee-mask mt-[6vh] overflow-hidden">
        <div className="marquee-track gap-3">
          {[...SLIDESHOW, ...SLIDESHOW].map((src, i) => (
            <img key={i} src={src} alt="" aria-hidden="true" loading="lazy"
              className="h-[26vh] w-auto flex-none object-cover"
              style={{ filter: "grayscale(1) contrast(1.05)" }} />
          ))}
        </div>
      </div>
    </section>
  );
}
