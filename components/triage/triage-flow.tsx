"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ListenButton } from "@/components/audio/listen-button";
import { PageShell } from "@/components/layout/page-shell";
import { Button, ButtonLink, buttonClass } from "@/components/ui/button";
import { ArrowLeft, HomeIcon, Info, Lock } from "@/components/ui/icons";
import { RESULT_READY_SPEECH } from "@/lib/audio/page-speech";
import { appConfig } from "@/lib/config";
import { useSession, useTriageText, useUi } from "@/lib/hooks";
import { commitTriage, triageFor, updateTriage } from "@/lib/session/actions";
import { sessionStore } from "@/lib/session/session-store";
import {
  acceptConsent,
  advance,
  buildPath,
  goBack,
  isScreenComplete,
  journeyStages,
  resolveCursor,
  screenQuestions,
  setAnswer,
  stageOf,
  switchEntry,
  type Entry,
  type TriageState,
} from "@/lib/triage/flow";
import { clearProgress, deviceStorage, hasSavedProgress, loadProgress } from "@/lib/triage/persistence";
import { questionShape, type QuestionId } from "@/lib/triage/questions";
import { EmergencyLine, GuidanceFooter, HelpNowButton, ReminderButton, SaveProgressToggle } from "./care-actions";
import { QuestionScreen, StageProgress } from "./question-screen";

/** Auto-advance delay after a single-choice answer, so the person sees what they chose. */
const AUTO_ADVANCE_MS = 300;

export const entryRoute = (entry: Entry) => (entry === "concern" ? "/concern" : "/no-concern");

/** Back, Home and "I need help now", shown at the top of every triage screen. */
export function TriageTopBar({ onBack, backLabel }: { onBack?: () => void; backLabel?: string }) {
  const { ui } = useUi();
  const { text } = useTriageText();
  return (
    <nav aria-label={ui.common.flowNavigation} className="flex flex-wrap items-center justify-between gap-2">
      {onBack ? (
        <button type="button" onClick={onBack} className={buttonClass("secondary", "md")}>
          <ArrowLeft className="size-5" />
          {backLabel ?? text.nav.back}
        </button>
      ) : (
        <Link href="/" className={buttonClass("secondary", "md")}>
          <ArrowLeft className="size-5" />
          {text.nav.back}
        </Link>
      )}
      <div className="flex items-center gap-1">
        <HelpNowButton />
        <Link href="/" className={buttonClass("quiet", "md", "px-3")} aria-label={ui.common.home}>
          <HomeIcon className="size-5" />
          <span className="hidden sm:inline">{ui.common.home}</span>
        </Link>
      </div>
    </nav>
  );
}

const noSubscription = () => () => {};

function WelcomeScreen({ entry }: { entry: Entry }) {
  const router = useRouter();
  const session = useSession();
  const { text, lang } = useTriageText();
  const t = text.welcome;
  const [dismissed, setDismissed] = useState(false);
  const existing = session.triage;
  // Saved progress is offered only when nothing is in progress in this tab.
  const saved = useSyncExternalStore(
    noSubscription,
    () => !existing && hasSavedProgress(deviceStorage(), Date.now()),
    () => false,
  );
  const consented = existing?.consent && existing.entry === entry;

  const start = () => {
    const base = triageFor(sessionStore, entry);
    const next: TriageState = base.consent
      ? { ...base, cursor: base.cursor === "welcome" ? buildPath(base).screens[0] : base.cursor }
      : acceptConsent(base, new Date());
    commitTriage(sessionStore, next);
  };

  const resume = () => {
    const restored = loadProgress(deviceStorage(), Date.now());
    if (!restored) {
      setDismissed(true);
      return;
    }
    commitTriage(sessionStore, restored);
    const route = restored.cursor === "result" ? "/next-step" : entryRoute(restored.entry);
    if (route !== entryRoute(entry)) router.push(route);
  };

  return (
    <PageShell>
      <TriageTopBar />
      <div role="note" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-base font-semibold text-red-950">
        <Info className="mt-0.5 size-5 shrink-0" />
        <EmergencyLine />
      </div>

      {saved && !dismissed && (
        <section aria-labelledby="resume-title" className="flex flex-col gap-3 rounded-3xl border border-brand-300 bg-brand-50 p-5">
          <h2 id="resume-title" className="text-xl font-bold">
            {t.resumeTitle}
          </h2>
          <p className="text-base leading-relaxed">{t.resumeText}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={resume}>
              {t.resume}
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => {
                clearProgress(deviceStorage());
                setDismissed(true);
              }}
            >
              {t.startAgain}
            </Button>
          </div>
        </section>
      )}

      <section className="rise-in flex flex-col items-center gap-5 rounded-[2rem] border border-line bg-white/85 px-5 py-8 text-center shadow-soft sm:px-10">
        <h1 lang={lang} className="max-w-[22ch] text-balance text-[clamp(1.75rem,1.2rem+2.6vw,2.75rem)] font-bold leading-[1.12] tracking-tight">
          {entry === "concern" ? t.concernTitle : t.noConcernTitle}
        </h1>
        <p className="max-w-[46ch] text-pretty text-lg leading-relaxed text-ink-soft">{t.body}</p>
        <ListenButton
          id={`welcome-${entry}`}
          readAlong
          ids={[
            entry === "concern" ? "triage.welcome.concernTitle" : "triage.welcome.noConcernTitle",
            "triage.welcome.body",
            "triage.welcome.consent",
            "triage.welcome.noIdentity",
          ]}
        />
        <div className="flex max-w-[52ch] flex-col gap-2 rounded-2xl bg-brand-50 px-4 py-3 text-left text-base leading-relaxed">
          <p className="flex items-start gap-2">
            <Lock className="mt-1 size-4 shrink-0 text-brand-700" />
            <span>{t.consent}</span>
          </p>
          <p className="pl-6 text-ink-soft">{t.noIdentity}</p>
          <a
            href={appConfig.privacyPolicyUrl}
            className="pl-6 font-semibold text-brand-700 underline underline-offset-2"
            {...(appConfig.privacyPolicyUrl.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {t.privacyLink}
          </a>
        </div>
        <Button size="lg" onClick={start} className="w-full sm:w-auto">
          {consented ? t.continue : t.agree}
        </Button>
      </section>
    </PageShell>
  );
}

function DeferredScreen({ state }: { state: TriageState }) {
  const { text } = useTriageText();
  const t = text.selfCheck;
  const back = () => commitTriage(sessionStore, goBack(state));
  return (
    <PageShell>
      <TriageTopBar onBack={back} />
      <section className="flex flex-col items-center gap-4 text-center">
        <h1 className="max-w-[24ch] text-balance text-[clamp(1.75rem,1.2rem+2.6vw,2.6rem)] font-bold leading-[1.12] tracking-tight">
          {t.deferredTitle}
        </h1>
        <p className="max-w-[46ch] text-pretty text-lg leading-relaxed text-ink-soft">{t.deferredText}</p>
        <ListenButton id="self-check-later" readAlong ids={["triage.selfCheck.deferredTitle", "triage.selfCheck.deferredText"]} />
      </section>
      <div className="flex flex-col gap-3 rounded-3xl border border-line bg-white p-5 shadow-soft">
        <ReminderButton kind="tomorrow" label={t.reminderTomorrow} />
        <p className="text-sm text-ink-soft">{t.reminderNote}</p>
      </div>
      <SaveProgressToggle />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={back}>
          {t.backToQuestion}
        </Button>
        <ButtonLink href="/learn" size="lg" variant="secondary">
          {t.learn}
        </ButtonLink>
      </div>
      <GuidanceFooter showSave={false} />
    </PageShell>
  );
}

function ResultReady({ state }: { state: TriageState }) {
  const { text } = useTriageText();
  return (
    <PageShell>
      <TriageTopBar onBack={() => commitTriage(sessionStore, goBack(state))} />
      <section className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-balance text-[clamp(1.75rem,1.2rem+2.6vw,2.6rem)] font-bold leading-[1.12] tracking-tight">
          {text.results.ready}
        </h1>
        <ListenButton id="result-ready" readAlong ids={RESULT_READY_SPEECH} />
        <ButtonLink href="/next-step" size="lg">
          {text.results.title}
        </ButtonLink>
      </section>
      <GuidanceFooter />
    </PageShell>
  );
}

function ActiveQuestion({ state, screen, focusOnMount }: { state: TriageState; screen: QuestionId; focusOnMount: boolean }) {
  const router = useRouter();
  const { text } = useTriageText();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const timer = useRef<number | null>(null);
  const moving = useRef(false);
  // The kind of message, not its text, so it follows a language switch.
  const [error, setError] = useState<"required" | "requiredMulti" | "requiredFollowUp" | null>(null);
  const path = buildPath(state);
  const stages = journeyStages(path);

  useEffect(() => {
    // Moving focus to the new question announces it to screen readers.
    if (focusOnMount) headingRef.current?.focus();
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, [focusOnMount]);

  const cancelTimer = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };

  const go = () => {
    cancelTimer();
    // One move per screen, however many taps or timers arrive.
    if (moving.current) return;
    if (!updateTriage(sessionStore, (current) => advance(current, screen))) {
      const questions = screenQuestions(screen, sessionStore.getState().triage?.answers ?? {});
      setError(questions.length > 1 ? "requiredFollowUp" : questionShape(screen).kind === "multi" ? "requiredMulti" : "required");
      return;
    }
    moving.current = true;
    if (sessionStore.getState().triage?.cursor === "result") router.push("/next-step");
  };

  const onAnswer = (id: QuestionId, value: string | string[] | undefined, fromArrowKey: boolean) => {
    if (moving.current) return;
    setError(null);
    cancelTimer();
    updateTriage(sessionStore, (current) => setAnswer(current, id, value));
    const after = sessionStore.getState().triage;
    // Single-choice answers move on by themselves, unless something on this screen is still needed
    // or the person is moving through the options with the arrow keys.
    if (after && questionShape(id).kind === "single" && !fromArrowKey && isScreenComplete(screen, after.answers)) {
      timer.current = window.setTimeout(go, AUTO_ADVANCE_MS);
    }
  };

  const back = () => {
    cancelTimer();
    const current = sessionStore.getState().triage;
    if (current) commitTriage(sessionStore, goBack(current));
  };

  const canSwitch = state.entry === "no-concern" && stageOf(screen) === "about";

  return (
    <PageShell>
      <TriageTopBar onBack={back} />
      <StageProgress stages={stages} current={stageOf(screen)} />
      <div key={screen} className="rise-in">
        <QuestionScreen
          screen={screen}
          answers={state.answers}
          error={error && text.nav[error]}
          headingRef={headingRef}
          onAnswer={onAnswer}
          onContinue={go}
        />
      </div>
      {canSwitch && (
        <p className="flex flex-wrap items-center justify-center gap-x-2 text-base text-ink-soft">
          {text.nav.switchToConcernText}
          <button
            type="button"
            onClick={() => {
              cancelTimer();
              commitTriage(sessionStore, switchEntry(state, "concern"));
              router.push("/concern");
            }}
            className="inline-flex min-h-11 items-center rounded-full px-3 font-semibold text-brand-700 underline underline-offset-2 hover:bg-brand-50"
          >
            {text.nav.switchToConcern}
          </button>
        </p>
      )}
      <GuidanceFooter />
    </PageShell>
  );
}

/**
 * The "I have a concern" and "I don't have a concern" journeys. Both routes share this
 * flow; the route only decides which journey a new visit starts. Answers and progress
 * live in the session store, so switching language never loses them.
 */
export function TriageFlow({ entry }: { entry: Entry }) {
  const session = useSession();
  const triage = session.triage;
  const active = triage && triage.consent && triage.entry === entry ? triage : null;
  const cursor = active ? resolveCursor(active) : "welcome";
  // Focus moves to each new question, but not on the first screen the page opens with.
  const [previous, setPrevious] = useState(cursor);
  const [focusOnMount, setFocusOnMount] = useState(false);
  if (previous !== cursor) {
    setPrevious(cursor);
    setFocusOnMount(true);
  }

  if (!active || cursor === "welcome") return <WelcomeScreen entry={entry} />;
  if (cursor === "deferred") return <DeferredScreen state={active} />;
  if (cursor === "result") return <ResultReady state={active} />;
  return <ActiveQuestion key={cursor} state={active} screen={cursor} focusOnMount={focusOnMount} />;
}
