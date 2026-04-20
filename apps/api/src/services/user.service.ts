import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, userFolderAccess, userScreenAccess, userTemplateFolderAccess, userTemplateAccess } from "../db/schema.js";
import type { UpdateUserInput } from "../schemas/user.schema.js";

export type UserRow = {
  id: number;
  username: string;
  role: "ADMIN" | "USER";
  createdAt: Date | null;
};

export async function listUsers(): Promise<UserRow[]> {
  return db
    .select({ id: users.id, username: users.username, role: users.role, createdAt: users.createdAt })
    .from(users);
}

export async function getUserAccess(userId: number) {
  const [folderRows, screenRows, tplFolderRows, tplRows] = await Promise.all([
    db.select({ folderId: userFolderAccess.folderId }).from(userFolderAccess).where(eq(userFolderAccess.userId, userId)),
    db.select({ screenId: userScreenAccess.screenId }).from(userScreenAccess).where(eq(userScreenAccess.userId, userId)),
    db.select({ templateFolderId: userTemplateFolderAccess.templateFolderId }).from(userTemplateFolderAccess).where(eq(userTemplateFolderAccess.userId, userId)),
    db.select({ templateId: userTemplateAccess.templateId }).from(userTemplateAccess).where(eq(userTemplateAccess.userId, userId)),
  ]);
  return {
    folderIds: folderRows.map((f) => f.folderId),
    screenIds: screenRows.map((s) => s.screenId),
    templateFolderIds: tplFolderRows.map((r) => r.templateFolderId),
    templateIds: tplRows.map((r) => r.templateId),
  };
}

export async function createUser(input: { username: string; password: string; role: "ADMIN" | "USER"; folderIds: number[]; screenIds: number[]; templateFolderIds: number[]; templateIds: number[] }): Promise<{ id: number }> {
  const passwordHash = await bcrypt.hash(input.password, 12);
  try {
    await db.insert(users).values({ username: input.username, passwordHash, role: input.role });
  } catch {
    throw new UserError("username already taken", 409);
  }
  const [row] = await db.select({ id: users.id }).from(users).where(eq(users.username, input.username)).limit(1);
  if (!row) throw new UserError("user creation failed", 500);

  if (input.role === "USER") {
    await syncAccess(row.id, input.folderIds, input.screenIds, input.templateFolderIds, input.templateIds);
  }
  return { id: row.id };
}

export async function updateUser(userId: number, input: UpdateUserInput): Promise<void> {
  const updates: Partial<{ passwordHash: string; role: "ADMIN" | "USER" }> = {};
  if (input.password) {
    updates.passwordHash = await bcrypt.hash(input.password, 12);
  }
  if (input.role !== undefined) {
    updates.role = input.role;
  }
  if (Object.keys(updates).length) {
    await db.update(users).set(updates).where(eq(users.id, userId));
  }

  const effectiveRole = input.role ?? (await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1))[0]?.role ?? "USER";

  if (effectiveRole === "ADMIN") {
    await db.delete(userFolderAccess).where(eq(userFolderAccess.userId, userId));
    await db.delete(userScreenAccess).where(eq(userScreenAccess.userId, userId));
    await db.delete(userTemplateFolderAccess).where(eq(userTemplateFolderAccess.userId, userId));
    await db.delete(userTemplateAccess).where(eq(userTemplateAccess.userId, userId));
  } else if (input.folderIds !== undefined || input.screenIds !== undefined || input.templateFolderIds !== undefined || input.templateIds !== undefined) {
    await syncAccess(userId, input.folderIds ?? [], input.screenIds ?? [], input.templateFolderIds ?? [], input.templateIds ?? []);
  }
}

export async function deleteUser(userId: number, requesterId: number): Promise<void> {
  if (userId === requesterId) {
    throw new UserError("cannot delete yourself", 400);
  }
  await db.delete(users).where(eq(users.id, userId));
}

async function syncAccess(userId: number, folderIds: number[], screenIds: number[], templateFolderIds: number[], templateIds: number[]) {
  await db.delete(userFolderAccess).where(eq(userFolderAccess.userId, userId));
  await db.delete(userScreenAccess).where(eq(userScreenAccess.userId, userId));
  await db.delete(userTemplateFolderAccess).where(eq(userTemplateFolderAccess.userId, userId));
  await db.delete(userTemplateAccess).where(eq(userTemplateAccess.userId, userId));
  if (folderIds.length) {
    await db.insert(userFolderAccess).values(folderIds.map((folderId) => ({ userId, folderId })));
  }
  if (screenIds.length) {
    await db.insert(userScreenAccess).values(screenIds.map((screenId) => ({ userId, screenId })));
  }
  if (templateFolderIds.length) {
    await db.insert(userTemplateFolderAccess).values(templateFolderIds.map((templateFolderId) => ({ userId, templateFolderId })));
  }
  if (templateIds.length) {
    await db.insert(userTemplateAccess).values(templateIds.map((templateId) => ({ userId, templateId })));
  }
}

export class UserError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "UserError";
  }
}
