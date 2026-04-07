import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
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
  void navigator.serviceWorker.register(SW_PATH, { scope: "/" }).catch(() => {
    /* ignore */
  });
}

export function ShowPage() {
  const { token } = useParams<{ token: string }>();
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [index, setIndex] = useState(0);
  const revisionRef = useRef<number | null>(null);
  const lastGoodSrcRef = useRef<string | null>(null);

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
      /* hors-ligne : conserver le dernier manifest */
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
  const isVideo = current?.type === "VIDEO" || current?.type === "GIF";

  useEffect(() => {
    if (!current || !src) return;
    const ms = Math.max(1000, current.durationMs);
    const t = window.setTimeout(() => {
      setIndex((i) => (n ? (i + 1) % n : 0));
    }, ms);
    return () => window.clearTimeout(t);
  }, [current?.id, current?.durationMs, src, n]);

  function onLoaded() {
    if (src) lastGoodSrcRef.current = src;
  }

  function onMediaError() {
    setIndex((i) => (n > 1 ? (i + 1) % n : i));
  }

  const bgSrc = src ?? lastGoodSrcRef.current;
  const fgSrc = src ?? lastGoodSrcRef.current;

  if (!token) {
    return <div className="bg-black text-white">Missing token</div>;
  }

  if (!manifest) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-black text-white">
        Chargement…
      </div>
    );
  }

  if (n === 0) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-black text-white">
        Aucun média
      </div>
    );
  }

  if (!fgSrc) {
    return <div className="min-h-svh bg-black" />;
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <div className="absolute inset-0" aria-hidden>
        {isVideo ? (
          <video
            key={`bg-${current?.id}`}
            src={bgSrc ?? undefined}
            className="absolute inset-0 size-full scale-110 object-cover blur-3xl brightness-[0.35]"
            muted
            playsInline
            autoPlay
            loop
          />
        ) : (
          <img
            key={`bg-${current?.id}`}
            src={bgSrc ?? undefined}
            alt=""
            className="absolute inset-0 size-full scale-110 object-cover blur-3xl brightness-[0.35]"
          />
        )}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        {isVideo ? (
          <video
            key={`fg-${current?.id}`}
            src={fgSrc ?? undefined}
            className="max-h-full max-w-full object-contain"
            muted
            playsInline
            autoPlay
            loop
            onLoadedData={onLoaded}
            onError={onMediaError}
          />
        ) : (
          <img
            key={`fg-${current?.id}`}
            src={fgSrc ?? undefined}
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
