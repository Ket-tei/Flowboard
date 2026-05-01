import { useTranslation } from "react-i18next";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Upload } from "lucide-react";
import type { DragEndEvent } from "@dnd-kit/core";
import { apiUrl } from "@/lib/api";
import { PX_PER_MS, MIN_DURATION_MS, TRACK_LABEL_W, msToLabel } from "@/lib/timeline";
import type { ScreenItem, TemplateWidget, TransitionType } from "@/types/screen.types";
import type { LocalItem } from "@/hooks/useMediaDialog";
import { isPendingItem } from "@/hooks/useMediaDialog";
import { ResizableBlock } from "./ResizableBlock";
import { InlineTransitionBlock } from "./InlineTransitionBlock";
import { WidgetTrack } from "./WidgetTrack";
import { TimeRuler } from "./TimeRuler";

const MEDIA_COLORS: Record<string, string> = {
  IMAGE: "oklch(0.50 0.14 252)",
  VIDEO: "oklch(0.50 0.15 155)",
  GIF: "oklch(0.58 0.15 80)",
};

function getMediaColor(item: LocalItem): string {
  if (isPendingItem(item)) {
    const isVideo = item.file.type.startsWith("video/");
    return isVideo ? MEDIA_COLORS.VIDEO : MEDIA_COLORS.IMAGE;
  }
  return MEDIA_COLORS[item.type] ?? "var(--primary)";
}

function SortableMediaBlock({
  item,
  templateId,
  onResize,
}: {
  item: LocalItem;
  templateId: number;
  onResize: (id: number | string, newPx: number) => void;
}) {
  const itemKey = isPendingItem(item) ? item.localId : String(item.id);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: itemKey,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const durationMs = item.durationMs;
  const widthPx = Math.max(MIN_DURATION_MS * PX_PER_MS, durationMs * PX_PER_MS);
  const color = getMediaColor(item);

  let label = "";
  let sublabel = "";

  if (isPendingItem(item)) {
    label = item.file.name;
    sublabel = `Pending · ${msToLabel(durationMs)}`;
  } else {
    const src = apiUrl(`/api/public/templates/${templateId}/media/${item.id}`);
    label = src.split("/").pop() ?? "media";
    sublabel = `${item.type} · ${msToLabel(durationMs)}`;
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <ResizableBlock
        widthPx={widthPx}
        color={color}
        label={label}
        sublabel={sublabel}
        onResize={(newW) => onResize(isPendingItem(item) ? item.localId : item.id, newW)}
      >
        <div style={{ overflow: "hidden", flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {label}
          </div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.65)", whiteSpace: "nowrap" }}>
            {sublabel}
          </div>
        </div>
        {/* Drag handle */}
        <div
          {...listeners}
          style={{
            flexShrink: 0,
            cursor: "grab",
            color: "rgba(255,255,255,0.5)",
            padding: "0 2px",
            display: "flex",
            alignItems: "center",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
            <circle cx="2" cy="2" r="1.5" />
            <circle cx="8" cy="2" r="1.5" />
            <circle cx="2" cy="7" r="1.5" />
            <circle cx="8" cy="7" r="1.5" />
            <circle cx="2" cy="12" r="1.5" />
            <circle cx="8" cy="12" r="1.5" />
          </svg>
        </div>
      </ResizableBlock>
    </div>
  );
}

function assignTrackIndices(widgets: TemplateWidget[], totalMs: number): Map<number, number> {
  const sorted = [...widgets].sort((a, b) => (a.startMs ?? 0) - (b.startMs ?? 0));
  const trackEnds: number[] = [];
  const result = new Map<number, number>();

  for (const w of sorted) {
    const start = w.startMs ?? 0;
    const end = w.endMs ?? totalMs;
    let placed = false;
    for (let t = 0; t < trackEnds.length; t++) {
      if (start >= trackEnds[t]) {
        trackEnds[t] = end;
        result.set(w.id, t);
        placed = true;
        break;
      }
    }
    if (!placed) {
      result.set(w.id, trackEnds.length);
      trackEnds.push(end);
    }
  }

  return result;
}

interface TimelineProps {
  items: LocalItem[];
  itemIds: string[];
  templateId: number;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  widgets: TemplateWidget[];
  totalDurationMs: number;
  onDragEnd: (e: DragEndEvent) => void;
  onUpdateDuration: (id: number | string, ms: number) => void;
  onUpdateTransition: (id: number | string, type: TransitionType) => void;
  onUpdateTransitionDuration: (id: number | string, ms: number) => void;
  onUploadFiles: (files: FileList | File[]) => void;
  onUpdateWidgetTiming: (id: number, timing: { startMs: number | null; endMs: number | null }) => void;
  onRemoveWidget: (id: number) => void;
  onAddWidget: (widget: Omit<TemplateWidget, "id">) => Promise<void>;
}

export function Timeline({
  items,
  itemIds,
  templateId,
  fileInputRef,
  widgets,
  totalDurationMs,
  onDragEnd,
  onUpdateDuration,
  onUpdateTransition,
  onUpdateTransitionDuration,
  onUploadFiles,
  onUpdateWidgetTiming,
  onRemoveWidget,
  onAddWidget,
}: TimelineProps) {
  const { t } = useTranslation();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const trackAssignments = assignTrackIndices(widgets, totalDurationMs);
  const trackCount = trackAssignments.size > 0 ? Math.max(...trackAssignments.values()) + 1 : 0;
  const trackList: TemplateWidget[][] = Array.from({ length: trackCount + 1 }, () => []);

  for (const w of widgets) {
    const ti = trackAssignments.get(w.id) ?? 0;
    trackList[ti].push(w);
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) onUploadFiles(e.dataTransfer.files);
  };

  return (
    <div
      style={{
        flexShrink: 0,
        background: "var(--card)",
        borderTop: "1px solid var(--border)",
        overflowX: "auto",
        overflowY: "visible",
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <TimeRuler totalDurationMs={totalDurationMs} />

      {/* Media track */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          minHeight: 64,
          padding: "8px 0",
          borderBottom: "1px solid color-mix(in oklch, var(--border), transparent 60%)",
        }}
      >
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
          {t("templateEditor.mediaLabel")}
        </div>

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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={itemIds} strategy={horizontalListSortingStrategy}>
              {items.map((item, idx) => {
                const isLast = idx === items.length - 1;
                const nextItem = items[idx + 1];
                const showTransition =
                  !isLast &&
                  !isPendingItem(item) &&
                  nextItem &&
                  !isPendingItem(nextItem);

                return (
                  <div
                    key={isPendingItem(item) ? item.localId : String(item.id)}
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <SortableMediaBlock
                      item={item}
                      templateId={templateId}
                      onResize={(id, newPx) =>
                        onUpdateDuration(id, Math.max(MIN_DURATION_MS, Math.round(newPx / PX_PER_MS)))
                      }
                    />
                    {showTransition && !isPendingItem(item) && nextItem && !isPendingItem(nextItem) && (
                      <InlineTransitionBlock
                        transitionType={(nextItem as ScreenItem).transitionType ?? "NONE"}
                        transitionDurationMs={(nextItem as ScreenItem).transitionDurationMs ?? 350}
                        onChangeType={(type) =>
                          onUpdateTransition((nextItem as ScreenItem).id, type)
                        }
                        onChangeDuration={(ms) =>
                          onUpdateTransitionDuration((nextItem as ScreenItem).id, ms)
                        }
                      />
                    )}
                  </div>
                );
              })}
            </SortableContext>
          </DndContext>

          {/* Upload drop / click zone */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              height: 44,
              minWidth: 80,
              flexShrink: 0,
              border: "2px dashed var(--border)",
              borderRadius: 6,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              cursor: "pointer",
              fontSize: 10,
              color: "var(--muted-foreground)",
              background: "transparent",
              transition: "background 0.12s, border-color 0.12s",
              padding: "0 16px",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "color-mix(in oklch, var(--muted), transparent 40%)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <Upload size={14} />
            {t("templateEditor.addMedia")}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files?.length) onUploadFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {/* Widget tracks */}
      {trackList.map((track, ti) => (
        <WidgetTrack
          key={ti}
          trackIndex={ti}
          widgets={track}
          totalDurationMs={totalDurationMs}
          onUpdateTiming={onUpdateWidgetTiming}
          onRemove={onRemoveWidget}
          onAdd={onAddWidget}
        />
      ))}
    </div>
  );
}
