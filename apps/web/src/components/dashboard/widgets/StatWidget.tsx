import { useTranslation } from "react-i18next";

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-1">
      <span className="text-3xl font-bold tracking-tight">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function ScreenCountWidget({ data }: { data: any }) {
  const { t } = useTranslation();
  return <StatCard value={data?.screenCount ?? 0} label={t("dashboard.widgets.screenCount")} />;
}

export function FolderCountWidget({ data }: { data: any }) {
  const { t } = useTranslation();
  return <StatCard value={data?.folderCount ?? 0} label={t("dashboard.widgets.folderCount")} />;
}

export function MediaCountWidget({ data }: { data: any }) {
  const { t } = useTranslation();
  return <StatCard value={data?.mediaCount ?? 0} label={t("dashboard.widgets.mediaCount")} />;
}

export function AvgMediaWidget({ data }: { data: any }) {
  const { t } = useTranslation();
  return <StatCard value={data?.avgMediaPerScreen ?? 0} label={t("dashboard.widgets.avgMediaPerScreen")} />;
}

export function TotalDurationWidget({ data }: { data: any }) {
  const { t } = useTranslation();
  const ms = data?.totalDurationMs ?? 0;
  return <StatCard value={formatDuration(ms)} label={t("dashboard.widgets.totalDuration")} />;
}

export function UserCountWidget({ data }: { data: any }) {
  const { t } = useTranslation();
  return <StatCard value={data?.userCount ?? 0} label={t("dashboard.widgets.userCount")} />;
}
