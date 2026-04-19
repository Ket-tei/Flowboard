import { useEffect, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ScreenItem } from "@/types/screen.types";

export function SortableMediaCard({
  item,
  token,
  onUpdateDuration,
  onDelete,
}: {
  item: ScreenItem;
  token: string;
  onUpdateDuration: (id: number, durationMs: number) => void;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const src = apiUrl(`/api/public/screens/${token}/media/${item.id}`);
  const [durationStr, setDurationStr] = useState<string>(() => String(item.durationMs ?? 5000));

  useEffect(() => {
    setDurationStr(String(item.durationMs ?? 5000));
  }, [item.durationMs]);

  const isVideo = item.type === "VIDEO";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex w-48 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md",
        isDragging && "opacity-60"
      )}
    >
      <button
        type="button"
        className="absolute left-2 top-2 z-10 cursor-grab touch-none rounded-lg bg-card p-1 text-muted-foreground shadow-sm"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3.5" />
      </button>

      {isVideo ? (
        <video src={src} className="h-36 w-full object-cover" muted playsInline />
      ) : (
        <img src={src} alt="" className="h-36 w-full object-cover" />
      )}

      <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center gap-1.5 rounded-lg bg-card p-1.5 shadow-sm">
        <span className="text-muted-foreground text-[10px] leading-none font-medium">ms</span>
        <Input
          type="number"
          inputMode="numeric"
          className="h-6 rounded-lg border-border bg-card px-1.5 text-xs"
          value={durationStr}
          min={0}
          step={100}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setDurationStr(e.target.value)}
          onBlur={() => {
            const n = Number(durationStr);
            if (!Number.isFinite(n)) {
              setDurationStr(String(item.durationMs ?? 5000));
              return;
            }
            onUpdateDuration(item.id, Math.max(0, Math.trunc(n)));
          }}
        />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 z-10 size-7 rounded-lg bg-card text-muted-foreground shadow-sm hover:bg-destructive hover:text-destructive-foreground"
        onClick={() => onDelete(item.id)}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}
