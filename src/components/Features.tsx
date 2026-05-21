import { useEffect, useRef, useState } from "react";

function useInView(threshold = 0.05) {
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

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <path d="M5 3L19 12L5 21V3Z" fill="currentColor" />
      </svg>
    ),
    title: "Interactive Learning",
    desc: "Engage with dynamic content, quizzes, and hands-on exercises that adapt to your pace.",
    span: "sm:col-span-2 lg:col-span-1",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Real Projects",
    desc: "Build a portfolio of real-world projects that demonstrate your skills to employers.",
    span: "sm:col-span-2 lg:col-span-2",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Expert Mentors",
    desc: "Learn directly from industry veterans who bring years of real-world experience.",
    span: "sm:col-span-2 lg:col-span-1",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Flexible Schedule",
    desc: "Learn at your own pace with on-demand access to all course materials, anytime.",
    span: "sm:col-span-2 lg:col-span-1",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    title: "Global Community",
    desc: "Join a worldwide network of learners and collaborate on projects across time zones.",
    span: "sm:col-span-2 lg:col-span-1",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor" />
      </svg>
    ),
    title: "Certificates",
    desc: "Earn verifiable certificates upon completion to showcase your achievements.",
    span: "sm:col-span-2 lg:col-span-2",
  },
];

export default function Features() {
  const { ref, inView } = useInView(0.05);

  return (
    <section id="features" className="relative py-32 md:py-40 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/[0.01] to-transparent" />

      <div ref={ref} className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section header */}
        <div className={`text-center mb-20 transition-all duration-800 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-6 h-[1px] bg-amber-500/60" />
            <span className="text-[11px] font-body tracking-[0.3em] text-amber-accent/70 uppercase">
              Features
            </span>
            <div className="w-6 h-[1px] bg-amber-500/60" />
          </div>
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-amber-heading">
            WHY AETHERIX
          </h2>
        </div>

        {/* Bento grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`${f.span} group relative p-6 md:p-8 rounded-2xl border border-border-subtle bg-surface-card/50 backdrop-blur-sm transition-all duration-600 hover:border-amber-500/25 hover:shadow-lg hover:shadow-amber-600/5 hover:-translate-y-0.5 ${
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${0.15 + i * 0.08}s` }}
            >
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-heading mb-5 group-hover:bg-amber-500/20 group-hover:scale-110 transition-all duration-300">
                {f.icon}
              </div>
              <h3 className="text-base md:text-lg font-heading font-semibold text-amber-heading mb-2">{f.title}</h3>
              <p className="text-sm text-text-label font-body leading-relaxed">{f.desc}</p>

              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-tr-2xl rounded-bl-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
