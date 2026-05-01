export const PX_PER_MS = 0.032; // 32px per second
export const MIN_DURATION_MS = 1000;
export const TRACK_HEIGHT = 48;
export const TRACK_LABEL_W = 80;

export function msToLabel(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m${String(s % 60).padStart(2, "0")}`;
}
