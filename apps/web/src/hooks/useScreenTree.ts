import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { useTreeManager } from "@/hooks/useTreeManager";

export function useScreenTree() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const manager = useTreeManager({
    treeUrl: "/api/admin/folder-screen-tree",
    folderBaseUrl: "/api/folders",
    itemCreateUrl: (folderId) => `/api/folders/${folderId}/screens`,
    itemBaseUrl: (id) => `/api/screens/${id}`,
    newItemBody: () => ({ name: t("screens.newScreenDefault"), displayMode: "QUICK" }),
    buildItemResult: (created, folderId) => ({
      id: created.id,
      folderId,
      name: t("screens.newScreenDefault"),
      publicToken: created.publicToken ?? "",
      revision: 0,
      sortOrder: 0,
      displayMode: "QUICK" as const,
      slideshowPath: created.slideshowPath ?? "",
    }),
    i18n: {
      folderCreated: t("screens.folderCreated"),
      folderDeleted: t("screens.folderDeleted"),
      folderMoved: t("screens.folderMoved"),
      itemCreated: t("screens.screenCreated"),
      itemDeleted: t("screens.screenDeleted"),
      itemMoved: t("screens.screenMoved"),
      noFolder: t("screens.noFolder"),
    },
  });

  useEffect(() => {
    if (!isAdmin) return;
    void manager.loadTree();
  }, [isAdmin, manager.loadTree]);

  function fullSlideshowUrl(token: string) {
    return `${window.location.origin}/show/${token}`;
  }

  async function copyUrl(token: string) {
    await navigator.clipboard.writeText(fullSlideshowUrl(token));
    toast.success(t("screens.copied"));
  }

  async function updateScreenMode(screenId: number, displayMode: "QUICK" | "TEMPLATE") {
    await apiFetch(`/api/screens/${screenId}`, {
      method: "PATCH",
      body: JSON.stringify({ displayMode }),
    });
    await manager.loadTree();
  }

  const onDropOnFolder = (e: React.DragEvent, folderId: number) =>
    manager.onDropOnFolder(e, folderId, isAdmin);

  return {
    ...manager,
    isAdmin,
    createScreen: manager.createItem,
    copyUrl,
    updateScreenMode,
    onDropOnFolder,
  } as const;
}
