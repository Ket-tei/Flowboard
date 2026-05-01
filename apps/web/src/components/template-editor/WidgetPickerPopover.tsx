import { useEffect, useRef, useState } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

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

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div
        onClick={() => setOpen((o) => !o)}
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

      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: 0,
            marginBottom: 6,
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: 6,
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            minWidth: 160,
          }}
        >
          {WIDGET_DEFS.map((w) => (
            <button
              key={w.type}
              type="button"
              disabled={adding}
              onClick={() => void pick(w.type)}
              style={{
                padding: "8px 12px",
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
        </div>
      )}
    </div>
  );
}
