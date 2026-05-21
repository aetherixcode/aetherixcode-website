import { useEffect, useState, useMemo } from "react";

interface Particle {
  id: number;
  left: number;
  size: number;
  anim: string;
  dur: number;
  delay: number;
  color: string;
}

export default function FireParticles() {
  const [mounted, setMounted] = useState(false);

  const particles = useMemo<Particle[]>(() => {
    const result: Particle[] = [];
    const anims = ["ember", "ember2", "ember3"];
    const colors = [
      "bg-amber-400",
      "bg-amber-500",
      "bg-amber-300",
      "bg-orange-500",
      "bg-yellow-300",
    ];
    for (let i = 0; i < 35; i++) {
      result.push({
        id: i,
        left: Math.random() * 100,
        size: 2 + Math.random() * 4,
        anim: anims[Math.floor(Math.random() * anims.length)],
        dur: 4 + Math.random() * 6,
        delay: Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    return result;
  }, []);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" />;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute bottom-0 rounded-full ${p.color}`}
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: 0,
            boxShadow: `0 0 ${p.size * 3}px currentColor`,
            animation: `${p.anim} ${p.dur}s ease-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
