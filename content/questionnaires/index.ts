import { questionnaireFixture } from "@/content/fixtures/questionnaire.fixture";
import { appConfig } from "@/lib/config";
import { validateQuestionnaire } from "@/lib/questionnaire/engine";
import type { Questionnaire } from "@/lib/types/questionnaire";

/**
 * The breast-concern questionnaire shown to the public.
 *
 * PENDING: the clinical lead has not yet supplied the approved questions, conditions
 * or urgency rules, so this is null and the concern screen says the questions are being
 * prepared. To install them: add a file in this folder that exports a `Questionnaire`
 * with `review.status: "approved"` (and `urgency.review.status: "approved"` for the
 * urgency rules), then set it here. A questionnaire that is not approved, or fails
 * `validateQuestionnaire`, is never shown.
 */
const approvedQuestionnaire = null as Questionnaire | null;

export function getConcernQuestionnaire(): Questionnaire | null {
  const questionnaire = approvedQuestionnaire;
  if (!questionnaire || questionnaire.review.status !== "approved") return null;
  return validateQuestionnaire(questionnaire).length === 0 ? questionnaire : null;
}

/** Interface-test questionnaire, only in development or internal review builds. */
export const devQuestionnaire: Questionnaire | null =
  appConfig.showDevFixtures && validateQuestionnaire(questionnaireFixture).length === 0 ? questionnaireFixture : null;

export function getQuestionnaire(id: string | null): Questionnaire | null {
  if (!id) return null;
  const approved = getConcernQuestionnaire();
  if (approved?.id === id) return approved;
  return devQuestionnaire?.id === id ? devQuestionnaire : null;
}
