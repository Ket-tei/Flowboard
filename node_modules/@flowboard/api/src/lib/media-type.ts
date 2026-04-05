export type MediaKind = "IMAGE" | "VIDEO" | "GIF";

export function mimeToMediaType(mime: string): MediaKind | null {
  const m = mime.toLowerCase();
  if (m === "image/gif") return "GIF";
  if (m.startsWith("video/")) return "VIDEO";
  if (m.startsWith("image/")) return "IMAGE";
  return null;
}
