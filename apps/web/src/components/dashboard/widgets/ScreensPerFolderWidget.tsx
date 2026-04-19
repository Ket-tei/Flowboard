import { useTranslation } from "react-i18next";

export default function ScreensPerFolderWidget({ data }: { data: any }) {
  const { t } = useTranslation();
  const rows: { folderName: string; screenCount: number }[] = data?.screensPerFolder ?? [];

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        {t("dashboard.widgets.noData")}
      </div>
    );
  }

  const max = Math.max(...rows.map((r) => r.screenCount), 1);

  return (
    <div className="flex flex-col justify-center gap-2.5 h-full">
      {rows.map((r) => (
        <div key={r.folderName} className="flex items-center gap-3">
          <span className="w-24 text-xs text-muted-foreground truncate text-right shrink-0">
            {r.folderName}
          </span>
          <div className="flex-1 h-5 rounded-full bg-muted/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary/80 transition-all duration-500"
              style={{ width: `${Math.round((r.screenCount / max) * 100)}%` }}
            />
          </div>
          <span className="w-6 text-xs font-medium text-right">{r.screenCount}</span>
        </div>
      ))}
    </div>
  );
}
