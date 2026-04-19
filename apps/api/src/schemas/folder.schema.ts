import { z } from "zod";

export const createFolderSchema = z.object({
  name: z.string().trim().min(1, "name required").max(255),
  parentId: z.number().int().positive().nullable().default(null),
  sortOrder: z.number().int().default(0),
});

export const updateFolderSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    parentId: z.number().int().positive().nullable().optional(),
    sortOrder: z.number().int().optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "at least one field required",
  });

export type CreateFolderInput = z.output<typeof createFolderSchema>;
export type UpdateFolderInput = z.output<typeof updateFolderSchema>;
