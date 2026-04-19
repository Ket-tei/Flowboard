import { useTranslation } from "react-i18next";
import { Upload } from "lucide-react";

export function MediaPlaceholder({
  onFileSelect,
  onFileDrop,
}: {
  onFileSelect: () => void;
  onFileDrop: (files: FileList) => void;
}) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className="flex h-36 w-48 shrink-0 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/60 bg-muted/10 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/20 hover:text-foreground"
      onClick={onFileSelect}
      onDragOver={(e) => {
        if (Array.from(e.dataTransfer.types).includes("Files")) e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (e.dataTransfer.files?.length) onFileDrop(e.dataTransfer.files);
      }}
    >
      <Upload className="size-5 opacity-50" />
      <span className="text-xs font-medium">{t("screens.dragDrop")}</span>
      <span className="text-[10px]">{t("screens.orClickToAdd")}</span>
    </button>
  );
}
