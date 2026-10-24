/**
 * Simple in-memory limits for the speech endpoint, per server instance. They stop one
 * client from running up provider costs; a deployment behind several instances should
 * also set a limit at its proxy or gateway.
 */

export interface Limiter {
  /** True if the request may go ahead (and counts it). */
  take(key: string, now?: number): boolean;
}

/** At most `limit` requests per `windowMs` for each key (fixed window). */
export function windowLimiter(limit: number, windowMs: number, maxKeys = 5000): Limiter {
  const windows = new Map<string, { start: number; count: number }>();
  return {
    take(key, now = Date.now()) {
      let entry = windows.get(key);
      if (!entry || now - entry.start >= windowMs) {
        if (!entry && windows.size >= maxKeys) {
          for (const [old, value] of windows) if (now - value.start >= windowMs) windows.delete(old);
          if (windows.size >= maxKeys) return false;
        }
        entry = { start: now, count: 0 };
        windows.set(key, entry);
      }
      if (entry.count >= limit) return false;
      entry.count += 1;
      return true;
    },
  };
}

function positive(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const speechLimits = {
  /** Any speech request, cached or not: per client per minute. */
  requests: windowLimiter(positive(process.env.SPEECH_REQUESTS_PER_MINUTE, 120), 60_000),
  /** New clips sent to the paid provider: per client per minute. */
  generations: windowLimiter(positive(process.env.SPEECH_GENERATIONS_PER_MINUTE, 30), 60_000),
  /** New clips for the whole server per day, a ceiling on provider cost. */
  daily: windowLimiter(positive(process.env.SPEECH_GENERATIONS_PER_DAY, 3000), 86_400_000, 1),
};
