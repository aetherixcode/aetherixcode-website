import { useEffect, useRef, useState, useCallback } from "react";

declare global {
  interface Window {
    YT: {
      Player: new (el: HTMLElement | string, config: Record<string, unknown>) => YTPlayer;
      PlayerState: { PLAYING: number; ENDED: number; PAUSED: number; BUFFERING: number; CUED: number };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YTPlayer {
  destroy: () => void;
  getDuration: () => number;
  getCurrentTime: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  playVideo: () => void;
}

interface VideoPlayerProps {
  videoUrl: string;
  lectureId: string;
  userId: string;
  savedTime: number;
  onComplete: () => void;
  onProgress: (seconds: number, duration: number) => void;
}

function getYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

let apiLoaded = false;
let apiLoading = false;

function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (apiLoaded && window.YT && window.YT.Player) {
      resolve();
      return;
    }
    if (apiLoading) {
      const check = setInterval(() => {
        if (apiLoaded && window.YT && window.YT.Player) {
          clearInterval(check);
          resolve();
        }
      }, 100);
      setTimeout(() => clearInterval(check), 10000);
      return;
    }
    apiLoading = true;
    window.onYouTubeIframeAPIReady = () => {
      apiLoaded = true;
      apiLoading = false;
      resolve();
    };
    if (!document.querySelector("script[src*='youtube.com/iframe_api']")) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
    setTimeout(() => {
      if (window.YT && window.YT.Player) {
        apiLoaded = true;
        apiLoading = false;
        resolve();
      }
    }, 10000);
  });
}

export default function VideoPlayer({ videoUrl, lectureId, userId, savedTime, onComplete, onProgress }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [ready, setReady] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const [resumeTime, setResumeTime] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const videoId = getYoutubeId(videoUrl);

  const lectureIdRef = useRef(lectureId);
  lectureIdRef.current = lectureId;
  const userIdRef = useRef(userId);
  userIdRef.current = userId;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;
  const promptShownRef = useRef(false);
  const initialSavedTimeRef = useRef(savedTime);

  useEffect(() => {
    initialSavedTimeRef.current = savedTime;
  }, [savedTime]);

  useEffect(() => {
    if (!videoId || !containerRef.current) return;

    promptShownRef.current = false;
    setReady(false);
    setShowResume(false);
    setHasInteracted(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (playerRef.current) {
      try { playerRef.current.destroy(); } catch { /* already destroyed */ }
      playerRef.current = null;
    }

    let destroyed = false;

    const setup = async () => {
      await loadYouTubeAPI();
      if (destroyed || !containerRef.current) return;

      containerRef.current.innerHTML = "";
      const player = new window.YT.Player(containerRef.current, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1, enablejsapi: 1 },
        events: {
          onReady: (event: { target: YTPlayer }) => {
            if (destroyed) return;
            setReady(true);
            const duration = event.target.getDuration();
            const st = initialSavedTimeRef.current;
            if (st > 10 && st < duration - 10) {
              promptShownRef.current = true;
              setResumeTime(st);
              setShowResume(true);
            }
          },
          onStateChange: (event: { data: number; target: YTPlayer }) => {
            if (destroyed) return;
            if (event.data === window.YT.PlayerState.PLAYING) {
              if (intervalRef.current) clearInterval(intervalRef.current);
              intervalRef.current = setInterval(() => {
                if (destroyed || !player || typeof player.getCurrentTime !== "function") return;
                const t = player.getCurrentTime();
                const d = player.getDuration();
                if (t > 0 && d > 0) {
                  onProgressRef.current(Math.floor(t), Math.floor(d));
                  if (t / d >= 0.9) {
                    onCompleteRef.current();
                  }
                }
              }, 5000);
            } else {
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
              if (event.data === window.YT.PlayerState.ENDED) {
                onCompleteRef.current();
              }
            }
          },
        },
      });
      playerRef.current = player;
    };

    setup();

    return () => {
      destroyed = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch { /* already destroyed */ }
        playerRef.current = null;
      }
    };
  }, [videoId]);

  const handleResume = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.seekTo(resumeTime, true);
      playerRef.current.playVideo();
    }
    setShowResume(false);
    setHasInteracted(true);
  }, [resumeTime]);

  const handleStartOver = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.seekTo(0, true);
      playerRef.current.playVideo();
    }
    setShowResume(false);
    setHasInteracted(true);
  }, []);

  if (!videoId) {
    return (
      <div className="aspect-video rounded-xl overflow-hidden border border-border-default bg-black flex items-center justify-center">
        <p className="text-sm text-text-placeholder font-body">Invalid video URL</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video rounded-xl overflow-hidden border border-border-default bg-black">
      <div ref={containerRef} className="w-full h-full" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
        </div>
      )}
      {showResume && !hasInteracted && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-80 rounded-2xl border border-border-medium bg-bg-modal p-6 text-center">
            <p className="text-sm text-text-muted font-body mb-1">Continue watching?</p>
            <p className="font-heading text-xl text-amber-heading mb-5">Resume from {formatTime(resumeTime)}?</p>
            <div className="flex gap-3">
              <button onClick={handleStartOver} className="flex-1 py-2.5 text-xs font-body text-text-muted border border-border-strong-zinc rounded-lg hover:bg-zinc-800 transition-all">Start Over</button>
              <button onClick={handleResume} className="flex-1 py-2.5 text-xs font-body font-semibold text-black bg-gradient-to-r from-amber-400 to-amber-600 rounded-lg hover:from-amber-300 hover:to-amber-500 transition-all">Resume</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
