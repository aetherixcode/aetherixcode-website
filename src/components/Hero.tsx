import { useEffect, useRef } from "react";

import Terminal from "./Terminal";

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 20;
      const glow = heroRef.current.querySelector("[data-glow]") as HTMLElement;
      if (glow) glow.style.transform = `translate(${x}px, ${y}px)`;
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <section
      id="home"
      ref={heroRef}
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-bg-primary via-bg-primary to-amber-500/[0.03]" />
        <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-amber-500/[0.02] to-transparent skew-x-[-12deg] origin-top-right" />
      </div>

      {/* Glow orb */}
      <div
        data-glow
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[150px] transition-transform duration-[2000ms] ease-out"
      />

      {/* Decorative lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[25%] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/10 to-transparent" />
        <div className="absolute top-[50%] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/5 to-transparent" />
        <div className="absolute top-[75%] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/10 to-transparent" />
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pt-24 pb-20">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left: Content */}
          <div className="lg:col-span-7">
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[0.9] mb-8">
              <span
                className="block bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent"
                style={{
                  backgroundImage: "linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 0 60px rgba(245,158,11,0.12))",
                }}
              >
                AETHERIX
              </span>
            </h1>

            <div className="max-w-lg mb-10 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              <p className="text-lg md:text-xl text-text-muted font-body leading-relaxed">
                Where curiosity meets mastery. Expert-led courses, real projects, and a community that pushes you beyond limits.
              </p>
            </div>

            <div
              className="flex flex-col sm:flex-row items-start gap-4 animate-fade-in-up"
              style={{ animationDelay: "0.5s" }}
            >
              <a
                href="/register"
                className="group relative px-10 py-4 text-sm font-body font-semibold text-black bg-gradient-to-r from-amber-400 to-amber-600 rounded-full overflow-hidden transition-all duration-300 shadow-xl shadow-amber-600/20 hover:shadow-amber-500/35 hover:scale-[1.02]"
              >
                <span className="relative z-10">Start Learning — Free</span>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-300 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </a>
              <a
                href="/courses"
                className="group flex items-center gap-3 px-6 py-4 text-sm font-body font-medium text-text-muted hover:text-amber-heading transition-colors duration-300"
              >
                Browse Courses
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          </div>

          {/* Right: Terminal */}
          <div className="lg:col-span-5 lg:pl-8 animate-fade-in-up" style={{ animationDelay: "0.7s" }}>
            <Terminal />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in-up" style={{ animationDelay: "0.8s" }}>
        <span className="text-[10px] font-body text-text-placeholder tracking-[0.2em] uppercase">Scroll</span>
        <div className="w-[1px] h-8 bg-gradient-to-b from-amber-500/40 to-transparent relative overflow-hidden">
          <div className="absolute top-0 w-full h-3 bg-amber-400 animate-bounce" style={{ animationDuration: "2s" }} />
        </div>
      </div>
    </section>
  );
}
