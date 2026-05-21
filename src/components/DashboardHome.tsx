import { useEffect, useState, useCallback, useRef } from "react";

import { getDrivePreviewUrl, getDriveDownloadUrl } from "../lib/gdrive-utils";
import { supabase } from "../lib/supabase";

import { toastError, toastSuccess, toastInfo } from "./ToastContext";
import VideoPlayer from "./VideoPlayer";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getLastLecture(courseId: string): string | null {
  try { return localStorage.getItem(`aetherix_last_lecture_${courseId}`); } catch { return null; }
}

function setLastLecture(courseId: string, lectureId: string) {
  try { localStorage.setItem(`aetherix_last_lecture_${courseId}`, lectureId); } catch { /* storage full */ }
}

interface Enrollment {
  id: string;
  course: { id: string; name: string; slug: string; total_lectures: number; image_url: string | null };
}

interface Lecture {
  id: string;
  lecture_number: number;
  title: string;
  video_url: string;
  notes_url: string | null;
  dpp_url: string | null;
  dpp_solution_url: string | null;
  quiz_url: string | null;
}

interface QuizData {
  questions: { question: string; options: string[]; answer: number }[];
}

interface VideoTimestamp {
  watched: number;
  duration: number;
}

export default function DashboardHome() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selected, setSelected] = useState<Enrollment | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [activeLecture, setActiveLecture] = useState<Lecture | null>(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showUnenroll, setShowUnenroll] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [unenrollLoading, setUnenrollLoading] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [videoTimestamps, setVideoTimestamps] = useState<Record<string, { watched: number; duration: number }>>({});

  const userIdRef = useRef(userId);
  userIdRef.current = userId;
  const activeLectureRef = useRef(activeLecture);
  activeLectureRef.current = activeLecture;
  const completedIdsRef = useRef(completedIds);
  completedIdsRef.current = completedIds;
  const lecturesRef = useRef(lectures);
  lecturesRef.current = lectures;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  const recalcProgress = useCallback((completed: Set<string>, total: number) => {
    if (total > 0) setProgress(Math.round((completed.size / total) * 100));
  }, []);

  const loadEnrollments = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    const { data, error } = await supabase
      .from("enrollments")
      .select("id, course:courses(id, name, slug, total_lectures, image_url)")
      .eq("user_id", user.id)
      .order("last_accessed_at", { ascending: false });
    if (error) return;
    setEnrollments(data as Enrollment[] || []);
    if (data && data.length > 0) setSelected(data[0] as Enrollment);
    setLoading(false);
  }, []);

  useEffect(() => { loadEnrollments(); }, [loadEnrollments]);

  useEffect(() => {
    if (!selected || !userId) return;
    (async () => {
      const { data } = await supabase.from("lectures").select("*").eq("course_id", selected.course.id).order("lecture_number");
      const lectureList = data as Lecture[] || [];
      setLectures(lectureList);

      const lastId = getLastLecture(selected.course.id);
      const lastLecture = lectureList.find(l => l.id === lastId);
      if (lastLecture) {
        setActiveLecture(lastLecture);
      } else if (lectureList.length > 0) {
        setActiveLecture(lectureList[0]);
      } else {
        setActiveLecture(null);
      }

      const { data: completed } = await supabase.from("lecture_progress").select("lecture_id").eq("user_id", userId);
      const completedSet = new Set((completed || []).map((c: { lecture_id: string }) => c.lecture_id));
      setCompletedIds(completedSet);

      const { data: timestamps } = await supabase.from("video_progress").select("lecture_id, watched_seconds, total_duration").eq("user_id", userId);
      const tsMap: Record<string, VideoTimestamp> = {};
      (timestamps || []).forEach((t: { lecture_id: string; watched_seconds: number; total_duration: number }) => {
        tsMap[t.lecture_id] = { watched: t.watched_seconds, duration: t.total_duration };
      });
      setVideoTimestamps(tsMap);

      recalcProgress(completedSet, lectureList.length);
    })();
  }, [selected, userId, recalcProgress]);

  useEffect(() => {
    if (activeLecture && selected) {
      setLastLecture(selected.course.id, activeLecture.id);
    }
  }, [activeLecture, selected]);

  const handleVideoProgress = useCallback(async (seconds: number, duration: number) => {
    const uid = userIdRef.current;
    const lec = activeLectureRef.current;
    if (!uid || !lec) return;

    try {
      const { error } = await supabase.from("video_progress").upsert(
        { user_id: uid, lecture_id: lec.id, watched_seconds: seconds, total_duration: duration },
        { onConflict: "user_id,lecture_id" }
      );
      if (error) return;
      setVideoTimestamps(prev => ({ ...prev, [lec.id]: { watched: seconds, duration } }));
    } catch { /* network error */ }
  }, []);

  const advanceNext = useCallback(() => {
    const lec = activeLectureRef.current;
    const list = lecturesRef.current;
    if (!lec) return;
    const idx = list.findIndex(l => l.id === lec.id);
    if (idx >= 0 && idx < list.length - 1) {
      setActiveLecture(list[idx + 1]);
    }
  }, []);

  const handleVideoComplete = useCallback(async () => {
    const uid = userIdRef.current;
    const lec = activeLectureRef.current;
    if (!uid || !lec) return;
    if (completedIdsRef.current.has(lec.id)) {
      advanceNext();
      return;
    }

    const { error } = await supabase.from("lecture_progress").insert({ user_id: uid, lecture_id: lec.id });
    if (error) return;

    const newSet = new Set(completedIdsRef.current);
    newSet.add(lec.id);
    setCompletedIds(newSet);
    recalcProgress(newSet, lecturesRef.current.length);
    advanceNext();
  }, [advanceNext, recalcProgress]);

  const toggleComplete = useCallback(async (lectureId: string) => {
    const uid = userIdRef.current;
    if (!uid) return;
    const isCompleted = completedIdsRef.current.has(lectureId);
    if (isCompleted) {
      await supabase.from("lecture_progress").delete().eq("user_id", uid).eq("lecture_id", lectureId);
      const newSet = new Set(completedIdsRef.current);
      newSet.delete(lectureId);
      setCompletedIds(newSet);
      recalcProgress(newSet, lecturesRef.current.length);
    } else {
      const { error } = await supabase.from("lecture_progress").insert({ user_id: uid, lecture_id: lectureId });
      if (error) return;
      const newSet = new Set(completedIdsRef.current);
      newSet.add(lectureId);
      setCompletedIds(newSet);
      recalcProgress(newSet, lecturesRef.current.length);
    }
  }, [recalcProgress]);

  const clearLectureProgress = useCallback(async (lectureId: string) => {
    const uid = userIdRef.current;
    if (!uid) return;
    await supabase.from("lecture_progress").delete().eq("user_id", uid).eq("lecture_id", lectureId);
    await supabase.from("video_progress").delete().eq("user_id", uid).eq("lecture_id", lectureId);
    const newSet = new Set(completedIdsRef.current);
    newSet.delete(lectureId);
    setCompletedIds(newSet);
    setVideoTimestamps(prev => { const n = { ...prev }; delete n[lectureId]; return n; });
    recalcProgress(newSet, lecturesRef.current.length);
    toastInfo("Progress reset for this lecture.");
  }, [recalcProgress]);

  const handleUnenroll = async () => {
    if (confirmText.toLowerCase() !== "yes" || !selected) return;
    setUnenrollLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const lectureIds = lectures.map(l => l.id);
    if (lectureIds.length > 0) {
      await supabase.from("lecture_progress").delete().eq("user_id", user.id).in("lecture_id", lectureIds);
      await supabase.from("video_progress").delete().eq("user_id", user.id).in("lecture_id", lectureIds);
    }
    await supabase.from("enrollments").delete().eq("id", selected.id);
    setShowUnenroll(false);
    setConfirmText("");
    setUnenrollLoading(false);
    toastSuccess(`Unenrolled from "${selected.course.name}". All progress cleared.`);
    loadEnrollments();
  };

  const loadQuiz = async (url: string) => {
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.questions && Array.isArray(data.questions)) {
        setQuizData(data);
        setQuizAnswers({});
        setQuizSubmitted(false);
        setShowQuiz(true);
      }
    } catch {
      toastError("Failed to load quiz. Please try again later.");
    }
  };

  const handleQuizSubmit = () => {
    setQuizSubmitted(true);
    const score = quizData ? quizData.questions.filter((q, i) => quizAnswers[i] === q.answer).length : 0;
    const total = quizData?.questions.length || 0;
    const pct = Math.round((score / total) * 100);
    if (pct >= 80) {
      toastSuccess(`Great job! You scored ${score}/${total} (${pct}%)!`);
    } else if (pct >= 50) {
      toastInfo(`You scored ${score}/${total} (${pct}%). Keep practicing!`);
    } else {
      toastError(`You scored ${score}/${total} (${pct}%). Review the material and try again.`);
    }
  };

  const [activeResource, setActiveResource] = useState<"notes" | "dpp" | "dpp_solution" | null>(null);
  const quizScore = quizData ? quizData.questions.filter((q, i) => quizAnswers[i] === q.answer).length : 0;

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" /></div>;

  if (enrollments.length === 0) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="text-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-16 h-16 mx-auto mb-6 text-amber-accent/30">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h2 className="font-heading text-2xl text-amber-heading mb-2">No Courses Enrolled</h2>
          <p className="text-sm text-text-label font-body mb-6">Start your learning journey by enrolling in a course.</p>
          <button onClick={() => { window.history.pushState({}, "", "/courses"); window.dispatchEvent(new PopStateEvent("popstate")); }} className="inline-flex items-center gap-2 px-6 py-3 text-sm font-body font-semibold text-black bg-gradient-to-r from-amber-400 to-amber-600 rounded-xl hover:from-amber-300 hover:to-amber-500 transition-all duration-300 shadow-lg shadow-amber-600/20">
            Browse Courses
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4"><path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 p-4 rounded-xl border border-border-default bg-surface-card">
        <div className="flex-1 w-full sm:w-auto">
          <label className="text-[10px] font-body tracking-wider text-text-label uppercase mb-1 block">Current Course</label>
          <select value={selected?.id || ""} onChange={(e) => { const found = enrollments.find(en => en.id === e.target.value); if (found) setSelected(found); }}
            className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-sm text-text-secondary font-body outline-none focus:border-border-medium">
            {enrollments.map(en => <option key={en.id} value={en.id}>{en.course.name}</option>)}
          </select>
        </div>
        <div className="flex-1 w-full sm:w-auto">
          <label className="text-[10px] font-body tracking-wider text-text-label uppercase mb-1 block">Progress</label>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs font-body text-amber-heading min-w-[40px] text-right">{progress}%</span>
          </div>
        </div>
        <button onClick={() => setShowUnenroll(true)} className="px-4 py-2 text-xs font-body text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-all duration-200 self-end">
          Unenroll
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <h3 className="font-heading text-sm text-amber-heading mb-3 tracking-wider">LECTURES</h3>
          <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-2">
            {lectures.map((lec) => {
              const isDone = completedIds.has(lec.id);
              const isActive = activeLecture?.id === lec.id;
              const ts = videoTimestamps[lec.id];
              const hasTimestamp = ts && ts.watched > 10 && ts.watched < (ts.duration - 10);
              return (
                <div key={lec.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${isActive ? "bg-amber-500/10 border border-amber-500/20" : "hover:bg-surface-card-hover border border-transparent"}`}>
                  <button onClick={() => setActiveLecture(lec)} className="flex-1 flex items-center gap-3 text-left min-w-0">
                    <span className="text-xs font-heading text-amber-accent/60 w-8 shrink-0">{lec.lecture_number}</span>
                    <div className="min-w-0">
                      <span className={`text-sm font-body truncate block ${isDone ? "text-amber-heading/60 line-through" : "text-text-body"}`}>{lec.title}</span>
                      {hasTimestamp && !isDone && <span className="text-[10px] font-body text-amber-accent/50">Resume from {formatTime(ts.watched)}</span>}
                    </div>
                  </button>
                  <button onClick={() => clearLectureProgress(lec.id)} title="Reset progress"
                    className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-text-placeholder hover:text-red-400 hover:bg-red-500/10 transition-all duration-200">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3.5 h-3.5"><path d="M3 12a9 9 0 1 1 3 6.75" strokeWidth="2" strokeLinecap="round" /><path d="M3 21v-6h6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                  <button onClick={() => toggleComplete(lec.id)}
                    className={`shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-all duration-200 ${isDone ? "bg-amber-500/20 text-amber-heading" : "bg-zinc-800/50 text-text-placeholder hover:text-amber-heading hover:bg-zinc-800"}`}>
                    {isDone ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4"><path d="M20 6L9 17l-5-5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4"><circle cx="12" cy="12" r="9" strokeWidth="1.5" /></svg>
                    )}
                  </button>
                </div>
              );
            })}
            {lectures.length === 0 && <p className="text-sm text-text-placeholder font-body py-8 text-center">No lectures yet.</p>}
          </div>
        </div>

        <div className="lg:col-span-2">
          {activeLecture ? (
            <>
              <VideoPlayer
                key={activeLecture.id}
                videoUrl={activeLecture.video_url}
                lectureId={activeLecture.id}
                userId={userId}
                savedTime={videoTimestamps[activeLecture.id]?.watched || 0}
                onComplete={handleVideoComplete}
                onProgress={handleVideoProgress}
              />
              <div className="flex items-start justify-between gap-4 mt-4 mb-1">
                <div>
                  <h3 className="font-heading text-lg text-amber-heading">{activeLecture.title}</h3>
                  <p className="text-xs text-text-label font-body">Lecture {activeLecture.lecture_number}</p>
                </div>
                <button onClick={() => toggleComplete(activeLecture.id)}
                  className={`shrink-0 flex items-center gap-2 px-4 py-2 text-xs font-body font-semibold rounded-lg transition-all duration-200 ${completedIds.has(activeLecture.id) ? "bg-amber-500/20 text-amber-heading border border-amber-500/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30" : "bg-zinc-800 text-text-muted border border-border-strong-zinc hover:bg-amber-500/10 hover:text-amber-heading hover:border-amber-500/30"}`}>
                  {completedIds.has(activeLecture.id) ? (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4"><path d="M20 6L9 17l-5-5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      Completed
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4"><path d="M20 6L9 17l-5-5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      Mark Complete
                    </>
                  )}
                </button>
              </div>
              <div className="mt-6 space-y-3">
                {activeLecture.notes_url && (
                  <div className="rounded-xl border border-border-subtle bg-surface-card overflow-hidden">
                    <button onClick={() => setActiveResource(activeResource === "notes" ? null : "notes")} className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-card-hover transition-all">
                      <div className="flex items-center gap-3">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 text-amber-accent/70"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><polyline points="14 2 14 8 20 8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><line x1="16" y1="13" x2="8" y2="13" strokeWidth="1.5" strokeLinecap="round" /><line x1="16" y1="17" x2="8" y2="17" strokeWidth="1.5" strokeLinecap="round" /></svg>
                        <span className="text-sm font-body text-text-secondary">Notes</span>
                      </div>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={`w-4 h-4 text-text-placeholder transition-transform duration-200 ${activeResource === "notes" ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    {activeResource === "notes" && (
                      <div className="border-t border-border-subtle">
                        <iframe src={getDrivePreviewUrl(activeLecture.notes_url)!} className="w-full h-[500px]" title="Notes" allow="fullscreen" sandbox="allow-scripts allow-same-origin allow-popups" />
                        <div className="flex justify-end p-3 border-t border-border-subtle">
                          <a href={getDriveDownloadUrl(activeLecture.notes_url)!} target="_blank" rel="noopener" className="flex items-center gap-2 px-4 py-2 text-xs font-body text-amber-heading border border-amber-500/30 rounded-lg hover:bg-amber-500/10 transition-all">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><polyline points="7 10 12 15 17 10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><line x1="12" y1="15" x2="12" y2="3" strokeWidth="2" strokeLinecap="round" /></svg>
                            Download
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {activeLecture.dpp_url && (
                  <div className="rounded-xl border border-border-subtle bg-surface-card overflow-hidden">
                    <button onClick={() => setActiveResource(activeResource === "dpp" ? null : "dpp")} className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-card-hover transition-all">
                      <div className="flex items-center gap-3">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 text-amber-accent/70"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><polyline points="14 2 14 8 20 8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><line x1="16" y1="13" x2="8" y2="13" strokeWidth="1.5" strokeLinecap="round" /><line x1="16" y1="17" x2="8" y2="17" strokeWidth="1.5" strokeLinecap="round" /></svg>
                        <span className="text-sm font-body text-text-secondary">DPP Problem</span>
                      </div>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={`w-4 h-4 text-text-placeholder transition-transform duration-200 ${activeResource === "dpp" ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    {activeResource === "dpp" && (
                      <div className="border-t border-border-subtle">
                        <iframe src={getDrivePreviewUrl(activeLecture.dpp_url)!} className="w-full h-[500px]" title="DPP Problem" allow="fullscreen" sandbox="allow-scripts allow-same-origin allow-popups" />
                        <div className="flex justify-end p-3 border-t border-border-subtle">
                          <a href={getDriveDownloadUrl(activeLecture.dpp_url)!} target="_blank" rel="noopener" className="flex items-center gap-2 px-4 py-2 text-xs font-body text-amber-heading border border-amber-500/30 rounded-lg hover:bg-amber-500/10 transition-all">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><polyline points="7 10 12 15 17 10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><line x1="12" y1="15" x2="12" y2="3" strokeWidth="2" strokeLinecap="round" /></svg>
                            Download
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {activeLecture.dpp_solution_url && (
                  <div className="rounded-xl border border-border-subtle bg-surface-card overflow-hidden">
                    <button onClick={() => setActiveResource(activeResource === "dpp_solution" ? null : "dpp_solution")} className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-card-hover transition-all">
                      <div className="flex items-center gap-3">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 text-amber-accent/70"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><polyline points="14 2 14 8 20 8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><line x1="16" y1="13" x2="8" y2="13" strokeWidth="1.5" strokeLinecap="round" /><line x1="16" y1="17" x2="8" y2="17" strokeWidth="1.5" strokeLinecap="round" /></svg>
                        <span className="text-sm font-body text-text-secondary">DPP Solution</span>
                      </div>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={`w-4 h-4 text-text-placeholder transition-transform duration-200 ${activeResource === "dpp_solution" ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    {activeResource === "dpp_solution" && (
                      <div className="border-t border-border-subtle">
                        <iframe src={getDrivePreviewUrl(activeLecture.dpp_solution_url)!} className="w-full h-[500px]" title="DPP Solution" allow="fullscreen" sandbox="allow-scripts allow-same-origin allow-popups" />
                        <div className="flex justify-end p-3 border-t border-border-subtle">
                          <a href={getDriveDownloadUrl(activeLecture.dpp_solution_url)!} target="_blank" rel="noopener" className="flex items-center gap-2 px-4 py-2 text-xs font-body text-amber-heading border border-amber-500/30 rounded-lg hover:bg-amber-500/10 transition-all">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><polyline points="7 10 12 15 17 10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><line x1="12" y1="15" x2="12" y2="3" strokeWidth="2" strokeLinecap="round" /></svg>
                            Download
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {activeLecture.quiz_url && (
                  <button onClick={() => loadQuiz(activeLecture.quiz_url!)} className="w-full flex items-center justify-between px-5 py-4 rounded-xl border border-border-subtle bg-surface-card hover:bg-surface-card-hover transition-all">
                    <div className="flex items-center gap-3">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 text-amber-accent/70"><circle cx="12" cy="12" r="10" strokeWidth="1.5" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      <span className="text-sm font-body text-text-secondary">Take Quiz</span>
                    </div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4 text-amber-accent/50"><path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="aspect-video rounded-xl border border-border-default bg-surface-input flex items-center justify-center">
              <p className="text-sm text-text-placeholder font-body">Select a lecture to begin</p>
            </div>
          )}
        </div>
      </div>

      {showUnenroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-overlay backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border-destructive bg-bg-modal p-8">
            <h3 className="font-heading text-xl text-red-400 mb-3">Confirm Unenroll</h3>
            <p className="text-sm text-text-label font-body mb-6">Type <span className="text-red-400 font-mono">yes</span> to unenroll from <span className="text-text-secondary">{selected?.course.name}</span>. This will remove all progress.</p>
            <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="Type yes" className="w-full bg-surface-input border border-border-destructive rounded-lg px-4 py-3 text-sm text-text-secondary font-body outline-none focus:border-border-destructive-focus mb-6" />
            <div className="flex gap-4">
              <button onClick={() => { setShowUnenroll(false); setConfirmText(""); }} className="flex-1 py-3 text-sm font-body text-text-muted border border-border-strong-zinc rounded-lg hover:bg-zinc-800 transition-all">Cancel</button>
              <button onClick={handleUnenroll} disabled={confirmText.toLowerCase() !== "yes" || unenrollLoading} className="flex-1 py-3 text-sm font-body text-black bg-red-500 rounded-lg disabled:opacity-30 hover:bg-red-400 transition-all">{unenrollLoading ? "Unenrolling..." : "Unenroll"}</button>
            </div>
          </div>
        </div>
      )}

      {showQuiz && quizData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-overlay backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-border-medium bg-bg-modal p-8 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-heading text-xl text-amber-heading">Quiz</h3>
              <button onClick={() => setShowQuiz(false)} className="text-text-label hover:text-text-body text-xl">&times;</button>
            </div>
            {quizData.questions.map((q, qi) => (
              <div key={qi} className="mb-8 pb-8 border-b border-border-divider last:border-0">
                <p className="text-base font-body text-text-secondary mb-4"><span className="text-amber-accent/60 font-heading">{qi + 1}.</span> {q.question}</p>
                <div className="space-y-3">
                  {q.options.map((opt: string, oi: number) => (
                    <button key={oi} disabled={quizSubmitted} onClick={() => setQuizAnswers(prev => ({ ...prev, [qi]: oi }))}
                      className={`w-full text-left px-5 py-3.5 text-sm font-body rounded-lg border transition-all duration-200 ${
                        quizSubmitted
                          ? oi === q.answer ? "border-green-500/50 bg-green-500/10 text-green-400" : quizAnswers[qi] === oi ? "border-red-500/50 bg-red-500/10 text-red-400" : "border-zinc-800 text-text-placeholder"
                          : quizAnswers[qi] === oi ? "border-amber-500/50 bg-amber-500/10 text-amber-heading" : "border-zinc-800 text-text-muted hover:border-amber-500/30"
                      }`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {!quizSubmitted ? (
              <button onClick={handleQuizSubmit} disabled={Object.keys(quizAnswers).length < quizData.questions.length} className="w-full py-4 text-sm font-body font-semibold text-black bg-gradient-to-r from-amber-400 to-amber-600 rounded-lg disabled:opacity-30 hover:from-amber-300 hover:to-amber-500 transition-all">
                Submit Quiz
              </button>
            ) : (
              <div className="text-center p-6 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="font-heading text-3xl text-amber-heading mb-2">{quizScore}/{quizData.questions.length}</p>
                <p className="text-sm text-text-label font-body">Correct Answers</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
