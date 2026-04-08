import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, GripVertical, Monitor, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, apiUrl } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
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

type TreeScreen = { id: number; name: string; publicToken: string };
type TreeFolder = {
  id: number;
  parentId: number | null;
  name: string;
  sortOrder: number;
  screens: TreeScreen[];
  children: TreeFolder[];
};

type ScreenRow = {
  id: number;
  folderId: number;
  name: string;
  publicToken: string;
  revision: number;
  sortOrder: number;
  slideshowPath: string;
};

type ScreenItem = {
  id: number;
  type: string;
  durationMs: number;
  sortOrder: number;
  mimeType: string;
};

type DragPayload =
  | { type: "folder"; id: number }
  | { type: "screen"; id: number };

function SortableMediaRow({
  item,
  token,
  onUpdateDuration,
  onDelete,
}: {
  item: ScreenItem;
  token: string;
  onUpdateDuration: (id: number, durationMs: number) => void;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const src = apiUrl(`/api/public/screens/${token}/media/${item.id}`);
  const [durationStr, setDurationStr] = useState<string>(() => String(item.durationMs ?? 5000));

  useEffect(() => {
    setDurationStr(String(item.durationMs ?? 5000));
  }, [item.durationMs]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-border/60 bg-card group relative flex w-[200px] shrink-0 items-center justify-center overflow-hidden rounded-lg border shadow-sm",
        isDragging && "opacity-60"
      )}
    >
      <button
        type="button"
        className="absolute left-2 top-2 z-10 cursor-grab touch-none rounded bg-white p-1 text-slate-700 shadow-sm"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      {item.type === "VIDEO" || item.type === "GIF" ? (
        <video src={src} className="h-40 w-full object-cover" muted playsInline />
      ) : (
        <img src={src} alt="" className="h-40 w-full object-cover" />
      )}

      <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center gap-2 rounded bg-white p-1.5 shadow-sm">
        <span className="text-[11px] leading-none text-slate-600">ms</span>
        <Input
          type="number"
          inputMode="numeric"
          className="h-7 border-slate-200 bg-white px-2 text-xs text-slate-900"
          value={durationStr}
          min={0}
          step={100}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setDurationStr(e.target.value)}
          onBlur={() => {
            const n = Number(durationStr);
            if (!Number.isFinite(n)) {
              setDurationStr(String(item.durationMs ?? 5000));
              return;
            }
            onUpdateDuration(item.id, Math.max(0, Math.trunc(n)));
          }}
        />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 z-10 bg-white text-slate-700 shadow-sm hover:bg-white"
        onClick={() => onDelete(item.id)}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

export function ScreensPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [tree, setTree] = useState<TreeFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [selectedScreenId, setSelectedScreenId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set());
  const [dialogScreen, setDialogScreen] = useState<ScreenRow | null>(null);
  const [dialogItems, setDialogItems] = useState<ScreenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const pendingInputRef = useRef<HTMLInputElement | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createState, setCreateState] = useState<{
    kind: "folder" | "screen";
    parentFolderId: number | null;
    name: string;
    busy: boolean;
  } | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const confirmRef = useRef<{ type: "folder" | "screen"; id: number; label: string } | null>(
    null
  );

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
    // Par défaut, on ouvre le 1er niveau
    if (tree.length === 0) return;
    setExpanded((prev) => {
      if (prev.size > 0) return prev;
      const next = new Set<number>();
      for (const r of tree) next.add(r.id);
      return next;
    });
  }, [tree]);

  useEffect(() => {
    // Les écrans sont chargés via l’arbre admin côté API
  }, []);

  function fullSlideshowUrl(token: string) {
    return `${window.location.origin}/show/${token}`;
  }

  async function copyUrl(token: string) {
    await navigator.clipboard.writeText(fullSlideshowUrl(token));
    toast.success(t("screens.copied"));
  }

  async function openDialog(s: ScreenRow) {
    // Ouvre la popup immédiatement, puis charge les médias en arrière-plan.
    setDialogScreen(s);
    setDialogItems([]);
    const r = await apiFetch<{ screen: ScreenRow; items: ScreenItem[] }>(`/api/screens/${s.id}`);
    setDialogScreen(r.screen);
    setDialogItems(r.items.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id));
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const itemIds = useMemo(() => dialogItems.map((i) => i.id), [dialogItems]);

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
    toast.success("Ordre des médias enregistré");
  }

  async function deleteItem(id: number) {
    if (!dialogScreen) return;
    await apiFetch(`/api/screens/${dialogScreen.id}/items/${id}`, { method: "DELETE" });
    setDialogItems((prev) => prev.filter((x) => x.id !== id));
    toast.success("Média supprimé");
  }

  async function updateItemDuration(itemId: number, durationMs: number) {
    if (!dialogScreen) return;
    setDialogItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, durationMs } : it)));
    await apiFetch(`/api/screens/${dialogScreen.id}/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ durationMs }),
    });
    toast.success("Durée du média mise à jour");
  }

  async function onUploadFile(f: File | null) {
    if (!f || !dialogScreen) return;
    const fd = new FormData();
    fd.append("file", f);
    const res = await fetch(
      apiUrl(`/api/screens/${dialogScreen.id}/items?durationMs=5000`),
      {
        method: "POST",
        body: fd,
        credentials: "include",
      }
    );
    if (!res.ok) {
      toast.error(await res.text());
      return;
    }
    await openDialog(dialogScreen);
    toast.success("Média ajouté");
  }

  function MediaPlaceholder() {
    return (
      <button
        type="button"
        className="border-border/60 text-muted-foreground flex h-40 w-[200px] shrink-0 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/10 text-sm hover:bg-muted/20"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          if (Array.from(e.dataTransfer.types).includes("Files")) e.preventDefault();
        }}
        onDrop={(e) => {
          const f = e.dataTransfer.files?.[0] ?? null;
          if (f) void onUploadFile(f);
        }}
      >
        <span className="font-medium">Glisser-déposer</span>
        <span className="text-xs">ou cliquer pour ajouter</span>
      </button>
    );
  }

  function pickTargetFolderId(explicit: number | null): number | null {
    if (explicit != null) return explicit;
    if (selectedFolderId != null) return selectedFolderId;
    return tree[0]?.id ?? null;
  }

  function openCreate(kind: "folder" | "screen", parentFolderId: number | null) {
    if (!isAdmin) return;
    let parent = parentFolderId;
    if (kind === "screen") {
      parent = pickTargetFolderId(parentFolderId);
      if (parent == null) {
        toast.error(t("screens.noFolder"));
        return;
      }
      setSelectedFolderId(parent);
      setExpanded((prev) => new Set(prev).add(parent!));
      // Pour la création d’un écran, on ouvre directement la popup médias
      void (async () => {
        const created = await apiFetch<{ id: number; publicToken: string; slideshowPath: string }>(
          `/api/folders/${parent}/screens`,
          {
            method: "POST",
            body: JSON.stringify({ name: "Nouvel écran" }),
          }
        );
        toast.success("Écran créé");
        await loadTree();
        await openDialog({
          id: created.id,
          folderId: parent!,
          name: "Nouvel écran",
          publicToken: created.publicToken,
          revision: 0,
          sortOrder: 0,
          slideshowPath: created.slideshowPath,
        });
      })();
      return;
    } else if (parent !== null) {
      setExpanded((prev) => new Set(prev).add(parent!));
    }
    setCreateState({ kind, parentFolderId: parent ?? null, name: "", busy: false });
    setCreateOpen(true);
    queueMicrotask(() => pendingInputRef.current?.focus());
  }

  async function submitCreate() {
    if (!createState || !isAdmin) return;
    const name = createState.name.trim();
    if (!name) return;
    setCreateState((p) => (p ? { ...p, busy: true } : p));
    try {
      if (createState.kind === "folder") {
        await apiFetch<{ id: number }>("/api/folders", {
          method: "POST",
          body: JSON.stringify({ name, parentId: createState.parentFolderId }),
        });
        toast.success("Dossier créé");
        setCreateOpen(false);
        setCreateState(null);
        await loadTree();
        return;
      }
      const folderId = createState.parentFolderId;
      if (folderId == null) {
        toast.error(t("screens.noFolder"));
        return;
      }
      const created = await apiFetch<{ id: number; publicToken: string; slideshowPath: string }>(
        `/api/folders/${folderId}/screens`,
        {
          method: "POST",
          body: JSON.stringify({ name }),
        }
      );
      toast.success("Écran créé");
      setCreateOpen(false);
      setCreateState(null);
      await loadTree();
      await openDialog({
        id: created.id,
        folderId,
        name,
        publicToken: created.publicToken,
        revision: 0,
        sortOrder: 0,
        slideshowPath: created.slideshowPath,
      });
    } finally {
      setCreateState((p) => (p ? { ...p, busy: false } : p));
    }
  }

  function requestDelete(type: "folder" | "screen", id: number, label: string) {
    confirmRef.current = { type, id, label };
    setConfirmOpen(true);
  }

  async function confirmDelete() {
    const c = confirmRef.current;
    if (!c) return;
    if (c.type === "folder") {
      await apiFetch(`/api/folders/${c.id}`, { method: "DELETE" });
    } else {
      await apiFetch(`/api/screens/${c.id}`, { method: "DELETE" });
    }
    toast.success(c.type === "folder" ? "Dossier supprimé" : "Écran supprimé");
    setConfirmOpen(false);
    confirmRef.current = null;
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
      toast.success("Dossier déplacé");
      await loadTree();
      return;
    }
    if (p.type === "screen") {
      await apiFetch(`/api/screens/${p.id}`, {
        method: "PATCH",
        body: JSON.stringify({ folderId }),
      });
      toast.success("Écran déplacé");
      await loadTree();
    }
  }

  function toggleExpanded(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function FolderRow({ folder, depth }: { folder: TreeFolder; depth: number }) {
    const hasChildren = folder.children.length > 0 || folder.screens.length > 0;
    const isOpen = expanded.has(folder.id);
    return (
      <div>
        <ContextMenu>
          <ContextMenuTrigger
              className={cn(
                "group relative flex w-full items-center gap-2 rounded px-2 py-1.5 text-base",
                "before:absolute before:inset-0 before:rounded before:bg-transparent group-hover:before:bg-muted/60 before:content-['']",
                // Le repère visuel doit être au hover, pas au clic
              )}
              style={{ paddingLeft: 10 + depth * 14 }}
              draggable={isAdmin}
              onDragStart={(e) => onDragStart(e, { type: "folder", id: folder.id })}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => void onDropOnFolder(e, folder.id)}
              onClick={() => {
                setSelectedFolderId(folder.id);
                setSelectedScreenId(null);
                if (hasChildren) toggleExpanded(folder.id);
              }}
          >
            <button
              type="button"
              className={cn(
                "text-muted-foreground flex size-5 items-center justify-center rounded hover:bg-transparent group-hover:bg-transparent",
                !hasChildren && "opacity-0"
              )}
              onClick={(e) => {
                e.stopPropagation();
                if (hasChildren) toggleExpanded(folder.id);
              }}
              aria-label={isOpen ? "Fermer" : "Ouvrir"}
            >
              <span className={cn("transition-transform", isOpen && "rotate-90")}>›</span>
            </button>
            <span className="truncate font-medium relative">{folder.name}</span>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onSelect={() => openCreate("folder", folder.id)}>
              {t("screens.addFolder")}
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => openCreate("screen", folder.id)}>
              {t("screens.addScreen")}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              variant="destructive"
              onSelect={() => requestDelete("folder", folder.id, folder.name)}
            >
              {t("common.delete")}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        {isOpen ? (
          <>
            {folder.screens.map((s) => (
              <ContextMenu key={s.id}>
                <ContextMenuTrigger
                  className={cn(
                    "flex w-full items-center gap-2 rounded px-2 py-1.5 text-base text-muted-foreground hover:bg-muted/60",
                    selectedScreenId === s.id && "border-l-4 border-blue-500 bg-muted pl-1"
                  )}
                  style={{ paddingLeft: 28 + depth * 14 }}
                  draggable={isAdmin}
                  onDragStart={(e) => onDragStart(e, { type: "screen", id: s.id })}
                  onClick={() => {
                    setSelectedScreenId(s.id);
                    setSelectedFolderId(folder.id);
                  }}
                  onDoubleClick={() =>
                    void openDialog({
                      id: s.id,
                      folderId: folder.id,
                      name: s.name,
                      publicToken: s.publicToken,
                      revision: 0,
                      sortOrder: 0,
                      slideshowPath: `/show/${s.publicToken}`,
                    })
                  }
                >
                  <Monitor className="size-4 shrink-0 text-muted-foreground/80" />
                  <span className="truncate">{s.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-7 px-2 text-[11px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      void copyUrl(s.publicToken);
                    }}
                  >
                    <Copy className="mr-1 size-3" />
                    {t("screens.copyUrl")}
                  </Button>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem
                    onSelect={() =>
                      void openDialog({
                        id: s.id,
                        folderId: folder.id,
                        name: s.name,
                        publicToken: s.publicToken,
                        revision: 0,
                        sortOrder: 0,
                        slideshowPath: `/show/${s.publicToken}`,
                      })
                    }
                  >
                    {t("screens.manageMedia")}
                  </ContextMenuItem>
                  <ContextMenuItem onSelect={() => openCreate("folder", folder.id)}>
                    {t("screens.addFolder")}
                  </ContextMenuItem>
                  <ContextMenuItem onSelect={() => openCreate("screen", folder.id)}>
                    {t("screens.addScreen")}
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    variant="destructive"
                    onSelect={() => requestDelete("screen", s.id, s.name)}
                  >
                    {t("common.delete")}
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}

            {folder.children.map((c) => (
              <FolderRow key={c.id} folder={c} depth={depth + 1} />
            ))}
          </>
        ) : null}

      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <p className="text-muted-foreground text-sm">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-120px)]">
      <ContextMenu>
        <ContextMenuTrigger className="block min-h-[calc(100vh-160px)] rounded-lg border border-border/60 bg-background p-2">
            {tree.length === 0 ? (
              <p className="text-muted-foreground p-4 text-sm">{t("screens.rootEmpty")}</p>
            ) : (
              <div className="select-none py-1">
                {tree.map((f) => (
                  <FolderRow key={f.id} folder={f} depth={0} />
                ))}
              </div>
            )}
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onSelect={() => openCreate("folder", null)}>
            {t("screens.addFolder")}
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => openCreate("screen", null)}>
            {t("screens.addScreen")}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <Dialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) setCreateState(null);
        }}
      >
        <DialogContent className="border-border/60 max-w-md">
          <DialogHeader>
            <DialogTitle>
              {createState?.kind === "screen" ? t("screens.addScreen") : t("screens.addFolder")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              ref={pendingInputRef}
              value={createState?.name ?? ""}
              onChange={(e) => setCreateState((p) => (p ? { ...p, name: e.target.value } : p))}
              placeholder={
                createState?.kind === "screen" ? t("screens.screenName") : t("screens.folderName")
              }
              className="h-10"
              onKeyDown={(e) => {
                if (e.key === "Enter") void submitCreate();
              }}
              disabled={createState?.busy === true}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={createState?.busy === true}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="button"
                onClick={() => void submitCreate()}
                disabled={createState?.busy === true || !(createState?.name ?? "").trim()}
              >
                Créer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="border-border/60">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmRef.current?.type === "folder"
                ? `Ce dossier et tout ce qu’il contient seront supprimés : “${confirmRef.current?.label}”.`
                : `Cet écran sera supprimé : “${confirmRef.current?.label}”.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void confirmDelete()}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!dialogScreen} onOpenChange={(o) => !o && setDialogScreen(null)}>
        <DialogContent className="border-border/60 h-[90vh] w-[90vw] max-w-none gap-4 overflow-hidden rounded-xl p-4 shadow-lg sm:max-w-none">
          <DialogHeader>
            <DialogTitle>
              {t("screens.dialogTitle")} — {dialogScreen?.name}
            </DialogTitle>
          </DialogHeader>
          {dialogScreen ? (
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <div className="flex items-center gap-2">
                <Input
                  value={dialogScreen.name}
                  className="h-10 max-w-[520px]"
                  onChange={(e) =>
                    setDialogScreen((prev) => (prev ? { ...prev, name: e.target.value } : prev))
                  }
                  onBlur={() => {
                    const name = dialogScreen.name.trim();
                    if (!name) return;
                    void (async () => {
                      await apiFetch(`/api/screens/${dialogScreen.id}`, {
                        method: "PATCH",
                        body: JSON.stringify({ name }),
                      });
                      toast.success("Nom de l’écran mis à jour");
                      await loadTree();
                    })();
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => void copyUrl(dialogScreen.publicToken)}>
                  <Copy className="mr-1 size-4" />
                  {t("screens.copyUrl")}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,video/*,.gif"
                  onChange={(e) => void onUploadFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(ev) => void onDragEnd(ev)}
              >
                <SortableContext items={itemIds} strategy={horizontalListSortingStrategy}>
                  <div className="no-scrollbar flex min-h-0 flex-1 items-start gap-3 overflow-x-auto overflow-y-hidden rounded-lg border border-border/60 bg-muted/10 p-3">
                    {dialogItems.map((it) => (
                      <SortableMediaRow
                        key={it.id}
                        item={it}
                        token={dialogScreen.publicToken}
                        onUpdateDuration={(id, ms) => void updateItemDuration(id, ms)}
                        onDelete={(id) => void deleteItem(id)}
                      />
                    ))}
                    <MediaPlaceholder />
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
