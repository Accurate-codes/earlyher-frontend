"use client";

import { useEffect, useRef, useState } from "react";
import { Speaker, SpeakerOff, Spinner, StopSquare } from "@/components/ui/icons";
import { audioController, availability } from "@/lib/audio/audio-controller";
import { useAudioState, useAudioSupport, useReadAlong, useUi } from "@/lib/hooks";

interface ListenButtonProps {
  /** Unique per control so only the one that was pressed shows as playing. */
  id: string;
  /** Content ids to read, in order (see lib/audio/speech-catalog.ts). */
  ids: string[];
  /**
   * A step of the check: pressing Listen here turns on reading each new step, and this
   * step starts reading by itself while that is on.
   */
  readAlong?: boolean;
  className?: string;
}

/** A short pause before a new step is read, so it is on screen first. */
const READ_ALONG_DELAY_MS = 250;

const round =
  "group relative inline-grid size-12 shrink-0 place-items-center rounded-full border shadow-soft transition-colors disabled:cursor-wait disabled:opacity-60";

/**
 * Listen: one speaker button that reads the screen in the selected language, and stops
 * when pressed again. Playback starts only when pressed, or, after the person has pressed
 * it on a step of the check, when the next step appears. If the selected language cannot
 * be read aloud here, the speaker is crossed out and pressing it says so, instead of
 * playing nothing or the wrong language.
 */
export function ListenButton({ id, ids, readAlong = false, className = "" }: ListenButtonProps) {
  const { ui, locale } = useUi();
  const audio = useAudioState();
  const support = useAudioSupport();
  const following = useReadAlong();
  const t = ui.audio;
  const mine = audio.controlId === id;
  const status = mine ? audio.status : "idle";
  const ready = availability(locale, ids);
  // support is read so the control updates when voices or the server answer arrive.
  void support;
  const [explained, setExplained] = useState(false);
  const played = useRef(false);
  const spoken = ids.join("|");

  // Leaving the screen, or this question, stops its audio.
  useEffect(() => () => audioController.release(id), [id]);

  // Reading along: this step reads itself once, as soon as its audio is ready.
  useEffect(() => {
    if (!readAlong || !following || played.current || ready !== "ready") return;
    const timer = window.setTimeout(() => {
      played.current = true;
      audioController.play(id, locale, spoken.split("|"));
    }, READ_ALONG_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [readAlong, following, ready, id, locale, spoken]);

  const busy = status === "loading" || status === "playing" || status === "paused";
  const unavailable = ready === "unavailable" && !busy;

  const press = () => {
    if (busy) {
      audioController.stopReading();
      return;
    }
    if (unavailable) {
      setExplained(true);
      return;
    }
    played.current = true;
    audioController.setFollowing(readAlong);
    audioController.play(id, locale, ids);
  };

  let message: string | null = null;
  if (status === "error" && audio.error) message = audio.error === "unavailable" ? t.unavailable : t.errors[audio.error];
  else if (unavailable && explained) message = t.unavailable;
  else if (status === "loading") message = t.loading;
  const notes = [
    busy && audio.device ? t.deviceVoice : null,
    busy && audio.generated ? t.generated : null,
    readAlong && following && !unavailable && status !== "error" ? t.readAlong : null,
  ].filter(Boolean);

  const label = busy ? ui.common.stop : status === "error" ? t.retry : ui.common.listen;
  const look = busy
    ? "border-brand-600 bg-brand-600 text-white ring-4 ring-brand-200 hover:bg-brand-700"
    : unavailable
      ? "border-dashed border-line bg-white/70 text-ink-soft hover:bg-white"
      : readAlong && following
        ? "border-brand-400 bg-brand-50 text-brand-700 hover:bg-brand-100"
        : "border-line bg-white text-brand-700 hover:border-brand-300 hover:bg-brand-50";
  const align = className.includes("items-") ? "" : "items-center text-center";

  return (
    <span className={`inline-flex flex-col gap-1.5 ${align} ${className}`}>
      <button
        type="button"
        aria-label={label}
        aria-describedby={message ? `${id}-listen-status` : undefined}
        aria-busy={status === "loading" || undefined}
        disabled={ready === "checking" && !busy}
        onClick={press}
        className={`${round} ${look}`}
      >
        {status === "loading" ? (
          <Spinner className="size-6" />
        ) : busy ? (
          <StopSquare className="size-6" />
        ) : unavailable ? (
          <SpeakerOff className="size-6" />
        ) : (
          <Speaker className="size-6" />
        )}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-full top-1/2 z-10 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1 text-sm font-semibold text-white opacity-0 shadow-soft transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          {label}
        </span>
      </button>
      <span id={`${id}-listen-status`} role="status" className="max-w-[40ch] text-sm text-ink-soft empty:hidden">
        {message}
      </span>
      {notes.map((note) => (
        <span key={note} className="max-w-[40ch] text-xs text-ink-soft">
          {note}
        </span>
      ))}
    </span>
  );
}
