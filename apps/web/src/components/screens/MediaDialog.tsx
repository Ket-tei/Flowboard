import { useTranslation } from "react-i18next";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CalendarDays, Copy, MonitorPlay, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SortableMediaCard } from "./SortableMediaCard";
import { MediaPlaceholder } from "./MediaPlaceholder";
import type { ScreenRow, ScreenItem } from "@/types/screen.types";
import type { LocalItem, PendingItem } from "@/hooks/useMediaDialog";
import { isPendingItem } from "@/hooks/useMediaDialog";
import type { DragEndEvent } from "@dnd-kit/core";

function PendingMediaCard({
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
    <div className="relative flex shrink-0 flex-col gap-2 rounded-xl border border-dashed border-border/60 bg-muted/20 p-2 opacity-70 w-36">
      <div className="flex h-24 items-center justify-center overflow-hidden rounded-lg bg-muted/40">
        {isVideo ? (
          <video src={item.previewUrl} className="h-full w-full object-cover" muted />
        ) : (
          <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="flex items-center gap-1">
        <input
          type="number"
          min={100}
          step={500}
          value={item.durationMs}
          onChange={(e) => onUpdateDuration(item.localId, Number(e.target.value))}
          className="h-7 w-full rounded-lg border border-border/60 bg-transparent px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <span className="text-[10px] text-muted-foreground shrink-0">ms</span>
      </div>
      <button
        type="button"
        onClick={() => onDelete(item.localId)}
        className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-destructive/80 text-destructive-foreground text-xs hover:bg-destructive"
      >
        ✕
      </button>
    </div>
  );
}

export function MediaDialog({
  screen,
  items,
  itemIds,
  fileInputRef,
  editedName,
  hasChanges,
  saving,
  onClose,
  onDragEnd,
  onDeleteItem,
  onUpdateDuration,
  onUploadFiles,
  onEditName,
  onSave,
  onCopyUrl,
  onChangeMode,
}: {
  screen: ScreenRow | null;
  items: LocalItem[];
  itemIds: string[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  editedName: string;
  hasChanges: boolean;
  saving: boolean;
  onClose: () => void;
  onDragEnd: (e: DragEndEvent) => void;
  onDeleteItem: (id: number | string) => void;
  onUpdateDuration: (id: number | string, ms: number) => void;
  onUploadFiles: (files: FileList | File[]) => void;
  onEditName: (name: string) => void;
  onSave: () => void;
  onCopyUrl: (token: string) => void;
  onChangeMode?: (mode: "QUICK" | "TEMPLATE") => void;
}) {
  const { t } = useTranslation();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  return (
    <Dialog open={!!screen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex h-[85vh] w-[95vw] max-w-[95vw] flex-col gap-0 overflow-hidden rounded-2xl border-border/60 p-0 shadow-xl md:w-[80vw] md:max-w-[80vw]">
        <DialogHeader className="shrink-0 border-b border-border/40 px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-base font-semibold">
              {t("screens.dialogTitle")}
            </DialogTitle>
            {onChangeMode && (
              <div className="flex overflow-hidden rounded-lg border border-border/60 text-xs">
                <button
                  type="button"
                  onClick={() => onChangeMode("QUICK")}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground font-medium"
                >
                  <MonitorPlay className="size-3.5" />
                  {t("screens.modeQuick")}
                </button>
                <button
                  type="button"
                  onClick={() => onChangeMode("TEMPLATE")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-muted-foreground hover:bg-muted/60 transition-colors"
                >
                  <CalendarDays className="size-3.5" />
                  {t("screens.modeTemplate")}
                </button>
              </div>
            )}
          </div>
        </DialogHeader>

        {screen && (
          <div className="flex min-h-0 flex-1 flex-col">
            {/* Name + copy URL bar */}
            <div className="flex flex-wrap items-center gap-3 border-b border-border/40 px-8 py-4">
              <div className="flex flex-1 items-center gap-0 overflow-hidden rounded-xl border border-border/60 bg-muted/30 transition-shadow focus-within:ring-2 focus-within:ring-ring/30">
                <Input
                  value={editedName}
                  className="h-10 flex-1 border-0 bg-transparent px-4 shadow-none focus-visible:ring-0"
                  onChange={(e) => onEditName(e.target.value)}
                />
                <button
                  type="button"
                  className="flex h-10 shrink-0 items-center gap-1.5 border-l border-border/40 bg-muted/40 px-4 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  onClick={() => onCopyUrl(screen.publicToken)}
                >
                  <Copy className="size-3.5" />
                  <span className="hidden sm:inline">{t("screens.copyUrl")}</span>
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,video/*,.gif"
                multiple
                onChange={(e) => {
                  if (e.target.files?.length) onUploadFiles(e.target.files);
                }}
              />
            </div>

            {/* Media grid */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(ev) => void onDragEnd(ev)}
            >
              <SortableContext items={itemIds} strategy={horizontalListSortingStrategy}>
                <div className="no-scrollbar flex min-h-0 flex-1 items-start gap-3 overflow-x-auto overflow-y-hidden bg-muted/5 px-8 py-4">
                  {items.map((it) =>
                    isPendingItem(it) ? (
                      <PendingMediaCard
                        key={it.localId}
                        item={it}
                        onUpdateDuration={(id, ms) => onUpdateDuration(id, ms)}
                        onDelete={(id) => onDeleteItem(id)}
                      />
                    ) : (
                      <SortableMediaCard
                        key={it.id}
                        item={it as ScreenItem}
                        token={screen.publicToken}
                        onUpdateDuration={(id, ms) => void onUpdateDuration(id, ms)}
                        onDelete={(id) => void onDeleteItem(id)}
                      />
                    )
                  )}
                  <MediaPlaceholder
                    onFileSelect={() => fileInputRef.current?.click()}
                    onFileDrop={(files) => void onUploadFiles(files)}
                  />
                </div>
              </SortableContext>
            </DndContext>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-end border-t border-border/40 bg-muted/20 px-8 py-3.5">
              <Button
                type="button"
                className="h-10 gap-2 rounded-full px-6 text-sm font-medium"
                disabled={!hasChanges || saving}
                onClick={() => void onSave()}
              >
                <Save className="size-4" />
                {saving ? t("common.loading") : t("accounts.save")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
