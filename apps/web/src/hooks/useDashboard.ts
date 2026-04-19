import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { getDefaultLayout, getWidgetDef } from "@/components/dashboard/widget-registry";

export type WidgetLayoutItem = { widgetId: string; order: number };

type CommonStats = {
  folderCount: number;
  screenCount: number;
  mediaCount: number;
  avgMediaPerScreen: number;
  totalDurationMs: number;
  mediaByType: { IMAGE: number; VIDEO: number; GIF: number };
};

type AdminStats = {
  userCount: number;
  adminCount: number;
  userRoleCount: number;
  recentAccounts: { id: number; username: string; role: string; createdAt: string }[];
  screensPerFolder: { folderName: string; screenCount: number }[];
};

type DashboardResponse = {
  commonStats: CommonStats;
  adminStats: AdminStats | null;
  layout: WidgetLayoutItem[];
};

export function useDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commonStats, setCommonStats] = useState<CommonStats | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [layout, setLayout] = useState<WidgetLayoutItem[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const role = user?.role ?? "USER";

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<DashboardResponse>("/api/dashboard");
      setCommonStats(data.commonStats);
      setAdminStats(data.adminStats);
      const saved = data.layout;
      if (saved && saved.length > 0) {
        setLayout(saved);
      } else {
        setLayout(getDefaultLayout(role));
      }
    } catch (e: any) {
      setError(e.message ?? "Error");
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    void fetch_();
  }, [fetch_]);

  const persistLayout = useCallback((next: WidgetLayoutItem[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void apiFetch("/api/dashboard/layout", {
        method: "PUT",
        body: JSON.stringify({ layout: next }),
      });
    }, 800);
  }, []);

  const updateLayout = useCallback(
    (next: WidgetLayoutItem[]) => {
      setLayout(next);
      persistLayout(next);
    },
    [persistLayout]
  );

  const addWidget = useCallback(
    (widgetId: string) => {
      if (layout.some((l) => l.widgetId === widgetId)) return;
      const maxOrder = layout.reduce((m, l) => Math.max(m, l.order), -1);
      const next = [...layout, { widgetId, order: maxOrder + 1 }];
      updateLayout(next);
    },
    [layout, updateLayout]
  );

  const removeWidget = useCallback(
    (widgetId: string) => {
      const next = layout
        .filter((l) => l.widgetId !== widgetId)
        .map((l, i) => ({ ...l, order: i }));
      updateLayout(next);
    },
    [layout, updateLayout]
  );

  const reorderWidgets = useCallback(
    (fromIndex: number, toIndex: number) => {
      const sorted = [...layout].sort((a, b) => a.order - b.order);
      const [moved] = sorted.splice(fromIndex, 1);
      sorted.splice(toIndex, 0, moved);
      const next = sorted.map((l, i) => ({ ...l, order: i }));
      updateLayout(next);
    },
    [layout, updateLayout]
  );

  const resetLayout = useCallback(() => {
    const defaults = getDefaultLayout(role);
    updateLayout(defaults);
  }, [role, updateLayout]);

  const stats = commonStats
    ? { ...commonStats, ...(adminStats ?? {}) }
    : null;

  return {
    loading,
    error,
    stats,
    commonStats,
    adminStats,
    layout: [...layout]
      .filter((l) => {
        const def = getWidgetDef(l.widgetId);
        return def && def.roles.includes(role as "ADMIN" | "USER");
      })
      .sort((a, b) => a.order - b.order),
    addWidget,
    removeWidget,
    reorderWidgets,
    resetLayout,
    refetch: fetch_,
    role,
  };
}
