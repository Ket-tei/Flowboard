import { useRef, useCallback } from "react";
import type { TemplateWidget } from "@/types/screen.types";
import { WeatherOverlay } from "@/components/show/WeatherOverlay";

type Geometry = { x: number; y: number; w: number; h: number };

type HandleDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const HANDLE_CLASSES: Record<HandleDir, string> = {
  n: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-n-resize",
  s: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-s-resize",
  e: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-e-resize",
  w: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-w-resize",
  ne: "top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-ne-resize",
  nw: "top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nw-resize",
  se: "bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-se-resize",
  sw: "bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-sw-resize",
};

export function EditableWidgetOverlay({
  widget,
  isSelected,
  onSelect,
  onChange,
}: {
  widget: TemplateWidget;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (geom: Geometry) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const getParentRect = useCallback((): DOMRect | null => {
    return containerRef.current?.parentElement?.getBoundingClientRect() ?? null;
  }, []);

  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

  const startDrag = (e: React.MouseEvent, mode: "body" | HandleDir) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect();
    const rect = getParentRect();
    if (!rect) return;
    const { x, y, w, h } = widget;
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;

    const onMove = (ev: MouseEvent) => {
      const dx = (ev.clientX - startMouseX) / rect.width;
      const dy = (ev.clientY - startMouseY) / rect.height;
      let nx = x, ny = y, nw = w, nh = h;

      if (mode === "body") {
        nx = clamp(x + dx, 0, 1 - w);
        ny = clamp(y + dy, 0, 1 - h);
      } else {
        if (mode.includes("e")) nw = clamp(w + dx, 0.05, 1 - x);
        if (mode.includes("w")) { nw = clamp(w - dx, 0.05, x + w); nx = x + (w - nw); }
        if (mode.includes("s")) nh = clamp(h + dy, 0.03, 1 - y);
        if (mode.includes("n")) { nh = clamp(h - dy, 0.03, y + h); ny = y + (h - nh); }
      }

      onChange({ x: nx, y: ny, w: nw, h: nh });
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div
      ref={containerRef}
      className={`absolute ${isSelected ? "ring-2 ring-primary ring-offset-1" : "hover:ring-1 hover:ring-primary/40"}`}
      style={{
        left: `${widget.x * 100}%`,
        top: `${widget.y * 100}%`,
        width: `${widget.w * 100}%`,
        height: `${widget.h * 100}%`,
      }}
      onClick={onSelect}
    >
      {/* Content */}
      <div
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => startDrag(e, "body")}
      >
        <WeatherOverlay widget={widget} inline />
      </div>

      {/* Resize handles — only shown when selected */}
      {isSelected && (Object.keys(HANDLE_CLASSES) as HandleDir[]).map((dir) => (
        <div
          key={dir}
          className={`absolute size-2.5 rounded-full border-2 border-primary bg-white ${HANDLE_CLASSES[dir]}`}
          onMouseDown={(e) => startDrag(e, dir)}
        />
      ))}
    </div>
  );
}
