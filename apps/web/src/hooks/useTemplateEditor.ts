import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import type { ScreenRow, ScreenItem, TransitionType, TemplateWidget } from "@/types/screen.types";
import type { LocalItem, PendingItem } from "@/hooks/useMediaDialog";
import { isPendingItem } from "@/hooks/useMediaDialog";

export function useTemplateEditor(onTreeChanged: () => Promise<void>) {
  const { t } = useTranslation();
  const [dialogScreen, setDialogScreen] = useState<ScreenRow | null>(null);
  const [localItems, setLocalItems] = useState<LocalItem[]>([]);
  const [originalItems, setOriginalItems] = useState<ScreenItem[]>([]);
  const [editedName, setEditedName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [saving, setSaving] = useState(false);
  const [widgets, setWidgets] = useState<TemplateWidget[]>([]);
  const [originalWidgets, setOriginalWidgets] = useState<TemplateWidget[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const itemIds = useMemo(
    () => localItems.map((i) => (isPendingItem(i) ? i.localId : String(i.id))),
    [localItems]
  );

  const hasChanges = useMemo(() => {
    if (editedName.trim() !== "" && editedName.trim() !== originalName) return true;
    if (localItems.some(isPendingItem)) return true;
    const localReal = localItems.filter((i): i is ScreenItem => !isPendingItem(i));
    if (localReal.length !== originalItems.length) return true;
    for (let i = 0; i < localReal.length; i++) {
      if (localReal[i].id !== originalItems[i]?.id) return true;
      if (localReal[i].durationMs !== originalItems[i]?.durationMs) return true;
      if ((localReal[i].transitionType ?? "NONE") !== (originalItems[i]?.transitionType ?? "NONE")) return true;
      if ((localReal[i].transitionDurationMs ?? 350) !== (originalItems[i]?.transitionDurationMs ?? 350)) return true;
    }
    if (widgets.length !== originalWidgets.length) return true;
    for (let i = 0; i < widgets.length; i++) {
      const w = widgets[i];
      const o = originalWidgets[i];
      if (!o || w.id !== o.id) return true;
      if (w.x !== o.x || w.y !== o.y || w.w !== o.w || w.h !== o.h) return true;
      if (w.startMs !== o.startMs || w.endMs !== o.endMs) return true;
    }
    return false;
  }, [editedName, originalName, localItems, originalItems, widgets, originalWidgets]);

  const loadTemplate = useCallback(async (templateId: number) => {
    setLoading(true);
    try {
      const r = await apiFetch<{ screen: ScreenRow; items: ScreenItem[]; widgets: TemplateWidget[] }>(`/api/templates/${templateId}`);
      const sorted = r.items.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
      setDialogScreen(r.screen);
      setLocalItems(sorted);
      setOriginalItems(sorted);
      setEditedName(r.screen.name);
      setOriginalName(r.screen.name);
      setWidgets(r.widgets ?? []);
      setOriginalWidgets(r.widgets ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = itemIds.indexOf(String(active.id));
    const newIndex = itemIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    setLocalItems((prev) => arrayMove(prev, oldIndex, newIndex));
  }

  function deleteItem(id: number | string) {
    setLocalItems((prev) => {
      const item = prev.find((i) => (isPendingItem(i) ? i.localId === id : i.id === id));
      if (item && isPendingItem(item)) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => (isPendingItem(i) ? i.localId !== id : i.id !== id));
    });
  }

  function updateItemDuration(id: number | string, durationMs: number) {
    setLocalItems((prev) =>
      prev.map((it) => {
        if (isPendingItem(it)) return it.localId === id ? { ...it, durationMs } : it;
        return it.id === id ? { ...it, durationMs } : it;
      })
    );
  }

  function updateItemTransition(id: number | string, transitionType: TransitionType) {
    setLocalItems((prev) =>
      prev.map((it) => {
        if (isPendingItem(it)) return it.localId === id ? { ...it, transitionType } : it;
        return it.id === id ? { ...it, transitionType } : it;
      })
    );
  }

  function updateItemTransitionDuration(id: number | string, transitionDurationMs: number) {
    setLocalItems((prev) =>
      prev.map((it) => {
        if (isPendingItem(it)) return it.localId === id ? { ...it, transitionDurationMs } : it;
        return it.id === id ? { ...it, transitionDurationMs } : it;
      })
    );
  }

  function uploadFiles(files: FileList | File[]) {
    const newItems: PendingItem[] = Array.from(files).map((file) => ({
      localId: `pending-${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      durationMs: 5000,
      transitionType: "NONE" as TransitionType,
      transitionDurationMs: 350,
    }));
    setLocalItems((prev) => [...prev, ...newItems]);
  }

  function updateWidgetGeometry(id: number, geom: { x: number; y: number; w: number; h: number }) {
    setWidgets((prev) => prev.map((widget) => (widget.id === id ? { ...widget, ...geom } : widget)));
  }

  function updateWidgetTiming(id: number, timing: { startMs: number | null; endMs: number | null }) {
    setWidgets((prev) => prev.map((widget) => (widget.id === id ? { ...widget, ...timing } : widget)));
  }

  async function addWidget(widget: Omit<TemplateWidget, "id">) {
    if (!dialogScreen) return;
    const created = await apiFetch<TemplateWidget>(`/api/templates/${dialogScreen.id}/widgets`, {
      method: "POST",
      body: JSON.stringify({
        type: widget.type,
        config: widget.config,
        x: widget.x,
        y: widget.y,
        w: widget.w,
        h: widget.h,
        startMs: widget.startMs,
        endMs: widget.endMs,
      }),
    });
    setWidgets((prev) => [...prev, created]);
    setOriginalWidgets((prev) => [...prev, created]);
  }

  async function removeWidget(widgetId: number) {
    if (!dialogScreen) return;
    await apiFetch(`/api/templates/${dialogScreen.id}/widgets/${widgetId}`, { method: "DELETE" });
    setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
    setOriginalWidgets((prev) => prev.filter((w) => w.id !== widgetId));
  }

  async function saveChanges() {
    if (!dialogScreen) return;
    setSaving(true);
    try {
      const templateId = dialogScreen.id;
      const base = `/api/templates/${templateId}/items`;

      const uploadedMap = new Map<string, ScreenItem>();
      for (const it of localItems) {
        if (!isPendingItem(it)) continue;
        const fd = new FormData();
        fd.append("file", it.file);
        const params = new URLSearchParams({
          durationMs: String(it.durationMs),
          transitionType: it.transitionType ?? "NONE",
          transitionDurationMs: String(it.transitionDurationMs ?? 350),
        });
        const created = await apiFetch<ScreenItem>(`${base}?${params.toString()}`, {
          method: "POST",
          body: fd,
        });
        uploadedMap.set(it.localId, { ...created, durationMs: it.durationMs, transitionType: it.transitionType, transitionDurationMs: it.transitionDurationMs });
      }

      const finalItems: ScreenItem[] = localItems
        .map((it) => {
          if (isPendingItem(it)) return uploadedMap.get(it.localId) ?? null;
          return it;
        })
        .filter((it): it is ScreenItem => it !== null);

      const finalIds = new Set(finalItems.map((i) => i.id));
      for (const orig of originalItems) {
        if (!finalIds.has(orig.id)) {
          await apiFetch(`${base}/${orig.id}`, { method: "DELETE" });
        }
      }

      const origMap = new Map(originalItems.map((i) => [i.id, i]));
      for (const it of finalItems) {
        const orig = origMap.get(it.id);
        if (!orig) continue;
        const durChanged = orig.durationMs !== it.durationMs;
        const trnChanged = (orig.transitionType ?? "NONE") !== (it.transitionType ?? "NONE");
        const trnDurChanged = (orig.transitionDurationMs ?? 350) !== (it.transitionDurationMs ?? 350);
        if (durChanged || trnChanged || trnDurChanged) {
          await apiFetch(`${base}/${it.id}`, {
            method: "PATCH",
            body: JSON.stringify({
              durationMs: it.durationMs,
              transitionType: it.transitionType ?? "NONE",
              transitionDurationMs: it.transitionDurationMs ?? 350,
            }),
          });
        }
      }

      if (finalItems.length > 0) {
        await apiFetch(`${base}/order`, {
          method: "PATCH",
          body: JSON.stringify({ orderedIds: finalItems.map((i) => i.id) }),
        });
      }

      // Save widget changes
      const origWidgetMap = new Map(originalWidgets.map((w) => [w.id, w]));
      for (const widget of widgets) {
        const orig = origWidgetMap.get(widget.id);
        if (!orig) continue;
        const geomChanged = widget.x !== orig.x || widget.y !== orig.y || widget.w !== orig.w || widget.h !== orig.h;
        const timingChanged = widget.startMs !== orig.startMs || widget.endMs !== orig.endMs;
        if (geomChanged || timingChanged) {
          await apiFetch(`/api/templates/${templateId}/widgets/${widget.id}`, {
            method: "PATCH",
            body: JSON.stringify({ x: widget.x, y: widget.y, w: widget.w, h: widget.h, startMs: widget.startMs, endMs: widget.endMs }),
          });
        }
      }

      const trimmed = editedName.trim();
      if (trimmed && trimmed !== originalName) {
        await apiFetch(`/api/templates/${templateId}`, {
          method: "PATCH",
          body: JSON.stringify({ name: trimmed }),
        });
        setOriginalName(trimmed);
        setDialogScreen((prev) => (prev ? { ...prev, name: trimmed } : prev));
      }

      toast.success(t("screens.saved"));
      await onTreeChanged();

      const r = await apiFetch<{ screen: ScreenRow; items: ScreenItem[]; widgets: TemplateWidget[] }>(`/api/templates/${templateId}`);
      const sorted = r.items.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
      setDialogScreen(r.screen);
      setLocalItems(sorted);
      setOriginalItems(sorted);
      setEditedName(r.screen.name);
      setOriginalName(r.screen.name);
      setWidgets(r.widgets ?? []);
      setOriginalWidgets(r.widgets ?? []);
    } finally {
      setSaving(false);
    }
  }

  return {
    dialogScreen,
    localItems,
    itemIds,
    fileInputRef,
    editedName,
    setEditedName,
    hasChanges,
    saving,
    loading,
    widgets,
    loadTemplate,
    onDragEnd,
    deleteItem,
    updateItemDuration,
    updateItemTransition,
    updateItemTransitionDuration,
    uploadFiles,
    updateWidgetGeometry,
    updateWidgetTiming,
    addWidget,
    removeWidget,
    saveChanges,
  } as const;
}
