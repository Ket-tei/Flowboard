import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScreenPlayer } from "@/components/show/ScreenPlayer";
import type { PlayerItem } from "@/components/show/ScreenPlayer";
import type { TemplateWidget } from "@/types/screen.types";

export function PreviewDialog({
  open,
  onClose,
  items,
  widgets = [],
  title,
}: {
  open: boolean;
  onClose: () => void;
  items: PlayerItem[];
  widgets?: TemplateWidget[];
  title?: string;
}) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[90vh] w-[90vw] max-w-[90vw] flex-col gap-0 overflow-hidden rounded-2xl border-border/60 p-0 shadow-xl"
      >
        <DialogHeader className="shrink-0 border-b border-border/40 px-5 py-2.5">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm font-semibold">
              {title ?? t("screens.preview")}
            </DialogTitle>
            <button
              type="button"
              onClick={onClose}
              className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-sm"
            >
              ✕
            </button>
          </div>
        </DialogHeader>
        <div className="relative min-h-0 flex-1">
          {items.length === 0 ? (
            <div className="flex h-full items-center justify-center bg-black text-white/60 text-sm">
              {t("show.noMedia")}
            </div>
          ) : (
            <ScreenPlayer items={items} widgets={widgets} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
