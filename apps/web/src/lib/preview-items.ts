import { apiUrl } from "@/lib/api";
import type { LocalItem } from "@/hooks/useMediaDialog";
import type { PlayerItem } from "@/components/show/ScreenPlayer";
import { isPendingItem } from "@/hooks/useMediaDialog";

function mimeToType(mime: string): string {
  if (mime.startsWith("video/")) return "VIDEO";
  if (mime === "image/gif") return "GIF";
  return "IMAGE";
}

export function localItemsToPreview(
  items: LocalItem[],
  opts: { screenToken?: string; templateId?: number }
): PlayerItem[] {
  return items.map((it) => {
    if (isPendingItem(it)) {
      return {
        id: it.localId,
        type: mimeToType(it.file.type),
        durationMs: it.durationMs,
        mimeType: it.file.type,
        url: it.previewUrl,
        transitionType: it.transitionType ?? "NONE",
      };
    }
    let url: string;
    if (opts.templateId != null) {
      url = apiUrl(`/api/public/templates/${opts.templateId}/media/${it.id}`);
    } else if (opts.screenToken) {
      url = apiUrl(`/api/public/screens/${encodeURIComponent(opts.screenToken)}/media/${it.id}`);
    } else {
      url = "";
    }
    return {
      id: it.id,
      type: it.type,
      durationMs: it.durationMs,
      mimeType: it.mimeType,
      url,
      transitionType: it.transitionType ?? "NONE",
    };
  });
}
