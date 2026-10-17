"use client";

import { Check } from "@/components/ui/icons";
import { useUi } from "@/lib/hooks";
import { localize } from "@/lib/i18n/translate";
import { optionIds, toggleOption } from "@/lib/questionnaire/engine";
import type { AnswerValue, Questionnaire, QuestionnaireOption, QuestionnaireQuestion } from "@/lib/types/questionnaire";

interface QuestionStepProps {
  questionnaire: Questionnaire;
  question: QuestionnaireQuestion;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue | undefined) => void;
  /** Validation message shown under the options, if any. */
  error: string | null;
  headingRef: React.Ref<HTMLHeadingElement>;
  progress: string;
  progressNote?: string;
}

const optionClass =
  "flex min-h-16 w-full cursor-pointer items-center justify-between gap-3 rounded-3xl border bg-white px-5 py-4 text-left text-lg font-semibold leading-snug shadow-soft " +
  "transition-[border-color,background-color] duration-150 hover:border-brand-400 hover:bg-brand-50 " +
  "has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-ink";

/**
 * One question as a native fieldset: radio buttons for one answer, checkboxes for
 * several. Native inputs give keyboard and screen-reader support without extra code.
 */
export function QuestionStep({ questionnaire, question, value, onChange, error, headingRef, progress, progressNote }: QuestionStepProps) {
  const { ui, locale, fallback } = useUi();
  // Built-in answers come from the interface text, which may still be English.
  const uiLang = fallback ? "en" : locale;
  const t = ui.questionnaire;
  const prompt = localize(question.prompt, locale, questionnaire.translations);
  const help = question.help ? localize(question.help, locale, questionnaire.translations) : null;
  const multiple = question.type === "multiple";
  const errorId = `${question.id}-error`;
  const helpId = `${question.id}-help`;

  const builtIn: Record<string, string> = { yes: t.yes, no: t.no, unsure: t.unsure };
  const options: { option: QuestionnaireOption | null; id: string; label: string; lang: string }[] =
    question.type === "yes-no-unsure"
      ? optionIds(question).map((id) => ({ option: null, id, label: builtIn[id], lang: uiLang }))
      : (question.options ?? []).map((option) => {
          const label = localize(option.label, locale, questionnaire.translations);
          return { option, id: option.id, label: label.text, lang: label.lang };
        });

  const chosen = new Set(Array.isArray(value) ? value : value ? [value] : []);

  return (
    <fieldset
      className="flex flex-col gap-5"
      aria-describedby={[help ? helpId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined}
    >
      <legend className="sr-only">{prompt.text}</legend>
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-base font-semibold text-brand-700">{progress}</p>
        {progressNote && <p className="text-sm text-ink-soft">{progressNote}</p>}
        <h1
          ref={headingRef}
          tabIndex={-1}
          lang={prompt.lang}
          className="max-w-[26ch] text-balance text-[clamp(1.6rem,1.2rem+2vw,2.4rem)] font-bold leading-[1.15] tracking-tight focus:outline-none"
        >
          {prompt.text}
        </h1>
        {help && (
          <p id={helpId} lang={help.lang} className="max-w-[46ch] text-pretty text-lg leading-relaxed text-ink-soft">
            {help.text}
          </p>
        )}
        <p className="text-base text-ink-soft">
          {multiple && t.chooseAll} {!question.required && <span className="font-semibold">({t.optional})</span>}
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {options.map(({ option, id, label, lang }) => {
          const checked = chosen.has(id);
          const unsure = id === "unsure" || option?.kind === "unsure";
          return (
            <li key={id}>
              <label
                className={`${optionClass} ${
                  checked ? "border-brand-600 bg-brand-50 ring-2 ring-brand-600" : "border-line"
                } ${unsure ? "text-ink-soft" : ""}`}
              >
                <span lang={lang} className="min-w-0 flex-1">
                  {label}
                </span>
                <input
                  type={multiple ? "checkbox" : "radio"}
                  name={question.id}
                  value={id}
                  checked={checked}
                  aria-invalid={error ? true : undefined}
                  onChange={() => onChange(multiple ? toggleOption(question, value, id) : id)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`grid size-8 shrink-0 place-items-center border-2 ${multiple ? "rounded-lg" : "rounded-full"} ${
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

      {error && (
        <p id={errorId} role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-base font-semibold text-red-900">
          {error}
        </p>
      )}
    </fieldset>
  );
}
