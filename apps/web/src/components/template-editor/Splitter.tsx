import { useCallback, useRef } from "react";

export function Splitter({ onRatioChange }: { onRatioChange: (ratio: number) => void }) {
  const dragging = useRef(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const ratio = ev.clientX / window.innerWidth;
      onRatioChange(Math.min(0.75, Math.max(0.25, ratio)));
    };

    const onUp = () => {
      dragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [onRatioChange]);

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      className="flex w-2 shrink-0 cursor-col-resize items-center justify-center bg-border/40 hover:bg-primary/30 transition-colors"
      onMouseDown={onMouseDown}
    >
      <div className="h-8 w-0.5 rounded-full bg-border" />
    </div>
  );
}
