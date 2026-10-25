import { describe, expect, it } from 'vitest';
import { createSeed } from '@/mock/seed';
import { computeSla, slaChipLabel } from './sla';
import { evaluateRequirements, amlOverall, signingSummary, SHORT_ADDRESS_PATTERN } from './eddRules';
import { canTransition } from './transitions';

const H = 3_600_000;
const base = { status: 'in_progress' as const, pausedMs: 0, pausedSince: undefined, closedAt: undefined };

describe('SLA (UC001)', () => {
  const created = Date.UTC(2026, 0, 1);
  const due = created + 100 * H;
  it('is On Track below 75 %', () => {
    expect(computeSla({ ...base, createdAt: new Date(created).toISOString(), dueAt: new Date(due).toISOString() }, created + 74 * H).status).toBe('on_track');
  });
  it('is At Risk from 75 % to below 100 %', () => {
    expect(computeSla({ ...base, createdAt: new Date(created).toISOString(), dueAt: new Date(due).toISOString() }, created + 75 * H).status).toBe('at_risk');
  });
  it('is Breached at 100 %', () => {
    const s = computeSla({ ...base, createdAt: new Date(created).toISOString(), dueAt: new Date(due).toISOString() }, created + 102 * H);
    expect(s.status).toBe('breached');
    expect(slaChipLabel(s, false)).toBe('2h overdue');
  });
  it('pauses during Need Info', () => {
    const s = computeSla(
      { ...base, status: 'need_info', createdAt: new Date(created).toISOString(), dueAt: new Date(due).toISOString(), pausedSince: new Date(created + 10 * H).toISOString() },
      created + 200 * H,
    );
    expect(s.elapsedMs).toBe(10 * H);
    expect(s.paused).toBe(true);
  });
});

describe('transitions', () => {
  it('keeps Closed final and Need Info after work started', () => {
    expect(canTransition('closed', 'in_progress')).toBe(false);
    expect(canTransition('open', 'need_info')).toBe(false);
    expect(canTransition('in_progress', 'need_info')).toBe(true);
  });
});

describe('EDD rules (UC012/UC013)', () => {
  it('describes signing methods by count', () => {
    expect(signingSummary(1)).toBe('1 signatory · single signature');
    expect(signingSummary(3)).toBe('3 signatories · all must sign');
  });
  it('validates short address format AAAA9999', () => {
    expect(SHORT_ADDRESS_PATTERN.test('RAGI2929')).toBe(true);
    expect(SHORT_ADDRESS_PATTERN.test('RAG2929')).toBe(false);
  });
  it('only verifies AML when all parties are clear or approved', () => {
    expect(amlOverall([{ id: 'a', name: 'a', kind: 'company', result: 'clear' }, { id: 'b', name: 'b', kind: 'owner', result: 'approved' }])).toBe('verified');
    expect(amlOverall([{ id: 'a', name: 'a', kind: 'company', result: 'clear' }, { id: 'b', name: 'b', kind: 'owner', result: 'pending_review' }])).toBe('pending_review');
  });
});

describe('seed data', () => {
  const seed = createSeed();
  it('creates the hero cases', () => {
    expect(seed.cases.map((c) => c.id)).toEqual(expect.arrayContaining(['CS-1847', 'CS-1845', 'CS-1843']));
    expect(new Set(seed.cases.map((c) => c.id)).size).toBe(seed.cases.length);
  });
  it('has approved closed cases that satisfy every precondition', () => {
    const approved = seed.cases.filter((c) => c.resolution === 'approved');
    expect(approved.length).toBeGreaterThan(0);
    for (const c of approved) expect(evaluateRequirements(c).map((r) => r.key)).toEqual([]);
  });
  it('leaves the "complete and close" case with signing + license only', () => {
    const c = seed.cases.find((x) => x.id === 'CS-1843')!;
    expect(evaluateRequirements(c).map((r) => r.key).sort()).toEqual(['licenses', 'signing']);
  });
});
