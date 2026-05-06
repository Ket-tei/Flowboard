import { useRef, useState, useCallback, useLayoutEffect, useEffect } from "react";
import { MonitorPlay, X } from "lucide-react";
import type { PlayerItem } from "@/components/show/ScreenPlayer";
import { ScreenPlayer } from "@/components/show/ScreenPlayer";
import type { TemplateWidget } from "@/types/screen.types";
import { EditableWidgetOverlay } from "./EditableWidgetOverlay";
import { TEXT_FONTS } from "@/components/show/TextOverlay";

const MIN_PREVIEW_WIDTH = 240;

/* ─── Weather config panel ─────────────────────────────────────────────── */

type GeoResult = { name: string; latitude: number; longitude: number; country: string; admin1?: string };

function WeatherConfigPanel({
  config,
  onChange,
}: {
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  const city = (config.city as string | undefined) ?? "";
  const units = (config.units as string | undefined) ?? "celsius";
  const [input, setInput] = useState(city);
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => { setInput(city); }, [city]);

  useEffect(() => {
    if (input.length < 2) { setResults([]); return; }
    const t = setTimeout(() => {
      setSearching(true);
      fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(input)}&count=6&language=fr&format=json`)
        .then((r) => r.json())
        .then((d: { results?: GeoResult[] }) => setResults(d.results ?? []))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 450);
    return () => clearTimeout(t);
  }, [input]);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ville</label>
        <div className="relative">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Rechercher…"
            className="h-8 w-full rounded-lg border border-border/60 bg-muted/30 px-2.5 text-xs outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
          />
          {searching && (
            <span className="absolute right-2 top-2 text-[10px] text-muted-foreground">…</span>
          )}
          {results.length > 0 && (
            <div className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-lg border border-border/60 bg-card shadow-lg">
              {results.map((r) => (
                <button
                  key={`${r.latitude},${r.longitude}`}
                  type="button"
                  className="flex w-full flex-col px-3 py-2 text-left text-xs hover:bg-muted/60 transition-colors"
                  onClick={() => {
                    onChange({ ...config, city: r.name, lat: r.latitude, lon: r.longitude });
                    setInput(r.name);
                    setResults([]);
                  }}
                >
                  <span className="font-medium">{r.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {[r.admin1, r.country].filter(Boolean).join(", ")}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Unités</label>
        <div className="flex gap-2">
          {(["celsius", "fahrenheit"] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => onChange({ ...config, units: u })}
              className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition-colors ${
                units === u
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground hover:bg-muted/40"
              }`}
            >
              {u === "celsius" ? "°C" : "°F"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Text config panel ─────────────────────────────────────────────────── */

const TEXT_COLORS = ["#ffffff", "#000000", "#fde047", "#f87171", "#60a5fa", "#4ade80", "#e879f9"];

function TextConfigPanel({
  config,
  onChange,
}: {
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  const text = (config.text as string | undefined) ?? "";
  const fontFamily = (config.fontFamily as string | undefined) ?? "sans";
  const color = (config.color as string | undefined) ?? "#ffffff";
  const align = (config.align as string | undefined) ?? "center";

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Texte</label>
        <textarea
          value={text}
          onChange={(e) => onChange({ ...config, text: e.target.value })}
          rows={3}
          className="w-full resize-none rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1.5 text-xs outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
          placeholder="Votre texte…"
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Police</label>
        <select
          value={fontFamily}
          onChange={(e) => onChange({ ...config, fontFamily: e.target.value })}
          className="h-8 w-full rounded-lg border border-border/60 bg-muted/30 px-2.5 text-xs outline-none focus:border-primary/60"
        >
          {Object.entries(TEXT_FONTS).map(([key, { label, css }]) => (
            <option key={key} value={key} style={{ fontFamily: css }}>{label}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Couleur</label>
        <div className="flex flex-wrap gap-1.5">
          {TEXT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange({ ...config, color: c })}
              className={`size-6 rounded-full border-2 transition-transform hover:scale-110 ${
                color === c ? "border-primary ring-1 ring-primary/60" : "border-border/40"
              }`}
              style={{ background: c }}
              title={c}
            />
          ))}
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Alignement</label>
        <div className="flex gap-1">
          {(["left", "center", "right"] as const).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => onChange({ ...config, align: a })}
              className={`flex-1 rounded-lg border py-1 text-xs transition-colors ${
                align === a
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground hover:bg-muted/40"
              }`}
            >
              {a === "left" ? "←" : a === "center" ? "↔" : "→"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Widget config panel ───────────────────────────────────────────────── */

function WidgetConfigPanel({
  widget,
  onChange,
  onClose,
}: {
  widget: TemplateWidget;
  onChange: (id: number, config: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="absolute right-3 top-3 z-50 w-56 rounded-xl border border-border/60 bg-card/95 shadow-2xl backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-border/40 px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {widget.type === "TEXT" ? "Texte" : "Météo"}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="flex size-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
        >
          <X className="size-3" />
        </button>
      </div>
      <div className="p-3">
        {widget.type === "TEXT" ? (
          <TextConfigPanel
            config={widget.config}
            onChange={(c) => onChange(widget.id, c)}
          />
        ) : (
          <WeatherConfigPanel
            config={widget.config}
            onChange={(c) => onChange(widget.id, c)}
          />
        )}
      </div>
    </div>
  );
}

/* ─── LivePreview ───────────────────────────────────────────────────────── */

export function LivePreview({
  items,
  widgets,
  onWidgetChange,
  onWidgetConfigChange,
}: {
  items: PlayerItem[];
  widgets: TemplateWidget[];
  onWidgetChange: (id: number, geom: { x: number; y: number; w: number; h: number }) => void;
  onWidgetConfigChange: (id: number, config: Record<string, unknown>) => void;
}) {
  const [currentMs, setCurrentMs] = useState(0);
  const [selectedWidgetId, setSelectedWidgetId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [previewWidthPx, setPreviewWidthPx] = useState<number | null>(null);
  const [containerH, setContainerH] = useState(0);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContainerH(el.offsetHeight));
    ro.observe(el);
    setContainerH(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  const visibleWidgets = widgets.filter((w) => {
    if (w.startMs !== null && currentMs < w.startMs) return false;
    if (w.endMs !== null && currentMs >= w.endMs) return false;
    return true;
  });

  const selectedWidget = selectedWidgetId !== null
    ? widgets.find((w) => w.id === selectedWidgetId) ?? null
    : null;

  const startHResize = useCallback((side: "left" | "right") => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    const currentW = previewWidthPx ?? (containerRect.width * 0.9);

    const onMove = (ev: MouseEvent) => {
      const containerW = containerRef.current?.getBoundingClientRect().width ?? containerRect.width;
      const maxW = containerW - 16;
      const delta = ev.clientX - startX;
      const newW = side === "right"
        ? Math.min(maxW, Math.max(MIN_PREVIEW_WIDTH, currentW + delta))
        : Math.min(maxW, Math.max(MIN_PREVIEW_WIDTH, currentW - delta));
      setPreviewWidthPx(newW);
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [previewWidthPx]);

  const maxH = containerH > 16 ? containerH - 16 : undefined;
  const previewStyle: React.CSSProperties = previewWidthPx
    ? { width: previewWidthPx, aspectRatio: "16 / 9", ...(maxH ? { maxHeight: maxH } : {}) }
    : { width: "90%", maxWidth: 860, aspectRatio: "16 / 9", ...(maxH ? { maxHeight: maxH } : {}) };

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full items-center justify-center bg-black select-none"
      onClick={() => setSelectedWidgetId(null)}
    >
      <div
        className="relative overflow-hidden rounded-lg bg-muted shadow-2xl"
        style={previewStyle}
      >
        {items.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <MonitorPlay className="size-10 text-muted-foreground opacity-20" />
            <span className="text-sm text-muted-foreground opacity-40">Aperçu du diaporama</span>
          </div>
        ) : (
          /* widgets=[] : ScreenPlayer ne rend pas les widgets en mode édition,
             EditableWidgetOverlay s'en charge avec le filtre de timing */
          <ScreenPlayer items={items} widgets={[]} onTime={setCurrentMs} />
        )}

        {visibleWidgets.map((w) => (
          <EditableWidgetOverlay
            key={w.id}
            widget={w}
            isSelected={selectedWidgetId === w.id}
            onSelect={() => setSelectedWidgetId(w.id)}
            onChange={(geom) => onWidgetChange(w.id, geom)}
          />
        ))}

        {/* Left resize handle */}
        <div
          onMouseDown={startHResize("left")}
          className="absolute left-0 top-0 h-full w-2 cursor-ew-resize opacity-0 hover:opacity-100 transition-opacity"
          style={{ background: "linear-gradient(to right, rgba(255,255,255,0.25), transparent)" }}
          onClick={(e) => e.stopPropagation()}
        />
        {/* Right resize handle */}
        <div
          onMouseDown={startHResize("right")}
          className="absolute right-0 top-0 h-full w-2 cursor-ew-resize opacity-0 hover:opacity-100 transition-opacity"
          style={{ background: "linear-gradient(to left, rgba(255,255,255,0.25), transparent)" }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Widget config panel — appears when a widget is selected */}
      {selectedWidget && (
        <WidgetConfigPanel
          widget={selectedWidget}
          onChange={onWidgetConfigChange}
          onClose={() => setSelectedWidgetId(null)}
        />
      )}
    </div>
  );
}
