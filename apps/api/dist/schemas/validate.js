export class ValidationError extends Error {
    issues;
    constructor(issues) {
        const msg = issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
        super(msg);
        this.issues = issues;
        this.name = "ValidationError";
    }
}
export function validate(schema, data) {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new ValidationError(result.error.issues);
    }
    return result.data;
}
