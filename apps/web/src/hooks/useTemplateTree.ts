import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/auth-context";
import { useTreeManager } from "@/hooks/useTreeManager";

export function useTemplateTree() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const manager = useTreeManager({
    treeUrl: "/api/template-folders/tree",
    folderBaseUrl: "/api/template-folders",
    itemCreateUrl: (folderId) => `/api/template-folders/${folderId}/templates`,
    itemBaseUrl: (id) => `/api/templates/${id}`,
    newItemBody: () => ({ name: t("templates.newDefault") }),
    buildItemResult: (created, folderId) => ({
      id: created.id,
      folderId,
      name: t("templates.newDefault"),
      publicToken: `tpl-${created.id}`,
      revision: 0,
      sortOrder: 0,
      displayMode: "QUICK" as const,
      slideshowPath: "",
    }),
    i18n: {
      folderCreated: t("templates.folderCreated"),
      folderDeleted: t("templates.folderDeleted"),
      folderMoved: t("screens.folderMoved"),
      itemCreated: t("templates.created"),
      itemDeleted: t("templates.deleted"),
      itemMoved: t("screens.screenMoved"),
      noFolder: t("screens.noFolder"),
    },
  });

  useEffect(() => {
    void manager.loadTree();
  }, [manager.loadTree]);

  const onDropOnFolder = (e: React.DragEvent, folderId: number) =>
    manager.onDropOnFolder(e, folderId, isAdmin);

  return {
    ...manager,
    isAdmin,
    createScreen: manager.createItem,
    copyUrl: (_token: string) => Promise.resolve(),
    onDropOnFolder,
  } as const;
}
