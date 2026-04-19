import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { TreeFolder } from "@/types/tree.types";

export function AccessTree({
  nodes,
  depth,
  folderIds,
  screenIds,
  parentChecked = false,
  onToggleFolder,
  onToggleScreen,
}: {
  nodes: TreeFolder[];
  depth: number;
  folderIds: Set<number>;
  screenIds: Set<number>;
  parentChecked?: boolean;
  onToggleFolder: (id: number, checked: boolean) => void;
  onToggleScreen: (id: number, checked: boolean) => void;
}) {
  return (
    <div className="space-y-1" style={{ paddingLeft: depth * 12 }}>
      {nodes.map((n) => {
        const folderChecked = folderIds.has(n.id) || parentChecked;
        const disabledByParent = parentChecked;

        return (
          <div key={n.id} className="space-y-1">
            <label
              className={cn(
                "flex items-center gap-2 text-sm",
                disabledByParent ? "cursor-default opacity-60" : "cursor-pointer"
              )}
            >
              <Checkbox
                checked={folderChecked}
                disabled={disabledByParent}
                onCheckedChange={(v) => onToggleFolder(n.id, v === true)}
              />
              <span className="font-medium">{n.name}</span>
            </label>
            {n.screens.map((s) => {
              const screenDisabled = folderChecked;
              const screenChecked = screenIds.has(s.id) || folderChecked;
              return (
                <label
                  key={s.id}
                  className={cn(
                    "flex items-center gap-2 pl-6 text-sm text-muted-foreground",
                    screenDisabled ? "cursor-default opacity-60" : "cursor-pointer"
                  )}
                >
                  <Checkbox
                    checked={screenChecked}
                    disabled={screenDisabled}
                    onCheckedChange={(v) => onToggleScreen(s.id, v === true)}
                  />
                  <span>{s.name}</span>
                </label>
              );
            })}
            {n.children.length > 0 && (
              <AccessTree
                nodes={n.children}
                depth={depth + 1}
                folderIds={folderIds}
                screenIds={screenIds}
                parentChecked={folderChecked}
                onToggleFolder={onToggleFolder}
                onToggleScreen={onToggleScreen}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function collectDescendantIds(
  nodes: TreeFolder[],
  targetFolderId: number
): { folderIds: number[]; screenIds: number[] } {
  const folderIds: number[] = [];
  const screenIds: number[] = [];

  function collectAll(folder: TreeFolder) {
    for (const s of folder.screens) screenIds.push(s.id);
    for (const c of folder.children) {
      folderIds.push(c.id);
      collectAll(c);
    }
  }

  function find(folders: TreeFolder[]): boolean {
    for (const f of folders) {
      if (f.id === targetFolderId) {
        collectAll(f);
        return true;
      }
      if (find(f.children)) return true;
    }
    return false;
  }

  find(nodes);
  return { folderIds, screenIds };
}
