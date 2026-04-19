import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Pencil,
  Plus,
  Shield,
  Trash2,
  User as UserIcon,
  Users,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { AccessTree, collectDescendantIds } from "@/components/accounts/AccessTree";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/utils";
import type { TreeFolder } from "@/types/tree.types";
import type { UserRow } from "@/types/user.types";

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-1 pt-2">
      {title}
    </h3>
  );
}

export function AccountsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [tree, setTree] = useState<TreeFolder[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
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
    setLoadingUsers(false);
  }, []);

  const loadTree = useCallback(async () => {
    const r = await apiFetch<{ tree: TreeFolder[] }>("/api/admin/folder-screen-tree");
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
    }
    setOpen(true);
  }

  async function saveUser() {
    if (editId == null) {
      if (!username.trim() || !password) {
        toast.error(t("accounts.missingFields"));
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
      toast.success(t("accounts.updated"));
    }
    setOpen(false);
    resetForm();
    await loadUsers();
  }

  async function removeUser(id: number) {
    await apiFetch(`/api/users/${id}`, { method: "DELETE" });
    await loadUsers();
    toast.success(t("accounts.deleted"));
  }

  if (loadingUsers) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const initial = (s: string) => (s[0] ?? "?").toUpperCase();

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <Users className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-base font-semibold">{t("accounts.members")}</p>
              <p className="text-xs text-muted-foreground">
                {t("accounts.membersCount", { count: users.length })}
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            className="h-9 gap-1.5 rounded-full px-4 text-xs"
            onClick={openCreate}
          >
            <Plus className="size-3.5" />
            {t("accounts.add")}
          </Button>
        </div>
      </div>

      {/* Members list */}
      <div className="rounded-2xl border border-border/60 bg-card">
        <div className="px-5 pt-4 pb-1">
          <SectionHeader title={t("accounts.members")} />
        </div>

        <div className="px-5 pb-3 divide-y divide-border/40">
          {users.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("accounts.noAccounts")}
            </p>
          ) : (
            users.map((u) => (
              <div
                key={u.id}
                className="group flex items-center gap-3 py-3.5 transition-colors"
              >
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    u.role === "ADMIN"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {initial(u.username)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{u.username}</p>
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold leading-none",
                        u.role === "ADMIN"
                          ? "bg-blue-700 text-white"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {u.role === "ADMIN" ? (
                        <Shield className="size-2.5" />
                      ) : (
                        <UserIcon className="size-2.5" />
                      )}
                      {u.role === "ADMIN" ? t("accounts.admin") : t("accounts.user")}
                    </span>
                  </div>
                  {u.createdAt && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {t("accounts.createdAt")}{" "}
                      {new Date(u.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-full"
                    onClick={() => void openEdit(u)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      setConfirmUser(u);
                      setConfirmOpen(true);
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-2xl border-border/60">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("accounts.confirmDeleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmUser
                ? t("accounts.confirmDeleteDesc", { name: confirmUser.username })
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
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

      {/* Create / Edit dialog */}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) resetForm();
        }}
      >
        <DialogContent className="max-w-lg overflow-hidden rounded-2xl border-border/60 p-0">
          <DialogHeader className="border-b border-border/40 px-6 py-4">
            <DialogTitle className="text-base">
              {editId == null ? t("accounts.add") : t("accounts.edit")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 px-6 py-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                {t("accounts.username")}
              </Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={editId != null}
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                {t("accounts.password")}
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={editId != null ? t("accounts.passwordHint") : ""}
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                {t("accounts.role")}
              </Label>
              <Select value={role} onValueChange={(v) => setRole(v as "ADMIN" | "USER")}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="ADMIN" className="rounded-lg">
                    <span className="flex items-center gap-2">
                      <Shield className="size-3.5" />
                      {t("accounts.admin")}
                    </span>
                  </SelectItem>
                  <SelectItem value="USER" className="rounded-lg">
                    <span className="flex items-center gap-2">
                      <UserIcon className="size-3.5" />
                      {t("accounts.user")}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {role === "USER" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  {t("accounts.permissions")}
                </Label>
                <ScrollArea className="h-48 rounded-xl border border-border/60 bg-muted/20 p-3">
                  <AccessTree
                    nodes={tree}
                    depth={0}
                    folderIds={folderIds}
                    screenIds={screenIds}
                    onToggleFolder={(id, checked) => {
                      const desc = collectDescendantIds(tree, id);
                      setFolderIds((prev) => {
                        const n = new Set(prev);
                        if (checked) {
                          n.add(id);
                          for (const cid of desc.folderIds) n.add(cid);
                        } else {
                          n.delete(id);
                          for (const cid of desc.folderIds) n.delete(cid);
                        }
                        return n;
                      });
                      setScreenIds((prev) => {
                        const n = new Set(prev);
                        if (checked) {
                          for (const sid of desc.screenIds) n.add(sid);
                        } else {
                          for (const sid of desc.screenIds) n.delete(sid);
                        }
                        return n;
                      });
                    }}
                    onToggleScreen={(id, checked) => {
                      setScreenIds((prev) => {
                        const n = new Set(prev);
                        if (checked) n.add(id);
                        else n.delete(id);
                        return n;
                      });
                    }}
                  />
                </ScrollArea>
              </div>
            )}
          </div>

          <div className="flex justify-end border-t border-border/40 bg-muted/20 px-6 py-3.5">
            <Button
              type="button"
              size="sm"
              className="h-9 gap-1.5 rounded-full px-5"
              onClick={() => void saveUser()}
            >
              {t("accounts.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
