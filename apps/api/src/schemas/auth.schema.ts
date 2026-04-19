import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "username required"),
  password: z.string().min(1, "password required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
