import { beforeEach, describe, expect, it } from 'vitest';
import { useClm } from '@/store/caseStore';
import { canTransition, transitionBlockReason } from './transitions';
import { computeSla } from './sla';
import { evaluateRequirements, impactedSigningDocuments } from './eddRules';
import { authoritiesFor, LICENSE_AUTHORITY_MAP } from '@/mock/masterData';
import { answerQuestion } from '@/training/assistant/engine';

const st = () => useClm.getState();
const get = (id: string) => st().cases.find((c) => c.id === id)!;

beforeEach(() => st().resetAll());

describe('On Hold (ASQ-5973)', () => {
  it('can only be entered by the migration and only leaves to In Progress', () => {
    expect(canTransition('open', 'on_hold')).toBe(false);
    expect(canTransition('in_progress', 'on_hold')).toBe(false);
    expect(canTransition('on_hold', 'in_progress')).toBe(true);
    expect(canTransition('on_hold', 'closed')).toBe(false);
    expect(canTransition('on_hold', 'need_info')).toBe(false);
    expect(transitionBlockReason('open', 'on_hold')).toMatch(/migration/);
  });
  it('pauses the SLA and resumes it without a reset', () => {
    const c = get('CS-1861');
    expect(c.status).toBe('on_hold');
    expect(computeSla(c).paused).toBe(true);
    const before = computeSla(c).elapsedMs;
    st().changeStatus('CS-1861', 'in_progress');
    const after = get('CS-1861');
    expect(after.pausedSince).toBeUndefined();
    expect(after.pausedMs).toBeGreaterThan(0);
    expect(computeSla(after).elapsedMs).toBeGreaterThanOrEqual(before);
    expect(computeSla(after).elapsedMs - before).toBeLessThan(60_000);
    expect(c.activity.some((a) => a.actorId === 'system' && a.to === 'On Hold')).toBe(true);
  });
});

describe('optional approval reason (ASQ-5954)', () => {
  it('records "-" when an approval has no reason', () => {
    st().closeCase('CS-2002', { resolution: 'approved' });
    expect(get('CS-2002').resolutionReason).toBe('-');
  });
});

describe('license master data (ASQ-5970, UC003)', () => {
  it('maps categories to authorities without duplicates', () => {
    expect(authoritiesFor('Food')).toEqual(['Saudi Food and Drug Authority (SFDA)', 'Municipalities / Amanahs', 'Ministry of Environment, Water and Agriculture']);
    for (const list of Object.values(LICENSE_AUTHORITY_MAP)) expect(new Set(list).size).toBe(list.length);
    expect(authoritiesFor('Construction')).toHaveLength(3);
  });
});

describe('Change of Circumstance', () => {
  it('blocks closing until no document lists the departed signatory', () => {
    const c = get('CS-2001');
    expect(evaluateRequirements(c).map((r) => [r.key, r.blocksAll])).toEqual([['coc', true]]);
    const left = c.coc!.leftIds[0];
    const docs = c.edd.signing.documents.map((d) => ({ ...d, signatoryIds: d.signatoryIds.filter((x) => x !== left) }));
    st().changeStatus('CS-2001', 'in_progress');
    st().saveSigning('CS-2001', c.edd.signing.defaultManagerId, docs);
    expect(impactedSigningDocuments(get('CS-2001'))).toEqual([]);
    expect(evaluateRequirements(get('CS-2001'))).toEqual([]);
  });
  it('review-only changes never block', () => {
    expect(evaluateRequirements(get('CS-2002'))).toEqual([]);
  });
});

describe('request cases', () => {
  it('need In Progress and a decision before closing', () => {
    expect(evaluateRequirements(get('CS-2031'))[0].blocksAll).toBe(true);
    st().approveAuthorization('CS-2031', ['view_wallet']);
    expect(get('CS-2031').decision).toBeUndefined(); // still Open
    st().changeStatus('CS-2031', 'in_progress');
    st().approveAuthorization('CS-2031', ['view_wallet']);
    expect(get('CS-2031').decision?.outcome).toBe('approved');
    expect(evaluateRequirements(get('CS-2031'))).toEqual([]);
  });
  it('license expiry: blocked until uploaded, then until decided', () => {
    expect(evaluateRequirements(get('CS-2021'))[0].detail).toMatch(/not uploaded/);
    st().simulateBorrowerLicenseUpload('CS-2021');
    expect(evaluateRequirements(get('CS-2021'))[0].detail).toMatch(/approved or rejected/);
    st().changeStatus('CS-2021', 'in_progress');
    st().rejectRenewedLicense('CS-2021', 'Wrong document');
    const e = st().entities.find((x) => x.id === get('CS-2021').entityId)!;
    expect(e.borrowerTasks?.find((t) => t.caseId === 'CS-2021')?.status).toBe('rejected');
    expect(evaluateRequirements(get('CS-2021'))).toEqual([]);
  });
  it('delegation: added delegator is verified and selected', () => {
    st().changeStatus('CS-2041', 'in_progress');
    st().addDelegator('CS-2041', { nid: '1098765432', dobHijri: '1411-04-12 H' });
    const list = get("CS-2041").delegation!.delegators;
    const d = list[list.length - 1];
    expect(d.verified && d.selected && !!d.name).toBe(true);
  });
  it('IBAN training data is fictional', () => {
    for (const c of st().cases.filter((x) => x.iban)) expect(c.iban!.iban).toMatch(/TEST/);
  });
});

describe('Request compliance documents (UC008)', () => {
  it('creates one task, pending rows, and never duplicates a pending document', () => {
    const entityId = get('CS-1863').entityId;
    st().requestComplianceDocuments(entityId, ['MISA License', 'CR Number'], 'CS-1863');
    st().requestComplianceDocuments(entityId, ['MISA License'], 'CS-1863');
    const e = st().entities.find((x) => x.id === entityId)!;
    expect(e.complianceRequests?.map((r) => r.docType).sort()).toEqual(['CR Number', 'MISA License']);
    const tasks = e.borrowerTasks!.filter((t) => t.kind === 'compliance_documents');
    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({ title: 'Compliance Documents Task', priority: 'High' });
    expect(Date.parse(tasks[0].dueAt!) - Date.parse(tasks[0].createdAt)).toBeGreaterThan(29 * 86_400_000);
    st().simulateComplianceUpload(entityId, e.complianceRequests![0].id);
    expect(st().entities.find((x) => x.id === entityId)!.complianceRequests![0].status).toBe('uploaded');
  });
});

describe('Ask CLM is case-type aware', () => {
  it('explains an undecided request case and an On Hold case', () => {
    const a = answerQuestion('What do I need to do?', { module: 'case-workspace', caseId: 'CS-2031' }, get('CS-2031'));
    expect(a.answer).toMatch(/Authorization Request/);
    expect(a.points?.join(' ')).toMatch(/No decision recorded/);
    expect(a.citations.map((x) => x.articleId)).toContain('authorization');
    const h = answerQuestion('What should I do next?', { module: 'case-workspace', caseId: 'CS-1861' }, get('CS-1861'));
    expect(h.answer).toMatch(/On Hold/);
  });
});
