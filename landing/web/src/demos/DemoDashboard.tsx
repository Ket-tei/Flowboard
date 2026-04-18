import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { ALL_WIDGETS, DEFAULT_WIDGET_IDS, type DemoWidget } from "./demo-data";

const MAX_WIDGETS = 3;

function WidgetCard({ widget, onRemove }: { widget: DemoWidget; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: widget.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "group flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm",
        isDragging && "z-10 opacity-80 shadow-lg"
      )}
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab text-gray-300 hover:text-gray-400 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full p-0.5 text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-500"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-3 text-center">
        <span className={cn("inline-block rounded-lg px-3 py-1.5 text-2xl font-bold", widget.color)}>
          {widget.value}
        </span>
        <p className="mt-2 text-xs font-medium text-gray-500">{widget.label}</p>
      </div>
    </div>
  );
}

const defaultWidgets = ALL_WIDGETS.filter((w) => DEFAULT_WIDGET_IDS.includes(w.id)).slice(0, 2);

export function DemoDashboard() {
  const [widgets, setWidgets] = useState<DemoWidget[]>(defaultWidgets);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        setWidgets((prev) => {
          const oldIdx = prev.findIndex((w) => w.id === active.id);
          const newIdx = prev.findIndex((w) => w.id === over.id);
          return arrayMove(prev, oldIdx, newIdx);
        });
      }
    },
    []
  );

  const available = ALL_WIDGETS.filter((aw) => !widgets.some((w) => w.id === aw.id));
  const atLimit = widgets.length >= MAX_WIDGETS;
  const canAddAny = !atLimit && available.length > 0;
  const slots = Array.from({ length: MAX_WIDGETS }, (_, i) => widgets[i] ?? null);

  return (
    <div className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Dashboard</h3>
      </div>

      {/* Fixed-height picker zone to prevent layout shift */}
      <div className="mb-4 min-h-[32px]">
        {canAddAny && (
          <div className="flex flex-wrap gap-2">
            {atLimit ? null : available.length > 0 ? (
              available.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => {
                    setWidgets((prev) => (prev.length < MAX_WIDGETS ? [...prev, w] : prev));
                  }}
                  className="rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs text-gray-500 transition-colors hover:border-indigo-400 hover:text-indigo-600"
                >
                  + {w.label}
                </button>
              ))
            ) : (
              <span className="px-1 text-xs text-gray-400">Tous les widgets sont affichés</span>
            )}
          </div>
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {slots.map((w, idx) =>
              w ? (
                <WidgetCard
                  key={w.id}
                  widget={w}
                  onRemove={() => setWidgets((prev) => prev.filter((x) => x.id !== w.id))}
                />
              ) : (
                <div
                  key={`empty-${idx}`}
                  className="min-h-[132px] rounded-xl border border-dashed border-gray-200 bg-gray-50/50"
                />
              )
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
