import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiUrl } from "@/lib/api";

type ManifestItem = {
  id: number;
  type: string;
  durationMs: number;
  mimeType: string;
  url: string;
};

type Manifest = {
  revision: number;
  screenId: number;
  items: ManifestItem[];
};

const POLL_MS = 15000;
const SW_PATH = "/sw.js";

function registerSw(): void {
  if (!("serviceWorker" in navigator)) return;
  void navigator.serviceWorker.register(SW_PATH, { scope: "/" }).catch(() => {});
}

export function ShowPage() {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [index, setIndex] = useState(0);
  const revisionRef = useRef<number | null>(null);
  const lastGoodSrcRef = useRef<string | null>(null);
  const videoEndedRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const manifestUrl = token
    ? apiUrl(`/api/public/screens/${encodeURIComponent(token)}/manifest`)
    : "";

  const loadManifest = useCallback(async () => {
    if (!manifestUrl) return;
    try {
      const res = await fetch(manifestUrl, { credentials: "omit" });
      if (!res.ok) return;
      const data = (await res.json()) as Manifest;
      if (revisionRef.current === null || data.revision !== revisionRef.current) {
        revisionRef.current = data.revision;
        setManifest(data);
        setIndex(0);
      }
    } catch {
      /* offline: keep current manifest */
    }
  }, [manifestUrl]);

  useEffect(() => {
    registerSw();
  }, []);

  useEffect(() => {
    void loadManifest();
    const id = window.setInterval(() => void loadManifest(), POLL_MS);
    return () => window.clearInterval(id);
  }, [loadManifest]);

  const items = manifest?.items ?? [];
  const n = items.length;
  const safeIdx = n ? index % n : 0;
  const current = n ? items[safeIdx] : null;

  const resolveUrl = useCallback((path: string) => {
    if (path.startsWith("http")) return path;
    return apiUrl(path);
  }, []);

  const src = current ? resolveUrl(current.url) : null;
  const isVideo = current?.type === "VIDEO";
  const isGif = current?.type === "GIF";

  const advance = useCallback(() => {
    setIndex((i) => (n > 1 ? (i + 1) % n : 0));
  }, [n]);

  useEffect(() => {
    if (!current || !src) return;

    if (isVideo) {
      videoEndedRef.current = false;
      // Safety fallback: if video doesn't fire onEnded after 3x duration or 60s
      const maxMs = Math.max(current.durationMs * 3, 60000);
      const fallback = window.setTimeout(() => {
        if (!videoEndedRef.current) advance();
      }, maxMs);
      return () => window.clearTimeout(fallback);
    }

    // Images and GIFs: advance after configured duration
    const ms = Math.max(1000, current.durationMs);
    const timer = window.setTimeout(advance, ms);
    return () => window.clearTimeout(timer);
  }, [current?.id, current?.durationMs, src, isVideo, advance]);

  // Force play on video mount (some browsers block autoplay)
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

  if (!token) {
    return <div className="bg-black text-white p-4">{t("show.missingToken")}</div>;
  }

  if (!manifest) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-black text-white">
        {t("common.loading")}
      </div>
    );
  }

  if (n === 0) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-black text-white">
        {t("show.noMedia")}
      </div>
    );
  }

  if (!fgSrc) {
    return <div className="min-h-svh bg-black" />;
  }

  // GIFs are rendered as <img> (native animated support, lighter than <video>)
  // Videos are rendered as <video> with proper playback controls
  // Images are rendered as <img>

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {/* Blurred background layer */}
      <div className="absolute inset-0" aria-hidden>
        {isVideo ? (
          <video
            key={`bg-v-${current?.id}`}
            src={fgSrc}
            className="absolute inset-0 size-full scale-110 object-cover blur-3xl brightness-[0.35]"
            muted
            playsInline
            autoPlay
            loop
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
            className="max-h-full max-w-full object-contain"
            muted
            playsInline
            autoPlay
            preload="auto"
            onEnded={onVideoEnded}
            onLoadedData={onLoaded}
            onError={onMediaError}
          />
        ) : isGif ? (
          <img
            key={`fg-g-${current?.id}`}
            src={fgSrc}
            alt=""
            className="max-h-full max-w-full object-contain"
            onLoad={onLoaded}
            onError={onMediaError}
          />
        ) : (
          <img
            key={`fg-i-${current?.id}`}
            src={fgSrc}
            alt=""
            className="max-h-full max-w-full object-contain"
            onLoad={onLoaded}
            onError={onMediaError}
          />
        )}
      </div>
    </div>
  );
}
