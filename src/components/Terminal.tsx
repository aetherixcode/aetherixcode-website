import { useState, useEffect, useRef } from "react";

interface TerminalLine {
  text: string;
  type: "command" | "progress" | "success" | "info";
  progress?: number;
}

const commands = [
  { cmd: "brain install python", success: "✓ Python 3.12.4 installed successfully" },
  { cmd: "brain install javascript", success: "✓ JavaScript ES2024 modules ready" },
  { cmd: "brain install react", success: "✓ React 19.0 + hooks loaded" },
  { cmd: "brain install typescript", success: "✓ TypeScript 5.4 type-checking active" },
  { cmd: "brain install tailwind", success: "✓ Tailwind CSS v4 utilities compiled" },
  { cmd: "brain install astro", success: "✓ Astro 4.0 islands configured" },
  { cmd: "brain install supabase", success: "✓ Supabase client connected" },
  { cmd: "brain install cloudflare", success: "✓ Cloudflare edge deployed" },
];

export default function Terminal() {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [cmdIndex, setCmdIndex] = useState(0);
  const [phase, setPhase] = useState<"typing" | "progress" | "done" | "clearing">("typing");
  const [typedText, setTypedText] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const current = commands[cmdIndex % commands.length];

    if (phase === "typing") {
      setTypedText("");
      let i = 0;
      intervalRef.current = setInterval(() => {
        if (i <= current.cmd.length) {
          setTypedText(current.cmd.slice(0, i));
          i++;
        } else {
          clearInterval(intervalRef.current!);
          setPhase("progress");
        }
      }, 50);
    }

    if (phase === "progress") {
      setLines((prev) => [...prev, { text: `$ ${current.cmd}`, type: "command" }]);
      let progress = 0;
      intervalRef.current = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress >= 100) {
          progress = 100;
          clearInterval(intervalRef.current!);
          setLines((prev) => [
            ...prev,
            { text: "Installing...", type: "progress", progress: 100 },
            { text: current.success, type: "success" },
          ]);
          setPhase("done");
        } else {
          setLines((prev) => {
            const filtered = prev.filter((l) => l.type !== "progress");
            return [...filtered, { text: "Installing...", type: "progress", progress }];
          });
        }
      }, 120);
    }

    if (phase === "done") {
      const nextIndex = cmdIndex + 1;
      if (nextIndex % 2 === 0) {
        intervalRef.current = setTimeout(() => {
          setPhase("clearing");
        }, 800);
      } else {
        intervalRef.current = setTimeout(() => {
          setCmdIndex(nextIndex);
          setPhase("typing");
        }, 600);
      }
    }

    if (phase === "clearing") {
      setLines([]);
      setCmdIndex(cmdIndex + 1);
      setPhase("typing");
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, cmdIndex]);

  return (
    <div className="w-[420px] h-[320px] bg-surface-card border border-border-default rounded-xl overflow-hidden shadow-2xl shadow-amber-glow-shadow">
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-raised border-b border-border-divider">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        <span className="text-[10px] font-mono text-amber-subtle ml-2 tracking-wider">brain terminal</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-accent/40 animate-pulse" />
          <span className="text-[9px] font-mono text-amber-subtle/60">v2.1.0</span>
        </div>
      </div>

      {/* Terminal body */}
      <div className="p-4 font-mono text-[11px] leading-relaxed h-[272px] overflow-y-auto scrollbar-none">
        {lines.map((line, i) => (
          <div key={i} className="mb-1">
            {line.type === "command" && (
              <span className="text-amber-accent">{line.text}</span>
            )}
            {line.type === "progress" && (
              <div className="flex items-center gap-2">
                <span className="text-amber-subtle">▸</span>
                <div className="flex-1 h-1.5 bg-amber-500/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-150"
                    style={{ width: `${line.progress}%` }}
                  />
                </div>
                <span className="text-amber-subtle w-8 text-right">{Math.round(line.progress!)}%</span>
              </div>
            )}
            {line.type === "success" && (
              <span className="text-green-500">{line.text}</span>
            )}
            {line.type === "info" && (
              <span className="text-amber-subtle">{line.text}</span>
            )}
          </div>
        ))}
        {phase === "typing" && (
          <span className="text-amber-accent">
            $ {typedText}
            <span className="animate-pulse">█</span>
          </span>
        )}
      </div>
    </div>
  );
}
