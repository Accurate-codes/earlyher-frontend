"use client";

import { useEffect } from "react";
import { Pause, Play, Speaker, SpeakerOff, Spinner, StopSquare } from "@/components/ui/icons";
import { audioController, availability } from "@/lib/audio/audio-controller";
import { useAudioState, useAudioSupport, useUi } from "@/lib/hooks";

interface ListenButtonProps {
  /** Unique per control so only the one that was pressed shows as playing. */
  id: string;
  /** Content ids to read, in order (see lib/audio/speech-catalog.ts). */
  ids: string[];
  className?: string;
}

const pill = "inline-flex min-h-12 items-center gap-2 rounded-full border px-5 py-2 text-base font-semibold shadow-soft transition-colors";
const primary = `${pill} border-line bg-white text-brand-700 hover:border-brand-300 hover:bg-brand-50`;
const active = `${pill} border-brand-600 bg-brand-600 text-white hover:bg-brand-700`;

/**
 * Listen, with Pause/Resume (where the audio supports it) and Stop. Playback starts only
 * when pressed. If the selected language cannot be read aloud here, the control says so
 * instead of offering a button that would play nothing or the wrong language.
 */
export function ListenButton({ id, ids, className = "" }: ListenButtonProps) {
  const { ui, locale } = useUi();
  const audio = useAudioState();
  const support = useAudioSupport();
  const t = ui.audio;
  const mine = audio.controlId === id;
  const status = mine ? audio.status : "idle";
  const ready = availability(locale, ids);
  // support is read so the control updates when voices or the server answer arrive.
  void support;

  // Leaving the screen, or this question, stops its audio.
  useEffect(() => () => audioController.release(id), [id]);

  const align = className.includes("items-") ? "" : "items-center";
  let message: string | null = null;
  if (status === "error" && audio.error) message = audio.error === "unavailable" ? t.unavailable : t.errors[audio.error];
  else if (status === "loading") message = t.loading;
  else if ((status === "playing" || status === "paused") && audio.device) message = t.deviceVoice;

  if (ready === "unavailable" && status === "idle") {
    return (
      <span className={`inline-flex flex-col gap-1.5 ${align} ${className}`}>
        <span className="inline-flex min-h-12 items-center gap-2 rounded-full border border-dashed border-line bg-white/60 px-4 py-2 text-base text-ink-soft">
          <SpeakerOff className="size-5 shrink-0" />
          {t.unavailable}
        </span>
      </span>
    );
  }

  return (
    <span className={`inline-flex flex-col gap-1.5 ${align} ${className}`}>
      <span className="inline-flex flex-wrap items-center justify-center gap-2">
        {(status === "idle" || status === "error") && (
          <button
            type="button"
            disabled={ready === "checking"}
            onClick={() => audioController.play(id, locale, ids)}
            className={`${primary} disabled:cursor-wait disabled:opacity-60`}
          >
            <Speaker className="size-5" />
            {status === "error" ? t.retry : ui.common.listen}
          </button>
        )}
        {status === "loading" && (
          <span className={`${pill} border-line bg-white text-ink-soft`} aria-hidden="true">
            <Spinner className="size-5" />
            {t.loading}
          </span>
        )}
        {status === "playing" && audio.canPause && (
          <button type="button" onClick={() => audioController.pause()} className={active}>
            <Pause className="size-5" />
            {t.pause}
          </button>
        )}
        {status === "paused" && (
          <button type="button" onClick={() => audioController.resume()} className={active}>
            <Play className="size-5" />
            {t.resume}
          </button>
        )}
        {(status === "loading" || status === "playing" || status === "paused") && (
          <button
            type="button"
            onClick={() => audioController.stop()}
            className={status === "playing" && !audio.canPause ? active : primary}
          >
            <StopSquare className="size-5" />
            {ui.common.stop}
          </button>
        )}
      </span>
      <span role="status" className="text-sm text-ink-soft empty:hidden">
        {message}
      </span>
      {mine && audio.generated && status !== "idle" && status !== "error" && (
        <span className="text-xs text-ink-soft">{t.generated}</span>
      )}
    </span>
  );
}
