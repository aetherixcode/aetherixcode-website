import { useEffect, useState } from "react";
import Logo from "./Logo";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Home", href: "#home" },
    { label: "About", href: "#about" },
    { label: "Features", href: "#features" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-surface-nav/80 backdrop-blur-2xl border-b border-border-header/50"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 group">
          <Logo className="w-7 h-7 md:w-8 md:h-8" />
          <span className="font-heading text-base md:text-lg tracking-[0.2em] text-amber-heading font-semibold">
            AETHERIX
          </span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-10">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-text-muted hover:text-amber-heading transition-colors duration-300 font-body tracking-wide relative group"
            >
              {l.label}
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-amber-500 group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="/login"
            className="px-5 py-2 text-sm font-body text-text-muted hover:text-amber-heading transition-colors duration-300"
          >
            Login
          </a>
          <a
            href="/register"
            className="px-5 py-2 text-sm font-body text-black bg-gradient-to-r from-amber-400 to-amber-600 rounded-full hover:from-amber-300 hover:to-amber-500 transition-all duration-300 shadow-lg shadow-amber-600/15 hover:shadow-amber-500/25"
          >
            Get Started
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden flex flex-col gap-1.5 p-2"
          aria-label="Menu"
        >
          <span className={`block w-5 h-[1.5px] bg-amber-400 transition-all duration-300 ${mobileOpen ? "rotate-45 translate-y-[3.5px]" : ""}`} />
          <span className={`block w-5 h-[1.5px] bg-amber-400 transition-all duration-300 ${mobileOpen ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-[1.5px] bg-amber-400 transition-all duration-300 ${mobileOpen ? "-rotate-45 -translate-y-[3.5px]" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-400 ${
          mobileOpen ? "max-h-72 border-t border-border-mobile/50 bg-surface-mobile/95 backdrop-blur-2xl" : "max-h-0"
        }`}
      >
        <div className="px-6 py-5 flex flex-col gap-5">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="text-sm text-text-muted hover:text-amber-heading transition-colors font-body"
            >
              {l.label}
            </a>
          ))}
          <div className="flex gap-3 pt-2 border-t border-border-divider">
            <a href="/login" className="flex-1 text-sm text-text-muted font-body py-2.5 text-center">
              Login
            </a>
            <a href="/register" className="flex-1 text-sm font-body text-black bg-gradient-to-r from-amber-400 to-amber-600 rounded-full py-2.5 text-center shadow-md shadow-amber-600/15">
              Get Started
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
