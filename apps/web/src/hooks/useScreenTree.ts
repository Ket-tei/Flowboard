import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { TreeFolder } from "@/types/tree.types";
import type { ScreenRow } from "@/types/screen.types";

type DragPayload =
  | { type: "folder"; id: number }
  | { type: "screen"; id: number };

export function useScreenTree() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [tree, setTree] = useState<TreeFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [selectedScreenId, setSelectedScreenId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set());
  const [loading, setLoading] = useState(true);

  const loadTree = useCallback(async () => {
    const r = await apiFetch<{ tree: TreeFolder[] }>("/api/admin/folder-screen-tree");
    setTree(r.tree);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    void loadTree();
  }, [isAdmin, loadTree]);

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

  function fullSlideshowUrl(token: string) {
    return `${window.location.origin}/show/${token}`;
  }

  async function copyUrl(token: string) {
    await navigator.clipboard.writeText(fullSlideshowUrl(token));
    toast.success(t("screens.copied"));
  }

  function pickTargetFolderId(explicit: number | null): number | null {
    if (explicit != null) return explicit;
    if (selectedFolderId != null) return selectedFolderId;
    return tree[0]?.id ?? null;
  }

  async function createFolder(name: string, parentFolderId: number | null) {
    await apiFetch<{ id: number }>("/api/folders", {
      method: "POST",
      body: JSON.stringify({ name, parentId: parentFolderId }),
    });
    toast.success(t("screens.folderCreated"));
    await loadTree();
  }

  async function createScreen(parentFolderId: number | null, displayMode: "QUICK" | "TEMPLATE" = "QUICK"): Promise<ScreenRow | null> {
    const parent = pickTargetFolderId(parentFolderId);
    if (parent == null) {
      toast.error(t("screens.noFolder"));
      return null;
    }
    setSelectedFolderId(parent);
    setExpanded((prev) => new Set(prev).add(parent));
    const created = await apiFetch<{ id: number; publicToken: string; slideshowPath: string }>(
      `/api/folders/${parent}/screens`,
      { method: "POST", body: JSON.stringify({ name: t("screens.newScreenDefault"), displayMode }) }
    );
    toast.success(t("screens.screenCreated"));
    await loadTree();
    return {
      id: created.id,
      folderId: parent,
      name: t("screens.newScreenDefault"),
      publicToken: created.publicToken,
      revision: 0,
      sortOrder: 0,
      displayMode,
      slideshowPath: created.slideshowPath,
    };
  }

  async function updateScreenMode(screenId: number, displayMode: "QUICK" | "TEMPLATE") {
    await apiFetch(`/api/screens/${screenId}`, {
      method: "PATCH",
      body: JSON.stringify({ displayMode }),
    });
    await loadTree();
  }

  async function deleteNode(type: "folder" | "screen", id: number) {
    if (type === "folder") {
      await apiFetch(`/api/folders/${id}`, { method: "DELETE" });
      toast.success(t("screens.folderDeleted"));
    } else {
      await apiFetch(`/api/screens/${id}`, { method: "DELETE" });
      toast.success(t("screens.screenDeleted"));
    }
    await loadTree();
  }

  function onDragStart(e: React.DragEvent, payload: DragPayload) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
  }

  async function onDropOnFolder(e: React.DragEvent, folderId: number) {
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
      await apiFetch(`/api/folders/${p.id}`, {
        method: "PATCH",
        body: JSON.stringify({ parentId: folderId }),
      });
      toast.success(t("screens.folderMoved"));
      await loadTree();
    } else if (p.type === "screen") {
      await apiFetch(`/api/screens/${p.id}`, {
        method: "PATCH",
        body: JSON.stringify({ folderId }),
      });
      toast.success(t("screens.screenMoved"));
      await loadTree();
    }
  }

  return {
    tree,
    loading,
    isAdmin,
    expanded,
    selectedFolderId,
    selectedScreenId,
    setSelectedFolderId,
    setSelectedScreenId,
    toggleExpanded,
    copyUrl,
    loadTree,
    createFolder,
    createScreen,
    updateScreenMode,
    deleteNode,
    onDragStart,
    onDropOnFolder,
    pickTargetFolderId,
  } as const;
}
