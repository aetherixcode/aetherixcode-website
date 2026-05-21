import { useEffect, useState } from "react";

import { supabase } from "../lib/supabase";

interface Course {
  id: string;
  slug: string;
  name: string;
  image_url: string | null;
  difficulty: string;
  teacher_name: string;
  prerequisites: string | null;
  total_lectures: number;
}

export default function CoursesPage({ onCourseClick }: { onCourseClick: (slug: string) => void }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.from("courses").select("*").eq("is_published", true).order("created_at", { ascending: false }).then(({ data, error }) => {
      if (error) { setError(error.message); }
      setCourses(data as Course[] || []);
      setLoading(false);
    });
  }, []);

  const filtered = courses.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.teacher_name.toLowerCase().includes(search.toLowerCase()) ||
    c.difficulty.toLowerCase().includes(search.toLowerCase())
  );

  const diffColors: Record<string, string> = {
    beginner: "text-green-400 border-green-500/30",
    intermediate: "text-amber-heading border-amber-500/30",
    advanced: "text-red-400 border-red-500/30",
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <h1 className="font-heading text-2xl sm:text-3xl text-amber-heading mb-6">COURSES</h1>

      <div className="relative mb-8">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-placeholder">
          <circle cx="11" cy="11" r="8" strokeWidth="1.5" /><path d="m21 21-4.35-4.35" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses, teachers..."
          className="w-full bg-surface-input border border-border-input rounded-xl pl-10 pr-4 py-3 text-sm text-text-secondary font-body placeholder-text-placeholder outline-none focus:border-border-input-focus transition-all duration-300" />
      </div>

      {error && <p className="text-sm text-red-400 font-body mb-4">{error}</p>}

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-text-placeholder font-body py-12">No courses found.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(c => (
            <button key={c.id} onClick={() => onCourseClick(c.slug)} className="group block w-full text-left rounded-xl border border-border-subtle bg-gradient-to-b from-surface-raised to-transparent hover:border-amber-500/25 transition-all duration-300 overflow-hidden">
              <div className="aspect-video bg-surface-image overflow-hidden">
                {c.image_url ? (
                  <img src={c.image_url} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-disabled">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-12 h-12"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeWidth="1.5" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeWidth="1.5" /></svg>
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-heading text-base text-amber-heading mb-2 group-hover:text-amber-heading transition-colors">{c.name}</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`text-[10px] font-body tracking-wider uppercase border px-2 py-0.5 rounded ${diffColors[c.difficulty] || "text-text-muted border-border-strong-zinc"}`}>{c.difficulty}</span>
                  <span className="text-[10px] font-body text-text-placeholder border border-border-strong-zinc px-2 py-0.5 rounded">{c.total_lectures} lectures</span>
                </div>
                <p className="text-xs text-text-label font-body">By {c.teacher_name}</p>
                {c.prerequisites && <p className="text-[11px] text-text-placeholder font-body mt-1">Requires: {c.prerequisites}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
