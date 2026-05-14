import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, userFolderAccess, userScreenAccess, userTemplateFolderAccess, userTemplateAccess } from "../db/schema.js";
import { parseVisibleTabs } from "../lib/visible-tabs.js";
export async function listUsers() {
    const rows = await db
        .select({ id: users.id, username: users.username, role: users.role, visibleTabs: users.visibleTabs, createdAt: users.createdAt })
        .from(users);
    return rows.map((r) => ({ ...r, visibleTabs: parseVisibleTabs(r.visibleTabs) }));
}
export async function getUserAccess(userId) {
    const [userRows, folderRows, screenRows, tplFolderRows, tplRows] = await Promise.all([
        db.select({ visibleTabs: users.visibleTabs }).from(users).where(eq(users.id, userId)).limit(1),
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
        visibleTabs: parseVisibleTabs(userRows[0]?.visibleTabs),
    };
}
export async function createUser(input) {
    const passwordHash = await bcrypt.hash(input.password, 12);
    const visibleTabsVal = input.role === "USER" && input.visibleTabs?.length ? input.visibleTabs.join(",") : null;
    try {
        await db.insert(users).values({ username: input.username, passwordHash, role: input.role, visibleTabs: visibleTabsVal });
    }
    catch {
        throw new UserError("username already taken", 409);
    }
    const [row] = await db.select({ id: users.id }).from(users).where(eq(users.username, input.username)).limit(1);
    if (!row)
        throw new UserError("user creation failed", 500);
    if (input.role === "USER") {
        await syncAccess(row.id, input.folderIds, input.screenIds, input.templateFolderIds, input.templateIds);
    }
    return { id: row.id };
}
export async function updateUser(userId, input) {
    const updates = {};
    if (input.password) {
        updates.passwordHash = await bcrypt.hash(input.password, 12);
    }
    if (input.role !== undefined) {
        updates.role = input.role;
    }
    if (input.role === "ADMIN") {
        updates.visibleTabs = null;
    }
    else if (input.visibleTabs !== undefined) {
        updates.visibleTabs = input.visibleTabs.length > 0 ? input.visibleTabs.join(",") : null;
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
    }
    else if (input.folderIds !== undefined || input.screenIds !== undefined || input.templateFolderIds !== undefined || input.templateIds !== undefined) {
        await syncAccess(userId, input.folderIds ?? [], input.screenIds ?? [], input.templateFolderIds ?? [], input.templateIds ?? []);
    }
}
export async function deleteUser(userId, requesterId) {
    if (userId === requesterId) {
        throw new UserError("cannot delete yourself", 400);
    }
    await db.delete(users).where(eq(users.id, userId));
}
async function syncAccess(userId, folderIds, screenIds, templateFolderIds, templateIds) {
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
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = "UserError";
    }
}
