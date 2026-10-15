"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, StopSquare } from "@/components/ui/icons";
import { Notice } from "@/components/ui/notice";
import { ui } from "@/content/en/ui";
import { appConfig } from "@/lib/config";
import { sessionStore } from "@/lib/session/session-store";

type Phase =
  | { name: "idle" }
  | { name: "asking" }
  | { name: "recording"; startedAt: number }
  | { name: "recorded"; url: string }
  | { name: "denied" }
  | { name: "unsupported" }
  | { name: "failed" };

function canRecord() {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function" &&
    typeof MediaRecorder !== "undefined"
  );
}

/**
 * Optional short voice note. The recording lives only in this tab's memory: it is
 * never uploaded or transcribed, and it is deleted when the person removes it,
 * closes this panel, or the session ends. The microphone is only requested after
 * the person presses the button.
 */
export function VoiceNote({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>(() => (canRecord() ? { name: "idle" } : { name: "unsupported" }));
  const [elapsed, setElapsed] = useState(0);
  const recorder = useRef<MediaRecorder | null>(null);
  /** Releases the microphone and the recording. Registered with the session so a reset runs it too. */
  const release = useRef<(() => void) | null>(null);

  const discard = () => {
    release.current?.();
    release.current = null;
    recorder.current = null;
  };

  // Leaving this panel for any reason stops the microphone and deletes the recording.
  useEffect(() => discard, []);

  useEffect(() => {
    if (phase.name !== "recording") return;
    const timer = window.setInterval(() => {
      const ms = Date.now() - phase.startedAt;
      setElapsed(ms);
      if (ms >= appConfig.maxRecordingMs && recorder.current?.state === "recording") recorder.current.stop();
    }, 200);
    return () => window.clearInterval(timer);
  }, [phase]);

  const start = async () => {
    discard();
    setElapsed(0);
    setPhase({ name: "asking" });

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      setPhase(name === "NotAllowedError" || name === "SecurityError" ? { name: "denied" } : { name: "failed" });
      return;
    }

    let url: string | null = null;
    const stopTracks = () => stream.getTracks().forEach((track) => track.stop());
    release.current = sessionStore.registerCleanup(() => {
      if (recorder.current && recorder.current.state !== "inactive") {
        recorder.current.ondataavailable = null;
        recorder.current.onstop = null;
        recorder.current.stop();
      }
      stopTracks();
      if (url) URL.revokeObjectURL(url);
    });

    try {
      const chunks: Blob[] = [];
      const mediaRecorder = new MediaRecorder(stream);
      recorder.current = mediaRecorder;
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      mediaRecorder.onstop = () => {
        stopTracks();
        url = URL.createObjectURL(new Blob(chunks, { type: mediaRecorder.mimeType || "audio/webm" }));
        setPhase({ name: "recorded", url });
      };
      mediaRecorder.onerror = () => {
        discard();
        setPhase({ name: "failed" });
      };
      mediaRecorder.start();
      setPhase({ name: "recording", startedAt: Date.now() });
    } catch {
      discard();
      setPhase({ name: "failed" });
    }
  };

  const remove = () => {
    discard();
    setPhase({ name: "idle" });
  };

  const limitSeconds = Math.round(appConfig.maxRecordingMs / 1000);

  return (
    <div className="flex flex-col gap-4">
      <Notice>
        <p>{ui.voice.privacy}</p>
        <p className="mt-2">{ui.voice.purpose}</p>
      </Notice>

      {(phase.name === "idle" || phase.name === "asking") && (
        <>
          <Button size="lg" onClick={start} disabled={phase.name === "asking"}>
            <Mic className="size-6" />
            {ui.voice.allow}
          </Button>
          <p className="text-center text-base text-ink-soft" role="status">
            {phase.name === "asking" ? ui.voice.asking : ui.voice.limit(limitSeconds)}
          </p>
        </>
      )}

      {phase.name === "recording" && (
        <>
          <p className="flex items-center justify-center gap-3 text-xl font-bold" role="status">
            <span className="pulse-dot size-3.5 rounded-full bg-red-600" aria-hidden="true" />
            {ui.voice.recording}
            <span className="tabular-nums text-ink-soft" aria-hidden="true">
              {Math.min(Math.floor(elapsed / 1000), limitSeconds)} / {limitSeconds}s
            </span>
          </p>
          <Button size="lg" onClick={() => recorder.current?.stop()}>
            <StopSquare className="size-6" />
            {ui.voice.stop}
          </Button>
        </>
      )}

      {phase.name === "recorded" && (
        <>
          <p className="text-lg font-bold">{ui.voice.recorded}</p>
          <audio controls src={phase.url} className="w-full" />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="secondary" className="flex-1" onClick={remove}>
              {ui.voice.remove}
            </Button>
            <Button variant="secondary" className="flex-1" onClick={start}>
              {ui.voice.again}
            </Button>
          </div>
        </>
      )}

      {(phase.name === "denied" || phase.name === "unsupported" || phase.name === "failed") && (
        <Notice tone="warning" role="alert">
          {ui.voice[phase.name]}
        </Notice>
      )}

      <Button size="lg" variant={phase.name === "recorded" ? "primary" : "secondary"} onClick={onDone}>
        {ui.voice.done}
      </Button>
    </div>
  );
}
