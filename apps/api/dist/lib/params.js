import { BadRequestError } from "./errors.js";
export function parseIdParam(request, key = "id") {
    const raw = request.params[key];
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0)
        throw new BadRequestError(`invalid ${key}`);
    return n;
}
