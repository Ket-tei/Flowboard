import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
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
type TreeNode = {
  id: number;
  parentId: number | null;
  name: string;
  sortOrder: number;
  screens: TreeScreen[];
  children: TreeNode[];
};

type UserRow = {
  id: number;
  username: string;
  role: "ADMIN" | "USER";
  createdAt: string;
};

function AccessTree({
  nodes,
  depth,
  folderIds,
  screenIds,
  onToggleFolder,
  onToggleScreen,
}: {
  nodes: TreeNode[];
  depth: number;
  folderIds: Set<number>;
  screenIds: Set<number>;
  onToggleFolder: (id: number, checked: boolean) => void;
  onToggleScreen: (id: number, checked: boolean) => void;
}) {
  return (
    <div className="space-y-1" style={{ paddingLeft: depth * 12 }}>
      {nodes.map((n) => (
        <div key={n.id} className="space-y-1">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={folderIds.has(n.id)}
              onCheckedChange={(v) => onToggleFolder(n.id, v === true)}
            />
            <span className="font-medium">{n.name}</span>
          </label>
          {n.screens.map((s) => (
            <label
              key={s.id}
              className="flex cursor-pointer items-center gap-2 pl-6 text-sm text-muted-foreground"
            >
              <Checkbox
                checked={screenIds.has(s.id)}
                onCheckedChange={(v) => onToggleScreen(s.id, v === true)}
              />
              <span>{s.name}</span>
            </label>
          ))}
          {n.children.length > 0 ? (
            <AccessTree
              nodes={n.children}
              depth={depth + 1}
              folderIds={folderIds}
              screenIds={screenIds}
              onToggleFolder={onToggleFolder}
              onToggleScreen={onToggleScreen}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function AccountsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "USER">("USER");
  const [folderIds, setFolderIds] = useState<Set<number>>(() => new Set());
  const [screenIds, setScreenIds] = useState<Set<number>>(() => new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmUser, setConfirmUser] = useState<UserRow | null>(null);

  const loadUsers = useCallback(async () => {
    const r = await apiFetch<{ users: UserRow[] }>("/api/users");
    setUsers(r.users);
  }, []);

  const loadTree = useCallback(async () => {
    const r = await apiFetch<{ tree: TreeNode[] }>("/api/admin/folder-screen-tree");
    setTree(r.tree);
  }, []);

  useEffect(() => {
    void loadUsers();
    void loadTree();
  }, [loadUsers, loadTree]);

  if (user?.role !== "ADMIN") {
    return <Navigate to="/app/dashboard" replace />;
  }

  function resetForm() {
    setEditId(null);
    setUsername("");
    setPassword("");
    setRole("USER");
    setFolderIds(new Set());
    setScreenIds(new Set());
  }

  function openCreate() {
    resetForm();
    setOpen(true);
  }

  async function openEdit(u: UserRow) {
    resetForm();
    setEditId(u.id);
    setUsername(u.username);
    setRole(u.role);
    setPassword("");
    if (u.role === "USER") {
      const a = await apiFetch<{ folderIds: number[]; screenIds: number[] }>(
        `/api/users/${u.id}/access`
      );
      setFolderIds(new Set(a.folderIds));
      setScreenIds(new Set(a.screenIds));
    } else {
      setFolderIds(new Set());
      setScreenIds(new Set());
    }
    setOpen(true);
  }

  function toggleFolder(id: number, checked: boolean) {
    setFolderIds((prev) => {
      const n = new Set(prev);
      if (checked) n.add(id);
      else n.delete(id);
      return n;
    });
  }

  function toggleScreen(id: number, checked: boolean) {
    setScreenIds((prev) => {
      const n = new Set(prev);
      if (checked) n.add(id);
      else n.delete(id);
      return n;
    });
  }

  async function saveUser() {
    if (editId == null) {
      if (!username.trim() || !password) {
        toast.error("Missing fields");
        return;
      }
      await apiFetch("/api/users", {
        method: "POST",
        body: JSON.stringify({
          username: username.trim(),
          password,
          role,
          folderIds: role === "USER" ? [...folderIds] : [],
          screenIds: role === "USER" ? [...screenIds] : [],
        }),
      });
      toast.success(t("accounts.created"));
    } else {
      const body: Record<string, unknown> = {};
      if (password) body.password = password;
      body.role = role;
      if (role === "USER") {
        body.folderIds = [...folderIds];
        body.screenIds = [...screenIds];
      }
      await apiFetch(`/api/users/${editId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      toast.success("Compte mis à jour");
    }
    setOpen(false);
    resetForm();
    await loadUsers();
  }

  async function removeUser(id: number) {
    await apiFetch(`/api/users/${id}`, { method: "DELETE" });
    await loadUsers();
    toast.success("Compte supprimé");
  }

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger className="block">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-0">
              <div className="text-muted-foreground grid grid-cols-[1fr_140px] gap-4 border-b border-border/60 px-4 py-2 text-xs font-medium">
                <span>{t("accounts.username")}</span>
                <span className="text-right">{t("accounts.role")}</span>
              </div>

              <div className="divide-y divide-border/40">
                {users.map((u) => (
                  <ContextMenu key={u.id}>
                    <ContextMenuTrigger className="grid cursor-default grid-cols-[1fr_140px] items-center gap-4 px-4 py-3 text-sm hover:bg-muted/40">
                      <span className="font-medium">{u.username}</span>
                      <span className="text-muted-foreground text-right">{u.role}</span>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onSelect={() => void openEdit(u)}>
                        {t("accounts.edit")}
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        variant="destructive"
                        onSelect={() => {
                          setConfirmUser(u);
                          setConfirmOpen(true);
                        }}
                      >
                        {t("common.delete")}
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </div>
            </CardContent>
          </Card>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onSelect={openCreate}>{t("accounts.add")}</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="border-border/60">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmUser ? `Le compte “${confirmUser.username}” sera supprimé.` : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!confirmUser) return;
                void removeUser(confirmUser.id);
                setConfirmUser(null);
              }}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) resetForm();
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId == null ? t("accounts.add") : t("accounts.save")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("accounts.username")}</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={editId != null}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("accounts.password")}</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={editId != null ? "••••••••" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("accounts.role")}</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as "ADMIN" | "USER")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">{t("accounts.admin")}</SelectItem>
                  <SelectItem value="USER">{t("accounts.user")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {role === "USER" ? (
              <div className="space-y-2">
                <Label>{t("accounts.access")}</Label>
                <ScrollArea className="h-64 rounded-lg border border-border/60 bg-muted/20 p-3">
                  <AccessTree
                    nodes={tree}
                    depth={0}
                    folderIds={folderIds}
                    screenIds={screenIds}
                    onToggleFolder={toggleFolder}
                    onToggleScreen={toggleScreen}
                  />
                </ScrollArea>
              </div>
            ) : null}
            <Button type="button" onClick={() => void saveUser()}>
              {t("accounts.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
