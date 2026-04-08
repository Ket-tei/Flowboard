import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { setAppLanguage } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function onLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div>
      <Card className="max-w-xl border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium">{t("settings.connectedAs")}</CardTitle>
          <CardDescription>
            <span className="text-foreground font-medium">{user?.username}</span>
            <span className="text-muted-foreground"> · </span>
            <span>
              {t("settings.role")}: {user?.role}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("settings.language")}
            </Label>
            <Select
              value={i18n.language.startsWith("en") ? "en" : "fr"}
              onValueChange={(lng) => {
                if (lng) setAppLanguage(lng);
              }}
            >
              <SelectTrigger className="h-10 max-w-xs bg-background/80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator className="bg-border/60" />
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("settings.theme")}
            </Label>
            <Select
              value={theme ?? "system"}
              onValueChange={(v) => {
                if (v) setTheme(v);
              }}
            >
              <SelectTrigger className="h-10 max-w-xs bg-background/80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t("settings.themeLight")}</SelectItem>
                <SelectItem value="dark">{t("settings.themeDark")}</SelectItem>
                <SelectItem value="system">{t("settings.themeSystem")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator className="bg-border/60" />
          <Button type="button" variant="destructive" className="font-medium" onClick={() => void onLogout()}>
            {t("settings.logout")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
