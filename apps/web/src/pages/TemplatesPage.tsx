import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { FolderPlus, LayoutTemplate, Plus } from "lucide-react";
import { useTemplateTree } from "@/hooks/useTemplateTree";
import { FolderRow } from "@/components/screens/FolderRow";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { TreeFolder } from "@/types/tree.types";

type FlatFolder = { id: number; name: string; depth: number };

function flattenTree(folders: TreeFolder[], depth = 0): FlatFolder[] {
  const result: FlatFolder[] = [];
  for (const f of folders) {
    result.push({ id: f.id, name: f.name, depth });
    result.push(...flattenTree(f.children, depth + 1));
  }
  return result;
}

type CreateState = {
  kind: "folder" | "screen";
  parentFolderId: string;
  name: string;
  busy: boolean;
};

export function TemplatesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const tree = useTemplateTree();

  const pendingInputRef = useRef<HTMLInputElement | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createState, setCreateState] = useState<CreateState | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const confirmRef = useRef<{ type: "folder" | "screen"; id: number; label: string } | null>(null);

  const flatFolders = useMemo(() => flattenTree(tree.tree), [tree.tree]);

  function openCreateDialog(kind: "folder" | "screen", preselectedParentId: number | null) {
    if (!tree.isAdmin) return;
    let parentVal: string;
    if (preselectedParentId != null) {
      parentVal = String(preselectedParentId);
    } else if (kind === "screen" && flatFolders.length > 0) {
      parentVal = String(flatFolders[0].id);
    } else {
      parentVal = "__root__";
    }
    setCreateState({
      kind,
      parentFolderId: parentVal,
      name: kind === "folder" ? "" : t("templates.newDefault"),
      busy: false,
    });
    setCreateOpen(true);
    if (kind === "folder") {
      queueMicrotask(() => pendingInputRef.current?.focus());
    }
  }

  async function submitCreate() {
    if (!createState || !tree.isAdmin) return;
    const parentId = createState.parentFolderId === "__root__" ? null : Number(createState.parentFolderId);

    if (createState.kind === "folder") {
      const name = createState.name.trim();
      if (!name) return;
      setCreateState((p) => (p ? { ...p, busy: true } : p));
      try {
        await tree.createFolder(name, parentId);
        if (parentId !== null) tree.toggleExpanded(parentId);
        setCreateOpen(false);
        setCreateState(null);
      } finally {
        setCreateState((p) => (p ? { ...p, busy: false } : p));
      }
    } else {
      setCreateState((p) => (p ? { ...p, busy: true } : p));
      try {
        const created = await tree.createScreen(parentId);
        setCreateOpen(false);
        setCreateState(null);
        if (created) navigate(`/app/templates/${created.id}/edit`);
      } finally {
        setCreateState((p) => (p ? { ...p, busy: false } : p));
      }
    }
  }

  function requestDelete(type: "folder" | "screen", id: number, label: string) {
    confirmRef.current = { type, id, label };
    setConfirmOpen(true);
  }

  async function confirmDelete() {
    const c = confirmRef.current;
    if (!c) return;
    await tree.deleteNode(c.type, c.id);
    setConfirmOpen(false);
    confirmRef.current = null;
  }

  if (tree.loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <LayoutTemplate className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-base font-semibold">{t("templates.title")}</p>
              <p className="text-xs text-muted-foreground">{t("templates.subtitle")}</p>
            </div>
          </div>
          {tree.isAdmin && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 rounded-full px-3 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => openCreateDialog("folder", null)}
                title={t("templates.addFolder")}
              >
                <FolderPlus className="size-3.5" />
                <span className="hidden sm:inline">{t("templates.addFolder")}</span>
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 gap-1.5 rounded-full px-3 text-xs"
                onClick={() => openCreateDialog("screen", null)}
              >
                <Plus className="size-3.5" />
                {t("templates.addTemplate")}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tree card */}
      <div className="rounded-2xl border border-border/60 bg-card">
        <ContextMenu>
          <ContextMenuTrigger className="block min-h-[200px] p-2">
            {tree.tree.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/80 mb-3">
                  <LayoutTemplate className="size-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">{t("templates.noTemplates")}</p>
              </div>
            ) : (
              <div className="select-none">
                {tree.tree.map((f) => (
                  <FolderRow
                    key={f.id}
                    folder={f}
                    depth={0}
                    isAdmin={tree.isAdmin}
                    expanded={tree.expanded}
                    selectedScreenId={tree.selectedScreenId}
                    onToggleExpanded={tree.toggleExpanded}
                    onSelectFolder={(id) => {
                      tree.setSelectedFolderId(id);
                      tree.setSelectedScreenId(null);
                    }}
                    onSelectScreen={(folderId, screenId) => {
                      tree.setSelectedScreenId(screenId);
                      tree.setSelectedFolderId(folderId);
                    }}
                    onOpenDialog={(s) => navigate(`/app/templates/${s.id}/edit`)}
                    onCopyUrl={() => undefined}
                    onDragStart={tree.onDragStart}
                    onDropOnFolder={(e, folderId) => void tree.onDropOnFolder(e, folderId)}
                    onCreateFolder={(parentId) => openCreateDialog("folder", parentId)}
                    onCreateScreen={(parentId) => openCreateDialog("screen", parentId)}
                    onDelete={requestDelete}
                  />
                ))}
              </div>
            )}
          </ContextMenuTrigger>
          {tree.isAdmin && (
            <ContextMenuContent className="rounded-xl">
              <ContextMenuItem className="rounded-lg" onSelect={() => openCreateDialog("folder", null)}>
                {t("templates.addFolder")}
              </ContextMenuItem>
              <ContextMenuItem className="rounded-lg" onSelect={() => openCreateDialog("screen", null)}>
                {t("templates.addTemplate")}
              </ContextMenuItem>
            </ContextMenuContent>
          )}
        </ContextMenu>
      </div>

      {/* Create folder/template dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) setCreateState(null);
        }}
      >
        <DialogContent className="max-w-md overflow-hidden rounded-2xl border-border/60 p-0 sm:max-w-md">
          <DialogHeader className="border-b border-border/40 px-6 py-4">
            <DialogTitle className="text-base">
              {createState?.kind === "screen" ? t("templates.addTemplate") : t("templates.addFolder")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-6 py-5">
            {createState?.kind === "folder" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  {t("screens.folderName")}
                </Label>
                <Input
                  ref={pendingInputRef}
                  value={createState?.name ?? ""}
                  onChange={(e) => setCreateState((p) => (p ? { ...p, name: e.target.value } : p))}
                  placeholder={t("screens.folderName")}
                  className="h-10 rounded-xl"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void submitCreate();
                  }}
                  disabled={createState?.busy === true}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                {t("screens.parentFolder")}
              </Label>
              <select
                value={createState?.parentFolderId ?? "__root__"}
                onChange={(e) => setCreateState((p) => (p ? { ...p, parentFolderId: e.target.value } : p))}
                disabled={createState?.busy === true}
                className="flex h-10 w-full items-center rounded-xl border border-input bg-transparent px-3 text-sm transition-colors outline-none focus-visible:border-border focus-visible:ring-2 focus-visible:ring-border/60 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {createState?.kind === "folder" && (
                  <option value="__root__">{t("screens.rootLevel")}</option>
                )}
                {flatFolders.map((f) => (
                  <option key={f.id} value={String(f.id)}>
                    {"─".repeat(f.depth)}{f.depth > 0 ? " " : ""}{f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-border/40 bg-muted/20 px-6 py-3.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-full px-4"
              onClick={() => setCreateOpen(false)}
              disabled={createState?.busy === true}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-9 rounded-full px-4"
              onClick={() => void submitCreate()}
              disabled={
                createState?.busy === true ||
                (createState?.kind === "folder" && !(createState?.name ?? "").trim()) ||
                (createState?.kind === "screen" && createState?.parentFolderId === "__root__" && flatFolders.length === 0)
              }
            >
              {t("screens.create")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-2xl border-border/60">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("screens.confirmDeleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmRef.current?.type === "folder"
                ? t("screens.confirmDeleteFolder", { name: confirmRef.current?.label })
                : t("screens.confirmDeleteScreen", { name: confirmRef.current?.label })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void confirmDelete()}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
