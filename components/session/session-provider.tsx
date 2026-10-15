"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  Fragment,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ui } from "@/content/en/ui";
import { audioController } from "@/lib/audio/audio-controller";
import { appConfig } from "@/lib/config";
import { useSession } from "@/lib/hooks";
import { sessionStore } from "@/lib/session/session-store";

interface SessionControls {
  /** Asks for confirmation, then ends the session. */
  requestFinish: () => void;
  /** Ends the session immediately: clears everything and returns to the welcome screen. */
  endSession: () => void;
}

const SessionContext = createContext<SessionControls | null>(null);

export function useSessionControls(): SessionControls {
  const controls = useContext(SessionContext);
  if (!controls) throw new Error("useSessionControls must be used inside SessionProvider.");
  return controls;
}

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart"] as const;

/** Stops audio whenever the route changes. */
function StopAudioOnNavigation() {
  const pathname = usePathname();
  useEffect(() => () => audioController.stop(), [pathname]);
  return null;
}

/**
 * Watches for inactivity on any screen other than an untouched welcome screen,
 * warns the person, then clears the session if they do not respond.
 */
function InactivityGuard({ onTimeout }: { onTimeout: () => void }) {
  const pathname = usePathname();
  const session = useSession();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const lastActivity = useRef(0);
  const warning = useRef(false);

  const watching = pathname !== "/" || sessionStore.hasData();
  // Navigating or changing the session counts as activity.
  const activityKey = `${pathname}:${session.epoch}:${Object.keys(session.answers).length}`;

  useEffect(() => {
    if (!watching) return;
    lastActivity.current = Date.now();
    warning.current = false;

    const onActivity = () => {
      if (!warning.current) lastActivity.current = Date.now();
    };
    for (const name of ACTIVITY_EVENTS) window.addEventListener(name, onActivity, { passive: true });

    const tick = window.setInterval(() => {
      // Audio that is still playing means the person is listening, not absent.
      if (audioController.getState().playingId && !warning.current) lastActivity.current = Date.now();

      const idle = Date.now() - lastActivity.current;
      if (idle < appConfig.inactivityTimeoutMs) return;

      const remaining = appConfig.inactivityTimeoutMs + appConfig.inactivityWarningMs - idle;
      if (remaining <= 0) {
        warning.current = false;
        setSecondsLeft(null);
        onTimeout();
        return;
      }
      warning.current = true;
      setSecondsLeft(Math.ceil(remaining / 1000));
    }, 500);

    return () => {
      for (const name of ACTIVITY_EVENTS) window.removeEventListener(name, onActivity);
      window.clearInterval(tick);
      setSecondsLeft(null);
    };
  }, [watching, activityKey, onTimeout]);

  const stay = () => {
    lastActivity.current = Date.now();
    warning.current = false;
    setSecondsLeft(null);
  };

  return (
    <Dialog open={secondsLeft !== null} onClose={stay} title={ui.session.idleTitle} dismissible={false}>
      <p className="text-lg leading-relaxed text-ink-soft" role="timer" aria-live="off">
        {ui.session.idleText(secondsLeft ?? 0)}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <Button size="lg" className="flex-1" onClick={stay} autoFocus>
          {ui.session.idleContinue}
        </Button>
        <Button size="lg" variant="secondary" className="flex-1" onClick={onTimeout}>
          {ui.session.idleFinish}
        </Button>
      </div>
    </Dialog>
  );
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { epoch } = useSession();
  const [confirming, setConfirming] = useState(false);

  const endSession = useCallback(() => {
    setConfirming(false);
    audioController.stop();
    sessionStore.reset();
    // replace() so the screen being left is not the entry Back returns to.
    router.replace("/");
  }, [router]);

  const controls = useMemo<SessionControls>(
    () => ({ requestFinish: () => setConfirming(true), endSession }),
    [endSession],
  );

  return (
    <SessionContext.Provider value={controls}>
      {/* A new key remounts every screen, including routes kept alive in the background,
          so no component state from the previous person survives a reset. */}
      <Fragment key={epoch}>{children}</Fragment>

      <Suspense fallback={null}>
        <StopAudioOnNavigation />
        <InactivityGuard onTimeout={endSession} />
      </Suspense>

      <Dialog open={confirming} onClose={() => setConfirming(false)} title={ui.session.exitTitle}>
        <p className="text-lg leading-relaxed text-ink-soft">{ui.session.exitText}</p>
        <div className="flex flex-col gap-3 sm:flex-row-reverse">
          <Button size="lg" className="flex-1" onClick={endSession}>
            {ui.session.exitConfirm}
          </Button>
          <Button size="lg" variant="secondary" className="flex-1" onClick={() => setConfirming(false)}>
            {ui.session.exitStay}
          </Button>
        </div>
      </Dialog>
    </SessionContext.Provider>
  );
}
