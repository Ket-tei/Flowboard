import { useTranslation } from "react-i18next";
import type { TransitionType } from "@/types/screen.types";

const TRANSITIONS: TransitionType[] = ["NONE", "FADE", "SLIDE_LEFT", "SLIDE_UP"];

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
  const isNone = transitionType === "NONE";

  return (
    <div
      style={{
        width: 84,
        height: 48,
        borderRadius: 6,
        background: "color-mix(in oklch, var(--border), transparent 30%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        gap: 3,
        padding: "0 6px",
      }}
    >
      <select
        value={transitionType}
        onChange={(e) => onChangeType(e.target.value as TransitionType)}
        style={{
          width: "100%",
          height: 20,
          border: "none",
          background: "transparent",
          fontSize: 9,
          fontFamily: "inherit",
          color: "var(--foreground)",
          outline: "none",
          cursor: "pointer",
          textAlign: "center",
        }}
        title={t("templateEditor.transitionLabel")}
      >
        {TRANSITIONS.map((tr) => (
          <option key={tr} value={tr}>
            {t(`transitions.${tr}`)}
          </option>
        ))}
      </select>
      {!isNone && (
        <input
          type="number"
          value={transitionDurationMs}
          onChange={(e) => onChangeDuration(Math.min(5000, Math.max(50, Number(e.target.value) || 350)))}
          step={50}
          min={50}
          max={5000}
          style={{
            width: 52,
            height: 16,
            border: "none",
            background: "rgba(0,0,0,0.08)",
            borderRadius: 3,
            fontSize: 9,
            textAlign: "center",
            fontFamily: "inherit",
            color: "var(--muted-foreground)",
            outline: "none",
          }}
          title={t("templateEditor.transitionDuration")}
        />
      )}
    </div>
  );
}
