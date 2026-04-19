import { useTranslation } from "react-i18next";

export default function AdminVsUserWidget({ data }: { data: any }) {
  const { t } = useTranslation();
  const admins = data?.adminCount ?? 0;
  const users = data?.userRoleCount ?? 0;
  const total = admins + users || 1;
  const adminPct = Math.round((admins / total) * 100);
  const userPct = 100 - adminPct;

  return (
    <div className="flex flex-col justify-center gap-4 h-full">
      <div className="flex h-4 w-full rounded-full overflow-hidden bg-muted/60">
        {adminPct > 0 && (
          <div
            className="h-full bg-blue-700 transition-all duration-500"
            style={{ width: `${adminPct}%` }}
          />
        )}
        {userPct > 0 && (
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${userPct}%` }}
          />
        )}
      </div>
      <div className="flex justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-blue-700" />
          <span className="text-muted-foreground">{t("dashboard.widgets.admins")}</span>
          <span className="font-semibold">{admins}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">{t("dashboard.widgets.users")}</span>
          <span className="font-semibold">{users}</span>
        </div>
      </div>
    </div>
  );
}
