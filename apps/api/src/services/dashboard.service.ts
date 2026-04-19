import { db } from "../db/index.js";
import { sql, eq, count } from "drizzle-orm";
import {
  users,
  folders,
  screens,
  screenItems,
  dashboardLayouts,
  userFolderAccess,
  userScreenAccess,
} from "../db/schema.js";

export type WidgetLayoutItem = {
  widgetId: string;
  order: number;
};

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

async function getCommonStatsForAdmin(): Promise<CommonStats> {
  const [folderRes] = await db.select({ c: count() }).from(folders);
  const [screenRes] = await db.select({ c: count() }).from(screens);
  const [mediaRes] = await db.select({ c: count() }).from(screenItems);

  const [durRes] = await db
    .select({ total: sql<number>`COALESCE(SUM(${screenItems.durationMs}), 0)` })
    .from(screenItems);

  const typeRows = await db
    .select({ type: screenItems.type, c: count() })
    .from(screenItems)
    .groupBy(screenItems.type);

  const mediaByType = { IMAGE: 0, VIDEO: 0, GIF: 0 };
  for (const r of typeRows) {
    mediaByType[r.type as keyof typeof mediaByType] = r.c;
  }

  const sc = screenRes.c || 0;
  const mc = mediaRes.c || 0;

  return {
    folderCount: folderRes.c,
    screenCount: sc,
    mediaCount: mc,
    avgMediaPerScreen: sc > 0 ? Math.round((mc / sc) * 10) / 10 : 0,
    totalDurationMs: Number(durRes.total),
    mediaByType,
  };
}

async function getCommonStatsForUser(userId: number): Promise<CommonStats> {
  const accessedFolders = await db
    .select({ folderId: userFolderAccess.folderId })
    .from(userFolderAccess)
    .where(eq(userFolderAccess.userId, userId));
  const accessedScreensDirect = await db
    .select({ screenId: userScreenAccess.screenId })
    .from(userScreenAccess)
    .where(eq(userScreenAccess.userId, userId));

  const folderIdSet = new Set(accessedFolders.map((r) => r.folderId));
  const directScreenIds = new Set(accessedScreensDirect.map((r) => r.screenId));

  const allScreens = await db.select().from(screens);
  const visibleScreens = allScreens.filter(
    (s) => folderIdSet.has(s.folderId) || directScreenIds.has(s.id)
  );
  const visibleScreenIds = new Set(visibleScreens.map((s) => s.id));

  const allItems = await db.select().from(screenItems);
  const visibleItems = allItems.filter((i) => visibleScreenIds.has(i.screenId));

  const mediaByType = { IMAGE: 0, VIDEO: 0, GIF: 0 };
  let totalDur = 0;
  for (const it of visibleItems) {
    mediaByType[it.type as keyof typeof mediaByType]++;
    totalDur += it.durationMs;
  }

  const sc = visibleScreens.length;
  const mc = visibleItems.length;

  return {
    folderCount: folderIdSet.size,
    screenCount: sc,
    mediaCount: mc,
    avgMediaPerScreen: sc > 0 ? Math.round((mc / sc) * 10) / 10 : 0,
    totalDurationMs: totalDur,
    mediaByType,
  };
}

async function getAdminStats(): Promise<AdminStats> {
  const allUsers = await db
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(sql`${users.createdAt} DESC`);

  const adminCount = allUsers.filter((u) => u.role === "ADMIN").length;
  const userRoleCount = allUsers.filter((u) => u.role === "USER").length;

  const spfRows = await db
    .select({
      folderName: folders.name,
      screenCount: count(),
    })
    .from(screens)
    .innerJoin(folders, eq(screens.folderId, folders.id))
    .groupBy(folders.id, folders.name)
    .orderBy(sql`count(*) DESC`)
    .limit(5);

  return {
    userCount: allUsers.length,
    adminCount,
    userRoleCount,
    recentAccounts: allUsers.slice(0, 5).map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      createdAt: u.createdAt?.toISOString() ?? "",
    })),
    screensPerFolder: spfRows.map((r) => ({
      folderName: r.folderName,
      screenCount: r.screenCount,
    })),
  };
}

export async function getDashboardData(userId: number, role: string) {
  const commonStats =
    role === "ADMIN"
      ? await getCommonStatsForAdmin()
      : await getCommonStatsForUser(userId);

  const adminStats = role === "ADMIN" ? await getAdminStats() : null;

  const layoutRow = await db
    .select()
    .from(dashboardLayouts)
    .where(eq(dashboardLayouts.userId, userId))
    .limit(1);

  let layout: WidgetLayoutItem[] = [];
  if (layoutRow.length > 0) {
    try {
      layout = JSON.parse(layoutRow[0].layoutJson) as WidgetLayoutItem[];
    } catch {
      layout = [];
    }
  }

  return { commonStats, adminStats, layout };
}

export async function saveDashboardLayout(userId: number, layout: WidgetLayoutItem[]) {
  const json = JSON.stringify(layout);
  const existing = await db
    .select({ userId: dashboardLayouts.userId })
    .from(dashboardLayouts)
    .where(eq(dashboardLayouts.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(dashboardLayouts)
      .set({ layoutJson: json, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(dashboardLayouts.userId, userId));
  } else {
    await db.insert(dashboardLayouts).values({
      userId,
      layoutJson: json,
    });
  }
}
