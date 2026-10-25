// Ask CLM integration boundary.
//
// No AI service is configured in this build, so answers come from the knowledge-search engine
// (engine.ts) and the UI labels them as such. To connect a real model, deploy a server-side
// endpoint implementing the contract below (see server/ASSISTANT_INTEGRATION.md) and set
// VITE_ASSISTANT_ENDPOINT at build time. API keys must live on that server, never in this bundle.

import type { CaseRecord } from '@/domain/types';
import { evaluateRequirements } from '@/domain/eddRules';
import { ARTICLES } from '../knowledge/articles';
import { answerQuestion, type AssistantAnswer, type AssistantContext } from './engine';

export const ASSISTANT_ENDPOINT: string | undefined = import.meta.env.VITE_ASSISTANT_ENDPOINT || undefined;
export const assistantMode = ASSISTANT_ENDPOINT ? 'ai' : 'knowledge-search';

/** Request body sent to the server. Contains no client names, IDs or personal data. */
export interface AssistantRequest {
  question: string;
  locale: 'en' | 'ar';
  context: {
    module: string;
    caseId?: string;
    tab?: string;
    caseStatus?: string;
    incompleteItems?: string[];
  };
  /** Article ids the server may retrieve from; the server owns the full documents. */
  knowledgeIds: string[];
}

export async function ask(question: string, ctx: AssistantContext, c?: CaseRecord): Promise<AssistantAnswer> {
  if (!ASSISTANT_ENDPOINT) return answerQuestion(question, ctx, c);
  const body: AssistantRequest = {
    question,
    locale: /[؀-ۿ]/.test(question) ? 'ar' : 'en',
    context: {
      module: ctx.module,
      caseId: ctx.caseId,
      tab: ctx.tab,
      caseStatus: c?.status,
      incompleteItems: c ? evaluateRequirements(c).map((r) => r.label) : undefined,
    },
    knowledgeIds: ARTICLES.map((a) => a.id),
  };
  try {
    const res = await fetch(ASSISTANT_ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as AssistantAnswer;
    return { ...data, mode: 'ai' };
  } catch {
    const fallback = answerQuestion(question, ctx, c);
    return { ...fallback, answer: `The AI service is unavailable, so this answer comes from knowledge search. ${fallback.answer}` };
  }
}
