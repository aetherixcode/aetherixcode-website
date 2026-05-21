import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

let nextId = 0;
const listeners = new Set<(toast: Toast) => void>();

function emitToast(message: string, type: ToastType) {
  const toast: Toast = { id: ++nextId, message, type };
  listeners.forEach(fn => fn(toast));
}

export function toast(message: string, type: ToastType = "info") { emitToast(message, type); }
export function toastSuccess(message: string) { emitToast(message, "success"); }
export function toastError(message: string) { emitToast(message, "error"); }
export function toastInfo(message: string) { emitToast(message, "info"); }

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) { clearTimeout(timer); timersRef.current.delete(id); }
  }, []);

  useEffect(() => {
    const handler = (t: Toast) => {
      setToasts(prev => [...prev, t]);
      const timer = setTimeout(() => remove(t.id), 4000);
      timersRef.current.set(t.id, timer);
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, [remove]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((t) => {
        const colors: Record<string, string> = {
          success: "border-green-500/40 bg-green-500/10 text-green-400",
          error: "border-red-500/40 bg-red-500/10 text-red-400",
          info: "border-amber-500/40 bg-amber-500/10 text-amber-heading",
        };
        const icons: Record<string, ReactNode> = {
          success: <path d="M20 6L9 17l-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
          error: <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />,
          info: <><circle cx="12" cy="12" r="9" strokeWidth="2" /><path d="M12 8v4M12 16h.01" strokeWidth="2" strokeLinecap="round" /></>,
        };
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-lg ${colors[t.type]}`}
            role="alert"
            style={{ animation: "toastIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 shrink-0 mt-0.5">{icons[t.type]}</svg>
            <p className="text-sm font-body flex-1 leading-snug">{t.message}</p>
            <button onClick={() => remove(t.id)} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
