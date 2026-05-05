import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Users } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useUsersManager } from "@/hooks/useUsersManager";
import { UserForm } from "@/components/accounts/UserForm";
import { UsersList } from "@/components/accounts/UsersList";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export function AccountsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const mgr = useUsersManager();

  if (user?.role !== "ADMIN") {
    return <Navigate to="/app/dashboard" replace />;
  }

  if (mgr.loadingUsers) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <Users className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-base font-semibold">{t("accounts.members")}</p>
              <p className="text-xs text-muted-foreground">
                {t("accounts.membersCount", { count: mgr.users.length })}
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            className="h-9 gap-1.5 rounded-full px-4 text-xs"
            onClick={mgr.openCreate}
          >
            <Plus className="size-3.5" />
            {t("accounts.add")}
          </Button>
        </div>
      </div>

      <UsersList
        users={mgr.users}
        confirmOpen={mgr.confirmOpen}
        confirmUser={mgr.confirmUser}
        onEdit={(u) => void mgr.openEdit(u)}
        onRequestDelete={mgr.requestDelete}
        onConfirmDelete={() => void mgr.confirmDelete()}
        onCancelDelete={() => mgr.setConfirmOpen(false)}
      />

      <UserForm
        open={mgr.formOpen}
        onOpenChange={(next) => {
          mgr.setFormOpen(next);
        }}
        form={mgr.form}
        updateForm={mgr.updateForm}
        tree={mgr.tree}
        templateTree={mgr.templateTree}
        onSave={() => void mgr.saveUser()}
      />
    </div>
  );
}
