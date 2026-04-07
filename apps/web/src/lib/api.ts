const prefix = import.meta.env.VITE_API_URL ?? "";

export function apiUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${prefix}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function apiFetch<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(apiUrl(path), {
    ...init,
    credentials: "include",
    headers,
  });
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    const msg =
      typeof data === "object" && data && "error" in data
        ? String((data as { error: string }).error)
        : text || res.statusText;
    throw new Error(msg);
  }
  return data as T;
}
