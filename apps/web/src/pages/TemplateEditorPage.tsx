import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTemplateEditor } from "@/hooks/useTemplateEditor";
import { useTemplateTree } from "@/hooks/useTemplateTree";
import { MediaTrack } from "@/components/template-editor/MediaTrack";
import { WidgetTrackRow } from "@/components/template-editor/WidgetTrackRow";
import { AddWidgetButton } from "@/components/template-editor/AddWidgetButton";
import { LivePreview } from "@/components/template-editor/LivePreview";
import { Splitter } from "@/components/template-editor/Splitter";
import { localItemsToPreview } from "@/lib/preview-items";
import { isPendingItem } from "@/hooks/useMediaDialog";
import type { TransitionType } from "@/types/screen.types";

export function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const tree = useTemplateTree();
  const editor = useTemplateEditor(tree.loadTree);
  const [ratio, setRatio] = useState(0.45);

  const templateId = Number(id);

  useEffect(() => {
    if (!Number.isFinite(templateId)) return;
    void editor.loadTemplate(templateId);
  }, [templateId]);

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
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        …
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border/60 bg-card px-4 py-2.5">
        <button
          type="button"
          onClick={handleBack}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
        </button>

        <Input
          value={editor.editedName}
          onChange={(e) => editor.setEditedName(e.target.value)}
          className="h-8 w-64 rounded-lg text-sm font-medium"
        />

        <span className="text-xs text-muted-foreground">
          {t("templateEditor.totalDuration", { seconds: Math.round(totalDurationMs / 1000) })}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-full px-4 text-xs"
            onClick={handleBack}
          >
            {t("templateEditor.cancel")}
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-8 gap-1.5 rounded-full px-4 text-xs"
            disabled={editor.saving || !editor.hasChanges}
            onClick={() => void editor.saveChanges()}
          >
            <Save className="size-3.5" />
            {editor.saving ? "…" : t("templateEditor.save")}
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        {/* Timeline pane */}
        <div
          className="flex flex-col gap-0 overflow-y-auto border-r border-border/60"
          style={{ width: `${ratio * 100}%` }}
        >
          {/* Media track section */}
          <div className="border-b border-border/40 px-4 py-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("templateEditor.mediaTrack")}
            </p>
            <MediaTrack
              items={editor.localItems}
              itemIds={editor.itemIds}
              templateId={templateId}
              fileInputRef={editor.fileInputRef}
              onDragEnd={editor.onDragEnd}
              onUpdateDuration={editor.updateItemDuration}
              onUpdateTransition={(id, type) => editor.updateItemTransition(id, type as TransitionType)}
              onUpdateTransitionDuration={editor.updateItemTransitionDuration}
              onDelete={editor.deleteItem}
              onUploadFiles={editor.uploadFiles}
            />
          </div>

          {/* Widget tracks section */}
          <div className="px-4 py-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("templateEditor.widgetTracks")}
            </p>
            <div className="flex flex-col gap-1">
              {editor.widgets.map((widget) => (
                <WidgetTrackRow
                  key={widget.id}
                  widget={widget}
                  totalDurationMs={totalDurationMs}
                  onUpdateTiming={editor.updateWidgetTiming}
                  onRemove={(widgetId) => void editor.removeWidget(widgetId)}
                />
              ))}
            </div>
            <div className="mt-3">
              <AddWidgetButton onAdd={(widget) => editor.addWidget(widget)} />
            </div>
          </div>
        </div>

        {/* Splitter */}
        <Splitter onRatioChange={setRatio} />

        {/* Live preview pane */}
        <div className="min-h-0 flex-1 bg-black">
          <LivePreview
            items={previewItems}
            widgets={editor.widgets}
            onWidgetChange={editor.updateWidgetGeometry}
          />
        </div>
      </div>
    </div>
  );
}
