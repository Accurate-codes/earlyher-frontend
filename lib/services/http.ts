import { appConfig } from "@/lib/config";
import type { ServiceResult } from "@/lib/types/api";

interface RequestOptions<T> {
  method?: "GET" | "POST";
  body?: unknown;
  timeoutMs: number;
  /** Session signal: aborts when the session is reset. */
  signal?: AbortSignal;
  /** Returns null when the payload is not what the frontend expects. */
  parse: (value: unknown) => T | null;
}

export function isOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

/**
 * One request to the backend with a time limit, cancellation and response validation.
 * Never throws and never logs request or response bodies.
 */
export async function requestJson<T>(path: string, options: RequestOptions<T>): Promise<ServiceResult<T>> {
  if (options.signal?.aborted) return { ok: false, error: "aborted" };
  if (isOffline()) return { ok: false, error: "offline" };
  if (!appConfig.apiBaseUrl) return { ok: false, error: "unavailable" };

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, options.timeoutMs);
  const onSessionAbort = () => controller.abort();
  options.signal?.addEventListener("abort", onSessionAbort, { once: true });

  try {
    const response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
      method: options.method ?? "GET",
      headers: options.body === undefined ? { Accept: "application/json" } : {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
      cache: "no-store",
      credentials: "omit",
    });

    if (response.status === 404 || response.status === 503) return { ok: false, error: "unavailable" };
    if (!response.ok) return { ok: false, error: "server" };

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return { ok: false, error: "invalid-response" };
    }
    const data = options.parse(payload);
    return data === null ? { ok: false, error: "invalid-response" } : { ok: true, data, simulated: false };
  } catch {
    if (options.signal?.aborted) return { ok: false, error: "aborted" };
    if (timedOut) return { ok: false, error: "timeout" };
    return { ok: false, error: isOffline() ? "offline" : "unavailable" };
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", onSessionAbort);
  }
}

/** Resolves after `ms`, or early with false if the signal aborts. Used by mock adapters. */
export function wait(ms: number, signal?: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    if (signal?.aborted) return resolve(false);
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve(true);
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      resolve(false);
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
