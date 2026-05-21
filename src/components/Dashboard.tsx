import type { User } from "@supabase/supabase-js";
import { useEffect, useState, useCallback } from "react";

import { supabase } from "../lib/supabase";

import AdminPanel from "./AdminPanel";
import CourseDetail from "./CourseDetail";
import CoursesPage from "./CoursesPage";
import DashboardHome from "./DashboardHome";
import Settings from "./Settings";

const adminEmails = (import.meta.env.PUBLIC_ADMIN_EMAILS || "").split(",").map((e: string) => e.trim().toLowerCase());

type Page = "home" | "courses" | "course-detail" | "admin" | "settings";

function parseRoute(pathname: string): { page: Page; slug: string } {
  if (pathname.startsWith("/course/")) return { page: "course-detail", slug: pathname.split("/course/")[1]?.split("?")[0] || "" };
  if (pathname === "/courses") return { page: "courses", slug: "" };
  if (pathname === "/admin") return { page: "admin", slug: "" };
  if (pathname === "/settings") return { page: "settings", slug: "" };
  return { page: "home", slug: "" };
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [page, setPage] = useState<Page>("home");
  const [courseSlug, setCourseSlug] = useState("");

  const navigate = useCallback((href: string) => {
    window.history.pushState({}, "", href);
    const { page: p, slug: s } = parseRoute(href);
    setPage(p);
    setCourseSlug(s);
    setMenuOpen(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = "/"; return; }
      setUser(session.user);
      setChecking(false);
    });

    const { page: p, slug: s } = parseRoute(window.location.pathname);
    setPage(p);
    setCourseSlug(s);

    const handleRoute = () => {
      const { page: p2, slug: s2 } = parseRoute(window.location.pathname);
      setPage(p2);
      setCourseSlug(s2);
    };
    window.addEventListener("popstate", handleRoute);
    return () => window.removeEventListener("popstate", handleRoute);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (checking) {
    return <div className="min-h-dvh flex items-center justify-center"><div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" /></div>;
  }

  const isAdmin = user ? adminEmails.includes(user.email?.toLowerCase() ?? "") : false;
  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase() || "U";

  const links = [
    { label: "Home", href: "/dashboard" },
    { label: "Courses", href: "/courses" },
    { label: "Settings", href: "/settings" },
    ...(isAdmin ? [{ label: "Admin Panel", href: "/admin" }] : []),
  ];

  const activeHref = page === "home" ? "/dashboard" : page === "course-detail" ? "/courses" : `/${page}`;
  const pageTitle = page === "home" ? "HOME" : page === "courses" ? "COURSES" : page === "admin" ? "ADMIN" : page === "settings" ? "SETTINGS" : page === "course-detail" ? "COURSE" : "HOME";

  return (
    <div className="min-h-dvh bg-bg-primary">
      <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 sm:px-6 bg-surface-header backdrop-blur-xl border-b border-border-sidebar">
        <button onClick={() => setMenuOpen(!menuOpen)} className="flex flex-col gap-[5px] p-1" aria-label="Menu">
          <span className={`block w-5 h-[1.5px] bg-amber-400 transition-all duration-300 origin-center ${menuOpen ? "rotate-45 translate-y-[6.5px]" : ""}`} />
          <span className={`block w-5 h-[1.5px] bg-amber-400 transition-all duration-300 ${menuOpen ? "opacity-0 scale-0" : ""}`} />
          <span className={`block w-5 h-[1.5px] bg-amber-400 transition-all duration-300 origin-center ${menuOpen ? "-rotate-45 -translate-y-[6.5px]" : ""}`} />
        </button>
        <span className="font-heading text-xs tracking-[0.25em] text-amber-heading/70">{pageTitle}</span>
        <a href="/" className="font-heading text-sm tracking-[0.2em] text-amber-heading">AETHERIX</a>
      </header>

      <div className={`fixed inset-0 z-40 transition-all duration-400 ${menuOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
        <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-400 ${menuOpen ? "opacity-100" : "opacity-0"}`} onClick={() => setMenuOpen(false)} />
        <div className={`absolute top-14 left-0 bottom-0 w-72 bg-surface-sidebar backdrop-blur-xl border-r border-border-sidebar transition-transform duration-400 ease-out flex flex-col ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="px-6 pt-8 pb-6">
            <p className="text-[10px] font-body tracking-[0.2em] text-text-placeholder uppercase mb-1">Welcome</p>
            <p className="font-heading text-lg text-amber-heading">{displayName}</p>
          </div>
          <div className="mx-6 h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
          <nav className="flex-1 px-4 py-4 flex flex-col gap-1">
            {links.map((l) => {
              const isActive = l.href === activeHref;
              return (
                <button key={l.label} onClick={() => navigate(l.href)}
                  className={`px-4 py-3 text-sm font-body rounded-lg transition-all duration-200 text-left ${isActive ? "text-amber-heading bg-amber-500/5" : l.href === "/admin" ? "text-amber-accent/80 hover:text-amber-heading hover:bg-amber-500/5" : "text-text-label hover:text-amber-heading hover:bg-amber-500/5"}`}>
                  {l.label}
                </button>
              );
            })}
          </nav>
          <div className="px-6 pb-6 pt-4 border-t border-border-sidebar">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-sm font-heading font-bold text-black shrink-0">{initials}</div>
              <div className="min-w-0">
                <p className="text-sm font-body text-text-secondary truncate">{displayName}</p>
                <p className="text-[11px] font-body text-text-placeholder truncate">{user?.email}</p>
              </div>
            </div>
            <button onClick={handleSignOut} className="w-full px-4 py-2.5 text-sm font-body text-red-400 hover:text-red-300 hover:bg-red-500/5 rounded-lg transition-all duration-200 text-left">Sign Out</button>
          </div>
        </div>
      </div>

      <main className="pt-14">
        {page === "home" && <DashboardHome />}
        {page === "courses" && <CoursesPage onCourseClick={(slug: string) => navigate(`/course/${slug}`)} />}
        {page === "course-detail" && <CourseDetail slug={courseSlug} onBack={() => navigate("/courses")} />}
        {page === "admin" && isAdmin && <AdminPanel />}
        {page === "settings" && <Settings />}
      </main>
    </div>
  );
}
