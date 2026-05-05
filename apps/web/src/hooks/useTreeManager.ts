import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import type { TreeFolder } from "@/types/tree.types";
import type { ScreenRow } from "@/types/screen.types";

type DragPayload =
  | { type: "folder"; id: number }
  | { type: "screen"; id: number };

export type TreeManagerConfig = {
  treeUrl: string;
  folderBaseUrl: string;
  itemCreateUrl: (folderId: number) => string;
  itemBaseUrl: (id: number) => string;
  newItemBody: () => Record<string, unknown>;
  buildItemResult: (created: { id: number; publicToken?: string; slideshowPath?: string }, folderId: number) => ScreenRow;
  i18n: {
    folderCreated: string;
    folderDeleted: string;
    folderMoved: string;
    itemCreated: string;
    itemDeleted: string;
    itemMoved: string;
    noFolder: string;
  };
};

export function useTreeManager(config: TreeManagerConfig) {
  const [tree, setTree] = useState<TreeFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [selectedScreenId, setSelectedScreenId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set());
  const [loading, setLoading] = useState(true);

  const loadTree = useCallback(async () => {
    const r = await apiFetch<{ tree: TreeFolder[] }>(config.treeUrl);
    setTree(r.tree);
    setLoading(false);
  }, [config.treeUrl]);

  useEffect(() => {
    if (tree.length === 0) return;
    setExpanded((prev) => {
      if (prev.size > 0) return prev;
      const next = new Set<number>();
      for (const r of tree) next.add(r.id);
      return next;
    });
  }, [tree]);

  function toggleExpanded(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function pickTargetFolderId(explicit: number | null): number | null {
    if (explicit != null) return explicit;
    if (selectedFolderId != null) return selectedFolderId;
    return tree[0]?.id ?? null;
  }

  async function createFolder(name: string, parentFolderId: number | null) {
    await apiFetch<{ id: number }>(config.folderBaseUrl, {
      method: "POST",
      body: JSON.stringify({ name, parentId: parentFolderId }),
    });
    toast.success(config.i18n.folderCreated);
    await loadTree();
  }

  async function createItem(parentFolderId: number | null): Promise<ScreenRow | null> {
    const parent = pickTargetFolderId(parentFolderId);
    if (parent == null) {
      toast.error(config.i18n.noFolder);
      return null;
    }
    setSelectedFolderId(parent);
    setExpanded((prev) => new Set(prev).add(parent));
    const created = await apiFetch<{ id: number; publicToken?: string; slideshowPath?: string }>(
      config.itemCreateUrl(parent),
      { method: "POST", body: JSON.stringify(config.newItemBody()) }
    );
    toast.success(config.i18n.itemCreated);
    await loadTree();
    return config.buildItemResult(created, parent);
  }

  async function deleteNode(type: "folder" | "screen", id: number) {
    if (type === "folder") {
      await apiFetch(`${config.folderBaseUrl}/${id}`, { method: "DELETE" });
      toast.success(config.i18n.folderDeleted);
    } else {
      await apiFetch(`${config.itemBaseUrl(id)}`, { method: "DELETE" });
      toast.success(config.i18n.itemDeleted);
    }
    await loadTree();
  }

  function onDragStart(e: React.DragEvent, payload: DragPayload) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
  }

  async function onDropOnFolder(e: React.DragEvent, folderId: number, isAdmin: boolean) {
    e.preventDefault();
    if (!isAdmin) return;
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;
    let p: DragPayload | null = null;
    try {
      p = JSON.parse(raw) as DragPayload;
    } catch {
      return;
    }
    if (!p || typeof p !== "object") return;
    if (p.type === "folder") {
      if (p.id === folderId) return;
      await apiFetch(`${config.folderBaseUrl}/${p.id}`, {
        method: "PATCH",
        body: JSON.stringify({ parentId: folderId }),
      });
      toast.success(config.i18n.folderMoved);
      await loadTree();
    } else if (p.type === "screen") {
      await apiFetch(`${config.itemBaseUrl(p.id)}`, {
        method: "PATCH",
        body: JSON.stringify({ folderId }),
      });
      toast.success(config.i18n.itemMoved);
      await loadTree();
    }
  }

  return {
    tree,
    loading,
    expanded,
    selectedFolderId,
    selectedScreenId,
    setSelectedFolderId,
    setSelectedScreenId,
    toggleExpanded,
    loadTree,
    createFolder,
    createItem,
    deleteNode,
    onDragStart,
    onDropOnFolder,
    pickTargetFolderId,
  } as const;
}
