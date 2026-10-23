"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { educationModules } from "@/content/en/education";

/** Screens that must open without a connection. Private data never passes through these URLs. */
const CORE_ROUTES = [
  "/",
  "/concern",
  "/next-step",
  "/no-concern",
  "/summary",
  "/privacy",
  "/learn",
  "/healthcare",
  ...educationModules.map((module) => `/learn/${module.slug}`),
];

/**
 * Registers the service worker in production builds and warms the router's data for
 * every core screen, so moving between them does not need the network. The worker
 * is skipped in `next dev`, where cached assets would get in the way of live reload.
 */
export function ServiceWorkerRegistrar() {
  const router = useRouter();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    let cancelled = false;

    navigator.serviceWorker
      .register(`/sw.js?v=${process.env.NEXT_PUBLIC_BUILD_ID ?? "dev"}`, { scope: "/", updateViaCache: "none" })
      .then(() => navigator.serviceWorker.ready)
      // On a first visit the worker takes control a moment after it activates; wait for
      // that so the warm-up requests below pass through it and are stored.
      .then(
        () =>
          new Promise<void>((resolve) => {
            if (navigator.serviceWorker.controller) return resolve();
            navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true });
          }),
      )
      .then(() => {
        if (cancelled || !navigator.onLine) return;
        for (const route of CORE_ROUTES) router.prefetch(route);
      })
      .catch(() => {
        // Offline support is an enhancement; the app still works online without it.
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
