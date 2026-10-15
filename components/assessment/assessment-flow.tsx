"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ListenButton } from "@/components/audio/listen-button";
import { VoiceNote } from "@/components/assessment/voice-note";
import { SafetyMessage } from "@/components/clinical/safety-message";
import { Card, PageHeading, PageShell } from "@/components/layout/page-shell";
import { useSessionControls } from "@/components/session/session-provider";
import { Button, ButtonLink } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ArrowLeft, ArrowRight, Check, Mic } from "@/components/ui/icons";
import { Notice, ReviewBadge } from "@/components/ui/notice";
import { concerns, generalGuidance } from "@/content/en/clinical";
import { ui } from "@/content/en/ui";
import { getPathway } from "@/content/pathways";
import { getActivePath, getProgress } from "@/lib/engine/pathway-engine";
import { useSession } from "@/lib/hooks";
import { answerQuestion } from "@/lib/session/actions";
import { sessionStore } from "@/lib/session/session-store";
import { ANSWER_NOT_LISTED, type Pathway, type Question } from "@/lib/types/clinical";
import { optionButtonClass } from "./concern-picker";

function answerLabel(question: Question, answer: string | undefined): string {
  if (answer === ANSWER_NOT_LISTED) return ui.assessment.notListed;
  return question.options.find((option) => option.id === answer)?.label ?? "";
}

/** Shown after a refresh, a direct visit, or Back into a session that has ended. */
function NoSession() {
  return (
    <PageShell>
      <PageHeading title={ui.assessment.noSession.title} lead={ui.assessment.noSession.text} />
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <ButtonLink href="/concern" size="lg">
          {ui.common.checkConcern}
        </ButtonLink>
        <ButtonLink href="/" size="lg" variant="secondary">
          {ui.common.home}
        </ButtonLink>
      </div>
    </PageShell>
  );
}

/** Honest state for concerns that have no reviewed question pathway yet. */
function PathwayUnavailable({ concernLabel }: { concernLabel: string }) {
  const { requestFinish } = useSessionControls();
  return (
    <PageShell>
      <PageHeading title={ui.assessment.unavailable.title} lead={ui.assessment.unavailable.text}>
        <p className="rounded-full border border-line bg-white px-4 py-2 text-base">
          {ui.assessment.unavailable.chosen} <strong>{concernLabel}</strong>
        </p>
      </PageHeading>

      <Card className="flex flex-col items-start gap-3">
        <h2 className="text-xl font-bold">{ui.healthcare.generalGuidanceTitle}</h2>
        <p className="text-lg leading-relaxed">{generalGuidance.text}</p>
        <ReviewBadge review={generalGuidance.review} />
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <ButtonLink href="/healthcare" size="lg">
          {ui.common.findHealthcare}
        </ButtonLink>
        <ButtonLink href="/learn/changes-to-look-out-for" size="lg" variant="secondary">
          {ui.assessment.unavailable.learnChanges}
        </ButtonLink>
        <ButtonLink href="/concern" size="lg" variant="secondary">
          {ui.assessment.unavailable.chooseAnother}
        </ButtonLink>
        <Button size="lg" variant="secondary" onClick={requestFinish}>
          {ui.common.finish}
        </Button>
      </div>

      <SafetyMessage />
    </PageShell>
  );
}

function ProgressLine({ pathway, answers }: { pathway: Pathway; answers: Record<string, string> }) {
  const progress = getProgress(pathway, answers);
  if (!progress) return null;
  const { position, total } = progress;
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-base font-semibold text-brand-700">
        {total ? ui.assessment.questionOf(position, total) : ui.assessment.questionOpen(position)}
      </p>
      {total ? (
        <div className="flex gap-1.5" aria-hidden="true">
          {Array.from({ length: total }, (_, index) => (
            <span key={index} className={`h-1.5 w-8 rounded-full ${index < position ? "bg-brand-600" : "bg-brand-200"}`} />
          ))}
        </div>
      ) : (
        // No bar when the length depends on answers still to come: it would be a guess.
        <p className="text-sm text-ink-soft">{ui.assessment.moreMayFollow}</p>
      )}
    </div>
  );
}

export function AssessmentFlow() {
  const router = useRouter();
  const session = useSession();
  const { requestFinish } = useSessionControls();
  const [helpOpen, setHelpOpen] = useState(false);
  const [recording, setRecording] = useState(false);

  const concern = concerns.find((item) => item.id === session.concernId);
  const pathway = getPathway(session.pathwayId);

  if (!pathway) {
    return concern ? <PathwayUnavailable concernLabel={concern.label} /> : <NoSession />;
  }

  const { answers, editingQuestionId } = session;
  const path = getActivePath(pathway, answers);
  const editing = editingQuestionId !== null && path.answeredQuestionIds.includes(editingQuestionId);
  const questionId = editing ? editingQuestionId : path.currentQuestionId;
  const question = questionId ? pathway.questions[questionId] : null;

  const closeHelp = () => {
    setHelpOpen(false);
    setRecording(false);
  };

  const edit = (id: string | null) => sessionStore.update({ editingQuestionId: id });

  const continueAfter = () => {
    if (getActivePath(pathway, sessionStore.getState().answers).outcomeId) router.push("/next-step");
  };

  const choose = (answer: string) => {
    if (!question) return;
    closeHelp();
    answerQuestion(sessionStore, pathway, question.id, answer);
    continueAfter();
  };

  const answered = path.answeredQuestionIds;
  const answersList = answered.length > 0 && (
    <Card className="flex flex-col gap-3">
      <h2 className="text-lg font-bold">{ui.assessment.yourAnswers}</h2>
      <ul className="flex flex-col divide-y divide-line">
        {answered.map((id) => {
          const item = pathway.questions[id];
          return (
            <li key={id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5">
              <span className="min-w-0 flex-1 basis-48">
                <span className="block text-sm text-ink-soft">{item.prompt}</span>
                <span className="block text-base font-semibold">{answerLabel(item, answers[id])}</span>
              </span>
              <Button variant="quiet" onClick={() => edit(id)} aria-label={`${ui.assessment.change}: ${item.prompt}`}>
                {ui.assessment.change}
              </Button>
            </li>
          );
        })}
      </ul>
    </Card>
  );

  const pathwayNote = (
    <Notice tone={pathway.developmentFixture ? "demo" : "warning"}>
      {pathway.developmentFixture ? ui.assessment.fixturePathway : ui.assessment.demoPathway}
    </Notice>
  );

  // Every question on this branch is answered: offer the result and a chance to review.
  if (!question) {
    return (
      <PageShell>
        <PageHeading title={ui.assessment.yourAnswers} />
        {answersList}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <ButtonLink href="/concern" variant="secondary" size="lg">
            <ArrowLeft className="size-5" />
            {ui.assessment.unavailable.chooseAnother}
          </ButtonLink>
          <ButtonLink href="/next-step" size="lg">
            {ui.nextStep.title}
            <ArrowRight className="size-5" />
          </ButtonLink>
        </div>
        {pathway.review.status !== "approved" && pathwayNote}
      </PageShell>
    );
  }

  const index = answered.indexOf(question.id);
  const previousId = editing ? answered[index - 1] : answered[answered.length - 1];
  const unsureOption = question.options.find((option) => option.kind === "unsure");
  const listenText = `${question.prompt} ${question.help ?? ""} ${question.options.map((o) => o.label).join(". ")}.`;

  return (
    <PageShell>
      {!editing && <ProgressLine pathway={pathway} answers={answers} />}

      {/* Keyed so each question animates in and focus/scroll state does not carry over. */}
      <div key={question.id} className="rise-in flex flex-col gap-6">
        <PageHeading title={question.prompt} lead={question.help}>
          <ListenButton id={`question-${question.id}`} text={listenText} audioKey={question.audioKey} />
        </PageHeading>

        {editing && <Notice>{ui.assessment.changing}</Notice>}

        <ul className="flex flex-col gap-3">
          {question.options.map((option) => {
            const selected = editing && answers[question.id] === option.id;
            return (
              <li key={option.id}>
                <button
                  type="button"
                  aria-pressed={editing ? selected : undefined}
                  onClick={() => choose(option.id)}
                  className={`${optionButtonClass} ${selected ? "border-brand-600 bg-brand-50 ring-2 ring-brand-600" : ""} ${
                    option.kind === "unsure" ? "text-ink-soft" : ""
                  }`}
                >
                  {option.label}
                  {selected ? (
                    <Check className="size-6 shrink-0 text-brand-600" />
                  ) : (
                    <ArrowRight className="size-5 shrink-0 text-brand-600" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {previousId ? (
          <Button variant="secondary" onClick={() => edit(previousId)}>
            <ArrowLeft className="size-5" />
            {ui.common.back}
          </Button>
        ) : (
          <ButtonLink href="/concern" variant="secondary">
            <ArrowLeft className="size-5" />
            {ui.common.back}
          </ButtonLink>
        )}
        <Button variant="quiet" onClick={() => setHelpOpen(true)}>
          {ui.assessment.cantFind}
        </Button>
        <Button variant="quiet" onClick={requestFinish}>
          {ui.assessment.exit}
        </Button>
      </div>

      {answersList}
      {pathway.review.status !== "approved" && pathwayNote}

      <Dialog open={helpOpen} onClose={closeHelp} title={recording ? ui.voice.title : ui.cantFind.title}>
        {recording ? (
          <VoiceNote onDone={() => setRecording(false)} />
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-lg text-ink-soft">{ui.cantFind.text}</p>
            {unsureOption && (
              <Button size="lg" onClick={() => choose(unsureOption.id)}>
                {ui.cantFind.unsure}
              </Button>
            )}
            <Button size="lg" variant="secondary" onClick={() => choose(ANSWER_NOT_LISTED)}>
              {ui.cantFind.notListed}
            </Button>
            <p className="-mt-1 text-center text-sm text-ink-soft">{ui.cantFind.notListedHelp}</p>
            <Button size="lg" variant="secondary" onClick={() => setRecording(true)}>
              <Mic className="size-5" />
              <span className="flex flex-col">
                {ui.cantFind.record}
                <span className="text-sm font-normal text-ink-soft">{ui.cantFind.recordHelp}</span>
              </span>
            </Button>
            <ButtonLink href="/healthcare" size="lg" variant="secondary" onClick={closeHelp}>
              {ui.cantFind.talk}
            </ButtonLink>
          </div>
        )}
      </Dialog>
    </PageShell>
  );
}
