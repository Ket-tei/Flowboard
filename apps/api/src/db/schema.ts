import {
  mysqlTable,
  varchar,
  int,
  bigint,
  mysqlEnum,
  timestamp,
  primaryKey,
  decimal,
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
  displayMode: mysqlEnum("display_mode", ["QUICK", "TEMPLATE"]).notNull().default("QUICK"),
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

export const templateFolders = mysqlTable("template_folders", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  parentId: bigint("parent_id", { mode: "number" }),
  name: varchar("name", { length: 255 }).notNull(),
  sortOrder: int("sort_order").notNull().default(0),
});

export const templates = mysqlTable("templates", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  folderId: bigint("folder_id", { mode: "number" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  revision: int("revision").notNull().default(0),
  sortOrder: int("sort_order").notNull().default(0),
});

export const templateItems = mysqlTable("template_items", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  templateId: bigint("template_id", { mode: "number" }).notNull(),
  type: mysqlEnum("type", ["IMAGE", "VIDEO", "GIF"]).notNull(),
  storageKey: varchar("storage_key", { length: 512 }).notNull(),
  mimeType: varchar("mime_type", { length: 128 }).notNull(),
  durationMs: int("duration_ms").notNull().default(5000),
  sortOrder: int("sort_order").notNull().default(0),
  transitionType: mysqlEnum("transition_type", ["NONE", "FADE", "SLIDE_LEFT", "SLIDE_UP"]).notNull().default("NONE"),
  transitionDurationMs: int("transition_duration_ms").notNull().default(350),
});

export const templateWidgets = mysqlTable("template_widgets", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  templateId: bigint("template_id", { mode: "number" }).notNull(),
  type: mysqlEnum("type", ["WEATHER_CURRENT"]).notNull(),
  position: mysqlEnum("position", ["TOP_LEFT", "TOP_RIGHT", "BOTTOM_LEFT", "BOTTOM_RIGHT"]).notNull().default("TOP_RIGHT"),
  config: varchar("config", { length: 1024 }).notNull().default("{}"),
  x: decimal("x", { precision: 5, scale: 4 }).notNull().default("0.8500"),
  y: decimal("y", { precision: 5, scale: 4 }).notNull().default("0.0400"),
  w: decimal("w", { precision: 5, scale: 4 }).notNull().default("0.1300"),
  h: decimal("h", { precision: 5, scale: 4 }).notNull().default("0.1000"),
  startMs: int("start_ms"),
  endMs: int("end_ms"),
});

export const userTemplateFolderAccess = mysqlTable(
  "user_template_folder_access",
  {
    userId: bigint("user_id", { mode: "number" }).notNull(),
    templateFolderId: bigint("template_folder_id", { mode: "number" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.templateFolderId] })]
);

export const userTemplateAccess = mysqlTable(
  "user_template_access",
  {
    userId: bigint("user_id", { mode: "number" }).notNull(),
    templateId: bigint("template_id", { mode: "number" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.templateId] })]
);

export const screenSchedules = mysqlTable("screen_schedules", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  screenId: bigint("screen_id", { mode: "number" }).notNull(),
  dayOfWeek: int("day_of_week").notNull(),
  startTime: varchar("start_time", { length: 5 }).notNull(),
  endTime: varchar("end_time", { length: 5 }).notNull(),
  templateId: bigint("template_id", { mode: "number" }).notNull(),
});

export const dashboardLayouts = mysqlTable("dashboard_layouts", {
  userId: bigint("user_id", { mode: "number" }).primaryKey(),
  layoutJson: varchar("layout_json", { length: 8000 }).notNull().default("[]"),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const dashboardLayoutsRelations = relations(dashboardLayouts, ({ one }) => ({
  user: one(users, { fields: [dashboardLayouts.userId], references: [users.id] }),
}));

export const templateFoldersRelations = relations(templateFolders, ({ one, many }) => ({
  parent: one(templateFolders, {
    fields: [templateFolders.parentId],
    references: [templateFolders.id],
    relationName: "templateFolderTree",
  }),
  children: many(templateFolders, { relationName: "templateFolderTree" }),
  templates: many(templates),
}));

export const templatesRelations = relations(templates, ({ one, many }) => ({
  folder: one(templateFolders, { fields: [templates.folderId], references: [templateFolders.id] }),
  items: many(templateItems),
}));

export const templateItemsRelations = relations(templateItems, ({ one }) => ({
  template: one(templates, { fields: [templateItems.templateId], references: [templates.id] }),
}));

export const templateWidgetsRelations = relations(templateWidgets, ({ one }) => ({
  template: one(templates, { fields: [templateWidgets.templateId], references: [templates.id] }),
}));
