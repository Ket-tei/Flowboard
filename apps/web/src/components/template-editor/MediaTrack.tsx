import { useRef } from "react";
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
import { GripVertical, Trash2, Upload } from "lucide-react";
import { apiUrl } from "@/lib/api";
import type { ScreenItem, TransitionType } from "@/types/screen.types";
import type { LocalItem, PendingItem } from "@/hooks/useMediaDialog";
import { isPendingItem } from "@/hooks/useMediaDialog";
import type { DragEndEvent } from "@dnd-kit/core";
import { TransitionBlock } from "./TransitionBlock";

function MediaCard({
  item,
  templateId,
  onUpdateDuration,
  onDelete,
}: {
  item: ScreenItem;
  templateId: number;
  onUpdateDuration: (id: number, ms: number) => void;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(item.id),
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const src = apiUrl(`/api/public/templates/${templateId}/media/${item.id}`);
  const isVideo = item.type === "VIDEO";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative flex w-36 shrink-0 flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm ${isDragging ? "opacity-60" : ""}`}
    >
      <button
        type="button"
        className="absolute left-1.5 top-1.5 z-10 cursor-grab touch-none rounded-md bg-card/80 p-0.5 text-muted-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3" />
      </button>
      {isVideo ? (
        <video src={src} className="h-24 w-full object-cover" muted playsInline />
      ) : (
        <img src={src} alt="" className="h-24 w-full object-cover" />
      )}
      <div className="flex items-center gap-1 bg-card px-1.5 py-1">
        <span className="text-muted-foreground text-[9px]">ms</span>
        <input
          type="number"
          min={100}
          step={500}
          value={item.durationMs}
          onChange={(e) => onUpdateDuration(item.id, Number(e.target.value))}
          className="h-5 flex-1 rounded border border-border/60 bg-transparent px-1 text-[10px] focus:outline-none"
        />
      </div>
      <button
        type="button"
        className="absolute right-1.5 top-1.5 z-10 flex size-5 items-center justify-center rounded-md bg-card/80 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
        onClick={() => onDelete(item.id)}
      >
        <Trash2 className="size-2.5" />
      </button>
    </div>
  );
}

function PendingCard({
  item,
  onUpdateDuration,
  onDelete,
}: {
  item: PendingItem;
  onUpdateDuration: (id: string, ms: number) => void;
  onDelete: (id: string) => void;
}) {
  const isVideo = item.file.type.startsWith("video/");
  return (
    <div className="relative flex w-36 shrink-0 flex-col overflow-hidden rounded-xl border border-dashed border-border/60 bg-muted/20 opacity-70">
      {isVideo ? (
        <video src={item.previewUrl} className="h-24 w-full object-cover" muted playsInline />
      ) : (
        <img src={item.previewUrl} alt="" className="h-24 w-full object-cover" />
      )}
      <div className="flex items-center gap-1 bg-card px-1.5 py-1">
        <span className="text-muted-foreground text-[9px]">ms</span>
        <input
          type="number"
          min={100}
          step={500}
          value={item.durationMs}
          onChange={(e) => onUpdateDuration(item.localId, Number(e.target.value))}
          className="h-5 flex-1 rounded border border-border/60 bg-transparent px-1 text-[10px] focus:outline-none"
        />
      </div>
      <button
        type="button"
        className="absolute right-1.5 top-1.5 z-10 flex size-5 items-center justify-center rounded-md bg-card/80 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
        onClick={() => onDelete(item.localId)}
      >
        <Trash2 className="size-2.5" />
      </button>
    </div>
  );
}

export function MediaTrack({
  items,
  itemIds,
  templateId,
  fileInputRef,
  onDragEnd,
  onUpdateDuration,
  onUpdateTransition,
  onUpdateTransitionDuration,
  onDelete,
  onUploadFiles,
}: {
  items: LocalItem[];
  itemIds: string[];
  templateId: number;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onDragEnd: (e: DragEndEvent) => void;
  onUpdateDuration: (id: number | string, ms: number) => void;
  onUpdateTransition: (id: number | string, type: TransitionType) => void;
  onUpdateTransitionDuration: (id: number | string, ms: number) => void;
  onDelete: (id: number | string) => void;
  onUploadFiles: (files: FileList | File[]) => void;
}) {
  const { t } = useTranslation();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const dropRef = useRef<HTMLDivElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) onUploadFiles(e.dataTransfer.files);
  };

  return (
    <div
      ref={dropRef}
      className="flex min-h-[140px] items-end gap-0 overflow-x-auto pb-2"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={itemIds} strategy={horizontalListSortingStrategy}>
          {items.map((item, idx) => {
            const isLast = idx === items.length - 1;
            const nextItem = items[idx + 1];
            const showTransition = !isLast && !isPendingItem(item) && !isPendingItem(nextItem ?? item);

            return (
              <div key={isPendingItem(item) ? item.localId : String(item.id)} className="flex items-end gap-0">
                {isPendingItem(item) ? (
                  <PendingCard
                    item={item}
                    onUpdateDuration={onUpdateDuration}
                    onDelete={onDelete}
                  />
                ) : (
                  <MediaCard
                    item={item}
                    templateId={templateId}
                    onUpdateDuration={onUpdateDuration}
                    onDelete={onDelete}
                  />
                )}
                {showTransition && !isPendingItem(item) && (
                  <div className="flex items-center px-1">
                    <TransitionBlock
                      transitionType={(items[idx + 1] as ScreenItem).transitionType ?? "NONE"}
                      transitionDurationMs={(items[idx + 1] as ScreenItem).transitionDurationMs ?? 350}
                      onChange={(type, dur) => {
                        const nextId = (items[idx + 1] as ScreenItem).id;
                        onUpdateTransition(nextId, type);
                        onUpdateTransitionDuration(nextId, dur);
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </SortableContext>
      </DndContext>

      {/* Upload drop zone */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="ml-2 flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border/60 text-muted-foreground hover:border-border hover:text-foreground transition-colors"
      >
        <Upload className="size-4" />
        <span className="text-[10px]">{t("screens.upload")}</span>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onUploadFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
