"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CareOptions } from "@/components/clinical/care-options";
import { SafetyMessage } from "@/components/clinical/safety-message";
import { FlowNav } from "@/components/layout/flow-nav";
import { Card, PageHeading, PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "@/components/ui/icons";
import { Notice } from "@/components/ui/notice";
import { devQuestionnaire, getConcernQuestionnaire, getQuestionnaire } from "@/content/questionnaires";
import { useSession, useUi } from "@/lib/hooks";
import { localize } from "@/lib/i18n/translate";
import { isAnswered, visibleQuestions } from "@/lib/questionnaire/engine";
import { answerQuestion, canContinue, startQuestionnaire, stepAfter, stepBefore, submitAnswers } from "@/lib/session/actions";
import { sessionStore, type QuestionnaireStep } from "@/lib/session/session-store";
import type { AnswerValue, Questionnaire, QuestionnaireQuestion } from "@/lib/types/questionnaire";
import { QuestionStep } from "./question-step";

/** Honest state while the clinical lead's approved questions are not yet available. */
function QuestionnairePending() {
  const { ui } = useUi();
  const t = ui.questionnaire;
  return (
    <PageShell>
      <FlowNav back={{ href: "/" }} />
      <PageHeading title={t.pendingTitle} lead={t.pendingText} />
      <section aria-labelledby="pending-next" className="flex flex-col gap-3">
        <h2 id="pending-next" className="text-xl font-bold">
          {t.pendingNext}
        </h2>
        <CareOptions headingLevel={3} />
      </section>
      <SafetyMessage />
      {devQuestionnaire && (
        <button
          type="button"
          onClick={() => devQuestionnaire && startQuestionnaire(sessionStore, devQuestionnaire)}
          className="flex min-h-16 w-full flex-col items-start rounded-3xl border border-dashed border-sky-300 bg-sky-50 px-5 py-4 text-left text-lg font-semibold text-sky-950 hover:border-sky-400 hover:bg-sky-100"
        >
          {t.devFixture}
          <span className="text-sm font-normal">{t.devFixtureHelp}</span>
        </button>
      )}
    </PageShell>
  );
}

function answerText(
  questionnaire: Questionnaire,
  question: QuestionnaireQuestion,
  value: AnswerValue | undefined,
  labels: { yes: string; no: string; unsure: string; notAnswered: string },
  locale: "en" | "yo",
): string {
  if (!isAnswered(question, value)) return labels.notAnswered;
  const ids = Array.isArray(value) ? value : [value as string];
  if (question.type === "yes-no-unsure") return labels[ids[0] as "yes" | "no" | "unsure"];
  return ids
    .map((id) => {
      const option = question.options?.find((o) => o.id === id);
      return option ? localize(option.label, locale, questionnaire.translations).text : id;
    })
    .join(", ");
}

function ReviewStep({
  questionnaire,
  answers,
  onEdit,
  onBack,
  headingRef,
}: {
  questionnaire: Questionnaire;
  answers: Record<string, AnswerValue>;
  onEdit: (questionId: string) => void;
  onBack: () => void;
  headingRef: React.Ref<HTMLHeadingElement>;
}) {
  const router = useRouter();
  const { ui, locale } = useUi();
  const t = ui.questionnaire;
  const [missing, setMissing] = useState(false);
  const questions = visibleQuestions(questionnaire, answers);

  const submit = () => {
    const result = submitAnswers(sessionStore, questionnaire);
    if (result.ok) router.push("/next-step");
    else setMissing(true);
  };

  return (
    <>
      <div className="flex flex-col items-center gap-3 text-center">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-balance text-[clamp(1.75rem,1.2rem+2.6vw,2.75rem)] font-bold leading-[1.12] tracking-tight focus:outline-none"
        >
          {t.review}
        </h1>
        <p className="max-w-[46ch] text-pretty text-lg leading-relaxed text-ink-soft">{t.reviewText}</p>
      </div>

      <Card>
        <ul className="flex flex-col divide-y divide-line">
          {questions.map((question) => {
            const prompt = localize(question.prompt, locale, questionnaire.translations);
            const answered = isAnswered(question, answers[question.id]);
            return (
              <li key={question.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
                <span className="min-w-0 flex-1 basis-56">
                  <span lang={prompt.lang} className="block text-base text-ink-soft">
                    {prompt.text}
                  </span>
                  <span className={`block text-lg font-semibold ${answered ? "" : "text-red-800"}`}>
                    {answerText(questionnaire, question, answers[question.id], t, locale)}
                  </span>
                </span>
                <Button variant="secondary" onClick={() => onEdit(question.id)} aria-label={t.changeLabel(prompt.text)}>
                  {t.change}
                </Button>
              </li>
            );
          })}
        </ul>
      </Card>

      {missing && (
        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-base font-semibold text-red-900">
          {t.incomplete}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button variant="secondary" size="lg" onClick={onBack}>
          <ArrowLeft className="size-5" />
          {ui.common.back}
        </Button>
        <Button size="lg" onClick={submit}>
          {t.submit}
          <ArrowRight className="size-5" />
        </Button>
      </div>
    </>
  );
}

function ActiveQuestionnaire({ questionnaire }: { questionnaire: Questionnaire }) {
  const router = useRouter();
  const session = useSession();
  const { ui } = useUi();
  const t = ui.questionnaire;
  const [error, setError] = useState<string | null>(null);
  // Set when a question is opened with Change from the review step.
  const [fromReview, setFromReview] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { answers } = session;

  const visible = visibleQuestions(questionnaire, answers);
  // A step whose question no longer applies falls back to the first question.
  const saved = session.step;
  const step: QuestionnaireStep =
    saved && ("review" in saved || visible.some((q) => q.id === saved.questionId))
      ? saved
      : visible[0]
        ? { questionId: visible[0].id }
        : { review: true };
  const stepKey = "review" in step ? "review" : step.questionId;

  // Move focus to the new heading so screen readers announce each step.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [stepKey]);

  const goTo = (next: QuestionnaireStep) => {
    setError(null);
    if ("review" in next) setFromReview(false);
    sessionStore.update({ step: next });
  };

  const back = () => {
    const previous = stepBefore(questionnaire, answers, step);
    if (previous) goTo(previous);
    else router.push("/");
  };

  const notice = questionnaire.developmentFixture ? (
    <Notice tone="demo">{t.fixtureNotice}</Notice>
  ) : questionnaire.review.status !== "approved" ? (
    <Notice tone="warning">{t.draftNotice}</Notice>
  ) : null;

  if ("review" in step) {
    return (
      <PageShell>
        <FlowNav />
        {notice}
        <ReviewStep
          questionnaire={questionnaire}
          answers={answers}
          onEdit={(questionId) => {
            goTo({ questionId });
            setFromReview(true);
          }}
          onBack={back}
          headingRef={headingRef}
        />
        <SafetyMessage />
      </PageShell>
    );
  }

  const question = visible.find((q) => q.id === step.questionId)!;
  const index = visible.indexOf(question);
  // Hidden follow-ups later in the list could still appear, so the total is not final.
  const laterConditional = questionnaire.questions
    .slice(questionnaire.questions.indexOf(question) + 1)
    .some((q) => q.showIf);
  const progress = laterConditional ? t.questionOpen(index + 1) : t.questionOf(index + 1, visible.length);

  const next = () => {
    if (!canContinue(questionnaire, answers, question.id)) {
      setError(question.type === "multiple" ? t.requiredMultiple : t.required);
      return;
    }
    goTo(stepAfter(questionnaire, answers, step));
  };

  return (
    <PageShell>
      <FlowNav />
      {notice}
      <div key={question.id} className="rise-in">
        <QuestionStep
          questionnaire={questionnaire}
          question={question}
          value={answers[question.id]}
          onChange={(value) => {
            setError(null);
            answerQuestion(sessionStore, questionnaire, question.id, value);
          }}
          error={error}
          headingRef={headingRef}
          progress={progress}
          progressNote={laterConditional ? t.moreMayFollow : undefined}
        />
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button variant="secondary" size="lg" onClick={back}>
          <ArrowLeft className="size-5" />
          {ui.common.back}
        </Button>
        <Button size="lg" onClick={next}>
          {ui.common.next}
          <ArrowRight className="size-5" />
        </Button>
      </div>
      {fromReview && (
        <Button
          variant="quiet"
          onClick={() => {
            if (canContinue(questionnaire, answers, question.id)) goTo({ review: true });
            else setError(question.type === "multiple" ? t.requiredMultiple : t.required);
          }}
        >
          {t.backToReview}
        </Button>
      )}

      <SafetyMessage />
    </PageShell>
  );
}

export function ConcernFlow() {
  const session = useSession();
  const approved = getConcernQuestionnaire();
  const active = getQuestionnaire(session.questionnaireId);

  // An approved questionnaire starts straight away; answers in progress are kept.
  useEffect(() => {
    if (approved && !session.questionnaireId) startQuestionnaire(sessionStore, approved);
  }, [approved, session.questionnaireId]);

  if (active) return <ActiveQuestionnaire questionnaire={active} />;
  if (approved) return null;
  return <QuestionnairePending />;
}
