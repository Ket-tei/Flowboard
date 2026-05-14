export function parseVisibleTabs(raw) {
    if (!raw)
        return null;
    const tabs = raw.split(",").filter(Boolean);
    return tabs.length > 0 ? tabs : null;
}
