import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import type { TreeFolder } from "@/types/tree.types";
import type { UserRow } from "@/types/user.types";

export type UserFormState = {
  editId: number | null;
  username: string;
  password: string;
  role: "ADMIN" | "USER";
  folderIds: Set<number>;
  screenIds: Set<number>;
  templateFolderIds: Set<number>;
  templateIds: Set<number>;
};

const EMPTY_FORM: UserFormState = {
  editId: null,
  username: "",
  password: "",
  role: "USER",
  folderIds: new Set(),
  screenIds: new Set(),
  templateFolderIds: new Set(),
  templateIds: new Set(),
};

export function useUsersManager() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [tree, setTree] = useState<TreeFolder[]>([]);
  const [templateTree, setTemplateTree] = useState<TreeFolder[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmUser, setConfirmUser] = useState<UserRow | null>(null);

  const loadUsers = useCallback(async () => {
    const r = await apiFetch<{ users: UserRow[] }>("/api/users");
    setUsers(r.users);
    setLoadingUsers(false);
  }, []);

  const loadTree = useCallback(async () => {
    const [screenRes, tplRes] = await Promise.all([
      apiFetch<{ tree: TreeFolder[] }>("/api/admin/folder-screen-tree"),
      apiFetch<{ tree: TreeFolder[] }>("/api/admin/template-folder-tree"),
    ]);
    setTree(screenRes.tree);
    setTemplateTree(tplRes.tree);
  }, []);

  useEffect(() => {
    void loadUsers();
    void loadTree();
  }, [loadUsers, loadTree]);

  function updateForm(patch: Partial<UserFormState>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  async function openEdit(u: UserRow) {
    const base: UserFormState = { ...EMPTY_FORM, editId: u.id, username: u.username, role: u.role };
    if (u.role === "USER") {
      const a = await apiFetch<{
        folderIds: number[];
        screenIds: number[];
        templateFolderIds: number[];
        templateIds: number[];
      }>(`/api/users/${u.id}/access`);
      base.folderIds = new Set(a.folderIds);
      base.screenIds = new Set(a.screenIds);
      base.templateFolderIds = new Set(a.templateFolderIds ?? []);
      base.templateIds = new Set(a.templateIds ?? []);
    }
    setForm(base);
    setFormOpen(true);
  }

  async function saveUser() {
    if (form.editId == null) {
      if (!form.username.trim() || !form.password) {
        toast.error(t("accounts.missingFields"));
        return;
      }
      await apiFetch("/api/users", {
        method: "POST",
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password,
          role: form.role,
          folderIds: form.role === "USER" ? [...form.folderIds] : [],
          screenIds: form.role === "USER" ? [...form.screenIds] : [],
          templateFolderIds: form.role === "USER" ? [...form.templateFolderIds] : [],
          templateIds: form.role === "USER" ? [...form.templateIds] : [],
        }),
      });
      toast.success(t("accounts.created"));
    } else {
      const body: Record<string, unknown> = { role: form.role };
      if (form.password) body.password = form.password;
      if (form.role === "USER") {
        body.folderIds = [...form.folderIds];
        body.screenIds = [...form.screenIds];
        body.templateFolderIds = [...form.templateFolderIds];
        body.templateIds = [...form.templateIds];
      }
      await apiFetch(`/api/users/${form.editId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      toast.success(t("accounts.updated"));
    }
    setFormOpen(false);
    setForm(EMPTY_FORM);
    await loadUsers();
  }

  async function removeUser(id: number) {
    await apiFetch(`/api/users/${id}`, { method: "DELETE" });
    await loadUsers();
    toast.success(t("accounts.deleted"));
  }

  function requestDelete(u: UserRow) {
    setConfirmUser(u);
    setConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!confirmUser) return;
    await removeUser(confirmUser.id);
    setConfirmUser(null);
    setConfirmOpen(false);
  }

  return {
    users,
    tree,
    templateTree,
    loadingUsers,
    formOpen,
    setFormOpen,
    form,
    updateForm,
    confirmOpen,
    setConfirmOpen,
    confirmUser,
    openCreate,
    openEdit,
    saveUser,
    requestDelete,
    confirmDelete,
  } as const;
}
