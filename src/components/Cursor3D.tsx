import { useEffect, useRef, useState } from "react";

export default function Cursor3D() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    document.body.style.cursor = "none";

    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };

    const loop = () => {
      current.x += (target.x - current.x) * 0.1;
      current.y += (target.y - current.y) * 0.1;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${current.x}px, ${current.y}px)`;
      }
      requestAnimationFrame(loop);
    };

    const onMove = (e: MouseEvent) => { target.x = e.clientX; target.y = e.clientY; };
    const onHover = () => setHovering(true);
    const offHover = () => setHovering(false);

    document.addEventListener("mousemove", onMove);
    const els = document.querySelectorAll<HTMLElement>("a, button, input, textarea, [data-cursor]");
    els.forEach((el) => {
      el.addEventListener("mouseenter", onHover);
      el.addEventListener("mouseleave", offHover);
    });
    requestAnimationFrame(loop);

    return () => {
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", onMove);
      els.forEach((el) => {
        el.removeEventListener("mouseenter", onHover);
        el.removeEventListener("mouseleave", offHover);
      });
    };
  }, []);

  return (
    <div ref={cursorRef} className="pointer-events-none fixed z-[9999]">
      <div
        className={`relative rounded-full border transition-all duration-200 ease-out ${
          hovering
            ? "w-10 h-10 -ml-5 -mt-5 border-amber-400 bg-amber-500/5"
            : "w-[28px] h-[28px] -ml-3.5 -mt-3.5 border-amber-400/60 bg-transparent"
        }`}
      >
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400 transition-all duration-200 ${
            hovering ? "w-1 h-1" : "w-[3px] h-[3px]"
          }`}
        />
      </div>
    </div>
  );
}
