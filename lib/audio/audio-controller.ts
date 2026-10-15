import { audioMap } from "@/content/en/audio-map";

/**
 * One playback at a time for the whole app. Prefers an approved local recording;
 * where none is mapped it tries the device's speech synthesis as a best-effort
 * prototype fallback, and otherwise reports honestly that audio is unavailable.
 */

export interface AudioState {
  /** Id of the Listen control that is playing, if any. */
  playingId: string | null;
  source: "recording" | "device-voice" | null;
  /** Id of the control whose audio could not be played. */
  unavailableId: string | null;
}

export interface ListenRequest {
  id: string;
  text: string;
  audioKey?: string;
}

const idle: AudioState = { playingId: null, source: null, unavailableId: null };

let state: AudioState = idle;
let element: HTMLAudioElement | null = null;
const listeners = new Set<() => void>();

function setState(next: AudioState) {
  state = next;
  for (const listener of listeners) listener();
}

function silence() {
  if (element) {
    element.onended = null;
    element.onerror = null;
    element.pause();
    element.removeAttribute("src");
    element = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

function speak(request: ListenRequest): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    return false;
  }
  const utterance = new SpeechSynthesisUtterance(request.text);
  utterance.lang = "en-NG";
  utterance.rate = 0.92;
  const finish = () => {
    if (state.playingId === request.id) setState(idle);
  };
  utterance.onend = finish;
  utterance.onerror = finish;
  window.speechSynthesis.speak(utterance);
  setState({ playingId: request.id, source: "device-voice", unavailableId: null });
  return true;
}

export const audioController = {
  getState: (): AudioState => state,
  getServerState: (): AudioState => idle,

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  play(request: ListenRequest) {
    silence();
    const src = request.audioKey ? audioMap[request.audioKey] : undefined;

    if (src) {
      const audio = new Audio(src);
      element = audio;
      audio.onended = () => {
        if (state.playingId === request.id) setState(idle);
      };
      // A mapped file that fails to load (for example, not cached offline) falls back to the device voice.
      audio.onerror = () => {
        if (element !== audio) return;
        element = null;
        if (!speak(request)) setState({ playingId: null, source: null, unavailableId: request.id });
      };
      setState({ playingId: request.id, source: "recording", unavailableId: null });
      audio.play().catch(() => audio.onerror?.(new Event("error")));
      return;
    }

    if (!speak(request)) setState({ playingId: null, source: null, unavailableId: request.id });
  },

  /** Stops any playback. Called on navigation and when the session ends. */
  stop() {
    silence();
    if (state !== idle) setState(idle);
  },
};
