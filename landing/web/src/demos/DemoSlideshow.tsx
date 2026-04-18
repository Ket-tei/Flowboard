import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/cn";
import { ImageIcon } from "lucide-react";
import type { DemoMediaItem } from "./demo-data";

type Props = {
  items: DemoMediaItem[];
};

export function DemoSlideshow({ items }: Props) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (current >= items.length && items.length > 0) {
      setCurrent(0);
    }
  }, [items.length, current]);

  useEffect(() => {
    if (items.length === 0) return;

    const safeIdx = current < items.length ? current : 0;
    const duration = items[safeIdx]?.durationMs ?? 5000;

    timerRef.current = setTimeout(() => {
      setCurrent((c) => (c + 1) % items.length);
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [current, items]);

  const thumbToSlide = (thumb: string) =>
    thumb.replace(/w=\d+/, "w=600").replace(/h=\d+/, "h=340");

  if (items.length === 0) {
    return (
      <div className="relative aspect-video overflow-hidden bg-gray-900">
        <div className="flex h-full items-center justify-center">
          <div className="text-center text-gray-500">
            <ImageIcon className="mx-auto h-8 w-8 text-gray-600" />
            <p className="mt-2 text-sm">Ajoutez des médias ci-dessus</p>
          </div>
        </div>
      </div>
    );
  }

  const safeIdx = current < items.length ? current : 0;

  return (
    <div className="relative aspect-video overflow-hidden bg-black">
      {items.map((item, i) => (
        <img
          key={item.id}
          src={thumbToSlide(item.thumb)}
          alt={item.name}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
            i === safeIdx ? "opacity-100" : "opacity-0"
          )}
        />
      ))}

      {items.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrent(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === safeIdx ? "w-6 bg-white" : "w-1.5 bg-white/50"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
