import {
  mysqlTable,
  varchar,
  int,
  bigint,
  mysqlEnum,
  timestamp,
  primaryKey,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";

export const users = mysqlTable("users", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  username: varchar("username", { length: 128 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["ADMIN", "USER"]).notNull().default("USER"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const folders = mysqlTable("folders", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  parentId: bigint("parent_id", { mode: "number" }),
  name: varchar("name", { length: 255 }).notNull(),
  sortOrder: int("sort_order").notNull().default(0),
});

export const screens = mysqlTable("screens", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  folderId: bigint("folder_id", { mode: "number" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  publicToken: varchar("public_token", { length: 36 }).notNull().unique(),
  revision: int("revision").notNull().default(0),
  sortOrder: int("sort_order").notNull().default(0),
});

export const screenItems = mysqlTable("screen_items", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  screenId: bigint("screen_id", { mode: "number" }).notNull(),
  type: mysqlEnum("type", ["IMAGE", "VIDEO", "GIF"]).notNull(),
  storageKey: varchar("storage_key", { length: 512 }).notNull(),
  mimeType: varchar("mime_type", { length: 128 }).notNull(),
  durationMs: int("duration_ms").notNull().default(5000),
  sortOrder: int("sort_order").notNull().default(0),
});

export const userFolderAccess = mysqlTable(
  "user_folder_access",
  {
    userId: bigint("user_id", { mode: "number" }).notNull(),
    folderId: bigint("folder_id", { mode: "number" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.folderId] })]
);

export const userScreenAccess = mysqlTable(
  "user_screen_access",
  {
    userId: bigint("user_id", { mode: "number" }).notNull(),
    screenId: bigint("screen_id", { mode: "number" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.screenId] })]
);

export const usersRelations = relations(users, ({ many }) => ({
  folderAccess: many(userFolderAccess),
  screenAccess: many(userScreenAccess),
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
  parent: one(folders, {
    fields: [folders.parentId],
    references: [folders.id],
    relationName: "folderTree",
  }),
  children: many(folders, { relationName: "folderTree" }),
  screens: many(screens),
}));

export const screensRelations = relations(screens, ({ one, many }) => ({
  folder: one(folders, { fields: [screens.folderId], references: [folders.id] }),
  items: many(screenItems),
}));

export const screenItemsRelations = relations(screenItems, ({ one }) => ({
  screen: one(screens, { fields: [screenItems.screenId], references: [screens.id] }),
}));

export const dashboardLayouts = mysqlTable("dashboard_layouts", {
  userId: bigint("user_id", { mode: "number" }).primaryKey(),
  layoutJson: varchar("layout_json", { length: 8000 }).notNull().default("[]"),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const dashboardLayoutsRelations = relations(dashboardLayouts, ({ one }) => ({
  user: one(users, { fields: [dashboardLayouts.userId], references: [users.id] }),
}));
