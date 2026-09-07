import { COMPANY, ASSETS } from "../data/site";

const logoWhite = { filter: "brightness(0) invert(1)" };

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#0b0b0d] px-6 py-16 text-white">
      {/* subtle red-metallic ambience to match the site */}
      <div className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(50% 60% at 88% 0%, rgba(255,46,46,0.08), transparent 60%)" }} />

      <div className="relative z-10 mx-auto max-w-[1180px]">
        <div className="grid gap-12 md:grid-cols-[1.2fr_1fr]">
          {/* brand + connect */}
          <div className="max-w-sm">
            <img src={ASSETS.logo} alt={COMPANY.name} className="mb-5 h-8 w-auto" style={logoWhite} />
            <p className="text-sm leading-relaxed text-white/55">
              {COMPANY.name} — home cinema, projection, audio and commercial AV
              integration in {COMPANY.city} since {COMPANY.since}.
            </p>
            <a
              href={COMPANY.justdial}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-dark mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              <span className="font-display text-[0.95rem] font-bold leading-none tracking-tight text-white" aria-hidden="true">Jd</span>
              Connect on Justdial
            </a>
          </div>

          {/* contact */}
          <div>
            <p className="mb-4 text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-[#ff6a6a]">Contact</p>
            <address className="space-y-3 not-italic">
              <p className="max-w-xs text-sm leading-relaxed text-white/70">
                # 34/1, 2nd Floor, A Cross, A &amp; B Block, Near SBI, Off Palm Grove Road,
                Austin Town, Bangalore, 560047, Karnataka
              </p>
              <p>
                <a href="tel:+918105055008" className="text-sm text-white/70 transition-colors hover:text-[#ff8a8a]">+91-8105055008</a>
              </p>
              <p>
                <a href="mailto:lokeshsrjsrt28@gmail.com" className="text-sm text-white/70 transition-colors hover:text-[#ff8a8a]">lokeshsrjsrt28@gmail.com</a>
              </p>
            </address>
          </div>
        </div>

        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row">
          <span>© Copyrights 2026 - 2027. Star Audio Video Solutions. All Rights Reserved.</span>
          <span>Cinematic sight &amp; sound.</span>
        </div>
      </div>
    </footer>
  );
}
