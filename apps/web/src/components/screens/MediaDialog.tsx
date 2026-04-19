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
import { Copy, Save } from "lucide-react";
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
import type { DragEndEvent } from "@dnd-kit/core";

export function MediaDialog({
  screen,
  items,
  itemIds,
  fileInputRef,
  editedName,
  hasNameChanged,
  onClose,
  onDragEnd,
  onDeleteItem,
  onUpdateDuration,
  onUploadFiles,
  onEditName,
  onSave,
  onCopyUrl,
}: {
  screen: ScreenRow | null;
  items: ScreenItem[];
  itemIds: number[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  editedName: string;
  hasNameChanged: boolean;
  onClose: () => void;
  onDragEnd: (e: DragEndEvent) => void;
  onDeleteItem: (id: number) => void;
  onUpdateDuration: (id: number, ms: number) => void;
  onUploadFiles: (files: FileList | File[]) => void;
  onEditName: (name: string) => void;
  onSave: () => void;
  onCopyUrl: (token: string) => void;
}) {
  const { t } = useTranslation();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  return (
    <Dialog open={!!screen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex h-[80vh] w-[95vw] max-w-none flex-col gap-0 overflow-hidden rounded-2xl border-border/60 p-0 shadow-xl sm:max-w-none sm:h-[80vh] sm:w-[80vw]">
        <DialogHeader className="shrink-0 border-b border-border/40 px-8 py-4">
          <DialogTitle className="text-base font-semibold">
            {t("screens.dialogTitle")}
          </DialogTitle>
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
                  {items.map((it) => (
                    <SortableMediaCard
                      key={it.id}
                      item={it}
                      token={screen.publicToken}
                      onUpdateDuration={(id, ms) => void onUpdateDuration(id, ms)}
                      onDelete={(id) => void onDeleteItem(id)}
                    />
                  ))}
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
                disabled={!hasNameChanged}
                onClick={() => void onSave()}
              >
                <Save className="size-4" />
                {t("accounts.save")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
