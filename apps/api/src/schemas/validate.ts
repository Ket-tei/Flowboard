import type { ZodType, ZodError } from "zod";

export class ValidationError extends Error {
  constructor(public readonly issues: ZodError["issues"]) {
    const msg = issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    super(msg);
    this.name = "ValidationError";
  }
}

export function validate<O>(schema: ZodType<O, any, any>, data: unknown): O {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(result.error.issues);
  }
  return result.data;
}
