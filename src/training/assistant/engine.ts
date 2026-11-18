// Ask CLM — knowledge-search mode.
// This is NOT a language model. It answers from two grounded sources only:
//   1. the current simulated case (requirements computed by the same domain rules CLM uses), and
//   2. the CLM knowledge base articles (each citing the BRD or observed screens).
// When neither matches, it says so. A real model can be connected through ./client.ts.

import type { CaseRecord } from '@/domain/types';
import { evaluateRequirements, isDecisionCase } from '@/domain/eddRules';
import { CASE_TYPE_META } from '@/mock/masterData';
import { articleById } from '../knowledge/articles';
import { isArabic, searchArticles } from '../knowledge/search';
import { TOUR_TITLES } from '../tours/tourTitles';

export interface AssistantAction {
  label: string;
  route?: string;
  tourId?: string;
  articleId?: string;
}

export interface Citation {
  articleId: string;
  title: string;
  sources: string[];
}

export interface AssistantAnswer {
  answer: string;
  /** Bullet lines rendered under the answer. */
  points?: string[];
  status: 'answered' | 'not_found' | 'unverified';
  citations: Citation[];
  actions: AssistantAction[];
  mode: 'knowledge-search' | 'ai';
}

export interface AssistantContext {
  module: string;
  caseId?: string;
  tab?: string;
}

const cite = (id: string): Citation => {
  const a = articleById(id)!;
  return { articleId: a.id, title: a.title, sources: a.sources.map((s) => `${s.doc} — ${s.section}`) };
};

/** Knowledge-base article that explains each case type. */
const TYPE_ARTICLE: Record<CaseRecord['type'], string> = {
  edd: 'edd-overview',
  coc: 'coc',
  zatca_expiry: 'zatca-expiry',
  license_expiry: 'license-expiry',
  authorization: 'authorization',
  delegation: 'delegation',
  iban: 'iban',
};
const TYPE_AR: Record<CaseRecord['type'], string> = {
  edd: 'عناية واجبة',
  coc: 'تغيّر ظروف',
  zatca_expiry: 'انتهاء شهادة ZATCA',
  license_expiry: 'انتهاء رخصة نشاط',
  authorization: 'طلب صلاحيات',
  delegation: 'طلب تفويض',
  iban: 'مراجعة آيبان',
};

const APPROVAL_EN = /(why|can'?t|cannot|unable|not able|blocked|prevent|stop).*(approv|clos)|(approv|clos).*(blocked|disabled|not allowed|fail|error)/;
const APPROVAL_AR = /(لماذا|لا استطيع|لا أستطيع|لا يمكن|ممنوع|ما المانع|مانع).*(اعتماد|اعتمد|اغلاق|إغلاق|اغلق|أغلق|قبول)/;
const MISSING_EN = /(what('?s| is)? (missing|left|remaining|incomplete)|next step|what should i do|what do i need|to do)/;
const MISSING_AR = /(ماذا ينقص|ما الناقص|المتبقي|الخطوه التاليه|الخطوة التالية|ماذا افعل|ماذا أفعل|غير مكتمل|ما المطلوب)/;

export function answerQuestion(question: string, _ctx: AssistantContext, c?: CaseRecord): AssistantAnswer {
  const q = question.toLowerCase();
  const ar = isArabic(question);
  const wantsApproval = APPROVAL_EN.test(q) || APPROVAL_AR.test(question);
  const wantsMissing = MISSING_EN.test(q) || MISSING_AR.test(question);

  // 1. Case-aware answers — only when the trainee is looking at a case.
  if ((wantsApproval || wantsMissing) && c) {
    const actions: AssistantAction[] = [];
    if (c.status === 'closed') {
      return {
        answer: ar
          ? `الحالة ${c.id} مغلقة بالفعل بقرار ${c.resolution === 'approved' ? 'القبول' : 'الرفض'}، وهي الآن للقراءة فقط.`
          : `${c.id} is already closed as ${c.resolution === 'approved' ? 'Approved' : 'Rejected'}, so it is read-only. Open the Resolution tab to see the reason.`,
        status: 'answered',
        citations: [cite('resolution')],
        actions: [{ label: 'Open Resolution tab', route: `/cases/${c.id}?tab=resolution` }],
        mode: 'knowledge-search',
      };
    }
    const typeLabel = CASE_TYPE_META[c.type].label;
    const typeCite = cite(TYPE_ARTICLE[c.type]);
    if (c.status === 'on_hold') {
      return {
        answer: ar
          ? `الحالة ${c.id} (${TYPE_AR[c.type]}) في وضع On Hold بسبب ترحيل النظام، والـ SLA متوقف. انقلها إلى In Progress لتبدأ العمل عليها؛ هذا الانتقال الوحيد المسموح.`
          : `${c.id} is On Hold — the system migration paused it and its SLA. Move it to In Progress to work on it; that is the only transition allowed from On Hold, and the SLA resumes from where it stopped.`,
        status: 'answered',
        citations: [cite('on-hold')],
        actions: [],
        mode: 'knowledge-search',
      };
    }
    const reqs = evaluateRequirements(c);
    if (reqs.length === 0) {
      const decided = isDecisionCase(c) && c.decision;
      return {
        answer: decided
          ? ar
            ? `تم تسجيل القرار (${c.decision!.outcome === 'approved' ? 'Approved' : 'Rejected'}) على الحالة ${c.id}. أغلقها الآن: النتيجة تتبع القرار تلقائياً.`
            : `A decision (${c.decision!.outcome === 'approved' ? 'Approved' : 'Rejected'}) is recorded on ${c.id}. Close the case now — the resolution is set from that decision${c.decision!.outcome === 'rejected' ? ' and the rejection reason is carried over' : ''}.`
          : ar
            ? `جميع المتطلبات الإلزامية في الحالة ${c.id} مكتملة. يمكنك إغلاقها بقرار Approved، وسبب الاعتماد اختياري.`
            : `Every mandatory requirement on ${c.id} (${typeLabel}) is complete. You can close it as Approved — choose Closed in the status menu and select Approved. The approval reason is optional; if empty, "-" is recorded.`,
        status: 'answered',
        citations: [cite('closing'), typeCite],
        actions: [],
        mode: 'knowledge-search',
      };
    }
    for (const r of reqs.slice(0, 4)) actions.push({ label: `Go to ${r.label}`, route: `/cases/${c.id}?tab=${r.tab}&focus=${r.anchor}` });
    const hard = reqs.some((r) => r.blocksAll);
    const intro =
      c.status === 'open'
        ? ar
          ? `الحالة ${c.id} (${TYPE_AR[c.type]}) ما زالت Open. انقلها إلى In Progress أولاً${c.type === 'edd' ? ' لتشغيل الفحوصات الآلية' : ' — القرارات وإعادة المحاولة تحتاج ذلك'}. المتطلبات غير المكتملة حالياً (${reqs.length}):`
          : `${c.id} (${typeLabel}) is still Open — move it to In Progress first${c.type === 'edd' ? ' so the EDD jobs (SPL, ZATCA, AML, AOA) run' : '; decisions and retries only work while In Progress'}. ${reqs.length} mandatory item${reqs.length === 1 ? ' is' : 's are'} incomplete right now:`
        : ar
          ? `لا يمكن ${hard ? 'إغلاق' : 'اعتماد'} الحالة ${c.id} (${TYPE_AR[c.type]}) لأن ${reqs.length} من المتطلبات الإلزامية غير مكتملة:`
          : hard
            ? `${c.id} (${typeLabel}) can't be closed with any resolution yet:`
            : `${c.id} (${typeLabel}) can't be approved yet because ${reqs.length} mandatory requirement${reqs.length === 1 ? ' is' : 's are'} incomplete. You can still close it as Rejected with a reason:`;
    return {
      answer: intro,
      points: reqs.map((r) => `${r.label} — ${r.detail}`),
      status: 'answered',
      citations: [cite('closing'), typeCite],
      actions,
      mode: 'knowledge-search',
    };
  }

  // 2. Knowledge base search.
  const hits = searchArticles(question, 3);
  const best = hits[0];
  if (best && best.score >= 4) {
    const a = best.article;
    const bullets = a.body.filter((l) => l.startsWith('- ')).map((l) => l.slice(2)).slice(0, 5);
    const actions: AssistantAction[] = [{ label: `Read “${a.title}”`, articleId: a.id }];
    for (const t of a.relatedTours ?? []) if (TOUR_TITLES[t]) actions.push({ label: `Start tour: ${TOUR_TITLES[t]}`, tourId: t });
    const extra = wantsApproval && !c ? (ar ? ' افتح الحالة لأعرض لك المتطلبات الناقصة فيها تحديداً.' : ' Open the case and ask again to see exactly which items are missing on it.') : '';
    return {
      answer: (ar ? a.summaryAr : a.summary) + extra,
      points: ar ? undefined : bullets,
      status: a.status === 'open' ? 'unverified' : 'answered',
      citations: [a, ...hits.slice(1).filter((h) => h.score >= best.score * 0.6).map((h) => h.article)].slice(0, 2).map((x) => cite(x.id)),
      actions,
      mode: 'knowledge-search',
    };
  }

  return {
    answer: ar
      ? 'لم أجد إجابة لهذا السؤال في وثائق CLM المعتمدة المتوفرة في الأكاديمية. يرجى التواصل مع قائد فريق العمليات أو فريق المنتج.'
      : "I couldn't find this in the approved CLM documentation loaded into CLM Academy, so I won't guess. Try different words, browse the Knowledge Base, or ask the Operations lead or Product team.",
    status: 'not_found',
    citations: [],
    actions: [{ label: 'Browse the Knowledge Base', route: '/academy/kb' }],
    mode: 'knowledge-search',
  };
}

export function suggestedQuestions(ctx: AssistantContext, c?: CaseRecord): string[] {
  if (c && c.status === 'on_hold') return [`What should I do with ${c.id}?`, 'What does On Hold mean?', 'ما معنى On Hold؟'];
  if (c && c.status !== 'closed' && c.type !== 'edd') {
    const typeQ: Record<string, string> = {
      coc: 'What does Update configuration mean?',
      zatca_expiry: 'What if ZATCA retrieval fails?',
      license_expiry: 'What does the borrower see?',
      authorization: 'How do I approve an authorization?',
      delegation: 'How do I add a delegator?',
      iban: 'When is an IBAN review created?',
    };
    return [`What do I need to do on ${c.id}?`, typeQ[c.type], 'Is the approval reason mandatory?', 'ماذا ينقص لإغلاق الحالة؟'];
  }
  if (c && c.status !== 'closed') return [`Why can't I approve ${c.id}?`, 'What does Need Info do?', 'What does joint signing mean?', 'لماذا لا أستطيع اعتماد الحالة؟'];
  if (c) return ['What happens after I close a case?', 'What is in the activity log?'];
  if (ctx.module === 'case-queue') return ['How is SLA status calculated?', 'What are the case statuses?', 'How do cases enter CLM?'];
  return ['What is CLM?', 'What checks does an EDD case need?', 'ما هو العنوان المختصر؟'];
}

