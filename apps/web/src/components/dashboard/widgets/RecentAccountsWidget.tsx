import { useTranslation } from "react-i18next";

export default function RecentAccountsWidget({ data }: { data: any }) {
  const { t } = useTranslation();
  const accounts: { id: number; username: string; role: string; createdAt: string }[] =
    data?.recentAccounts ?? [];

  if (accounts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        {t("dashboard.widgets.noData")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 h-full overflow-y-auto">
      {accounts.map((a) => {
        const initial = (a.username ?? "?")[0].toUpperCase();
        const isAdmin = a.role === "ADMIN";
        return (
          <div
            key={a.id}
            className="flex items-center gap-3 rounded-lg px-2 py-1.5"
          >
            <div
              className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                isAdmin ? "bg-blue-700" : "bg-emerald-500"
              }`}
            >
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{a.username}</p>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? t("dashboard.widgets.admins") : t("dashboard.widgets.users")}
                {a.createdAt && ` · ${new Date(a.createdAt).toLocaleDateString()}`}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
