import { PX_PER_MS, TRACK_LABEL_W } from "@/lib/timeline";

interface TimeRulerProps {
  totalDurationMs: number;
}

export function TimeRuler({ totalDurationMs }: TimeRulerProps) {
  const stepMs = 5000;
  const tickCount = Math.ceil(totalDurationMs / stepMs) + 1;

  return (
    <div
      style={{
        height: 20,
        borderBottom: "1px solid color-mix(in oklch, var(--border), transparent 50%)",
        paddingLeft: TRACK_LABEL_W,
        display: "flex",
        alignItems: "flex-end",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
        background: "var(--card)",
      }}
    >
      {Array.from({ length: tickCount }, (_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: TRACK_LABEL_W + i * stepMs * PX_PER_MS,
            fontSize: 9,
            color: "var(--muted-foreground)",
            bottom: 2,
            fontFamily: "monospace",
            whiteSpace: "nowrap",
          }}
        >
          {i * 5}s
        </div>
      ))}
    </div>
  );
}
