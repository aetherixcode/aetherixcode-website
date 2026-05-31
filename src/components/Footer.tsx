import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="relative border-t border-border-footer/50">
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Brand — spans 5 cols */}
          <div className="lg:col-span-5">
            <a href="/" className="flex items-center gap-2.5 mb-5">
              <Logo className="w-7 h-7" />
              <span className="font-heading text-base tracking-[0.2em] text-amber-heading font-semibold">AETHERIX</span>
            </a>
            <p className="text-sm text-text-label font-body leading-relaxed max-w-sm mb-6">
              A next-generation learning platform built for the modern era. Knowledge without limits.
            </p>
            <div className="flex items-center gap-4">
              {["Twitter", "GitHub", "Discord", "YouTube"].map((s) => (
                <a key={s} href="#" className="w-9 h-9 rounded-lg border border-border-subtle flex items-center justify-center text-text-placeholder hover:text-amber-heading hover:border-amber-500/30 transition-all duration-300">
                  <span className="text-[10px] font-body font-bold">{s[0]}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Links — each spans 2 cols */}
          <div className="lg:col-span-2 lg:col-start-7">
            <h4 className="text-[10px] font-body tracking-[0.2em] text-amber-accent/60 uppercase mb-5">
              Platform
            </h4>
            <ul className="space-y-3">
              {["Home", "About", "Features", "Courses"].map((l) => (
                <li key={l}>
                  <a href={`#${l.toLowerCase()}`} className="text-sm text-text-label hover:text-amber-heading transition-colors duration-200 font-body">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-[10px] font-body tracking-[0.2em] text-amber-accent/60 uppercase mb-5">
              Resources
            </h4>
            <ul className="space-y-3">
              {["Blog", "Docs", "Support", "FAQ"].map((l) => (
                <li key={l}>
                  <a href="#" className="text-sm text-text-label hover:text-amber-heading transition-colors duration-200 font-body">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-[10px] font-body tracking-[0.2em] text-amber-accent/60 uppercase mb-5">
              Legal
            </h4>
            <ul className="space-y-3">
              {["Privacy", "Terms", "Cookies"].map((l) => (
                <li key={l}>
                  <a href="#" className="text-sm text-text-label hover:text-amber-heading transition-colors duration-200 font-body">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-border-footer/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-placeholder font-body">
            &copy; {new Date().getFullYear()} Aetherix. All rights reserved.
          </p>
          <p className="text-xs text-text-placeholder font-body">
            Built with passion for learners everywhere.
          </p>
        </div>
      </div>
    </footer>
  );
}
