import { useEffect, useRef, useState } from "react";
import type { TemplateWidget, WidgetPosition } from "@/types/screen.types";

type WeatherData = {
  temperature: number;
  weatherCode: number;
  city: string;
};

const CACHE_TTL_MS = 10 * 60 * 1000;
const weatherCache = new Map<string, { data: WeatherData; ts: number }>();

const POSITION_CLASSES: Record<WidgetPosition, string> = {
  TOP_LEFT: "top-4 left-4",
  TOP_RIGHT: "top-4 right-4",
  BOTTOM_LEFT: "bottom-4 left-4",
  BOTTOM_RIGHT: "bottom-4 right-4",
};

function weatherCodeToEmoji(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 2) return "🌤️";
  if (code <= 3) return "☁️";
  if (code <= 9) return "🌫️";
  if (code <= 19) return "🌦️";
  if (code <= 29) return "🌧️";
  if (code <= 39) return "🌨️";
  if (code <= 49) return "🌫️";
  if (code <= 59) return "🌦️";
  if (code <= 69) return "🌧️";
  if (code <= 79) return "❄️";
  if (code <= 84) return "🌧️";
  if (code <= 99) return "⛈️";
  return "🌡️";
}

async function fetchWeather(lat: number, lon: number, city: string, units: string): Promise<WeatherData> {
  const cacheKey = `${lat},${lon},${units}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.data;

  const tempUnit = units === "fahrenheit" ? "fahrenheit" : "celsius";
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=${tempUnit}`;
  const res = await fetch(url);
  const json = (await res.json()) as { current: { temperature_2m: number; weather_code: number } };
  const data: WeatherData = {
    temperature: Math.round(json.current.temperature_2m),
    weatherCode: json.current.weather_code,
    city,
  };
  weatherCache.set(cacheKey, { data, ts: Date.now() });
  return data;
}

export function WeatherOverlay({ widget }: { widget: TemplateWidget }) {
  const config = widget.config as { lat?: number; lon?: number; city?: string; units?: string };
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!config.lat || !config.lon) return;

    const load = () => {
      void fetchWeather(config.lat!, config.lon!, config.city ?? "", config.units ?? "celsius")
        .then(setWeather)
        .catch(() => {});
    };

    load();
    timerRef.current = setInterval(load, CACHE_TTL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [config.lat, config.lon, config.city, config.units]);

  if (!config.lat || !config.lon || !weather) return null;

  const posClass = POSITION_CLASSES[widget.position] ?? "top-4 right-4";
  const unit = config.units === "fahrenheit" ? "°F" : "°C";

  return (
    <div
      className={`absolute ${posClass} z-20 flex items-center gap-2 rounded-2xl bg-black/50 px-3 py-2 backdrop-blur-sm`}
    >
      <span className="text-2xl">{weatherCodeToEmoji(weather.weatherCode)}</span>
      <div className="flex flex-col leading-tight">
        <span className="text-lg font-bold text-white">
          {weather.temperature}{unit}
        </span>
        {weather.city && (
          <span className="text-xs text-white/70">{weather.city}</span>
        )}
      </div>
    </div>
  );
}
