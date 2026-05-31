import { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { supabase } from "../lib/supabase";

import { toastError, toastSuccess } from "./ToastContext";

interface Course {
  id: string; slug: string; name: string; description: string; image_url: string | null;
  difficulty: string; teacher_name: string; prerequisites: string | null; total_lectures: number;
}

export default function CourseDetail({ slug, onBack }: { slug: string; onBack: () => void }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showUnenroll, setShowUnenroll] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const loadCourse = useCallback(async (s: string) => {
    setLoading(true);
    const { data: courseData } = await supabase.from("courses").select("*").eq("slug", s).eq("is_published", true).single();
    if (!courseData) { onBack(); return; }
    setCourse(courseData as Course);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from("enrollments").select("id").eq("user_id", user.id).eq("course_id", courseData.id).single();
      setEnrolled(!!data);
    }
    setLoading(false);
  }, [onBack]);

  useEffect(() => {
    if (!slug) { onBack(); return; }
    loadCourse(slug);
  }, [slug, loadCourse, onBack]);

  const handleEnroll = async () => {
    if (!course) return;
    setActionLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login"; return; }
    const { error: err } = await supabase.from("enrollments").insert({ user_id: user.id, course_id: course.id });
    setActionLoading(false);
    if (err) {
      if (err.message.includes("duplicate")) {
        toastError("You are already enrolled in this course.");
      } else {
        toastError(err.message);
      }
    } else {
      setEnrolled(true);
      toastSuccess(`Enrolled in "${course.name}"! Start learning now.`);
    }
  };

  const handleUnenroll = async () => {
    if (confirmText.toLowerCase() !== "yes" || !course) return;
    setActionLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: enrollment } = await supabase.from("enrollments").select("id").eq("user_id", user.id).eq("course_id", course.id).single();
    if (enrollment) {
      await supabase.from("lecture_progress").delete().eq("user_id", user.id);
      await supabase.from("enrollments").delete().eq("id", enrollment.id);
    }
    setEnrolled(false);
    setShowUnenroll(false);
    setConfirmText("");
    setActionLoading(false);
    toastSuccess(`Unenrolled from "${course.name}". Progress has been cleared.`);
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" /></div>;
  if (!course) return null;

  const diffColors: Record<string, string> = { beginner: "text-green-400 border-green-500/30", intermediate: "text-amber-heading border-amber-500/30", advanced: "text-red-400 border-red-500/30" };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-text-label hover:text-amber-heading transition-colors font-body mb-6">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4"><path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        Back to Courses
      </button>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-video rounded-xl overflow-hidden border border-border-default bg-surface-image">
          {course.image_url ? <img src={course.image_url} alt={course.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-text-disabled"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-16 h-16"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeWidth="1.5" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeWidth="1.5" /></svg></div>}
        </div>

        <div>
          <h1 className="font-heading text-2xl sm:text-3xl text-amber-heading mb-3">{course.name}</h1>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`text-[10px] font-body tracking-wider uppercase border px-2 py-0.5 rounded ${diffColors[course.difficulty]}`}>{course.difficulty}</span>
            <span className="text-[10px] font-body text-text-placeholder border border-border-strong-zinc px-2 py-0.5 rounded">{course.total_lectures} lectures</span>
          </div>
          <p className="text-sm text-text-muted font-body mb-2">By {course.teacher_name}</p>
          {course.prerequisites && <p className="text-xs text-text-placeholder font-body mb-6">Requires: {course.prerequisites}</p>}

          <div className="flex gap-3">
            {enrolled ? (
              <>
                <button onClick={() => { window.history.pushState({}, "", "/dashboard"); window.dispatchEvent(new PopStateEvent("popstate")); }} className="flex-1 py-3 text-sm font-body font-semibold text-black bg-gradient-to-r from-amber-400 to-amber-600 rounded-xl hover:from-amber-300 hover:to-amber-500 transition-all shadow-lg shadow-amber-600/20">Continue Learning</button>
                <button onClick={() => setShowUnenroll(true)} className="px-4 py-3 text-sm font-body text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/10 transition-all">Unenroll</button>
              </>
            ) : (
              <button onClick={handleEnroll} disabled={actionLoading} className="flex-1 py-3 text-sm font-body font-semibold text-black bg-gradient-to-r from-amber-400 to-amber-600 rounded-xl hover:from-amber-300 hover:to-amber-500 transition-all shadow-lg shadow-amber-600/20 disabled:opacity-60">
                {actionLoading ? "Enrolling..." : "Enroll Now"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-heading text-lg text-amber-heading mb-4">About This Course</h2>
        <div className="prose prose-sm max-w-none text-text-body font-body leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{course.description}</ReactMarkdown>
        </div>
      </div>

      {showUnenroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-overlay backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border-destructive bg-bg-modal p-8">
            <h3 className="font-heading text-xl text-red-400 mb-3">Confirm Unenroll</h3>
            <p className="text-sm text-text-label font-body mb-6">Type <span className="text-red-400 font-mono">yes</span> to unenroll from <span className="text-text-secondary">{course.name}</span>.</p>
            <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="Type yes" className="w-full bg-surface-input border border-border-destructive rounded-lg px-4 py-3 text-sm text-text-secondary font-body outline-none focus:border-border-destructive-focus mb-6" />
            <div className="flex gap-4">
              <button onClick={() => { setShowUnenroll(false); setConfirmText(""); }} className="flex-1 py-3 text-sm font-body text-text-muted border border-border-strong-zinc rounded-lg hover:bg-surface-card-hover transition-all">Cancel</button>
              <button onClick={handleUnenroll} disabled={confirmText.toLowerCase() !== "yes" || actionLoading} className="flex-1 py-3 text-sm font-body text-black bg-red-500 rounded-lg disabled:opacity-30 hover:bg-red-400 transition-all">{actionLoading ? "Unenrolling..." : "Unenroll"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
