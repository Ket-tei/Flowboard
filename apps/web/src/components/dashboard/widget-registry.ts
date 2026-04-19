import type { ComponentType } from "react";
import {
  Monitor,
  FolderOpen,
  Image,
  BarChart3,
  Clock,
  PieChart,
  Users,
  ShieldCheck,
  FolderTree,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

export type WidgetSize = "sm" | "md" | "lg";

export type WidgetDef = {
  id: string;
  titleKey: string;
  descKey: string;
  icon: LucideIcon;
  size: WidgetSize;
  roles: Array<"ADMIN" | "USER">;
  component: () => Promise<{ default: ComponentType<{ data: any }> }>;
};

export const WIDGET_REGISTRY: WidgetDef[] = [
  {
    id: "screenCount",
    titleKey: "dashboard.widgets.screenCount",
    descKey: "dashboard.widgets.screenCountDesc",
    icon: Monitor,
    size: "sm",
    roles: ["ADMIN", "USER"],
    component: () => import("./widgets/StatWidget").then((m) => ({ default: m.ScreenCountWidget })),
  },
  {
    id: "folderCount",
    titleKey: "dashboard.widgets.folderCount",
    descKey: "dashboard.widgets.folderCountDesc",
    icon: FolderOpen,
    size: "sm",
    roles: ["ADMIN", "USER"],
    component: () => import("./widgets/StatWidget").then((m) => ({ default: m.FolderCountWidget })),
  },
  {
    id: "mediaCount",
    titleKey: "dashboard.widgets.mediaCount",
    descKey: "dashboard.widgets.mediaCountDesc",
    icon: Image,
    size: "sm",
    roles: ["ADMIN", "USER"],
    component: () => import("./widgets/StatWidget").then((m) => ({ default: m.MediaCountWidget })),
  },
  {
    id: "avgMediaPerScreen",
    titleKey: "dashboard.widgets.avgMediaPerScreen",
    descKey: "dashboard.widgets.avgMediaPerScreenDesc",
    icon: BarChart3,
    size: "sm",
    roles: ["ADMIN", "USER"],
    component: () => import("./widgets/StatWidget").then((m) => ({ default: m.AvgMediaWidget })),
  },
  {
    id: "totalDuration",
    titleKey: "dashboard.widgets.totalDuration",
    descKey: "dashboard.widgets.totalDurationDesc",
    icon: Clock,
    size: "sm",
    roles: ["ADMIN", "USER"],
    component: () => import("./widgets/StatWidget").then((m) => ({ default: m.TotalDurationWidget })),
  },
  {
    id: "mediaByType",
    titleKey: "dashboard.widgets.mediaByType",
    descKey: "dashboard.widgets.mediaByTypeDesc",
    icon: PieChart,
    size: "md",
    roles: ["ADMIN", "USER"],
    component: () => import("./widgets/MediaByTypeWidget"),
  },
  {
    id: "userCount",
    titleKey: "dashboard.widgets.userCount",
    descKey: "dashboard.widgets.userCountDesc",
    icon: Users,
    size: "sm",
    roles: ["ADMIN"],
    component: () => import("./widgets/StatWidget").then((m) => ({ default: m.UserCountWidget })),
  },
  {
    id: "adminVsUser",
    titleKey: "dashboard.widgets.adminVsUser",
    descKey: "dashboard.widgets.adminVsUserDesc",
    icon: ShieldCheck,
    size: "md",
    roles: ["ADMIN"],
    component: () => import("./widgets/AdminVsUserWidget"),
  },
  {
    id: "screensPerFolder",
    titleKey: "dashboard.widgets.screensPerFolder",
    descKey: "dashboard.widgets.screensPerFolderDesc",
    icon: FolderTree,
    size: "md",
    roles: ["ADMIN"],
    component: () => import("./widgets/ScreensPerFolderWidget"),
  },
  {
    id: "recentAccounts",
    titleKey: "dashboard.widgets.recentAccounts",
    descKey: "dashboard.widgets.recentAccountsDesc",
    icon: UserPlus,
    size: "lg",
    roles: ["ADMIN"],
    component: () => import("./widgets/RecentAccountsWidget"),
  },
];

export function getWidgetDef(id: string): WidgetDef | undefined {
  return WIDGET_REGISTRY.find((w) => w.id === id);
}

export function getDefaultLayout(role: "ADMIN" | "USER"): Array<{ widgetId: string; order: number }> {
  return WIDGET_REGISTRY.filter((w) => w.roles.includes(role)).map((w, i) => ({
    widgetId: w.id,
    order: i,
  }));
}
