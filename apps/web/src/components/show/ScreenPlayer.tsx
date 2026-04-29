import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { apiUrl } from "@/lib/api";
import type { TemplateWidget } from "@/types/screen.types";
import { WeatherOverlay } from "./WeatherOverlay";

export type PlayerItem = {
  id: number | string;
  type: string;
  durationMs: number;
  mimeType: string;
  url: string;
  transitionType?: string;
  transitionDurationMs?: number;
};

const TRANSITION_CLASSES: Record<string, string> = {
  FADE: "animate-player-fade-in",
  SLIDE_LEFT: "animate-player-slide-left",
  SLIDE_UP: "animate-player-slide-up",
};

export function ScreenPlayer({
  items,
  widgets = [],
  onTime,
  renderWidget,
}: {
  items: PlayerItem[];
  widgets?: TemplateWidget[];
  onTime?: (absMs: number) => void;
  renderWidget?: (w: TemplateWidget) => ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const videoEndedRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastGoodSrcRef = useRef<string | null>(null);
  const itemStartTsRef = useRef<number>(Date.now());

  const n = items.length;
  const safeIdx = n ? index % n : 0;
  const current = n ? items[safeIdx] : null;

  const resolveUrl = useCallback((url: string) => {
    if (url.startsWith("blob:") || url.startsWith("http")) return url;
    return apiUrl(url);
  }, []);

  const src = current ? resolveUrl(current.url) : null;
  const isVideo = current?.type === "VIDEO";

  const advance = useCallback(() => {
    setIndex((i) => (n > 1 ? (i + 1) % n : 0));
  }, [n]);

  // Reset to first item when items list changes
  useEffect(() => {
    setIndex(0);
  }, [items]);

  // Track item start time for onTime reporting
  useEffect(() => {
    itemStartTsRef.current = Date.now();
  }, [safeIdx]);

  // Emit onTime every 250ms
  useEffect(() => {
    if (!onTime || !n) return;
    const id = setInterval(() => {
      const prefixMs = items.slice(0, safeIdx).reduce((acc, it) => acc + it.durationMs, 0);
      const elapsed = Date.now() - itemStartTsRef.current;
      onTime(prefixMs + elapsed);
    }, 250);
    return () => clearInterval(id);
  }, [onTime, n, safeIdx, items]);

  useEffect(() => {
    if (!current || !src) return;
    if (isVideo) {
      videoEndedRef.current = false;
      const maxMs = Math.max(current.durationMs * 3, 60000);
      const fallback = window.setTimeout(() => {
        if (!videoEndedRef.current) advance();
      }, maxMs);
      return () => window.clearTimeout(fallback);
    }
    const ms = Math.max(1000, current.durationMs);
    const timer = window.setTimeout(advance, ms);
    return () => window.clearTimeout(timer);
  }, [current?.id, current?.durationMs, src, isVideo, advance]);

  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [isVideo, src]);

  function onVideoEnded() {
    videoEndedRef.current = true;
    advance();
  }

  function onLoaded() {
    if (src) lastGoodSrcRef.current = src;
  }

  function onMediaError() {
    setIndex((i) => (n > 1 ? (i + 1) % n : i));
  }

  const fgSrc = src ?? lastGoodSrcRef.current;
  const transitionClass = TRANSITION_CLASSES[current?.transitionType ?? ""] ?? "";

  if (!n || !fgSrc) {
    return <div className="absolute inset-0 bg-black" />;
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      {/* Blurred background */}
      <div className="absolute inset-0" aria-hidden>
        {isVideo ? (
          <video
            key={`bg-v-${current?.id}`}
            src={fgSrc}
            className="absolute inset-0 size-full scale-110 object-cover blur-3xl brightness-[0.35]"
            muted playsInline autoPlay loop
          />
        ) : (
          <img
            key={`bg-i-${current?.id}`}
            src={fgSrc}
            alt=""
            className="absolute inset-0 size-full scale-110 object-cover blur-3xl brightness-[0.35]"
          />
        )}
      </div>

      {/* Foreground media */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isVideo ? (
          <video
            ref={videoRef}
            key={`fg-v-${current?.id}`}
            src={fgSrc}
            className={`max-h-full max-w-full object-contain ${transitionClass}`}
            muted playsInline autoPlay preload="auto"
            onEnded={onVideoEnded}
            onLoadedData={onLoaded}
            onError={onMediaError}
          />
        ) : (
          <img
            key={`fg-i-${current?.id}`}
            src={fgSrc}
            alt=""
            className={`max-h-full max-w-full object-contain ${transitionClass}`}
            onLoad={onLoaded}
            onError={onMediaError}
          />
        )}
      </div>

      {/* Widgets overlay */}
      {widgets.map((w) =>
        renderWidget ? renderWidget(w) : <WeatherOverlay key={w.id} widget={w} />
      )}
    </div>
  );
}
