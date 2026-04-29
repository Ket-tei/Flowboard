import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import type { ScreenRow, ScreenItem, TransitionType } from "@/types/screen.types";

export type PendingItem = {
  localId: string;
  file: File;
  previewUrl: string;
  durationMs: number;
  transitionType: TransitionType;
};

export type LocalItem = ScreenItem | PendingItem;

export function isPendingItem(item: LocalItem): item is PendingItem {
  return "localId" in item;
}

function buildItemsApiBase(screenId: number): string {
  return `/api/screens/${screenId}/items`;
}

export function useMediaDialog(onTreeChanged: () => Promise<void>) {
  const { t } = useTranslation();
  const [dialogScreen, setDialogScreen] = useState<ScreenRow | null>(null);
  const [localItems, setLocalItems] = useState<LocalItem[]>([]);
  const [originalItems, setOriginalItems] = useState<ScreenItem[]>([]);
  const [editedName, setEditedName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [saving, setSaving] = useState(false);
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
    }
    return false;
  }, [editedName, originalName, localItems, originalItems]);

  const openDialog = useCallback(async (s: ScreenRow) => {
    setDialogScreen(s);
    setLocalItems([]);
    setOriginalItems([]);
    setEditedName(s.name);
    setOriginalName(s.name);
    const r = await apiFetch<{ screen: ScreenRow; items: ScreenItem[] }>(`/api/screens/${s.id}`);
    const sorted = r.items.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    setDialogScreen(r.screen);
    setLocalItems(sorted);
    setOriginalItems(sorted);
    setEditedName(r.screen.name);
    setOriginalName(r.screen.name);
  }, []);

  function closeDialog() {
    // Revoke any pending preview URLs
    setLocalItems((prev) => {
      for (const it of prev) {
        if (isPendingItem(it)) URL.revokeObjectURL(it.previewUrl);
      }
      return [];
    });
    setDialogScreen(null);
    setOriginalItems([]);
    setEditedName("");
    setOriginalName("");
  }

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

  function uploadFiles(files: FileList | File[]) {
    const newItems: PendingItem[] = Array.from(files).map((file) => ({
      localId: `pending-${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      durationMs: 5000,
      transitionType: "NONE",
    }));
    setLocalItems((prev) => [...prev, ...newItems]);
  }

  async function saveChanges() {
    if (!dialogScreen) return;
    setSaving(true);
    try {
      const screenId = dialogScreen.id;
      const base = buildItemsApiBase(screenId);

      // 1. Upload pending files → replace pending items with real items
      const uploadedMap = new Map<string, ScreenItem>();
      for (const it of localItems) {
        if (!isPendingItem(it)) continue;
        const fd = new FormData();
        fd.append("file", it.file);
        const created = await apiFetch<ScreenItem>(`${base}?durationMs=${it.durationMs}`, {
          method: "POST",
          body: fd,
        });
        uploadedMap.set(it.localId, { ...created, durationMs: it.durationMs });
      }

      // Resolve final list of real items in current order
      const finalItems: ScreenItem[] = localItems
        .map((it) => {
          if (isPendingItem(it)) return uploadedMap.get(it.localId) ?? null;
          return it;
        })
        .filter((it): it is ScreenItem => it !== null);

      // 2. Delete items removed by user
      const finalIds = new Set(finalItems.map((i) => i.id));
      for (const orig of originalItems) {
        if (!finalIds.has(orig.id)) {
          await apiFetch(`${base}/${orig.id}`, { method: "DELETE" });
        }
      }

      // 3. Update durations that changed (only for original items)
      const origDurMap = new Map(originalItems.map((i) => [i.id, i.durationMs]));
      for (const it of finalItems) {
        if (origDurMap.has(it.id) && origDurMap.get(it.id) !== it.durationMs) {
          await apiFetch(`${base}/${it.id}`, {
            method: "PATCH",
            body: JSON.stringify({ durationMs: it.durationMs }),
          });
        }
      }

      // 4. Reorder if needed
      if (finalItems.length > 0) {
        await apiFetch(`${base}/order`, {
          method: "PATCH",
          body: JSON.stringify({ orderedIds: finalItems.map((i) => i.id) }),
        });
      }

      // 5. Save name if changed
      const trimmed = editedName.trim();
      if (trimmed && trimmed !== originalName) {
        await apiFetch(`/api/screens/${screenId}`, {
          method: "PATCH",
          body: JSON.stringify({ name: trimmed }),
        });
        setOriginalName(trimmed);
        setDialogScreen((prev) => (prev ? { ...prev, name: trimmed } : prev));
      }

      toast.success(t("screens.saved"));
      await onTreeChanged();

      // Reload fresh state
      const r = await apiFetch<{ screen: ScreenRow; items: ScreenItem[] }>(`/api/screens/${screenId}`);
      const sorted = r.items.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
      setDialogScreen(r.screen);
      setLocalItems(sorted);
      setOriginalItems(sorted);
      setEditedName(r.screen.name);
      setOriginalName(r.screen.name);
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
    openDialog,
    closeDialog,
    setDialogScreen,
    onDragEnd,
    deleteItem,
    updateItemDuration,
    updateItemTransition,
    uploadFiles,
    saveChanges,
  } as const;
}
