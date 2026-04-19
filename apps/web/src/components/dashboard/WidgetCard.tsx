import { Suspense, lazy, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { GripVertical, X } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getWidgetDef, type WidgetSize } from "./widget-registry";

const sizeClasses: Record<WidgetSize, string> = {
  sm: "col-span-1 row-span-1",
  md: "col-span-1 row-span-1 sm:col-span-2",
  lg: "col-span-1 row-span-1 sm:col-span-2 lg:col-span-3",
};

export function WidgetCard({
  widgetId,
  data,
  onRemove,
}: {
  widgetId: string;
  data: any;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const def = getWidgetDef(widgetId);
  const [hovered, setHovered] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widgetId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const LazyWidget = useMemo(() => {
    if (!def) return null;
    return lazy(def.component);
  }, [def]);

  if (!def || !LazyWidget) return null;

  const Icon = def.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${sizeClasses[def.size]} rounded-xl border border-border/60 bg-card overflow-hidden flex flex-col min-h-[160px]`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
        <button
          className="cursor-grab active:cursor-grabbing touch-none rounded p-0.5 text-muted-foreground/50 hover:text-muted-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <Icon className="size-4 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex-1 truncate">
          {t(def.titleKey)}
        </span>
        <button
          onClick={onRemove}
          className={`rounded-full p-1 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-opacity ${
            hovered ? "opacity-100" : "opacity-0"
          }`}
          title={t("dashboard.removeWidget")}
        >
          <X className="size-3.5" />
        </button>
      </div>
      <div className="flex-1 px-4 pb-3">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full">
              <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-primary" />
            </div>
          }
        >
          <LazyWidget data={data} />
        </Suspense>
      </div>
    </div>
  );
}
