import { useEffect, useRef, useState } from "react";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

const pillars = [
  {
    number: "01",
    title: "Expert-Led",
    desc: "Courses crafted by industry professionals with real-world experience and a passion for teaching.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Hands-On",
    desc: "Project-based curriculum that puts theory into practice with real-world applications.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Cutting-Edge",
    desc: "Stay ahead with the latest technologies, frameworks, and industry methodologies.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function About() {
  const { ref, inView } = useInView();

  return (
    <section id="about" className="relative py-32 md:py-40 overflow-hidden">
      {/* Subtle gradient band */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/[0.015] to-transparent" />

      <div ref={ref} className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section header — editorial style */}
        <div className={`grid md:grid-cols-12 gap-8 md:gap-12 mb-24 transition-all duration-800 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <div className="md:col-span-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-[1px] bg-amber-500/60" />
              <span className="text-[11px] font-body tracking-[0.3em] text-amber-accent/70 uppercase">
                About
              </span>
            </div>
            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-amber-heading leading-[1.05]">
              REDEFINE<br />LEARNING
            </h2>
          </div>
          <div className="md:col-span-8 md:pt-4">
            <p className="text-lg md:text-xl text-text-muted font-body leading-relaxed max-w-2xl">
              Aetherix is a next-generation learning platform built for the modern era. We believe knowledge should be limitless, accessible, and deeply engaging. Our courses are crafted by industry experts and designed to push the boundaries of what&apos;s possible.
            </p>
            <div className="mt-8 flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-xs font-body text-text-label">Industry Experts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-xs font-body text-text-label">Project-Based</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-xs font-body text-text-label">Self-Paced</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pillars — horizontal cards with accent line */}
        <div className="space-y-4">
          {pillars.map((p, i) => (
            <div
              key={p.title}
              className={`group relative p-6 md:p-8 rounded-2xl border border-border-subtle bg-gradient-to-r from-surface-card to-transparent transition-all duration-700 hover:border-amber-500/25 hover:shadow-lg hover:shadow-amber-600/5 ${
                inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
              }`}
              style={{ transitionDelay: `${0.3 + i * 0.15}s` }}
            >
              <div className="flex items-start gap-6">
                <div className="hidden sm:flex w-12 h-12 rounded-xl bg-amber-500/10 items-center justify-center text-amber-heading shrink-0 group-hover:bg-amber-500/20 group-hover:scale-110 transition-all duration-300">
                  {p.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-3xl font-heading font-bold text-amber-accent/10 group-hover:text-amber-accent/20 transition-colors duration-300">
                      {p.number}
                    </span>
                    <h3 className="text-lg font-heading font-semibold text-amber-heading">{p.title}</h3>
                  </div>
                  <p className="text-sm text-text-label font-body leading-relaxed max-w-2xl">{p.desc}</p>
                </div>
              </div>
              {/* Hover accent line */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0 h-2/3 bg-gradient-to-b from-amber-500/40 to-amber-500/0 rounded-r-full group-hover:w-[2px] transition-all duration-500" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
