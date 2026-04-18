import { Trash2, Plus, Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import { MEDIA_POOL, MAX_MEDIA, type DemoMediaItem } from "./demo-data";

type Props = {
  items: DemoMediaItem[];
  onChange: (items: DemoMediaItem[]) => void;
};

export function DemoMedia({ items, onChange }: Props) {
  const canAdd = items.length < MAX_MEDIA;
  const nextAvailable = MEDIA_POOL.find((m) => !items.some((i) => i.id === m.id));

  function handleAdd() {
    if (!canAdd || !nextAvailable) return;
    onChange([...items, nextAvailable]);
  }

  function handleRemove(id: string) {
    onChange(items.filter((m) => m.id !== id));
  }

  function handleDuration(id: string, val: number) {
    onChange(items.map((m) => (m.id === id ? { ...m, durationMs: val } : m)));
  }

  const slots = Array.from({ length: MAX_MEDIA }, (_, i) => items[i] ?? null);

  return (
    <div className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Médias</h3>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!canAdd || !nextAvailable}
          className={cn(
            "flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium transition-colors",
            canAdd && nextAvailable
              ? "text-gray-600 hover:bg-gray-50"
              : "cursor-not-allowed text-gray-300"
          )}
        >
          <Plus className="h-3 w-3" />
          Ajouter
        </button>
      </div>

      <div className="space-y-2">
        {slots.map((item, idx) =>
          item ? (
            <div
              key={item.id}
              className="flex h-[68px] items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-2.5"
            >
              <img
                src={item.thumb}
                alt={item.name}
                className="h-12 w-16 rounded-md object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-700">{item.name}</p>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  <input
                    type="number"
                    value={item.durationMs}
                    onChange={(e) => handleDuration(item.id, Number(e.target.value))}
                    className="w-16 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs text-gray-600 outline-none focus:border-indigo-300"
                  />
                  <span>ms</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                className="rounded-full p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div
              key={`empty-${idx}`}
              className="h-[68px] rounded-lg border border-dashed border-gray-200 bg-gray-50/50"
            />
          )
        )}
      </div>
    </div>
  );
}
