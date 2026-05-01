import { useState } from "react";
import { MonitorPlay } from "lucide-react";
import type { PlayerItem } from "@/components/show/ScreenPlayer";
import { ScreenPlayer } from "@/components/show/ScreenPlayer";
import type { TemplateWidget } from "@/types/screen.types";
import { EditableWidgetOverlay } from "./EditableWidgetOverlay";

export function LivePreview({
  items,
  widgets,
  onWidgetChange,
}: {
  items: PlayerItem[];
  widgets: TemplateWidget[];
  onWidgetChange: (id: number, geom: { x: number; y: number; w: number; h: number }) => void;
}) {
  const [currentMs, setCurrentMs] = useState(0);
  const [selectedWidgetId, setSelectedWidgetId] = useState<number | null>(null);

  const visibleWidgets = widgets.filter((w) => {
    if (w.startMs !== null && currentMs < w.startMs) return false;
    if (w.endMs !== null && currentMs >= w.endMs) return false;
    return true;
  });

  return (
    <div
      className="relative flex h-full w-full items-center justify-center bg-black"
      onClick={() => setSelectedWidgetId(null)}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-lg bg-muted shadow-2xl"
        style={{ aspectRatio: "16 / 9" }}
      >
        {items.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <MonitorPlay className="size-10 text-muted-foreground opacity-20" />
            <span className="text-sm text-muted-foreground opacity-40">Aperçu du diaporama</span>
          </div>
        ) : (
          <ScreenPlayer items={items} widgets={[]} onTime={setCurrentMs} />
        )}

        {visibleWidgets.map((w) => (
          <EditableWidgetOverlay
            key={w.id}
            widget={w}
            isSelected={selectedWidgetId === w.id}
            onSelect={() => setSelectedWidgetId(w.id)}
            onChange={(geom) => onWidgetChange(w.id, geom)}
          />
        ))}
      </div>
    </div>
  );
}
