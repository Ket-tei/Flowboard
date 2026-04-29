import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiUrl } from "@/lib/api";
import { ScreenPlayer } from "@/components/show/ScreenPlayer";
import type { PlayerItem } from "@/components/show/ScreenPlayer";
import type { TemplateWidget } from "@/types/screen.types";

type Manifest = {
  revision: number;
  screenId: number;
  items: PlayerItem[];
  widgets?: TemplateWidget[];
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
  const revisionRef = useRef<number | null>(null);

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

  if (!manifest.items.length) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-black text-white">
        {t("show.noMedia")}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <ScreenPlayer items={manifest.items} widgets={manifest.widgets ?? []} />
    </div>
  );
}
