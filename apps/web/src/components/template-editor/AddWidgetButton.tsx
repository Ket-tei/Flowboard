import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import type { TemplateWidget } from "@/types/screen.types";

type GeoResult = { name: string; country: string; latitude: number; longitude: number };

export function AddWidgetButton({
  onAdd,
}: {
  onAdd: (widget: Omit<TemplateWidget, "id">) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [city, setCity] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [selected, setSelected] = useState<GeoResult | null>(null);
  const [units, setUnits] = useState<"celsius" | "fahrenheit">("celsius");
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  const searchCity = (query: string) => {
    setCity(query);
    setSelected(null);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (query.length < 2) { setResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=fr&format=json`);
        const json = (await res.json()) as { results?: GeoResult[] };
        setResults(json.results ?? []);
      } catch { setResults([]); }
    }, 300);
  };

  const handleAdd = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await onAdd({
        type: "WEATHER_CURRENT",
        x: 0.85,
        y: 0.04,
        w: 0.13,
        h: 0.10,
        startMs: null,
        endMs: null,
        config: { city: selected.name, lat: selected.latitude, lon: selected.longitude, units },
      });
      setOpen(false);
      setCity("");
      setSelected(null);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full border border-dashed border-border/60 px-3 py-1 text-[11px] text-muted-foreground hover:border-border hover:text-foreground transition-colors"
      >
        <Plus className="size-3" />
        {t("templateEditor.addWidget")}
      </button>

      {open && (
        <div className="absolute left-0 top-8 z-50 w-64 rounded-xl border border-border/60 bg-card p-4 shadow-xl">
          <p className="mb-3 text-xs font-semibold">{t("templateEditor.addWidget")} — {t("templateEditor.weatherLabel")}</p>

          <div className="relative mb-2">
            <input
              type="text"
              placeholder={t("templateEditor.weatherCity")}
              value={city}
              onChange={(e) => searchCity(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {results.length > 0 && !selected && (
              <div className="absolute left-0 right-0 top-9 z-10 rounded-lg border border-border/60 bg-card shadow-lg">
                {results.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setSelected(r); setCity(`${r.name}, ${r.country}`); setResults([]); }}
                    className="flex w-full items-center px-3 py-1.5 text-left text-xs hover:bg-muted/50"
                  >
                    {r.name}, {r.country}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mb-3 flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">{t("templateEditor.weatherUnits")}:</span>
            <select
              value={units}
              onChange={(e) => setUnits(e.target.value as "celsius" | "fahrenheit")}
              className="h-6 flex-1 rounded border border-input bg-transparent px-1 text-xs"
            >
              <option value="celsius">{t("templateEditor.celsius")}</option>
              <option value="fahrenheit">{t("templateEditor.fahrenheit")}</option>
            </select>
          </div>

          <button
            type="button"
            disabled={!selected || loading}
            onClick={() => void handleAdd()}
            className="h-8 w-full rounded-lg bg-primary text-xs font-medium text-primary-foreground disabled:opacity-50"
          >
            {loading ? "…" : t("templateEditor.addWidget")}
          </button>
        </div>
      )}
    </div>
  );
}
