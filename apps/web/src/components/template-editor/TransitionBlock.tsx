import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import type { TransitionType } from "@/types/screen.types";

const TRANSITIONS: TransitionType[] = ["NONE", "FADE", "SLIDE_LEFT", "SLIDE_UP"];

export function TransitionBlock({
  transitionType,
  transitionDurationMs,
  onChange,
}: {
  transitionType: TransitionType;
  transitionDurationMs: number;
  onChange: (type: TransitionType, durationMs: number) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [localType, setLocalType] = useState(transitionType);
  const [localDur, setLocalDur] = useState(String(transitionDurationMs));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalType(transitionType);
    setLocalDur(String(transitionDurationMs));
  }, [transitionType, transitionDurationMs]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  const apply = () => {
    const dur = Math.min(5000, Math.max(50, Number(localDur) || 350));
    onChange(localType, dur);
    setOpen(false);
  };

  const isNone = transitionType === "NONE";

  return (
    <div className="relative flex shrink-0 items-center" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex h-8 items-center gap-1 rounded-full border px-2.5 text-[10px] transition-colors ${
          isNone
            ? "border-border/40 bg-muted/30 text-muted-foreground hover:bg-muted/60"
            : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
        }`}
        title={t("templateEditor.transitionLabel")}
      >
        <ArrowRight className="size-3" />
        {!isNone && <span>{t(`transitions.${transitionType}`)}</span>}
      </button>

      {open && (
        <div className="absolute left-0 top-9 z-50 w-52 rounded-xl border border-border/60 bg-card p-3 shadow-xl">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("templateEditor.transitionLabel")}
          </p>
          <select
            value={localType}
            onChange={(e) => setLocalType(e.target.value as TransitionType)}
            className="mb-2 h-7 w-full rounded-lg border border-input bg-transparent px-1.5 text-xs"
          >
            {TRANSITIONS.map((tr) => (
              <option key={tr} value={tr}>{t(`transitions.${tr}`)}</option>
            ))}
          </select>
          {localType !== "NONE" && (
            <>
              <p className="mb-1 text-[10px] text-muted-foreground">{t("templateEditor.transitionDuration")}</p>
              <input
                type="number"
                min={50}
                max={5000}
                step={50}
                value={localDur}
                onChange={(e) => setLocalDur(e.target.value)}
                className="mb-2 h-7 w-full rounded-lg border border-input bg-transparent px-1.5 text-xs"
              />
            </>
          )}
          <button
            type="button"
            onClick={apply}
            className="h-7 w-full rounded-lg bg-primary text-[11px] font-medium text-primary-foreground"
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
}
