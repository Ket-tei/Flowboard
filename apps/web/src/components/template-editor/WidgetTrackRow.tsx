import { useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
import type { TemplateWidget } from "@/types/screen.types";

export function WidgetTrackRow({
  widget,
  totalDurationMs,
  onUpdateTiming,
  onRemove,
}: {
  widget: TemplateWidget;
  totalDurationMs: number;
  onUpdateTiming: (id: number, timing: { startMs: number | null; endMs: number | null }) => void;
  onRemove: (id: number) => void;
}) {
  const { t } = useTranslation();
  const trackRef = useRef<HTMLDivElement>(null);
  const config = widget.config as { city?: string };
  const label = config.city ? `${t("templateEditor.weatherLabel")} · ${config.city}` : t("templateEditor.weatherLabel");

  const alwaysVisible = widget.startMs === null && widget.endMs === null;
  const effectiveStart = widget.startMs ?? 0;
  const effectiveEnd = widget.endMs ?? totalDurationMs;
  const total = totalDurationMs || 1;

  const leftPct = (effectiveStart / total) * 100;
  const widthPct = Math.max(2, ((effectiveEnd - effectiveStart) / total) * 100);

  const getTrackX = useCallback((clientX: number): number => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  }, []);

  const handleDragHandle = (e: React.MouseEvent, side: "left" | "right" | "body") => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const origStart = effectiveStart;
    const origEnd = effectiveEnd;

    const onMove = (ev: MouseEvent) => {
      const frac = getTrackX(ev.clientX);
      const ms = frac * total;
      if (side === "left") {
        const newStart = Math.min(ms, origEnd - 500);
        onUpdateTiming(widget.id, { startMs: Math.round(newStart), endMs: widget.endMs });
      } else if (side === "right") {
        const newEnd = Math.max(ms, origStart + 500);
        onUpdateTiming(widget.id, { startMs: widget.startMs, endMs: Math.round(newEnd) });
      } else {
        const delta = (ev.clientX - startX) / (trackRef.current?.getBoundingClientRect().width ?? 1) * total;
        const newStart = Math.max(0, Math.min(origStart + delta, total - (origEnd - origStart)));
        const newEnd = newStart + (origEnd - origStart);
        onUpdateTiming(widget.id, { startMs: Math.round(newStart), endMs: Math.round(newEnd) });
      }
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const resetToAlways = () => {
    onUpdateTiming(widget.id, { startMs: null, endMs: null });
  };

  return (
    <div className="flex items-center gap-2 py-1">
      {/* Label */}
      <div className="flex w-36 shrink-0 items-center justify-between gap-1">
        <span className="truncate text-[10px] text-muted-foreground">{label}</span>
        <button
          type="button"
          onClick={() => onRemove(widget.id)}
          className="flex size-4 items-center justify-center rounded text-muted-foreground hover:text-destructive"
          title={t("templateEditor.deleteWidget")}
        >
          <Trash2 className="size-2.5" />
        </button>
      </div>

      {/* Track */}
      <div ref={trackRef} className="relative h-6 flex-1 rounded-md bg-muted/30">
        {totalDurationMs === 0 ? (
          <div className="flex h-full items-center justify-center text-[9px] text-muted-foreground">
            {t("templateEditor.noMedia")}
          </div>
        ) : (
          <div
            className="absolute top-0.5 h-5 rounded-md bg-primary/60 flex items-center select-none"
            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
          >
            {/* Left handle */}
            <div
              className="absolute left-0 top-0 h-full w-2 cursor-w-resize rounded-l-md bg-primary/80 hover:bg-primary"
              onMouseDown={(e) => handleDragHandle(e, "left")}
            />
            {/* Body drag */}
            <div
              className="absolute inset-x-2 top-0 h-full cursor-grab active:cursor-grabbing"
              onMouseDown={(e) => handleDragHandle(e, "body")}
            />
            {/* Right handle */}
            <div
              className="absolute right-0 top-0 h-full w-2 cursor-e-resize rounded-r-md bg-primary/80 hover:bg-primary"
              onMouseDown={(e) => handleDragHandle(e, "right")}
            />
            {alwaysVisible && (
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-medium text-white/80 pointer-events-none">
                {t("templateEditor.alwaysVisible")}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Always toggle */}
      {!alwaysVisible && (
        <button
          type="button"
          onClick={resetToAlways}
          className="shrink-0 text-[9px] text-muted-foreground underline hover:text-foreground"
        >
          {t("templateEditor.alwaysVisible")}
        </button>
      )}
    </div>
  );
}
