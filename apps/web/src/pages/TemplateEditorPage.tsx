import { useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Save } from "lucide-react";
import { useTemplateEditor } from "@/hooks/useTemplateEditor";
import { useTemplateTree } from "@/hooks/useTemplateTree";
import { Timeline } from "@/components/template-editor/Timeline";
import { LivePreview } from "@/components/template-editor/LivePreview";
import { localItemsToPreview } from "@/lib/preview-items";
import { isPendingItem } from "@/hooks/useMediaDialog";
import type { TransitionType } from "@/types/screen.types";
import { msToLabel } from "@/lib/timeline";
import { cn } from "@/lib/utils";

export function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const tree = useTemplateTree();
  const editor = useTemplateEditor(tree.loadTree);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const templateId = Number(id);

  useEffect(() => {
    if (!Number.isFinite(templateId)) return;
    void editor.loadTemplate(templateId);
  }, [templateId]);

  // Ctrl/Cmd + S to save
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (editor.hasChanges && !editor.saving) void editor.saveChanges();
      }
    },
    [editor]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const totalDurationMs = editor.localItems
    .filter((it) => !isPendingItem(it))
    .reduce((acc, it) => acc + (isPendingItem(it) ? 0 : it.durationMs), 0);

  const previewItems = editor.dialogScreen
    ? localItemsToPreview(editor.localItems, { templateId: editor.dialogScreen.id })
    : [];

  const handleBack = () => {
    if (editor.hasChanges) {
      if (!window.confirm(t("templateEditor.unsavedChanges"))) return;
    }
    navigate("/app/templates");
  };

  if (editor.loading) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground text-sm">
        …
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* ── Header ── */}
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border/40 bg-card px-3">
        <button
          type="button"
          onClick={handleBack}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
        </button>

        {/* Inline name input — minimal border until focused */}
        <input
          ref={nameInputRef}
          value={editor.editedName}
          onChange={(e) => editor.setEditedName(e.target.value)}
          className={cn(
            "h-8 min-w-32 max-w-64 rounded-lg bg-transparent px-2 text-sm font-semibold outline-none",
            "border border-transparent focus:border-border focus:bg-muted/30 transition-colors"
          )}
        />

        {/* Duration + dirty indicator */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{msToLabel(totalDurationMs)}</span>
          {editor.hasChanges && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-amber-500/80 inline-block" />
                {t("templateEditor.unsavedIndicator")}
              </span>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {editor.hasChanges && (
            <button
              type="button"
              onClick={handleBack}
              className="h-7 rounded-full border border-border/60 bg-transparent px-3 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              {t("templateEditor.cancel")}
            </button>
          )}
          <button
            type="button"
            disabled={editor.saving || !editor.hasChanges}
            onClick={() => void editor.saveChanges()}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            <Save className="size-3" />
            {editor.saving ? "…" : t("templateEditor.save")}
          </button>
        </div>
      </header>

      {/* ── Preview (flex-1) ── */}
      <div className="min-h-0 flex-1">
        <LivePreview
          items={previewItems}
          widgets={editor.widgets}
          onWidgetChange={editor.updateWidgetGeometry}
        />
      </div>

      {/* ── Timeline ── */}
      <Timeline
        items={editor.localItems}
        itemIds={editor.itemIds}
        templateId={templateId}
        fileInputRef={editor.fileInputRef}
        widgets={editor.widgets}
        totalDurationMs={totalDurationMs}
        onDragEnd={editor.onDragEnd}
        onUpdateDuration={editor.updateItemDuration}
        onUpdateTransition={(id, type) => editor.updateItemTransition(id, type as TransitionType)}
        onUpdateTransitionDuration={editor.updateItemTransitionDuration}
        onUploadFiles={editor.uploadFiles}
        onUpdateWidgetTiming={editor.updateWidgetTiming}
        onRemoveWidget={(widgetId) => void editor.removeWidget(widgetId)}
        onAddWidget={editor.addWidget}
      />
    </div>
  );
}
