import { useState } from "react";

import { supabase } from "../lib/supabase";

import Logo from "./Logo";
import { toastError, toastSuccess } from "./ToastContext";

export default function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirm) { toastError("Passwords do not match"); return; }
    if (password.length < 6) { toastError("Password must be at least 6 characters"); return; }

    setLoading(true);
    const { error: signUpErr } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } },
    });
    setLoading(false);

    if (signUpErr) {
      if (signUpErr.message.includes("already registered")) {
        toastError("An account with this email already exists. Try logging in.");
      } else {
        toastError(signUpErr.message);
      }
      return;
    }

    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signInErr) {
      toastSuccess("Account created! Check your email to confirm, then log in.");
      setTimeout(() => { window.location.href = "/login"; }, 2000);
      return;
    }

    toastSuccess("Account created! Welcome to Aetherix.");
    window.location.href = "/dashboard";
  };

  const handleGoogle = async () => {
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/dashboard" },
    });
    if (err) toastError(err.message);
  };

  return (
    <>
      <div className="lg:hidden text-center mb-5 animate-fade-in-up">
        <a href="/" className="inline-flex items-center gap-2 mb-3 group">
          <Logo className="w-7 h-7" />
          <span className="font-heading text-base tracking-[0.15em] text-amber-heading">AETHERIX</span>
        </a>
        <h1 className="font-heading text-2xl font-bold text-amber-heading mb-1">CREATE ACCOUNT</h1>
        <p className="text-xs text-text-label font-body">Start your learning journey today</p>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <div className="relative rounded-2xl border border-border-default bg-gradient-to-b from-surface-raised to-surface-card p-4 sm:p-6 shadow-[0_0_60px_rgba(245,158,11,0.04)]">
          <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label htmlFor="name" className="block text-[10px] font-body tracking-wider text-text-label mb-1.5 uppercase">Full Name</label>
              <div className="relative">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-placeholder pointer-events-none">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="9" cy="7" r="4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe"
                  className="w-full h-[42px] bg-surface-input border border-border-input rounded-xl pl-9 pr-3 text-sm text-text-secondary font-body placeholder-text-placeholder outline-none transition-all duration-300 focus:border-border-input-focus focus:shadow-[0_0_20px_rgba(245,158,11,0.06)] hover:border-border-input-hover" />
              </div>
            </div>
            <div>
              <label htmlFor="reg-email" className="block text-[10px] font-body tracking-wider text-text-label mb-1.5 uppercase">Email</label>
              <div className="relative">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-placeholder pointer-events-none">
                  <rect x="2" y="4" width="20" height="16" rx="2" strokeWidth="1.5" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" strokeWidth="1.5" />
                </svg>
                <input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required
                  className="w-full h-[42px] bg-surface-input border border-border-input rounded-xl pl-9 pr-3 text-sm text-text-secondary font-body placeholder-text-placeholder outline-none transition-all duration-300 focus:border-border-input-focus focus:shadow-[0_0_20px_rgba(245,158,11,0.06)] hover:border-border-input-hover" />
              </div>
            </div>
            <div>
              <label htmlFor="reg-password" className="block text-[10px] font-body tracking-wider text-text-label mb-1.5 uppercase">Password</label>
              <div className="relative">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-placeholder pointer-events-none">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth="1.5" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input id="reg-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6}
                  className="w-full h-[42px] bg-surface-input border border-border-input rounded-xl pl-9 pr-3 text-sm text-text-secondary font-body placeholder-text-placeholder outline-none transition-all duration-300 focus:border-border-input-focus focus:shadow-[0_0_20px_rgba(245,158,11,0.06)] hover:border-border-input-hover" />
              </div>
            </div>
            <div>
              <label htmlFor="reg-confirm" className="block text-[10px] font-body tracking-wider text-text-label mb-1.5 uppercase">Confirm Password</label>
              <div className="relative">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-placeholder pointer-events-none">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth="1.5" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="m9 12 2 2 4-4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <input id="reg-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" required minLength={6}
                  className="w-full h-[42px] bg-surface-input border border-border-input rounded-xl pl-9 pr-3 text-sm text-text-secondary font-body placeholder-text-placeholder outline-none transition-all duration-300 focus:border-border-input-focus focus:shadow-[0_0_20px_rgba(245,158,11,0.06)] hover:border-border-input-hover" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="relative w-full h-[42px] text-sm font-body font-semibold text-black bg-gradient-to-r from-amber-400 to-amber-600 rounded-xl overflow-hidden transition-all duration-300 shadow-md shadow-amber-600/20 hover:shadow-amber-500/30 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:hover:scale-100">
              <span className="relative z-10">{loading ? "Creating..." : "Create Account"}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-amber-300 to-amber-500 opacity-0 hover:opacity-100 transition-opacity duration-300" />
            </button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-amber-500/8" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-[10px] text-text-placeholder font-body tracking-wider uppercase bg-bg-primary">or</span>
            </div>
          </div>

          <button onClick={handleGoogle}
            className="w-full h-[42px] flex items-center justify-center gap-2.5 text-sm font-body text-text-body border border-border-input rounded-xl hover:bg-amber-500/5 hover:border-amber-500/30 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]">
            <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3-3C17.2 1.3 14.7 0 12 0 7.3 0 3.3 2.7 1.3 6.7l3.5 2.7C5.5 6.5 8.5 5 12 5z" />
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.3-2.3H12v4.5h6.5c-.3 1.5-1.1 2.7-2.4 3.5l3.7 2.9c2.2-2 3.4-5 3.4-8.6z" />
              <path fill="#FBBC05" d="M5.5 14.5c-.4-.9-.6-1.9-.6-2.9s.2-2 .6-2.9l-3.5-2.7C.8 7.9 0 10.1 0 12.5s.8 4.6 2 6.5l3.5-2.7z" />
              <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.3 1.1-4.2 1.1-3.5 0-6.5-2.5-7.5-5.9l-3.5 2.7C3.3 21.3 7.3 24 12 24z" />
            </svg>
            Continue with Google
          </button>

          <p className="mt-4 text-center text-xs text-text-placeholder font-body">
            Already have an account?{" "}
            <a href="/login" className="text-amber-heading hover:text-amber-heading transition-colors font-medium">Log in</a>
          </p>
        </div>
      </div>
    </>
  );
}
