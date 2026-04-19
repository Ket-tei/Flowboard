import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import {
  Globe,
  LogOut,
  Monitor,
  Moon,
  Sun,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { setAppLanguage } from "@/i18n";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

function SettingRow({
  icon: Icon,
  label,
  description,
  children,
  className,
}: {
  icon: React.ElementType;
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4 py-3", className)}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/80">
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium leading-tight">{label}</p>
          {description && (
            <p className="text-xs text-muted-foreground leading-tight mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-1 pt-2">
      {title}
    </h3>
  );
}

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const expectedHostname = window.location.hostname;

  async function onLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  async function onDeleteInstance() {
    setDeleting(true);
    try {
      await apiFetch("/api/instance/self", { method: "DELETE" });
      await logout();
      window.location.href = "https://flowboard.canope.org";
    } catch {
      setDeleting(false);
    }
  }

  function handleDeleteOpenChange(open: boolean) {
    setDeleteOpen(open);
    if (!open) setDeleteConfirmText("");
  }

  const initial = (user?.username ?? "?")[0].toUpperCase();

  return (
    <div className="space-y-6">
      {/* Profile card */}
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold truncate">{user?.username}</p>
            <p className="text-sm text-muted-foreground">
              {user?.role === "ADMIN" ? t("accounts.admin") : t("accounts.user")}
            </p>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="rounded-xl border border-border/60 bg-card">
        <div className="px-5 pt-4 pb-1">
          <SectionHeader title={t("settings.preferences")} />
        </div>

        <div className="px-5 divide-y divide-border/40">
          <SettingRow
            icon={Globe}
            label={t("settings.language")}
            description={t("settings.languageDesc")}
          >
            <Select
              value={i18n.language.startsWith("en") ? "en" : "fr"}
              onValueChange={(lng) => {
                if (lng) setAppLanguage(lng);
              }}
            >
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow
            icon={theme === "dark" ? Moon : theme === "light" ? Sun : Monitor}
            label={t("settings.theme")}
            description={t("settings.themeDesc")}
          >
            <Select
              value={theme ?? "system"}
              onValueChange={(v) => {
                if (v) setTheme(v);
              }}
            >
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <span className="flex items-center gap-2">
                    <Sun className="size-3.5" />
                    {t("settings.themeLight")}
                  </span>
                </SelectItem>
                <SelectItem value="dark">
                  <span className="flex items-center gap-2">
                    <Moon className="size-3.5" />
                    {t("settings.themeDark")}
                  </span>
                </SelectItem>
                <SelectItem value="system">
                  <span className="flex items-center gap-2">
                    <Monitor className="size-3.5" />
                    {t("settings.themeSystem")}
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-destructive/30 bg-card">
        <div className="px-5 pt-4 pb-1">
          <SectionHeader title={t("settings.dangerZone")} />
        </div>

        <div className="px-5 pb-2 divide-y divide-border/40">
          <SettingRow
            icon={LogOut}
            label={t("settings.logout")}
            description={t("settings.logoutDesc")}
          >
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="h-8 text-xs font-medium"
              onClick={() => void onLogout()}
            >
              {t("settings.logout")}
            </Button>
          </SettingRow>

          {user?.role === "ADMIN" && (
            <SettingRow
              icon={Trash2}
              label={t("settings.deleteInstance")}
              description={t("settings.deleteInstanceDesc")}
            >
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="h-8 text-xs font-medium"
                onClick={() => setDeleteOpen(true)}
                disabled={deleting}
              >
                {deleting ? t("settings.deleting") : t("settings.deleteInstance")}
              </Button>
            </SettingRow>
          )}
        </div>
      </div>

      <Dialog open={deleteOpen} onOpenChange={handleDeleteOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">{t("settings.deleteConfirmTitle")}</DialogTitle>
            <DialogDescription>{t("settings.deleteConfirmDesc")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              {t("settings.deleteConfirmHostnameLabel")}{" "}
              <span className="font-mono font-semibold text-foreground">{expectedHostname}</span>
            </p>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              onPaste={(e) => e.preventDefault()}
              placeholder={expectedHostname}
              className="h-10 rounded-xl font-mono text-sm"
              autoComplete="off"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDeleteOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={deleteConfirmText !== expectedHostname || deleting}
              onClick={() => void onDeleteInstance()}
            >
              {deleting ? t("settings.deleting") : t("settings.deleteConfirmButton")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
