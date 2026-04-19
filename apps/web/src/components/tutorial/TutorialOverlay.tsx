import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTutorial } from "@/context/tutorial-context";
import { TUTORIAL_STEPS } from "./tutorial-steps";

type Rect = { x: number; y: number; width: number; height: number };

const PAD = 10;

function getTargetRect(selector: string): Rect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left - PAD, y: r.top - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
}

function useWindowSize() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const handler = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return size;
}

export function TutorialOverlay() {
  const { t } = useTranslation();
  const { active, stepIndex, totalSteps, nextStep, skipTutorial } = useTutorial();
  const [rect, setRect] = useState<Rect | null>(null);
  const { w: winW, h: winH } = useWindowSize();
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = TUTORIAL_STEPS[stepIndex];
  const isLast = stepIndex === totalSteps - 1;

  useLayoutEffect(() => {
    if (!active || !step?.target) {
      setRect(null);
      return;
    }
    const update = () => setRect(getTargetRect(step.target!));
    update();
    const id = requestAnimationFrame(update);
    return () => cancelAnimationFrame(id);
  }, [active, step, stepIndex]);

  if (!active || !step) return null;

  const tooltipWidth = 300;
  const tooltipHeight = 180;

  let tooltipX = winW / 2 - tooltipWidth / 2;
  let tooltipY = winH / 2 - tooltipHeight / 2;

  if (rect) {
    const spaceBelow = winH - (rect.y + rect.height);
    const spaceAbove = rect.y;
    if (spaceBelow >= tooltipHeight + 16) {
      tooltipY = rect.y + rect.height + 12;
      tooltipX = Math.min(Math.max(rect.x, 16), winW - tooltipWidth - 16);
    } else if (spaceAbove >= tooltipHeight + 16) {
      tooltipY = rect.y - tooltipHeight - 12;
      tooltipX = Math.min(Math.max(rect.x, 16), winW - tooltipWidth - 16);
    } else {
      tooltipX = rect.x + rect.width + 12;
      tooltipY = Math.min(Math.max(rect.y, 16), winH - tooltipHeight - 16);
      if (tooltipX + tooltipWidth > winW) {
        tooltipX = rect.x - tooltipWidth - 12;
      }
    }
  }

  tooltipX = Math.max(16, Math.min(tooltipX, winW - tooltipWidth - 16));
  tooltipY = Math.max(16, Math.min(tooltipY, winH - tooltipHeight - 16));

  return (
    <div className="fixed inset-0 z-50" style={{ pointerEvents: "none" }}>
      {/* Backdrop with spotlight hole */}
      <svg
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id="tutorial-spotlight">
            <rect width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.65)"
          mask="url(#tutorial-spotlight)"
        />
      </svg>

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        style={{
          position: "fixed",
          left: tooltipX,
          top: tooltipY,
          width: tooltipWidth,
          pointerEvents: "auto",
        }}
        className="rounded-2xl border border-border bg-card shadow-2xl p-5 flex flex-col gap-3"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-tight">{t(step.titleKey)}</p>
          <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
            {t("tutorial.step", { current: stepIndex + 1, total: totalSteps })}
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{t(step.descKey)}</p>
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            onClick={skipTutorial}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("tutorial.skip")}
          </button>
          <button
            onClick={nextStep}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {isLast ? t("tutorial.finish") : t("tutorial.next")}
          </button>
        </div>
      </div>
    </div>
  );
}
