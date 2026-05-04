import { useTranslation } from "react-i18next";
import type { TransitionType } from "@/types/screen.types";

const TRANSITIONS: TransitionType[] = ["NONE", "FADE", "SLIDE_LEFT", "SLIDE_UP"];

// Visual scale for transition blocks: ~0.12px per ms
// 350ms → 42px, 500ms → 60px, 1000ms → 120px
const TR_PX_PER_MS = 0.12;
const MIN_TR_PX = 32;
const MIN_TR_MS = 50;
const MAX_TR_MS = 5000;

interface InlineTransitionBlockProps {
  transitionType: TransitionType;
  transitionDurationMs: number;
  onChangeType: (type: TransitionType) => void;
  onChangeDuration: (ms: number) => void;
}

export function InlineTransitionBlock({
  transitionType,
  transitionDurationMs,
  onChangeType,
  onChangeDuration,
}: InlineTransitionBlockProps) {
  const { t } = useTranslation();
  const widthPx = Math.max(MIN_TR_PX, Math.round(transitionDurationMs * TR_PX_PER_MS));
  const isNone = transitionType === "NONE";

  function startDrag(side: "left" | "right") {
    return (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const startX = e.clientX;
      const startW = widthPx;

      const move = (ev: MouseEvent) => {
        const delta = side === "right" ? ev.clientX - startX : startX - ev.clientX;
        const newW = Math.max(MIN_TR_PX, startW + delta);
        const newMs = Math.max(MIN_TR_MS, Math.min(MAX_TR_MS, Math.round(newW / TR_PX_PER_MS)));
        onChangeDuration(newMs);
      };

      const up = () => {
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", up);
      };

      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
    };
  }

  function cycleType(e: React.MouseEvent) {
    e.stopPropagation();
    const idx = TRANSITIONS.indexOf(transitionType);
    onChangeType(TRANSITIONS[(idx + 1) % TRANSITIONS.length]);
  }

  const label = isNone ? "—" : t(`transitions.${transitionType}`);

  return (
    <div
      style={{
        position: "relative",
        width: widthPx,
        height: 48,
        borderRadius: 4,
        background: isNone
          ? "color-mix(in oklch, var(--border), transparent 20%)"
          : "color-mix(in oklch, var(--primary), transparent 55%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        cursor: "pointer",
        userSelect: "none",
        overflow: "hidden",
      }}
      onClick={cycleType}
      title={`${t("templateEditor.transitionLabel")}: ${t(`transitions.${transitionType}`)} · ${transitionDurationMs}ms — cliquer pour changer`}
    >
      {/* Left resize handle */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 10,
          height: "100%",
          cursor: "ew-resize",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
        }}
        onMouseDown={startDrag("left")}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: 3,
            height: 16,
            borderRadius: 2,
            background: isNone ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.45)",
          }}
        />
      </div>

      {/* Transition type label */}
      <span
        style={{
          fontSize: 9,
          fontWeight: 500,
          color: isNone ? "var(--muted-foreground)" : "rgba(255,255,255,0.85)",
          textAlign: "center",
          pointerEvents: "none",
          maxWidth: "calc(100% - 24px)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>

      {/* Right resize handle */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: 10,
          height: "100%",
          cursor: "ew-resize",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
        }}
        onMouseDown={startDrag("right")}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: 3,
            height: 16,
            borderRadius: 2,
            background: isNone ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.45)",
          }}
        />
      </div>
    </div>
  );
}
