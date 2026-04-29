import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ScreenItem, TransitionType } from "@/types/screen.types";

const TRANSITIONS: TransitionType[] = ["NONE", "FADE", "SLIDE_LEFT", "SLIDE_UP"];

export function SortableMediaCard({
  item,
  token,
  mediaUrlBase,
  onUpdateDuration,
  onUpdateTransition,
  onDelete,
}: {
  item: ScreenItem;
  token: string;
  mediaUrlBase?: string;
  onUpdateDuration: (id: number, durationMs: number) => void;
  onUpdateTransition: (id: number, transitionType: TransitionType) => void;
  onDelete: (id: number) => void;
}) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(item.id),
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const base = mediaUrlBase ?? `/api/public/screens/${token}/media`;
  const src = apiUrl(`${base}/${item.id}`);
  const [durationStr, setDurationStr] = useState<string>(() => String(item.durationMs ?? 5000));

  useEffect(() => {
    setDurationStr(String(item.durationMs ?? 5000));
  }, [item.durationMs]);

  const isVideo = item.type === "VIDEO";
  const currentTransition = item.transitionType ?? "NONE";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex w-48 shrink-0 flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md",
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

      <div className="flex flex-col gap-1.5 bg-card p-2">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground text-[10px] leading-none font-medium">ms</span>
          <Input
            type="number"
            inputMode="numeric"
            className="h-6 flex-1 rounded-lg border-border bg-card px-1.5 text-xs"
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
        <select
          value={currentTransition}
          onChange={(e) => onUpdateTransition(item.id, e.target.value as TransitionType)}
          className="h-6 w-full rounded-lg border border-border/60 bg-transparent px-1.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {TRANSITIONS.map((tr) => (
            <option key={tr} value={tr}>{t(`transitions.${tr}`)}</option>
          ))}
        </select>
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
