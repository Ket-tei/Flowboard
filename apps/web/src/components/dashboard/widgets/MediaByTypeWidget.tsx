import { useTranslation } from "react-i18next";

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-14 text-xs text-muted-foreground text-right shrink-0">{label}</span>
      <div className="flex-1 h-6 rounded-full bg-muted/60 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-xs font-medium text-right">{value}</span>
    </div>
  );
}

export default function MediaByTypeWidget({ data }: { data: any }) {
  const { t } = useTranslation();
  const mediaByType = data?.mediaByType ?? { IMAGE: 0, VIDEO: 0, GIF: 0 };
  const max = Math.max(mediaByType.IMAGE, mediaByType.VIDEO, mediaByType.GIF, 1);

  return (
    <div className="flex flex-col justify-center gap-3 h-full px-1">
      <Bar label={t("dashboard.widgets.images")} value={mediaByType.IMAGE} max={max} color="bg-blue-600" />
      <Bar label={t("dashboard.widgets.videos")} value={mediaByType.VIDEO} max={max} color="bg-violet-500" />
      <Bar label={t("dashboard.widgets.gifs")} value={mediaByType.GIF} max={max} color="bg-amber-500" />
    </div>
  );
}
