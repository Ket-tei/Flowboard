import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import type { ScreenRow, ScreenItem } from "@/types/screen.types";

export function useMediaDialog(onTreeChanged: () => Promise<void>) {
  const { t } = useTranslation();
  const [dialogScreen, setDialogScreen] = useState<ScreenRow | null>(null);
  const [dialogItems, setDialogItems] = useState<ScreenItem[]>([]);
  const [editedName, setEditedName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const itemIds = useMemo(() => dialogItems.map((i) => i.id), [dialogItems]);

  const hasNameChanged = editedName.trim() !== "" && editedName.trim() !== originalName;

  const openDialog = useCallback(async (s: ScreenRow) => {
    setDialogScreen(s);
    setDialogItems([]);
    setEditedName(s.name);
    setOriginalName(s.name);
    const r = await apiFetch<{ screen: ScreenRow; items: ScreenItem[] }>(`/api/screens/${s.id}`);
    setDialogScreen(r.screen);
    setDialogItems(r.items.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id));
    setEditedName(r.screen.name);
    setOriginalName(r.screen.name);
  }, []);

  function closeDialog() {
    setDialogScreen(null);
    setDialogItems([]);
    setEditedName("");
    setOriginalName("");
  }

  async function onDragEnd(e: DragEndEvent) {
    if (!dialogScreen) return;
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = itemIds.indexOf(Number(active.id));
    const newIndex = itemIds.indexOf(Number(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(dialogItems, oldIndex, newIndex);
    setDialogItems(next);
    await apiFetch(`/api/screens/${dialogScreen.id}/items/order`, {
      method: "PATCH",
      body: JSON.stringify({ orderedIds: next.map((x) => x.id) }),
    });
    toast.success(t("screens.mediaOrderSaved"));
  }

  async function deleteItem(id: number) {
    if (!dialogScreen) return;
    setDialogItems((prev) => prev.filter((x) => x.id !== id));
    await apiFetch(`/api/screens/${dialogScreen.id}/items/${id}`, { method: "DELETE" });
    toast.success(t("screens.mediaDeleted"));
  }

  async function updateItemDuration(itemId: number, durationMs: number) {
    if (!dialogScreen) return;
    setDialogItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, durationMs } : it)));
    await apiFetch(`/api/screens/${dialogScreen.id}/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ durationMs }),
    });
    toast.success(t("screens.mediaDurationUpdated"));
  }

  async function uploadFiles(files: FileList | File[]) {
    if (!dialogScreen) return;
    for (const f of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", f);
      await apiFetch(`/api/screens/${dialogScreen.id}/items?durationMs=5000`, {
        method: "POST",
        body: fd,
      });
    }
    toast.success(t("screens.mediaAdded"));
    await openDialog(dialogScreen);
  }

  async function saveChanges() {
    if (!dialogScreen) return;
    if (!hasNameChanged) return;
    const trimmed = editedName.trim();
    if (!trimmed) return;
    await apiFetch(`/api/screens/${dialogScreen.id}`, {
      method: "PATCH",
      body: JSON.stringify({ name: trimmed }),
    });
    setOriginalName(trimmed);
    setDialogScreen((prev) => (prev ? { ...prev, name: trimmed } : prev));
    toast.success(t("screens.screenNameUpdated"));
    await onTreeChanged();
  }

  return {
    dialogScreen,
    dialogItems,
    itemIds,
    fileInputRef,
    editedName,
    setEditedName,
    hasNameChanged,
    openDialog,
    closeDialog,
    setDialogScreen,
    onDragEnd,
    deleteItem,
    updateItemDuration,
    uploadFiles,
    saveChanges,
  } as const;
}
