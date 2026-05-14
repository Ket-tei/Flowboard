export function parseVisibleTabs(raw: string | null | undefined): string[] | null {
  if (!raw) return null;
  const tabs = raw.split(",").filter(Boolean);
  return tabs.length > 0 ? tabs : null;
}
