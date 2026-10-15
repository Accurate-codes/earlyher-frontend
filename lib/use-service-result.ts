"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { sessionStore } from "@/lib/session/session-store";
import type { ServiceResult } from "@/lib/types/api";

/**
 * Runs a service call for `key` and returns "loading" until it settles. A new key
 * starts a new call; results for an old key, a hidden screen or an ended session
 * are dropped. Pass null to make no call.
 */
export function useServiceResult<T>(
  key: string | null,
  run: (signal: AbortSignal) => Promise<ServiceResult<T>>,
): ServiceResult<T> | "loading" | null {
  const [settled, setSettled] = useState<{ key: string; result: ServiceResult<T> } | null>(null);
  const call = useEffectEvent(run);

  useEffect(() => {
    if (key === null) return;
    let active = true;
    const task = sessionStore.startTask();
    call(task.signal).then((result) => {
      task.done();
      if (active && task.isCurrent()) setSettled({ key, result });
    });
    return () => {
      active = false;
    };
  }, [key]);

  if (key === null) return null;
  return settled?.key === key ? settled.result : "loading";
}
