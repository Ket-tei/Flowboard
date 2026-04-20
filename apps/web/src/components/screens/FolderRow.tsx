import { useTranslation } from "react-i18next";
import { ChevronRight, Copy, Folder, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { TreeFolder } from "@/types/tree.types";
import type { ScreenRow } from "@/types/screen.types";

function ScreenItem({
  screen,
  folderId,
  depth,
  isAdmin,
  isSelected,
  onDragStart,
  onSelectScreen,
  onOpenDialog,
  onCopyUrl,
  onDelete,
  t,
}: {
  screen: { id: number; name: string; publicToken: string; displayMode?: "QUICK" | "TEMPLATE" };
  folderId: number;
  depth: number;
  isAdmin: boolean;
  isSelected: boolean;
  onDragStart: (e: React.DragEvent, payload: { type: "folder" | "screen"; id: number }) => void;
  onSelectScreen: (folderId: number, screenId: number) => void;
  onOpenDialog: (s: ScreenRow) => void;
  onCopyUrl: (token: string) => void;
  onDelete: (type: "folder" | "screen", id: number, label: string) => void;
  t: (key: string) => string;
}) {
  const screenRow: ScreenRow = {
    id: screen.id,
    folderId,
    name: screen.name,
    publicToken: screen.publicToken,
    revision: 0,
    sortOrder: 0,
    displayMode: screen.displayMode ?? "QUICK",
    slideshowPath: `/show/${screen.publicToken}`,
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted-foreground",
          "transition-colors duration-100",
          "hover:bg-accent hover:text-accent-foreground",
          "active:bg-accent/80",
          isSelected && "bg-primary/8 text-primary border-l-2 border-primary"
        )}
        style={{ paddingLeft: 30 + depth * 16 }}
        draggable={isAdmin}
        onDragStart={(e) => onDragStart(e, { type: "screen", id: screen.id })}
        onClick={() => onSelectScreen(folderId, screen.id)}
        onDoubleClick={() => onOpenDialog(screenRow)}
      >
        <Monitor className="size-3.5 shrink-0 opacity-50" />
        <span className="truncate">{screen.name}</span>
        <span className="ml-auto flex shrink-0 items-center opacity-100">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 rounded-full px-2 text-[10px] opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onCopyUrl(screen.publicToken);
            }}
          >
            <Copy className="mr-0.5 size-3" />
            {t("screens.copyUrl")}
          </Button>
        </span>
      </ContextMenuTrigger>
      <ContextMenuContent className="rounded-xl">
        <ContextMenuItem
          className="rounded-lg"
          onSelect={() => onOpenDialog(screenRow)}
        >
          {t("screens.manageMedia")}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          className="rounded-lg"
          variant="destructive"
          onSelect={() => onDelete("screen", screen.id, screen.name)}
        >
          {t("common.delete")}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export function FolderRow({
  folder,
  depth,
  isAdmin,
  expanded,
  selectedScreenId,
  onToggleExpanded,
  onSelectFolder,
  onSelectScreen,
  onOpenDialog,
  onCopyUrl,
  onDragStart,
  onDropOnFolder,
  onCreateFolder,
  onCreateScreen,
  onDelete,
}: {
  folder: TreeFolder;
  depth: number;
  isAdmin: boolean;
  expanded: Set<number>;
  selectedScreenId: number | null;
  onToggleExpanded: (id: number) => void;
  onSelectFolder: (id: number) => void;
  onSelectScreen: (folderId: number, screenId: number) => void;
  onOpenDialog: (s: ScreenRow) => void;
  onCopyUrl: (token: string) => void;
  onDragStart: (e: React.DragEvent, payload: { type: "folder" | "screen"; id: number }) => void;
  onDropOnFolder: (e: React.DragEvent, folderId: number) => void;
  onCreateFolder: (parentId: number) => void;
  onCreateScreen: (parentId: number) => void;
  onDelete: (type: "folder" | "screen", id: number, label: string) => void;
}) {
  const { t } = useTranslation();
  const hasChildren = folder.children.length > 0 || folder.screens.length > 0;
  const isOpen = expanded.has(folder.id);

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm",
            "transition-colors duration-100",
            "hover:bg-accent hover:text-accent-foreground",
            "active:bg-accent/80"
          )}
          style={{ paddingLeft: 10 + depth * 16 }}
          draggable={isAdmin}
          onDragStart={(e) => onDragStart(e, { type: "folder", id: folder.id })}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => onDropOnFolder(e, folder.id)}
          onClick={() => {
            onSelectFolder(folder.id);
            if (hasChildren) onToggleExpanded(folder.id);
          }}
        >
          <button
            type="button"
            className={cn(
              "flex size-4 items-center justify-center rounded text-muted-foreground",
              !hasChildren && "invisible"
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) onToggleExpanded(folder.id);
            }}
          >
            <ChevronRight
              className={cn(
                "size-3.5 transition-transform duration-150",
                isOpen && "rotate-90"
              )}
            />
          </button>
          <Folder className="size-4 shrink-0 text-muted-foreground/70" />
          <span className="truncate font-medium">{folder.name}</span>
        </ContextMenuTrigger>
        <ContextMenuContent className="rounded-xl">
          <ContextMenuItem className="rounded-lg" onSelect={() => onCreateFolder(folder.id)}>
            {t("screens.addFolder")}
          </ContextMenuItem>
          <ContextMenuItem className="rounded-lg" onSelect={() => onCreateScreen(folder.id)}>
            {t("screens.addScreen")}
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            className="rounded-lg"
            variant="destructive"
            onSelect={() => onDelete("folder", folder.id, folder.name)}
          >
            {t("common.delete")}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {isOpen && (
        <>
          {folder.screens.map((s) => (
            <ScreenItem
              key={s.id}
              screen={s}
              folderId={folder.id}
              depth={depth}
              isAdmin={isAdmin}
              isSelected={selectedScreenId === s.id}
              onDragStart={onDragStart}
              onSelectScreen={onSelectScreen}
              onOpenDialog={onOpenDialog}
              onCopyUrl={onCopyUrl}
              onDelete={onDelete}
              t={t}
            />
          ))}

          {folder.children.map((c) => (
            <FolderRow
              key={c.id}
              folder={c}
              depth={depth + 1}
              isAdmin={isAdmin}
              expanded={expanded}
              selectedScreenId={selectedScreenId}
              onToggleExpanded={onToggleExpanded}
              onSelectFolder={onSelectFolder}
              onSelectScreen={onSelectScreen}
              onOpenDialog={onOpenDialog}
              onCopyUrl={onCopyUrl}
              onDragStart={onDragStart}
              onDropOnFolder={onDropOnFolder}
              onCreateFolder={onCreateFolder}
              onCreateScreen={onCreateScreen}
              onDelete={onDelete}
            />
          ))}
        </>
      )}
    </div>
  );
}
