import { z } from "zod";

export const createUserSchema = z.object({
  username: z.string().trim().min(1, "username required").max(128),
  password: z.string().min(1, "password required"),
  role: z.enum(["ADMIN", "USER"]).default("USER"),
  folderIds: z.array(z.number().int().positive()).default([]),
  screenIds: z.array(z.number().int().positive()).default([]),
});

export const updateUserSchema = z.object({
  password: z.string().min(1).optional(),
  role: z.enum(["ADMIN", "USER"]).optional(),
  folderIds: z.array(z.number().int().positive()).optional(),
  screenIds: z.array(z.number().int().positive()).optional(),
});

export type CreateUserInput = z.output<typeof createUserSchema>;
export type UpdateUserInput = z.output<typeof updateUserSchema>;
