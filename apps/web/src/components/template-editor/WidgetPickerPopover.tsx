import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import type { TemplateWidget } from "@/types/screen.types";

const WIDGET_DEFS = [
  { type: "WEATHER_CURRENT" as const, labelKey: "templateWidgets.WEATHER_CURRENT" },
];

interface WidgetPickerPopoverProps {
  onAdd: (widget: Omit<TemplateWidget, "id">) => Promise<void>;
}

export function WidgetPickerPopover({ onAdd }: WidgetPickerPopoverProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [popupPos, setPopupPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const popup = document.getElementById("widget-picker-portal");
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        popup &&
        !popup.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  function handleOpen() {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    // Open above the trigger
    setPopupPos({ top: rect.top - 8, left: rect.left });
    setOpen((o) => !o);
  }

  async function pick(type: "WEATHER_CURRENT") {
    setAdding(true);
    try {
      await onAdd({
        type,
        config: {},
        x: 0.05,
        y: 0.05,
        w: 0.25,
        h: 0.18,
        startMs: null,
        endMs: null,
      });
      setOpen(false);
    } finally {
      setAdding(false);
    }
  }

  const popup = open
    ? createPortal(
        <div
          id="widget-picker-portal"
          style={{
            position: "fixed",
            top: popupPos.top,
            left: popupPos.left,
            transform: "translateY(-100%)",
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: 6,
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            minWidth: 180,
          }}
        >
          {WIDGET_DEFS.map((w) => (
            <button
              key={w.type}
              type="button"
              disabled={adding}
              onClick={() => void pick(w.type)}
              style={{
                padding: "9px 14px",
                borderRadius: 6,
                fontSize: 13,
                cursor: "pointer",
                fontWeight: 500,
                background: "transparent",
                border: "none",
                textAlign: "left",
                color: "var(--foreground)",
                transition: "background 0.1s",
                opacity: adding ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--muted)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              {adding ? t("templateWidgets.adding") : t(w.labelKey)}
            </button>
          ))}
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <div
        ref={triggerRef}
        onClick={handleOpen}
        style={{
          height: 44,
          minWidth: 140,
          border: "2px dashed var(--border)",
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          cursor: "pointer",
          fontSize: 11,
          color: "var(--muted-foreground)",
          flexShrink: 0,
          padding: "0 16px",
          transition: "background 0.12s",
          userSelect: "none",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background =
            "color-mix(in oklch, var(--muted), transparent 40%)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }}
      >
        <Plus size={14} />
        {t("templateEditor.addWidget")}
      </div>
      {popup}
    </>
  );
}
