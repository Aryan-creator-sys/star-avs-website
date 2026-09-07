import Reveal from "./Reveal";
import { COMPANY } from "../data/site";

/**
 * About Us — a single glass card holding the company statement, set in a dark
 * scene with soft glow accents (per the supplied reference), on the site theme.
 */
export default function About() {
  return (
    <section id="about" className="relative overflow-hidden bg-[#09090f] px-6 py-[9vh]">
      {/* glow accents — monochrome (white / grey) */}
      <div className="pointer-events-none absolute left-1/2 top-[20%] h-[3px] w-[min(640px,74vw)] -translate-x-1/2 rounded-full"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.75), #ffffff, rgba(255,255,255,0.75), transparent)", filter: "blur(2px)", boxShadow: "0 0 40px 6px rgba(255,255,255,0.28)" }} />
      <div className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(60% 50% at 20% 80%, rgba(255,255,255,0.06), transparent 60%), radial-gradient(50% 40% at 85% 60%, rgba(255,255,255,0.05), transparent 60%)" }} />

      <Reveal className="relative mx-auto max-w-[900px]">
        <div className="glass-dark rounded-[28px] p-8 md:px-14 md:py-10">
          <p className="mb-4 text-[0.72rem] font-medium uppercase tracking-[0.35em] text-white/55">
            About us
          </p>
          <h2 className="font-display text-[clamp(1.6rem,3.2vw,2.4rem)] font-light leading-[1.12] tracking-tightest text-white">
            Exceptional AV experiences, since <span className="font-bold">{COMPANY.since}</span>.
          </h2>
          <p className="mt-5 text-[1.02rem] leading-relaxed text-white/75">
            {COMPANY.aboutText}
          </p>
          <a href="#contact"
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:border-white/40">
            Talk to us →
          </a>
        </div>
      </Reveal>
    </section>
  );
}
