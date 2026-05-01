import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { ResizableBlock } from "./ResizableBlock";
import { WidgetPickerPopover } from "./WidgetPickerPopover";
import { PX_PER_MS, MIN_DURATION_MS, TRACK_LABEL_W, msToLabel } from "@/lib/timeline";
import type { TemplateWidget } from "@/types/screen.types";

interface WidgetTrackProps {
  trackIndex: number;
  widgets: TemplateWidget[];
  totalDurationMs: number;
  onUpdateTiming: (id: number, timing: { startMs: number | null; endMs: number | null }) => void;
  onRemove: (id: number) => void;
  onAdd: (widget: Omit<TemplateWidget, "id">) => Promise<void>;
}

function getWidgetColor(widget: TemplateWidget): string {
  return widget.type === "WEATHER_CURRENT"
    ? "oklch(0.48 0.12 220)"
    : "oklch(0.50 0.12 300)";
}

export function WidgetTrack({
  trackIndex,
  widgets,
  totalDurationMs,
  onUpdateTiming,
  onRemove,
  onAdd,
}: WidgetTrackProps) {
  const { t } = useTranslation();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        minHeight: 56,
        padding: "4px 0",
        borderBottom: "1px solid color-mix(in oklch, var(--border), transparent 70%)",
      }}
    >
      {/* Track label */}
      <div
        style={{
          width: TRACK_LABEL_W,
          flexShrink: 0,
          padding: "0 12px",
          fontSize: 10,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: "var(--muted-foreground)",
        }}
      >
        {widgets.length > 0
          ? t("templateEditor.widgetLabel", { n: trackIndex + 1 })
          : t("templateEditor.widgetLabelEmpty")}
      </div>

      {/* Track content */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          flex: 1,
          overflowX: "auto",
          padding: "0 8px 0 0",
        }}
      >
        {widgets.map((w) => {
          const effectiveStart = w.startMs ?? 0;
          const effectiveEnd = w.endMs ?? totalDurationMs;
          const widthPx = Math.max(
            MIN_DURATION_MS * PX_PER_MS,
            (effectiveEnd - effectiveStart) * PX_PER_MS
          );

          return (
            <ResizableBlock
              key={w.id}
              widthPx={widthPx}
              color={getWidgetColor(w)}
              label=""
              onResize={(newW) => {
                const newDuration = Math.round(newW / PX_PER_MS);
                const newEnd = effectiveStart + newDuration;
                onUpdateTiming(w.id, {
                  startMs: w.startMs,
                  endMs: Math.round(newEnd),
                });
              }}
            >
              <div
                style={{
                  overflow: "hidden",
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#fff",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {(w.config as { city?: string }).city ?? t("templateWidgets.WEATHER_CURRENT")}
                </span>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.6)" }}>
                  {msToLabel(effectiveEnd - effectiveStart)}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(w.id);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.6)",
                  padding: 2,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                }}
                title={t("templateEditor.deleteWidget")}
              >
                <X size={12} />
              </button>
            </ResizableBlock>
          );
        })}

        {widgets.length === 0 && (
          <WidgetPickerPopover onAdd={onAdd} />
        )}
      </div>
    </div>
  );
}
