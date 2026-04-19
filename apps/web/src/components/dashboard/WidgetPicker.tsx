import { useTranslation } from "react-i18next";
import { Plus, Check } from "lucide-react";
import { WIDGET_REGISTRY } from "./widget-registry";
import { Button } from "@/components/ui/button";

export function WidgetPicker({
  role,
  activeIds,
  onAdd,
  onClose,
}: {
  role: "ADMIN" | "USER";
  activeIds: Set<string>;
  onAdd: (widgetId: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const available = WIDGET_REGISTRY.filter((w) => w.roles.includes(role));

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t("dashboard.widgetPicker")}</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 rounded-full text-xs"
          onClick={onClose}
        >
          {t("dashboard.close")}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {available.map((w) => {
          const added = activeIds.has(w.id);
          const Icon = w.icon;
          return (
            <button
              key={w.id}
              disabled={added}
              onClick={() => onAdd(w.id)}
              className="flex items-center gap-3 rounded-lg border border-border/40 px-3 py-2.5 text-left transition hover:bg-accent disabled:opacity-50 disabled:cursor-default"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/80">
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{t(w.titleKey)}</p>
                <p className="text-xs text-muted-foreground truncate">{t(w.descKey)}</p>
              </div>
              {added ? (
                <Check className="size-4 text-emerald-500 shrink-0" />
              ) : (
                <Plus className="size-4 text-muted-foreground shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
