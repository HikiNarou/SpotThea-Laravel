const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api").replace(/\/+$/, "");

interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  formData?: FormData;
  token?: string;
  headers?: Record<string, string>;
}

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers = new Headers({
    Accept: "application/json",
    ...(options.headers ?? {}),
  });

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const requestBody = options.formData ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined);
  if (!options.formData && options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: requestBody,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const rawMessage =
      (payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string" && payload.message) ||
      `Request failed with status ${response.status}`;
    const sensitivePattern = /(SQLSTATE\[|syntax error|stack trace|PDOException|QueryException)/i;
    const message =
      response.status >= 500 || sensitivePattern.test(rawMessage)
        ? "Terjadi kesalahan server. Silakan coba lagi."
        : rawMessage;

    throw new ApiClientError(response.status, message, payload);
  }

  return payload as T;
}
