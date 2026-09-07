import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "../lib/gsap";
import { COMPANY } from "../data/site";

/**
 * Final CTA + enquiry form (full name, mobile, email, message — all required).
 * No backend: a valid submit opens WhatsApp pre-filled with the enquiry.
 */
export default function Contact() {
  const ref = useRef(null);
  const [errs, setErrs] = useState({});
  const [sent, setSent] = useState(false);

  useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const ctx = gsap.context(() => {
      gsap.from(".contact-line", {
        yPercent: 110, duration: 1, ease: "power4.out", stagger: 0.09,
        scrollTrigger: { trigger: ref.current, start: "top 72%" },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    const f = e.currentTarget;
    const data = {
      name: f.name.value.trim(),
      mobile: f.mobile.value.trim(),
      email: f.email.value.trim(),
      message: f.message.value.trim(),
    };
    const next = {};
    if (!data.name) next.name = "Please enter your full name";
    if (!data.mobile) next.mobile = "Please enter your mobile number";
    if (!data.email) next.email = "Please enter your email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) next.email = "Please enter a valid email";
    if (!data.message) next.message = "Please add a short message";
    setErrs(next);
    if (Object.keys(next).length) {
      const first = f.querySelector(`[name="${Object.keys(next)[0]}"]`);
      first && first.focus();
      return;
    }
    const text =
      `New enquiry — staravs%0A%0AName: ${encodeURIComponent(data.name)}%0A` +
      `Mobile: ${encodeURIComponent(data.mobile)}%0AEmail: ${encodeURIComponent(data.email)}%0A` +
      `Message: ${encodeURIComponent(data.message)}`;
    window.open(`https://wa.me/${COMPANY.whatsapp}?text=${text}`, "_blank");
    setSent(true);
    f.reset();
  };

  const field =
    "w-full rounded-xl border bg-white/[0.05] px-4 py-3 text-white placeholder-white/35 outline-none transition-colors focus:border-white/50 focus:bg-white/[0.07]";

  return (
    <section id="contact" ref={ref} className="relative overflow-hidden bg-[#09090f] px-6 py-[16vh] text-white">
      {/* matte-black ambience — monochrome glow (matches the About section) */}
      <div className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(60% 50% at 18% 22%, rgba(255,255,255,0.05), transparent 60%), radial-gradient(50% 45% at 88% 82%, rgba(255,255,255,0.04), transparent 60%)" }} />

      {/* ambient dark-red wave — decorative only, drifts slowly, not reactive */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <svg className="contact-wave" style={{ top: "38%", filter: "blur(2px)" }}
          viewBox="0 0 1600 200" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 120 C 200 40, 350 40, 550 120 S 950 200, 1150 120 S 1550 40, 1600 120"
            fill="none" stroke="rgba(180,20,20,0.28)" strokeWidth="2" />
          <path d="M-800 120 C -600 40, -450 40, -250 120 S 150 200, 350 120 S 750 40, 800 120"
            fill="none" stroke="rgba(180,20,20,0.28)" strokeWidth="2" />
        </svg>
        <svg className="contact-wave is-slow" style={{ top: "58%", filter: "blur(3px)" }}
          viewBox="0 0 1600 200" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 100 C 220 180, 380 180, 560 100 S 960 20, 1160 100 S 1560 180, 1600 100"
            fill="none" stroke="rgba(120,12,12,0.22)" strokeWidth="3" />
          <path d="M-800 100 C -580 180, -420 180, -240 100 S 160 20, 360 100 S 760 180, 800 100"
            fill="none" stroke="rgba(120,12,12,0.22)" strokeWidth="3" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto grid max-w-[1180px] gap-14 md:grid-cols-2">
        {/* left — CTA + details */}
        <div>
          <p className="mb-6 text-[0.72rem] font-medium uppercase tracking-[0.35em] text-white/55">
            Get in touch
          </p>
          <h2 className="font-display font-light tracking-tightest text-white">
            {["Tell us about", "your room."].map((l, i) => (
              <span key={i} className="block overflow-hidden">
                <span className="contact-line block text-[clamp(2.2rem,6vw,4.2rem)] leading-[1.02]">{l}</span>
              </span>
            ))}
          </h2>
          <p className="mt-6 max-w-md text-white/60">
            Projectors, screens, audio, TVs and complete AV systems — designed,
            installed and calibrated end-to-end.
          </p>
        </div>

        {/* right — matte-black glass enquiry panel (matches About, no hover lift) */}
        <form
          onSubmit={onSubmit}
          noValidate
          className="relative overflow-hidden rounded-[28px] p-6 text-white backdrop-blur-xl md:p-8"
          style={{
            background: "rgba(18,18,22,0.35)",
            border: "1px solid rgba(255,255,255,0.22)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 30px 70px -24px rgba(0,0,0,0.6)",
          }}
        >
          {/* soft top sheen */}
          <span className="pointer-events-none absolute inset-x-0 top-0 h-24"
            style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.08), transparent)" }} />

          <h3 className="relative mb-5 font-display text-xl font-semibold text-white">Enquire</h3>
          <div className="relative space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/70">Full name <span className="text-white/50">*</span></label>
              <input name="name" type="text" required placeholder="Your name" autoComplete="name"
                className={`${field} ${errs.name ? "border-white/60" : "border-white/15"}`} />
              {errs.name && <p className="mt-1 text-xs text-white/55">{errs.name}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/70">Mobile number <span className="text-white/50">*</span></label>
              <input name="mobile" type="tel" required placeholder="+91…" autoComplete="tel"
                className={`${field} ${errs.mobile ? "border-white/60" : "border-white/15"}`} />
              {errs.mobile && <p className="mt-1 text-xs text-white/55">{errs.mobile}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/70">Email ID <span className="text-white/50">*</span></label>
              <input name="email" type="email" required placeholder="you@example.com" autoComplete="email"
                className={`${field} ${errs.email ? "border-white/60" : "border-white/15"}`} />
              {errs.email && <p className="mt-1 text-xs text-white/55">{errs.email}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/70">Message <span className="text-white/50">*</span></label>
              <textarea name="message" required rows={4} placeholder="Tell us about your room, budget and what you'd like…"
                className={`${field} resize-none ${errs.message ? "border-white/60" : "border-white/15"}`} />
              {errs.message && <p className="mt-1 text-xs text-white/55">{errs.message}</p>}
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-white px-6 py-3.5 font-semibold text-[#101012] transition-transform hover:-translate-y-0.5"
              style={{ boxShadow: "0 12px 30px -10px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.6)" }}
            >
              Send enquiry →
            </button>
            {sent && (
              <p className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white/75" role="status">
                Thanks! We've opened WhatsApp with your enquiry — just hit send, or call us directly.
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
