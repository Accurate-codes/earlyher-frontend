"use client";

import { ui } from "@/content/en/ui";
import { Speaker, StopSquare } from "@/components/ui/icons";
import { audioController } from "@/lib/audio/audio-controller";
import { useAudioState } from "@/lib/hooks";

interface ListenButtonProps {
  /** Unique per control so only the one that was pressed shows as playing. */
  id: string;
  /** What is read aloud when no approved recording is mapped. */
  text: string;
  audioKey?: string;
  className?: string;
}

export function ListenButton({ id, text, audioKey, className = "" }: ListenButtonProps) {
  const audio = useAudioState();
  const playing = audio.playingId === id;

  return (
    <span className={`inline-flex flex-col gap-1.5 ${className.includes("items-") ? "" : "items-center"} ${className}`}>
      <button
        type="button"
        aria-pressed={playing}
        onClick={() => (playing ? audioController.stop() : audioController.play({ id, text, audioKey }))}
        className={`inline-flex min-h-12 items-center gap-2 rounded-full border px-5 py-2 text-base font-semibold shadow-soft transition-colors ${
          playing
            ? "border-brand-600 bg-brand-600 text-white"
            : "border-line bg-white text-brand-700 hover:border-brand-300 hover:bg-brand-50"
        }`}
      >
        {playing ? <StopSquare className="size-5" /> : <Speaker className="size-5" />}
        {playing ? ui.common.stop : ui.common.listen}
      </button>
      <span role="status" className="text-sm text-ink-soft empty:hidden">
        {playing && audio.source === "device-voice" ? ui.audio.deviceVoice : null}
        {audio.unavailableId === id ? ui.audio.unavailable : null}
      </span>
    </span>
  );
}
