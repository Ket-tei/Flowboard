import type { TemplateWidget } from "@/types/screen.types";

export const TEXT_FONTS: Record<string, { label: string; css: string }> = {
  sans:    { label: "Sans-serif", css: "system-ui, -apple-system, sans-serif" },
  serif:   { label: "Serif",      css: "Georgia, 'Times New Roman', serif" },
  mono:    { label: "Monospace",  css: "ui-monospace, 'Courier New', monospace" },
  impact:  { label: "Impact",     css: "Impact, 'Arial Black', sans-serif" },
  cursive: { label: "Cursive",    css: "cursive" },
};

export function TextOverlay({ widget, inline }: { widget: TemplateWidget; inline?: boolean }) {
  const config = widget.config as {
    text?: string;
    fontFamily?: string;
    color?: string;
    align?: string;
  };

  const fontEntry = TEXT_FONTS[config.fontFamily ?? "sans"] ?? TEXT_FONTS.sans;
  const color = config.color ?? "#ffffff";
  const textAlign = (config.align ?? "center") as "left" | "center" | "right";

  const content = (
    <div
      className="flex h-full w-full items-center justify-center overflow-hidden p-2"
      style={{ fontFamily: fontEntry.css, color, textAlign }}
    >
      <span
        style={{
          fontSize: "2rem",
          fontWeight: 700,
          lineHeight: 1.2,
          textShadow: "0 1px 6px rgba(0,0,0,0.8)",
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
        }}
      >
        {config.text ?? "Texte"}
      </span>
    </div>
  );

  if (inline) return content;

  return (
    <div
      className="absolute z-20"
      style={{
        left: `${widget.x * 100}%`,
        top: `${widget.y * 100}%`,
        width: `${widget.w * 100}%`,
        height: `${widget.h * 100}%`,
      }}
    >
      {content}
    </div>
  );
}
