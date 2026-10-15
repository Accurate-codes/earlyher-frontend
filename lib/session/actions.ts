import { getRecommendation } from "@/content/en/clinical";
import { appConfig } from "@/lib/config";
import { applyAnswer, getActivePath } from "@/lib/engine/pathway-engine";
import type { ExplanationService } from "@/lib/services/ai-explanation";
import type { ConcernId, Pathway } from "@/lib/types/clinical";
import type { ExplanationState, SessionStore } from "./session-store";

/** Session changes shared by the screens. Kept free of React so they can be tested directly. */

export function chooseConcern(store: SessionStore, concernId: ConcernId | null, pathwayId: string | null) {
  store.update({
    concernId,
    pathwayId,
    answers: {},
    editingQuestionId: null,
    explanation: { status: "idle" },
  });
}

/**
 * Stores an answer, drops answers from branches that no longer apply, and clears any
 * explanation prepared for the earlier answers.
 */
export function answerQuestion(store: SessionStore, pathway: Pathway, questionId: string, answer: string) {
  const answers = applyAnswer(pathway, store.getState().answers, questionId, answer);
  store.update({ answers, editingQuestionId: null, explanation: { status: "idle" } });
}

/** The recommendation the pathway has reached, or null while questions remain. */
export function getReachedRecommendation(pathway: Pathway | null, answers: Record<string, string>) {
  if (!pathway) return null;
  const { outcomeId } = getActivePath(pathway, answers);
  const outcome = outcomeId ? pathway.outcomes[outcomeId] : undefined;
  return getRecommendation(outcome?.recommendationId);
}

/**
 * Asks for the optional AI explanation. Whatever happens, the recommendation is
 * untouched: a failure only sets a status the screen uses to show the fallback, and
 * an answer that arrives after the session ended is discarded.
 */
export async function loadExplanation(
  store: SessionStore,
  service: ExplanationService,
  pathway: Pathway,
  recommendationId: string,
): Promise<void> {
  if (store.getState().explanation.status !== "idle") return;

  const epoch = store.getState().epoch;
  const task = store.startTask();
  // Identity of this object marks the request, so a reply to a superseded request is ignored.
  const pending: ExplanationState = { status: "loading" };
  store.update({ explanation: pending });

  const result = await service
    .explain(
      {
        recommendationId,
        pathwayId: pathway.id,
        pathwayVersion: pathway.version,
        questionBankVersion: pathway.questionBankVersion,
        locale: appConfig.defaultLocale,
      },
      task.signal,
    )
    .catch(() => ({ ok: false as const, error: "server" as const }));
  task.done();

  if (!task.isCurrent() || store.getState().explanation !== pending) return;

  if (result.ok) {
    store.updateIfCurrent(epoch, {
      explanation: { status: "ready", text: result.data.explanation, simulated: result.simulated },
    });
    return;
  }
  if (result.error === "aborted") return;
  const reason =
    result.error === "offline" ? "offline" : result.error === "timeout" ? "timeout" : result.error === "invalid-response" ? "invalid" : "error";
  store.updateIfCurrent(epoch, { explanation: { status: "unavailable", reason } });
}
