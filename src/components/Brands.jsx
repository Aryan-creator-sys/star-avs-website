import Reveal from "./Reveal";
import { BRANDS } from "../data/site";

/**
 * "Trusted Brand Suppliers" — an animated logo carousel (continuous marquee),
 * each brand on a soft grey disc. Wordmarks are copyright-safe stand-ins; drop
 * official logo files into /public/images/brands and swap the <span> for <img>.
 */
export default function Brands() {
  const row = [...BRANDS, ...BRANDS]; // duplicated for a seamless loop

  return (
    <section id="brands" className="relative bg-[#f6f6f4] px-6 pb-[4vh] pt-[4vh]">
      <div className="mx-auto max-w-[1280px]">
        <Reveal>
          <p className="mb-10 text-center text-[0.72rem] font-medium uppercase tracking-[0.35em] text-black/55">
            Trusted brand suppliers
          </p>
        </Reveal>

        <div className="marquee marquee-mask overflow-hidden">
          {/* base gap = phones; sm:/md: restore the exact desktop rhythm */}
          <div className="marquee-track items-center gap-3 sm:gap-6 md:gap-10">
            {row.map((b, i) => (
              <div key={i} className="flex-none px-1 sm:px-2">
                {/* glass chip holding the official logo — smaller on phones only */}
                <div className="glass group flex h-[76px] w-[124px] items-center justify-center rounded-xl px-4 transition-transform duration-500 hover:-translate-y-1 sm:h-[104px] sm:w-[188px] sm:rounded-2xl sm:px-7">
                  <img
                    src={b.logo}
                    alt={`${b.name} logo`}
                    className="max-h-[30px] w-auto max-w-full object-contain opacity-70 grayscale transition duration-500 group-hover:opacity-100 group-hover:grayscale-0 sm:max-h-[42px]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
