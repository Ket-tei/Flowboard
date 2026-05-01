import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import type { WidgetLayoutItem } from "@/hooks/useDashboard";
import { WidgetCard } from "./WidgetCard";

export function DashboardGrid({
  layout,
  data,
  onReorder,
  onRemove,
  editMode = false,
}: {
  layout: WidgetLayoutItem[];
  data: any;
  onReorder: (from: number, to: number) => void;
  onRemove: (widgetId: string) => void;
  editMode?: boolean;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = layout.findIndex((l) => l.widgetId === active.id);
    const newIndex = layout.findIndex((l) => l.widgetId === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      onReorder(oldIndex, newIndex);
    }
  }

  const ids = layout.map((l) => l.widgetId);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {layout.map((item) => (
            <WidgetCard
              key={item.widgetId}
              widgetId={item.widgetId}
              data={data}
              onRemove={() => onRemove(item.widgetId)}
              showRemove={editMode}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
