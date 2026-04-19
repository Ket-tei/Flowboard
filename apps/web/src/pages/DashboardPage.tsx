import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { LayoutGrid, Plus, RotateCcw } from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { WidgetPicker } from "@/components/dashboard/WidgetPicker";
import { Button } from "@/components/ui/button";

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border/60 bg-card min-h-[160px] animate-pulse"
        >
          <div className="px-4 pt-3 pb-2">
            <div className="h-3 w-24 rounded bg-muted" />
          </div>
          <div className="flex items-center justify-center flex-1 px-4 pb-4">
            <div className="h-8 w-16 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
  const [showPicker, setShowPicker] = useState(false);

  const {
    loading,
    error,
    stats,
    layout,
    addWidget,
    removeWidget,
    reorderWidgets,
    resetLayout,
    role,
  } = useDashboard();

  const activeIds = useMemo(() => new Set(layout.map((l) => l.widgetId)), [layout]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <LayoutGrid className="size-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold truncate">{t("dashboard.title")}</h1>
              <p className="text-xs text-muted-foreground truncate">{t("dashboard.subtitle")}</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-full text-xs gap-1.5"
              onClick={resetLayout}
            >
              <RotateCcw className="size-3.5" />
              {t("dashboard.resetLayout")}
            </Button>
            <Button
              size="sm"
              className="h-8 rounded-full text-xs gap-1.5"
              onClick={() => setShowPicker(!showPicker)}
            >
              <Plus className="size-3.5" />
              {t("dashboard.addWidget")}
            </Button>
          </div>
        </div>
      </div>

      {/* Widget picker */}
      {showPicker && (
        <WidgetPicker
          role={role as "ADMIN" | "USER"}
          activeIds={activeIds}
          onAdd={(id) => addWidget(id)}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <SkeletonGrid />
      ) : layout.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card px-6 py-16 text-center">
          <LayoutGrid className="mx-auto size-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">{t("dashboard.noWidgets")}</p>
        </div>
      ) : (
        <DashboardGrid
          layout={layout}
          data={stats}
          onReorder={reorderWidgets}
          onRemove={removeWidget}
        />
      )}
    </div>
  );
}
