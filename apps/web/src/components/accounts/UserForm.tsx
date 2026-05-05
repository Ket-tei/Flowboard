import { useTranslation } from "react-i18next";
import { Shield, User as UserIcon } from "lucide-react";
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
import { AccessTree, collectDescendantIds } from "@/components/accounts/AccessTree";
import type { TreeFolder } from "@/types/tree.types";
import type { UserFormState } from "@/hooks/useUsersManager";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UserFormState;
  updateForm: (patch: Partial<UserFormState>) => void;
  tree: TreeFolder[];
  templateTree: TreeFolder[];
  onSave: () => void;
};

export function UserForm({ open, onOpenChange, form, updateForm, tree, templateTree, onSave }: Props) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden rounded-2xl border-border/60 p-0">
        <DialogHeader className="border-b border-border/40 px-6 py-4">
          <DialogTitle className="text-base">
            {form.editId == null ? t("accounts.add") : t("accounts.edit")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              {t("accounts.username")}
            </Label>
            <Input
              value={form.username}
              onChange={(e) => updateForm({ username: e.target.value })}
              disabled={form.editId != null}
              className="h-10 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              {t("accounts.password")}
            </Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => updateForm({ password: e.target.value })}
              placeholder={form.editId != null ? t("accounts.passwordHint") : ""}
              className="h-10 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              {t("accounts.role")}
            </Label>
            <Select value={form.role} onValueChange={(v) => updateForm({ role: v as "ADMIN" | "USER" })}>
              <SelectTrigger className="h-10 w-full rounded-xl">
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

          {form.role === "USER" && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  {t("accounts.permissions")}
                </Label>
                <ScrollArea className="h-48 rounded-xl border border-border/60 bg-muted/20 p-3">
                  <AccessTree
                    nodes={tree}
                    depth={0}
                    folderIds={form.folderIds}
                    screenIds={form.screenIds}
                    onToggleFolder={(id, checked) => {
                      const desc = collectDescendantIds(tree, id);
                      const folderIds = new Set(form.folderIds);
                      const screenIds = new Set(form.screenIds);
                      if (checked) {
                        folderIds.add(id);
                        for (const cid of desc.folderIds) folderIds.add(cid);
                        for (const sid of desc.screenIds) screenIds.add(sid);
                      } else {
                        folderIds.delete(id);
                        for (const cid of desc.folderIds) folderIds.delete(cid);
                        for (const sid of desc.screenIds) screenIds.delete(sid);
                      }
                      updateForm({ folderIds, screenIds });
                    }}
                    onToggleScreen={(id, checked) => {
                      const screenIds = new Set(form.screenIds);
                      if (checked) screenIds.add(id);
                      else screenIds.delete(id);
                      updateForm({ screenIds });
                    }}
                  />
                </ScrollArea>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  {t("accounts.templateAccess")}
                </Label>
                <ScrollArea className="h-48 rounded-xl border border-border/60 bg-muted/20 p-3">
                  {templateTree.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">{t("templates.noTemplates")}</p>
                  ) : (
                    <AccessTree
                      nodes={templateTree}
                      depth={0}
                      folderIds={form.templateFolderIds}
                      screenIds={form.templateIds}
                      onToggleFolder={(id, checked) => {
                        const desc = collectDescendantIds(templateTree, id);
                        const templateFolderIds = new Set(form.templateFolderIds);
                        const templateIds = new Set(form.templateIds);
                        if (checked) {
                          templateFolderIds.add(id);
                          for (const cid of desc.folderIds) templateFolderIds.add(cid);
                          for (const sid of desc.screenIds) templateIds.add(sid);
                        } else {
                          templateFolderIds.delete(id);
                          for (const cid of desc.folderIds) templateFolderIds.delete(cid);
                          for (const sid of desc.screenIds) templateIds.delete(sid);
                        }
                        updateForm({ templateFolderIds, templateIds });
                      }}
                      onToggleScreen={(id, checked) => {
                        const templateIds = new Set(form.templateIds);
                        if (checked) templateIds.add(id);
                        else templateIds.delete(id);
                        updateForm({ templateIds });
                      }}
                    />
                  )}
                </ScrollArea>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end border-t border-border/40 bg-muted/20 px-6 py-3.5">
          <Button
            type="button"
            size="sm"
            className="h-9 gap-1.5 rounded-full px-5"
            onClick={onSave}
          >
            {t("accounts.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
