"use client";

import { useRef, type ReactNode, type Ref } from "react";
import { ListenButton } from "@/components/audio/listen-button";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "@/components/ui/icons";
import { useTriageText } from "@/lib/hooks";
import { screenQuestions } from "@/lib/triage/flow";
import { questionShape, toggleMulti, type MultiQuestionId, type QuestionId, type Stage, type TriageAnswers } from "@/lib/triage/questions";
import { SelfCheckGuideButton } from "./care-actions";
import { BreastDiagram, FLUID_SWATCHES, LyingDownIllustration, MirrorIllustration, OpeningsIllustration, Swatch } from "./illustrations";

const optionClass =
  "flex min-h-16 w-full cursor-pointer items-center justify-between gap-3 rounded-3xl border bg-white px-5 py-4 text-left text-lg font-semibold leading-snug shadow-soft " +
  "transition-[border-color,background-color,box-shadow] duration-150 hover:border-brand-400 hover:bg-brand-50 " +
  "has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-ink";

/** Which stages exist on this journey, the current one marked. Not a count of questions, which depends on answers. */
export function StageProgress({ stages, current }: { stages: Stage[]; current: Stage }) {
  const { text } = useTriageText();
  if (stages.length < 2) {
    return <p className="text-center text-base font-semibold text-brand-700">{text.stages[current]}</p>;
  }
  const index = stages.indexOf(current);
  return (
    <nav aria-label={text.stagesLabel}>
      <ol className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {stages.map((stage, position) => {
          const done = position < index;
          const active = position === index;
          return (
            <li key={stage} aria-current={active ? "step" : undefined} className="flex min-w-0 flex-col gap-1.5">
              <span
                aria-hidden="true"
                className={`h-1.5 rounded-full ${done || active ? "bg-brand-600" : "bg-brand-100"} ${active ? "opacity-100" : done ? "opacity-60" : ""}`}
              />
              <span
                className={`flex items-center gap-1 text-xs font-semibold leading-tight sm:text-sm ${active ? "text-brand-800" : "text-ink-soft"}`}
              >
                {done && <Check className="size-3.5 shrink-0" />}
                <span className="min-w-0">{text.stages[stage]}</span>
                <span className="sr-only">({done ? text.stageDone : active ? text.stageCurrent : ""})</span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Illustration({ screen, answers, onAnswer }: { screen: QuestionId; answers: TriageAnswers; onAnswer: (value: string) => void }) {
  const { text } = useTriageText();
  switch (screen) {
    case "N2":
      return (
        <div className="flex flex-col items-center gap-3">
          <MirrorIllustration />
          <SelfCheckGuideButton label={text.selfCheck.guideButton} />
        </div>
      );
    case "N3":
      return <LyingDownIllustration />;
    case "B3":
      return <OpeningsIllustration />;
    case "A2R":
    case "A2L":
      return <BreastDiagram side={screen === "A2R" ? "right" : "left"} value={answers[screen]} onSelect={onAnswer} />;
    default:
      return null;
  }
}

interface QuestionFieldProps {
  id: QuestionId;
  value: string | string[] | undefined;
  primary: boolean;
  invalid: boolean;
  onAnswer: (id: QuestionId, value: string | string[] | undefined, fromArrowKey: boolean) => void;
  headingRef?: Ref<HTMLHeadingElement>;
  helper?: ReactNode;
  listen?: ReactNode;
}

/**
 * One question as a native fieldset: radio buttons for one answer, checkboxes for
 * several. Native inputs give keyboard and screen-reader support without extra code.
 */
function QuestionField({ id, value, primary, invalid, onAnswer, headingRef, helper, listen }: QuestionFieldProps) {
  const { text, lang } = useTriageText();
  const content = text.questions[id];
  const shape = questionShape(id);
  const multi = shape.kind === "multi";
  const exclusive: readonly string[] = shape.exclusive ?? [];
  const chosen = new Set(Array.isArray(value) ? value : value ? [value] : []);
  const lastKey = useRef<string | null>(null);
  const titleId = `${id}-title`;
  const helpId = `${id}-help`;

  const Title = primary ? "h1" : "h2";
  return (
    <fieldset
      className="flex flex-col gap-4"
      aria-labelledby={titleId}
      aria-describedby={content.helper || helper ? helpId : undefined}
      onKeyDown={(event) => {
        lastKey.current = event.key;
      }}
      onPointerDown={() => {
        lastKey.current = null;
      }}
    >
      <div className={`flex flex-col gap-2 ${primary ? "items-center text-center" : ""}`}>
        <Title
          id={titleId}
          ref={headingRef}
          tabIndex={primary ? -1 : undefined}
          lang={lang}
          className={
            primary
              ? "max-w-[26ch] text-balance text-[clamp(1.6rem,1.2rem+2vw,2.4rem)] font-bold leading-[1.15] tracking-tight focus:outline-none"
              : "text-xl font-bold leading-snug"
          }
        >
          {content.prompt}
        </Title>
        {(content.helper || helper) && (
          <div id={helpId} className={`flex flex-col gap-2 text-pretty text-lg leading-relaxed text-ink-soft ${primary ? "max-w-[46ch]" : ""}`}>
            {content.helper && <p lang={lang}>{content.helper}</p>}
            {helper}
          </div>
        )}
        <p className="text-base text-ink-soft">
          {multi ? text.nav.chooseAll : text.nav.chooseOne}
          {shape.optional && <span className="font-semibold"> ({text.nav.optional})</span>}
        </p>
        {listen}
      </div>

      <ul className="grid gap-3">
        {shape.options.map((option) => {
          const checked = chosen.has(option);
          const label = (content.options as Record<string, string>)[option];
          const quiet = option === "unsure" || option === "cantTell" || option === "unknown" || option === "dontRemember";
          return (
            <li key={option}>
              <label
                className={`${optionClass} ${checked ? "border-brand-600 bg-brand-50 ring-2 ring-brand-600" : "border-line"} ${
                  quiet ? "text-ink-soft" : ""
                } ${exclusive.includes(option) ? "mt-1" : ""}`}
              >
                {id === "B4" && <Swatch colours={FLUID_SWATCHES[option]} />}
                <span lang={lang} className="min-w-0 flex-1">
                  {label}
                </span>
                <input
                  type={multi ? "checkbox" : "radio"}
                  name={id}
                  value={option}
                  checked={checked}
                  aria-invalid={invalid ? true : undefined}
                  onChange={() => {
                    const fromArrow = lastKey.current?.startsWith("Arrow") ?? false;
                    lastKey.current = null;
                    onAnswer(
                      id,
                      multi ? toggleMulti(id as MultiQuestionId, value as string[] | undefined, option) : option,
                      fromArrow,
                    );
                  }}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`grid size-8 shrink-0 place-items-center border-2 ${multi ? "rounded-lg" : "rounded-full"} ${
                    checked ? "border-brand-600 bg-brand-600 text-white" : "border-brand-300 bg-white"
                  }`}
                >
                  {checked && <Check className="size-5" />}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

/** Content ids read by Listen for one question: prompt, helper, then each answer. */
export function questionSpeech(id: QuestionId): string[] {
  const shape = questionShape(id);
  const ids = [`triage.questions.${id}.prompt`, `triage.questions.${id}.helper`];
  return [...ids, ...shape.options.map((option) => `triage.questions.${id}.options.${option}`)];
}

export interface QuestionScreenProps {
  screen: QuestionId;
  answers: TriageAnswers;
  error: string | null;
  headingRef: Ref<HTMLHeadingElement>;
  onAnswer: (id: QuestionId, value: string | string[] | undefined, fromArrowKey: boolean) => void;
  onContinue: () => void;
}

export function QuestionScreen({ screen, answers, error, headingRef, onAnswer, onContinue }: QuestionScreenProps) {
  const { text } = useTriageText();
  const [primary, ...followUps] = screenQuestions(screen, answers);
  const values = answers as Record<string, string | string[] | undefined>;
  // A knock can explain soreness; said only when the person reported a recent one.
  const injuryHelper = screen === "C1" && answers.R5 === "recent";
  const extraHelper = injuryHelper ? <p>{text.painInjuryHelper}</p> : undefined;
  const speech = [primary, ...followUps]
    .flatMap((id) => {
      const ids = questionSpeech(id);
      return id === "C1" && injuryHelper ? [...ids.slice(0, 2), "triage.painInjuryHelper", ...ids.slice(2)] : ids;
    })
    .filter((id) => !id.endsWith(".helper") || Boolean((text.questions as Record<string, { helper?: string }>)[id.split(".")[2]].helper));

  return (
    <div className="flex flex-col gap-6">
      <QuestionField
        id={primary}
        value={values[primary]}
        primary
        invalid={Boolean(error)}
        onAnswer={onAnswer}
        headingRef={headingRef}
        helper={extraHelper}
        listen={<ListenButton key={screen} id={`question-${screen}`} ids={speech} />}
      />
      <Illustration screen={screen} answers={answers} onAnswer={(value) => onAnswer(screen, value, false)} />
      {followUps.map((id) => (
        <div key={id} className="rise-in rounded-3xl border border-line bg-white/60 p-4 sm:p-5">
          <QuestionField id={id} value={values[id]} primary={false} invalid={Boolean(error)} onAnswer={onAnswer} />
        </div>
      ))}

      {error && (
        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-base font-semibold text-red-900">
          {error}
        </p>
      )}

      <Button size="lg" onClick={onContinue} className="w-full sm:ml-auto sm:w-auto">
        {text.nav.continue}
        <ArrowRight className="size-5" />
      </Button>
    </div>
  );
}
