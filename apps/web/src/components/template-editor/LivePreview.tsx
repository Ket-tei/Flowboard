import { useState } from "react";
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
      className="relative h-full w-full bg-black"
      onClick={() => setSelectedWidgetId(null)}
    >
      <ScreenPlayer
        items={items}
        widgets={[]}
        onTime={setCurrentMs}
      />

      {/* Editable widget overlays on top */}
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
  );
}
