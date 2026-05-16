import { useTranslation } from "react-i18next";
import { Pencil, Shield, Trash2, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import type { UserRow } from "@/types/user.types";

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-1 pt-2">
      {title}
    </h3>
  );
}

type Props = {
  users: UserRow[];
  confirmOpen: boolean;
  confirmUser: UserRow | null;
  onEdit: (u: UserRow) => void;
  onRequestDelete: (u: UserRow) => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
};

export function UsersList({ users, confirmOpen, confirmUser, onEdit, onRequestDelete, onConfirmDelete, onCancelDelete }: Props) {
  const { t } = useTranslation();
  const initial = (s: string) => (s[0] ?? "?").toUpperCase();

  return (
    <>
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
              <div key={u.id} className="group flex items-center gap-3 py-3.5 transition-colors">
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
                          ? "bg-primary text-primary-foreground"
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
                    onClick={() => void onEdit(u)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onRequestDelete(u)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={(open) => { if (!open) onCancelDelete(); }}>
        <AlertDialogContent className="rounded-2xl border-border/60">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("accounts.confirmDeleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmUser ? t("accounts.confirmDeleteDesc", { name: confirmUser.username }) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full" onClick={onCancelDelete}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={onConfirmDelete}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
