import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { uploadToDrive } from "../lib/gdrive";
import { supabase } from "../lib/supabase";

import { toastError, toastSuccess } from "./ToastContext";

interface Course {
  id: string; slug: string; name: string; description: string; image_url: string | null;
  difficulty: string; teacher_name: string; prerequisites: string | null; total_lectures: number;
}

interface Lecture {
  id: string; lecture_number: number; title: string; video_url: string;
  notes_url: string | null; dpp_url: string | null; dpp_solution_url: string | null; quiz_url: string | null;
}

export default function AdminPanel() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showLecture, setShowLecture] = useState<string | null>(null);
  const [editing, setEditing] = useState<Course | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [previewMd, setPreviewMd] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [showLectureList, setShowLectureList] = useState<string | null>(null);
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);
  const [lecEditLoading, setLecEditLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const notesRef = useRef<HTMLInputElement>(null);
  const dppRef = useRef<HTMLInputElement>(null);
  const dppSolRef = useRef<HTMLInputElement>(null);
  const quizRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ name: "", slug: "", description: "", image_url: "", difficulty: "beginner", teacher_name: "", prerequisites: "" });
  const [lecForm, setLecForm] = useState({ lecture_number: "", title: "", video_url: "", notes_url: "", dpp_url: "", dpp_solution_url: "", quiz_url: "" });

  useEffect(() => { loadCourses(); }, []);

  const loadCourses = async () => {
    const { data, error } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
    if (error) toastError(error.message);
    setCourses(data as Course[] || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.name || !form.slug || !form.description || !form.teacher_name) {
      toastError("Name, slug, description, and teacher name are required.");
      return;
    }
    setCreateLoading(true);
    const { error } = await supabase.from("courses").insert({
      name: form.name, slug: form.slug, description: form.description,
      image_url: form.image_url || null, difficulty: form.difficulty,
      teacher_name: form.teacher_name, prerequisites: form.prerequisites || null,
      is_published: true, total_lectures: 0,
    });
    setCreateLoading(false);
    if (error) { toastError(error.message); return; }
    resetForm();
    setShowCreate(false);
    toastSuccess(`Course "${form.name}" created!`);
    loadCourses();
  };

  const handleEdit = async () => {
    if (!editing) return;
    const { error } = await supabase.from("courses").update({
      name: editing.name, slug: editing.slug, description: editing.description,
      image_url: editing.image_url || null, difficulty: editing.difficulty,
      teacher_name: editing.teacher_name, prerequisites: editing.prerequisites || null,
    }).eq("id", editing.id);
    if (error) { toastError(error.message); return; }
    setEditing(null);
    toastSuccess(`Course "${editing.name}" updated!`);
    loadCourses();
  };

  const handleDelete = async (id: string) => {
    if (confirmText.toLowerCase() !== "yes") return;
    const course = courses.find(c => c.id === id);
    await supabase.from("courses").delete().eq("id", id);
    setConfirmDelete(null);
    setConfirmText("");
    toastSuccess(`Course "${course?.name}" deleted.`);
    loadCourses();
  };

  const handleAddLecture = async () => {
    if (!showLecture || !lecForm.title || !lecForm.video_url) {
      toastError("Title and video URL are required.");
      return;
    }
    const { error } = await supabase.from("lectures").insert({
      course_id: showLecture, lecture_number: parseInt(lecForm.lecture_number),
      title: lecForm.title, video_url: lecForm.video_url,
      notes_url: lecForm.notes_url || null, dpp_url: lecForm.dpp_url || null,
      dpp_solution_url: lecForm.dpp_solution_url || null, quiz_url: lecForm.quiz_url || null,
    });
    if (error) { toastError(error.message); return; }
    setLecForm({ lecture_number: "", title: "", video_url: "", notes_url: "", dpp_url: "", dpp_solution_url: "", quiz_url: "" });
    setShowLecture(null);
    toastSuccess(`Lecture "${lecForm.title}" added!`);
    loadCourses();
  };

  const handleDeleteLecture = async (lectureId: string) => {
    const lecture = lectures.find(l => l.id === lectureId);
    await supabase.from("lectures").delete().eq("id", lectureId);
    if (showLectureList) loadLectures(showLectureList);
    toastSuccess(`Lecture "${lecture?.title}" deleted.`);
  };

  const handleEditLecture = async () => {
    if (!editingLecture) return;
    setLecEditLoading(true);
    const { error } = await supabase.from("lectures").update({
      lecture_number: editingLecture.lecture_number,
      title: editingLecture.title,
      video_url: editingLecture.video_url,
      notes_url: editingLecture.notes_url || null,
      dpp_url: editingLecture.dpp_url || null,
      dpp_solution_url: editingLecture.dpp_solution_url || null,
      quiz_url: editingLecture.quiz_url || null,
    }).eq("id", editingLecture.id);
    setLecEditLoading(false);
    if (error) { toastError(error.message); return; }
    setEditingLecture(null);
    toastSuccess(`Lecture "${editingLecture.title}" updated!`);
    if (showLectureList) loadLectures(showLectureList);
  };

  const loadLectures = async (courseId: string) => {
    const { data } = await supabase.from("lectures").select("*").eq("course_id", courseId).order("lecture_number");
    setLectures(data as Lecture[] || []);
  };

  const resetForm = () => { setForm({ name: "", slug: "", description: "", image_url: "", difficulty: "beginner", teacher_name: "", prerequisites: "" }); setPreviewMd(false); };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "notes_url" | "dpp_url" | "dpp_solution_url" | "quiz_url") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const course = courses.find(c => c.id === showLecture);
    if (!course) { toastError("Select a course first"); return; }

    setUploading(field);
    try {
      const { embedUrl } = await uploadToDrive(file, course.teacher_name, course.name, `Lecture ${lecForm.lecture_number || "new"}`);
      setLecForm(p => ({ ...p, [field]: embedUrl }));
      toastSuccess(`${file.name} uploaded to Drive!`);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
      e.target.value = "";
    }
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-2xl sm:text-3xl text-amber-heading">ADMIN PANEL</h1>
        <button onClick={() => { resetForm(); setShowCreate(true); }} className="px-5 py-2.5 text-sm font-body font-semibold text-black bg-gradient-to-r from-amber-400 to-amber-600 rounded-xl hover:from-amber-300 hover:to-amber-500 transition-all shadow-lg shadow-amber-600/20">
          + Create Course
        </button>
      </div>

      <div className="space-y-4">
        {courses.map(c => (
          <div key={c.id} className="p-5 rounded-xl border border-border-subtle bg-surface-card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-lg bg-surface-image overflow-hidden shrink-0 border border-border-subtle">
                  {c.image_url ? <img src={c.image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-text-disabled"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeWidth="1.5" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeWidth="1.5" /></svg></div>}
                </div>
                <div>
                  <h3 className="font-heading text-base text-amber-heading">{c.name}</h3>
                  <p className="text-xs text-text-label font-body">{c.teacher_name} · {c.difficulty} · {c.total_lectures} lectures</p>
                  <p className="text-[11px] text-text-placeholder font-body">/{c.slug}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => { setShowLectureList(c.id); loadLectures(c.id); }} className="px-3 py-1.5 text-xs font-body text-amber-heading border border-amber-500/30 rounded-lg hover:bg-amber-500/10 transition-all">Lectures</button>
                <button onClick={() => setShowLecture(c.id)} className="px-3 py-1.5 text-xs font-body text-amber-heading border border-amber-500/30 rounded-lg hover:bg-amber-500/10 transition-all">+ Lecture</button>
                <button onClick={() => { setEditing({ ...c }); }} className="px-3 py-1.5 text-xs font-body text-text-muted border border-border-strong-zinc rounded-lg hover:bg-zinc-800 transition-all">Edit</button>
                <button onClick={() => setConfirmDelete(c.id)} className="px-3 py-1.5 text-xs font-body text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-all">Delete</button>
              </div>
            </div>
          </div>
        ))}
        {courses.length === 0 && <p className="text-center text-sm text-text-placeholder font-body py-12">No courses yet. Create one to get started.</p>}
      </div>

      {(showCreate || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-overlay backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-border-medium bg-bg-modal p-8 max-h-[85vh] overflow-y-auto">
            <h3 className="font-heading text-xl text-amber-heading mb-6">{editing ? "Edit Course" : "Create Course"}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {(["name", "slug", "teacher_name", "image_url", "prerequisites"] as const).map(f => (
                  <input key={f} type="text" placeholder={f.replace(/_/g, " ")} value={(editing || form)[f]} onChange={(e) => editing ? setEditing({ ...editing, [f]: e.target.value }) : setForm(prev => ({ ...prev, [f]: e.target.value }))}
                    className="w-full bg-surface-input border border-border-input rounded-lg px-4 py-3 text-sm text-text-secondary font-body placeholder-text-placeholder outline-none focus:border-border-input-focus" />
                ))}
              </div>
              <select value={(editing || form).difficulty} onChange={(e) => editing ? setEditing({ ...editing, difficulty: e.target.value }) : setForm(prev => ({ ...prev, difficulty: e.target.value }))}
                className="w-full bg-surface-input border border-border-input rounded-lg px-4 py-3 text-sm text-text-secondary font-body outline-none focus:border-border-input-focus">
                <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
              </select>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-text-label font-body">Description (Markdown)</label>
                  <button onClick={() => setPreviewMd(!previewMd)} className="text-[10px] font-body text-amber-accent/70 hover:text-amber-heading transition-colors uppercase tracking-wider">{previewMd ? "Write" : "Preview"}</button>
                </div>
                {previewMd ? (
                  <div className="w-full min-h-[160px] max-h-[300px] overflow-y-auto bg-surface-code border border-border-default rounded-lg px-4 py-3 text-sm text-text-body prose prose-invert prose-sm">
                    {(editing || form).description ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{(editing || form).description}</ReactMarkdown> : <span className="text-text-placeholder italic">Nothing to preview</span>}
                  </div>
                ) : (
                  <textarea placeholder="# Course overview&#10;&#10;- Topic 1&#10;- Topic 2&#10;&#10;**Prerequisites:** Basic knowledge" rows={6} value={(editing || form).description} onChange={(e) => editing ? setEditing({ ...editing, description: e.target.value }) : setForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-surface-input border border-border-input rounded-lg px-4 py-3 text-sm text-text-secondary font-body placeholder-text-placeholder outline-none focus:border-border-input-focus resize-none" />
                )}
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button onClick={() => { setShowCreate(false); setEditing(null); }} className="flex-1 py-3 text-sm font-body text-text-muted border border-border-strong-zinc rounded-lg hover:bg-zinc-800 transition-all">Cancel</button>
              <button onClick={editing ? handleEdit : handleCreate} disabled={createLoading} className="flex-1 py-3 text-sm font-body font-semibold text-black bg-gradient-to-r from-amber-400 to-amber-600 rounded-lg hover:from-amber-300 hover:to-amber-500 transition-all disabled:opacity-50">{createLoading ? "Creating..." : editing ? "Save" : "Create"}</button>
            </div>
          </div>
        </div>
      )}

      {showLecture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-overlay backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-border-medium bg-bg-modal p-8">
            <h3 className="font-heading text-xl text-amber-heading mb-6">Add Lecture</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Lecture number" value={lecForm.lecture_number} onChange={(e) => setLecForm(p => ({ ...p, lecture_number: e.target.value }))} className="w-full bg-surface-input border border-border-input rounded-lg px-4 py-3 text-sm text-text-secondary font-body placeholder-text-placeholder outline-none focus:border-border-input-focus" />
                <input type="text" placeholder="Title" value={lecForm.title} onChange={(e) => setLecForm(p => ({ ...p, title: e.target.value }))} className="w-full bg-surface-input border border-border-input rounded-lg px-4 py-3 text-sm text-text-secondary font-body placeholder-text-placeholder outline-none focus:border-border-input-focus" />
              </div>
              <input type="text" placeholder="YouTube URL" value={lecForm.video_url} onChange={(e) => setLecForm(p => ({ ...p, video_url: e.target.value }))} className="w-full bg-surface-input border border-border-input rounded-lg px-4 py-3 text-sm text-text-secondary font-body placeholder-text-placeholder outline-none focus:border-border-input-focus" />
              <div className="space-y-1">
                <div className="flex gap-2">
                  <input type="text" placeholder="Notes PDF (upload or paste URL)" value={lecForm.notes_url} onChange={(e) => setLecForm(p => ({ ...p, notes_url: e.target.value }))} className="flex-1 bg-surface-input border border-border-input rounded-lg px-4 py-3 text-sm text-text-secondary font-body placeholder-text-placeholder outline-none focus:border-border-input-focus" />
                  <input ref={notesRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileUpload(e, "notes_url")} />
                  <button onClick={() => notesRef.current?.click()} disabled={uploading === "notes_url"} className="px-3 py-2 text-xs font-body text-amber-heading border border-amber-500/30 rounded-lg hover:bg-amber-500/10 transition-all disabled:opacity-50 whitespace-nowrap">
                    {uploading === "notes_url" ? "..." : "Upload"}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex gap-2">
                  <input type="text" placeholder="DPP PDF (upload or paste URL)" value={lecForm.dpp_url} onChange={(e) => setLecForm(p => ({ ...p, dpp_url: e.target.value }))} className="flex-1 bg-surface-input border border-border-input rounded-lg px-4 py-3 text-sm text-text-secondary font-body placeholder-text-placeholder outline-none focus:border-border-input-focus" />
                  <input ref={dppRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileUpload(e, "dpp_url")} />
                  <button onClick={() => dppRef.current?.click()} disabled={uploading === "dpp_url"} className="px-3 py-2 text-xs font-body text-amber-heading border border-amber-500/30 rounded-lg hover:bg-amber-500/10 transition-all disabled:opacity-50 whitespace-nowrap">
                    {uploading === "dpp_url" ? "..." : "Upload"}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex gap-2">
                  <input type="text" placeholder="DPP Solution PDF (upload or paste URL)" value={lecForm.dpp_solution_url} onChange={(e) => setLecForm(p => ({ ...p, dpp_solution_url: e.target.value }))} className="flex-1 bg-surface-input border border-border-input rounded-lg px-4 py-3 text-sm text-text-secondary font-body placeholder-text-placeholder outline-none focus:border-border-input-focus" />
                  <input ref={dppSolRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileUpload(e, "dpp_solution_url")} />
                  <button onClick={() => dppSolRef.current?.click()} disabled={uploading === "dpp_solution_url"} className="px-3 py-2 text-xs font-body text-amber-heading border border-amber-500/30 rounded-lg hover:bg-amber-500/10 transition-all disabled:opacity-50 whitespace-nowrap">
                    {uploading === "dpp_solution_url" ? "..." : "Upload"}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex gap-2">
                  <input type="text" placeholder="Quiz JSON (upload or paste URL)" value={lecForm.quiz_url} onChange={(e) => setLecForm(p => ({ ...p, quiz_url: e.target.value }))} className="flex-1 bg-surface-input border border-border-input rounded-lg px-4 py-3 text-sm text-text-secondary font-body placeholder-text-placeholder outline-none focus:border-border-input-focus" />
                  <input ref={quizRef} type="file" accept=".json,.pdf" className="hidden" onChange={(e) => handleFileUpload(e, "quiz_url")} />
                  <button onClick={() => quizRef.current?.click()} disabled={uploading === "quiz_url"} className="px-3 py-2 text-xs font-body text-amber-heading border border-amber-500/30 rounded-lg hover:bg-amber-500/10 transition-all disabled:opacity-50 whitespace-nowrap">
                    {uploading === "quiz_url" ? "..." : "Upload"}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button onClick={() => { setShowLecture(null); setLecForm({ lecture_number: "", title: "", video_url: "", notes_url: "", dpp_url: "", dpp_solution_url: "", quiz_url: "" }); }} className="flex-1 py-3 text-sm font-body text-text-muted border border-border-strong-zinc rounded-lg hover:bg-zinc-800 transition-all">Cancel</button>
              <button onClick={handleAddLecture} className="flex-1 py-3 text-sm font-body font-semibold text-black bg-gradient-to-r from-amber-400 to-amber-600 rounded-lg hover:from-amber-300 hover:to-amber-500 transition-all">Add</button>
            </div>
          </div>
        </div>
      )}

      {showLectureList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-overlay backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-border-medium bg-bg-modal p-8 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-xl text-amber-heading">Lectures</h3>
              <button onClick={() => { setShowLectureList(null); setLectures([]); }} className="text-text-label hover:text-text-body text-xl">&times;</button>
            </div>
            {lectures.length === 0 ? (
              <p className="text-sm text-text-placeholder font-body text-center py-8">No lectures yet.</p>
            ) : (
              <div className="space-y-2">
                {lectures.map(l => (
                  <div key={l.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-lecture border border-border-subtle">
                    <div>
                      <span className="text-xs font-heading text-amber-accent/60 mr-2">#{l.lecture_number}</span>
                      <span className="text-sm font-body text-text-secondary">{l.title}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingLecture({ ...l })} className="text-xs font-body text-text-muted hover:text-amber-heading transition-colors">Edit</button>
                      <button onClick={() => handleDeleteLecture(l.id)} className="text-xs font-body text-red-400 hover:text-red-300 transition-colors">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {editingLecture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-overlay backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-border-medium bg-bg-modal p-8">
            <h3 className="font-heading text-xl text-amber-heading mb-6">Edit Lecture</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Lecture number" value={editingLecture.lecture_number} onChange={(e) => setEditingLecture(p => ({ ...p!, lecture_number: parseInt(e.target.value) || 0 }))} className="w-full bg-surface-input border border-border-input rounded-lg px-4 py-3 text-sm text-text-secondary font-body placeholder-text-placeholder outline-none focus:border-border-input-focus" />
                <input type="text" placeholder="Title" value={editingLecture.title} onChange={(e) => setEditingLecture(p => ({ ...p!, title: e.target.value }))} className="w-full bg-surface-input border border-border-input rounded-lg px-4 py-3 text-sm text-text-secondary font-body placeholder-text-placeholder outline-none focus:border-border-input-focus" />
              </div>
              <input type="text" placeholder="YouTube URL" value={editingLecture.video_url} onChange={(e) => setEditingLecture(p => ({ ...p!, video_url: e.target.value }))} className="w-full bg-surface-input border border-border-input rounded-lg px-4 py-3 text-sm text-text-secondary font-body placeholder-text-placeholder outline-none focus:border-border-input-focus" />
              <input type="text" placeholder="Notes PDF URL" value={editingLecture.notes_url || ""} onChange={(e) => setEditingLecture(p => ({ ...p!, notes_url: e.target.value }))} className="w-full bg-surface-input border border-border-input rounded-lg px-4 py-3 text-sm text-text-secondary font-body placeholder-text-placeholder outline-none focus:border-border-input-focus" />
              <input type="text" placeholder="DPP PDF URL" value={editingLecture.dpp_url || ""} onChange={(e) => setEditingLecture(p => ({ ...p!, dpp_url: e.target.value }))} className="w-full bg-surface-input border border-border-input rounded-lg px-4 py-3 text-sm text-text-secondary font-body placeholder-text-placeholder outline-none focus:border-border-input-focus" />
              <input type="text" placeholder="DPP Solution PDF URL" value={editingLecture.dpp_solution_url || ""} onChange={(e) => setEditingLecture(p => ({ ...p!, dpp_solution_url: e.target.value }))} className="w-full bg-surface-input border border-border-input rounded-lg px-4 py-3 text-sm text-text-secondary font-body placeholder-text-placeholder outline-none focus:border-border-input-focus" />
              <input type="text" placeholder="Quiz JSON URL" value={editingLecture.quiz_url || ""} onChange={(e) => setEditingLecture(p => ({ ...p!, quiz_url: e.target.value }))} className="w-full bg-surface-input border border-border-input rounded-lg px-4 py-3 text-sm text-text-secondary font-body placeholder-text-placeholder outline-none focus:border-border-input-focus" />
            </div>
            <div className="flex gap-4 mt-6">
              <button onClick={() => setEditingLecture(null)} className="flex-1 py-3 text-sm font-body text-text-muted border border-border-strong-zinc rounded-lg hover:bg-zinc-800 transition-all">Cancel</button>
              <button onClick={handleEditLecture} disabled={lecEditLoading} className="flex-1 py-3 text-sm font-body font-semibold text-black bg-gradient-to-r from-amber-400 to-amber-600 rounded-lg hover:from-amber-300 hover:to-amber-500 transition-all disabled:opacity-50">{lecEditLoading ? "Saving..." : "Save"}</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-overlay backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border-destructive bg-bg-modal p-8">
            <h3 className="font-heading text-xl text-red-400 mb-3">Delete Course</h3>
            <p className="text-sm text-text-label font-body mb-6">Type <span className="text-red-400 font-mono">yes</span> to permanently delete this course and all its lectures.</p>
            <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="Type yes" className="w-full bg-surface-input border border-border-destructive rounded-lg px-4 py-3 text-sm text-text-secondary font-body outline-none focus:border-border-destructive-focus mb-6" />
            <div className="flex gap-4">
              <button onClick={() => { setConfirmDelete(null); setConfirmText(""); }} className="flex-1 py-3 text-sm font-body text-text-muted border border-border-strong-zinc rounded-lg hover:bg-zinc-800 transition-all">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} disabled={confirmText.toLowerCase() !== "yes"} className="flex-1 py-3 text-sm font-body text-black bg-red-500 rounded-lg disabled:opacity-30 hover:bg-red-400 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
