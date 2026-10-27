import { describe, expect, it, beforeEach } from 'vitest';
import { useClm } from '@/store/caseStore';
import { evaluateRequirements } from '@/domain/eddRules';
import { createSeed } from '@/mock/seed';
import { answerQuestion } from './assistant/engine';
import { searchArticles } from './knowledge/search';
import { ARTICLES } from './knowledge/articles';
import { TOURS } from './tours/tours';
import { SCENARIOS } from './practice/scenarios';
import type { TourCtx } from './tours/types';

const seed = createSeed();
const ids = new Set(seed.cases.map((c) => c.id));

const ctxFor = (path = '/'): TourCtx => ({
  path,
  caseOf: (id) => useClm.getState().cases.find((c) => c.id === id),
  dom: () => false,
  me: 'u-trainee',
});

describe('tours', () => {
  it('reference existing cases and have unique step ids', () => {
    for (const t of TOURS) {
      for (const id of t.caseIds) expect(ids.has(id)).toBe(true);
      const stepIds = t.steps.map((s) => s.id);
      expect(new Set(stepIds).size).toBe(stepIds.length);
      for (const s of t.steps) if (s.done) expect(s.done).toBeTypeOf('function');
    }
  });
  it('cover the six required learning paths', () => {
    expect(TOURS.map((t) => t.id)).toEqual(['intro', 'first-edd', 'missing-info', 'signing', 'license', 'close-edd']);
  });
  it('do not consider action steps done on fresh data', () => {
    useClm.getState().resetAll();
    const ctx = ctxFor('/academy');
    const fresh = TOURS.flatMap((t) => t.steps.filter((s) => s.done && s.id !== 'feedback').map((s) => ({ t: t.id, s: s.id, done: s.done!(ctx) })));
    expect(fresh.filter((x) => x.done)).toEqual([]);
  });
});

describe('practice scenarios', () => {
  beforeEach(() => useClm.getState().resetAll());
  it('each own a seeded case and start incomplete', () => {
    expect(SCENARIOS).toHaveLength(8);
    for (const s of SCENARIOS) {
      expect(ids.has(s.caseId)).toBe(true);
      expect(s.tasks.every((t) => t.check(ctxFor('/academy')))).toBe(false);
    }
  });
  it('recognise a completed Need Info request and SLA pause', () => {
    const s = SCENARIOS.find((x) => x.id === 'need-info')!;
    useClm.getState().requestInfo('CS-1906', 'Please provide a bank letter confirming the IBAN holder.');
    const ctx = ctxFor('/cases/CS-1906');
    expect(s.tasks.map((t) => t.check(ctx))).toEqual([true, true, true]);
  });
  it('flags an AML rejection as a failed attempt', () => {
    const s = SCENARIOS.find((x) => x.id === 'aml-pending')!;
    const party = useClm.getState().cases.find((c) => c.id === 'CS-1905')!.edd.aml.parties.find((p) => p.result === 'pending_review')!;
    useClm.getState().decideAml('CS-1905', party.id, 'rejected');
    expect(s.fail!(ctxFor())).toMatch(/Restart/);
    expect(useClm.getState().cases.find((c) => c.id === 'CS-1905')!.status).toBe('closed');
  });
});

describe('store flows', () => {
  beforeEach(() => useClm.getState().resetAll());
  it('resetCases restores only the named cases', () => {
    const st = useClm.getState();
    st.setPriority('CS-1906', 'low');
    st.setPriority('CS-1902', 'low');
    st.resetCases(['CS-1906']);
    const cases = useClm.getState().cases;
    expect(cases.find((c) => c.id === 'CS-1906')!.priority).toBe('medium');
    expect(cases.find((c) => c.id === 'CS-1902')!.priority).toBe('low');
  });
  it('closing approved is only offered once requirements are complete; licenses save via addLicense', () => {
    const st = useClm.getState();
    const get = () => useClm.getState().cases.find((c) => c.id === 'CS-1851')!;
    expect(evaluateRequirements(get()).map((r) => r.key)).toEqual(['licenses']);
    st.updateLicense('CS-1851', get().edd.licenses[0].id, { category: 'Industrial', authority: 'Riyadh Municipality' }, 'configured');
    expect(evaluateRequirements(get())).toEqual([]);
    st.addLicense('CS-1851', { category: 'Logistics' });
    expect(evaluateRequirements(get()).map((r) => r.key)).toEqual(['licenses']); // added license has no document
  });
  it('need info pauses and in progress resumes the SLA', () => {
    const st = useClm.getState();
    st.requestInfo('CS-1902', 'Need the bank letter.');
    expect(useClm.getState().cases.find((c) => c.id === 'CS-1902')!.pausedSince).toBeDefined();
    st.changeStatus('CS-1902', 'in_progress');
    const c = useClm.getState().cases.find((x) => x.id === 'CS-1902')!;
    expect(c.pausedSince).toBeUndefined();
    expect(c.activity[0].to).toBe('In Progress');
  });
});

describe('knowledge base and Ask CLM', () => {
  it('every article cites at least one source', () => {
    for (const a of ARTICLES) expect(a.sources.length).toBeGreaterThan(0);
  });
  it('finds articles from Arabic questions', () => {
    expect(searchArticles('ما هو العنوان المختصر')[0].article.id).toBe('national-address');
    expect(searchArticles('توقيع مجتمع')[0].article.id).toBe('signing-authority');
  });
  it('explains why the current case cannot be approved', () => {
    useClm.getState().resetAll();
    const c = useClm.getState().cases.find((x) => x.id === 'CS-1843')!;
    const a = answerQuestion("Why can't I approve this case?", { module: 'case-workspace', caseId: c.id }, c);
    expect(a.answer).toContain('CS-1843');
    expect(a.points?.join(' ')).toMatch(/Signing Authority/);
    expect(a.actions.some((x) => x.route?.includes('focus=signing'))).toBe(true);
    const ar = answerQuestion('لماذا لا أستطيع اعتماد الحالة؟', { module: 'case-workspace', caseId: c.id }, c);
    expect(ar.answer).toMatch(/CS-1843/);
  });
  it('admits when an answer is not in the documentation', () => {
    const a = answerQuestion('What is the office wifi password?', { module: 'academy' });
    expect(a.status).toBe('not_found');
    expect(a.citations).toEqual([]);
  });
});
