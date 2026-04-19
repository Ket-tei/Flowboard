import { z } from "zod";

export const createScreenSchema = z.object({
  name: z.string().trim().min(1, "name required").max(255),
  sortOrder: z.number().int().default(0),
});

export const updateScreenSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    sortOrder: z.number().int().optional(),
    folderId: z.number().int().positive().optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "at least one field required",
  });

export const reorderItemsSchema = z.object({
  orderedIds: z.array(z.number().int().positive()).min(1, "orderedIds required"),
});

export const updateItemSchema = z.object({
  durationMs: z.number().int().min(0, "durationMs must be >= 0"),
});

export type CreateScreenInput = z.output<typeof createScreenSchema>;
export type UpdateScreenInput = z.output<typeof updateScreenSchema>;
export type ReorderItemsInput = z.output<typeof reorderItemsSchema>;
export type UpdateItemInput = z.output<typeof updateItemSchema>;
