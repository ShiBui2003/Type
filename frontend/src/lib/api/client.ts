const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Carries the parsed FastAPI error body (a string for plain HTTPExceptions,
// or {errors: {question_id: message}} for the public submit endpoint's
// per-question validation failures) so callers can show something more
// useful than "request failed".
export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(status: number, detail: unknown) {
    super(typeof detail === "string" ? detail : "Request failed");
    this.status = status;
    this.detail = detail;
  }
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  // DELETE endpoints return 204 with no body.
  if (res.status === 204) {
    return undefined as T;
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(res.status, body?.detail ?? body);
  }

  return body as T;
}
