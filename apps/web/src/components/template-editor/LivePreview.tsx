import { useRef, useState, useCallback, useLayoutEffect } from "react";
import { MonitorPlay } from "lucide-react";
import type { PlayerItem } from "@/components/show/ScreenPlayer";
import { ScreenPlayer } from "@/components/show/ScreenPlayer";
import type { TemplateWidget } from "@/types/screen.types";
import { EditableWidgetOverlay } from "./EditableWidgetOverlay";

const MIN_PREVIEW_WIDTH = 240;

export function LivePreview({
  items,
  widgets,
  onWidgetChange,
}: {
  items: PlayerItem[];
  widgets: TemplateWidget[];
  onWidgetChange: (id: number, geom: { x: number; y: number; w: number; h: number }) => void;
}) {
  const [currentMs, setCurrentMs] = useState(0);
  const [selectedWidgetId, setSelectedWidgetId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // null = auto (fills container). A pixel value = user-set width.
  const [previewWidthPx, setPreviewWidthPx] = useState<number | null>(null);
  const [containerH, setContainerH] = useState(0);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContainerH(el.offsetHeight));
    ro.observe(el);
    setContainerH(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  const visibleWidgets = widgets.filter((w) => {
    if (w.startMs !== null && currentMs < w.startMs) return false;
    if (w.endMs !== null && currentMs >= w.endMs) return false;
    return true;
  });

  const startHResize = useCallback((side: "left" | "right") => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    // Get the current effective width of the 16:9 box
    const currentW = previewWidthPx ?? (containerRect.width * 0.9);

    const onMove = (ev: MouseEvent) => {
      const containerW = containerRef.current?.getBoundingClientRect().width ?? containerRect.width;
      const maxW = containerW - 16; // leave a small margin
      const delta = ev.clientX - startX;
      // Right handle: drag right = wider. Left handle: drag left = wider (inverted).
      const newW = side === "right"
        ? Math.min(maxW, Math.max(MIN_PREVIEW_WIDTH, currentW + delta))
        : Math.min(maxW, Math.max(MIN_PREVIEW_WIDTH, currentW - delta));
      setPreviewWidthPx(newW);
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [previewWidthPx]);

  const maxH = containerH > 16 ? containerH - 16 : undefined;
  const previewStyle: React.CSSProperties = previewWidthPx
    ? { width: previewWidthPx, aspectRatio: "16 / 9", ...(maxH ? { maxHeight: maxH } : {}) }
    : { width: "90%", maxWidth: 860, aspectRatio: "16 / 9", ...(maxH ? { maxHeight: maxH } : {}) };

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full items-center justify-center bg-black select-none"
      onClick={() => setSelectedWidgetId(null)}
    >
      <div
        className="relative overflow-hidden rounded-lg bg-muted shadow-2xl"
        style={previewStyle}
      >
        {items.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <MonitorPlay className="size-10 text-muted-foreground opacity-20" />
            <span className="text-sm text-muted-foreground opacity-40">Aperçu du diaporama</span>
          </div>
        ) : (
          <ScreenPlayer items={items} widgets={[]} onTime={setCurrentMs} />
        )}

        {visibleWidgets.map((w) => (
          <EditableWidgetOverlay
            key={w.id}
            widget={w}
            isSelected={selectedWidgetId === w.id}
            onSelect={() => setSelectedWidgetId(w.id)}
            onChange={(geom) => onWidgetChange(w.id, geom)}
          />
        ))}

        {/* Left resize handle */}
        <div
          onMouseDown={startHResize("left")}
          className="absolute left-0 top-0 h-full w-2 cursor-ew-resize opacity-0 hover:opacity-100 transition-opacity"
          style={{ background: "linear-gradient(to right, rgba(255,255,255,0.25), transparent)" }}
          onClick={(e) => e.stopPropagation()}
        />
        {/* Right resize handle */}
        <div
          onMouseDown={startHResize("right")}
          className="absolute right-0 top-0 h-full w-2 cursor-ew-resize opacity-0 hover:opacity-100 transition-opacity"
          style={{ background: "linear-gradient(to left, rgba(255,255,255,0.25), transparent)" }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}
