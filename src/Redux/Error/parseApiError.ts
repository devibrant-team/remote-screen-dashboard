// utils/parseApiError.ts
import type { AxiosError } from "axios";

export type ParsedApiError = {
  title: string;
  items: string[];      // human-readable lines
  code?: number;        // HTTP status
  requestId?: string;   // x-request-id or similar if found
  raw?: unknown;        // original error (for dev tools)
};

function asString(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v.trim() || null;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return null;
}

export function parseApiError(err: unknown): ParsedApiError {
  // Axios error?
  const ax = (err as AxiosError) ?? null;
  const status = (ax?.response?.status as number | undefined) ?? undefined;

  // Laravel-y shapes we often see:
  // - { message: "Something", errors: { field: ["msg1","msg2"], ... } }
  // - { error: "Something" }
  // - { detail: "Something" }
  const data = (ax?.response?.data ?? ax?.toJSON?.() ?? err) as any;

  const lines: string[] = [];

  // 1) Validation bag (Laravel)
  if (data?.errors && typeof data.errors === "object") {
    for (const key of Object.keys(data.errors)) {
      const arr = data.errors[key];
      if (Array.isArray(arr)) {
        arr.forEach((msg) => {
          const m = asString(msg);
          if (m) lines.push(m);
        });
      } else {
        const m = asString(arr);
        if (m) lines.push(m);
      }
    }
  }

  // 2) Single message-like fields
  const singleCandidates = [
    data?.message,
    data?.error,
    data?.detail,
    (ax?.message ?? (err as any)?.message),
  ];
  singleCandidates.forEach((m) => {
    const s = asString(m);
    if (s) lines.push(s);
  });

  // 3) Status text from Axios if nothing else
  if (lines.length === 0) {
    const statusText = asString((ax?.response as any)?.statusText) ?? "Request failed";
    lines.push(statusText);
  }

  // Try to find a request id in headers or payload
  const requestId =
    (ax?.response?.headers?.["x-request-id"] as string | undefined) ??
    (typeof data?.request_id === "string" ? data.request_id : undefined) ??
    undefined;

  // Title
  const titleParts: string[] = [];
  if (status) titleParts.push(`Error ${status}`);
  if (data?.code && Number.isFinite(Number(data.code))) titleParts.push(`Code ${data.code}`);
  const title = titleParts.length ? titleParts.join(" • ") : "Something went wrong";

  // Deduplicate & trim
  const unique = Array.from(new Set(lines.map((s) => s.trim()))).filter(Boolean);

  return {
    title,
    items: unique.slice(0, 10), // keep it short
    code: status,
    requestId,
    raw: err,
  };
}
