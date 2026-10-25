// Simulated external systems. Nothing here talks to a network.
// Each call resolves after a short delay with an outcome driven by the case's Scenario,
// so trainers can stage failures (fail), recoveries (fail_then_success) or happy paths.

import type { Address, BotSuggestion, Entity, HierarchyNode, KybInfo, Outcome, Stakeholder, WorkforceInfo, ZatcaInfo } from '@/domain/types';
import { ACTIVITY_NAMES, CITIES, STREETS } from './masterData';
import { createRng, hashString } from './rng';

export type CallResult<T> = { ok: true; data: T } | { ok: false; error: string };

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const latency = () => 700 + Math.random() * 700;

function resolveOutcome(outcome: Outcome, attempt: number): boolean {
  if (outcome === 'success') return true;
  if (outcome === 'fail') return false;
  return attempt > 1; // fail_then_success: first attempt fails, retries succeed
}

const errorCode = (prefix: string, attempt: number) => `${prefix}-${500 + ((attempt * 37) % 90)}`;

// ---- Deterministic synthetic payloads --------------------------------------

export function generateAddress(entity: Entity, shortAddress?: string): Address {
  const r = createRng(hashString(entity.id + (shortAddress ?? '')));
  const city = r.pick(CITIES);
  return {
    city: city.name,
    district: r.pick(city.districts),
    street: r.pick(STREETS),
    shortAddress: shortAddress?.toUpperCase(),
    postalCode: String(r.int(11000, 14999)),
    additionalNumber: r.digits(4),
    buildingNumber: r.digits(4),
  };
}

export function generateZatca(entity: Entity, withVat: boolean): ZatcaInfo {
  const r = createRng(hashString(entity.id + 'zatca'));
  const year = new Date().getFullYear();
  return {
    certificateNumber: `${entity.cr}-Z-${year}`,
    certificateStatus: 'Valid',
    issueDate: new Date(year, 0, 1 + r.int(0, 20)).toISOString(),
    expiryDate: new Date(year, 11, 31).toISOString(),
    vatNumber: withVat ? `3${r.digits(13)}3` : undefined,
    vatStatus: withVat ? 'Active' : undefined,
  };
}

export function generateWorkforce(entity: Entity): WorkforceInfo {
  const r = createRng(hashString(entity.id + 'gosi'));
  const saudi = r.int(8, 180);
  const nonSaudi = r.int(5, 140);
  const year = new Date().getFullYear();
  return {
    gosiStart: new Date(year, r.int(0, 5), r.int(1, 27)).toISOString(),
    gosiEnd: new Date(year + 1, r.int(0, 5), r.int(1, 27)).toISOString(),
    saudiCount: saudi,
    nonSaudiCount: nonSaudi,
    saudiWages: saudi * r.int(9000, 14000),
    nonSaudiWages: nonSaudi * r.int(3500, 6000),
    compliant: r.chance(0.7),
  };
}

export function generateKyb(entity: Entity): KybInfo {
  const r = createRng(hashString(entity.id + 'kyb'));
  const shares = r.pick([100, 1000, 2500]);
  const price = r.pick([100, 1000, 10000]);
  const count = r.int(2, 16);
  const start = r.int(0, ACTIVITY_NAMES.length - count);
  return {
    nameAr: entity.nameAr,
    nameEn: entity.nameEn,
    cr: entity.cr,
    unified: entity.unified,
    entityType: r.pick(['Commercial Company', 'Limited Liability Company', 'Closed Joint Stock Company']),
    paidUpCapital: shares * price,
    totalShares: shares,
    pricePerShare: price,
    revenue: r.int(2, 90) * 1_000_000,
    companyAge: `${r.int(2, 24)} years ${r.int(0, 11)} months`,
    inLiquidation: false,
    activities: ACTIVITY_NAMES.slice(start, start + count).map((name, i) => ({ id: `act-${i}`, name, main: i === 0 })),
  };
}

const CORP_CHILD_NAMES = [
  { name: 'شركة الخليج لتجارة المعادن', kind: 'company' as const },
  { name: 'بدر حمد الشهري', kind: 'person' as const },
  { name: 'منيرة عبدالعزيز الحربي', kind: 'person' as const },
  { name: 'شركة الصفوة القابضة', kind: 'company' as const },
  { name: 'فهد سليمان الزهراني', kind: 'person' as const },
];

/** Direct owners of a corporate owner (Owners API). Depth is capped so the tree ends. */
export function generateCorporateOwners(parentId: string, depth: number): HierarchyNode[] {
  const r = createRng(hashString(parentId));
  const n = r.int(2, 3);
  const shares = n === 2 ? [60, 40] : [50, 30, 20];
  return Array.from({ length: n }, (_, i) => {
    const pick = CORP_CHILD_NAMES[(r.int(0, 4) + i) % CORP_CHILD_NAMES.length];
    const kind = depth >= 2 ? 'person' : pick.kind;
    const name = kind === 'person' && pick.kind === 'company' ? 'سارة إبراهيم القرني' : pick.name;
    return { id: `${parentId}.${i}`, name, kind, ownership: shares[i], retrieval: 'idle' as const };
  });
}

export function generateBotSuggestions(stakeholders: Stakeholder[], documentIds: string[]): BotSuggestion[] {
  const managers = stakeholders.filter((s) => s.kind === 'person').slice(0, 2);
  if (managers.length === 0) return [];
  return documentIds.map((documentId) =>
    documentId === 'facility_contract' && managers.length > 1
      ? { documentId, method: 'jointly', signatories: managers.map((m, i) => ({ stakeholderId: m.id, label: `Manager ${i + 1}` })) }
      : { documentId, method: 'individually', signatories: [{ stakeholderId: managers[0].id }] },
  );
}

// ---- Async calls -----------------------------------------------------------

export async function callSpl(entity: Entity, outcome: Outcome, attempt: number): Promise<CallResult<Address>> {
  await wait(latency());
  return resolveOutcome(outcome, attempt)
    ? { ok: true, data: generateAddress(entity) }
    : { ok: false, error: `Unable to retrieve the National Address from SPL. Error Code: ${errorCode('SPL', attempt)}.` };
}

export async function callSplShortAddress(entity: Entity, shortAddress: string, outcome: Outcome, attempt: number): Promise<CallResult<Address>> {
  await wait(latency());
  return resolveOutcome(outcome, attempt)
    ? { ok: true, data: generateAddress(entity, shortAddress) }
    : { ok: false, error: `Unable to retrieve the National Address from SPL, Please Check Short Address. Error Code: ${errorCode('SPL', attempt)}.` };
}

export async function callZatca(entity: Entity, outcome: Outcome | 'no_vat', attempt: number): Promise<CallResult<ZatcaInfo>> {
  await wait(latency());
  if (outcome === 'no_vat') return { ok: true, data: generateZatca(entity, false) };
  return resolveOutcome(outcome, attempt) ? { ok: true, data: generateZatca(entity, true) } : { ok: false, error: 'Failed to retrieve' };
}

export async function callMasdr(entity: Entity, outcome: Outcome, attempt: number): Promise<CallResult<WorkforceInfo>> {
  await wait(latency() + 400);
  return resolveOutcome(outcome, attempt)
    ? { ok: true, data: generateWorkforce(entity) }
    : { ok: false, error: 'Workforce information could not be retrieved from Masdr.' };
}

export async function callWathq(entity: Entity, outcome: Outcome, attempt: number): Promise<CallResult<KybInfo>> {
  await wait(latency());
  return resolveOutcome(outcome, attempt) ? { ok: true, data: generateKyb(entity) } : { ok: false, error: `Wathq request failed. Error Code: ${errorCode('WTQ', attempt)}.` };
}

export async function callOwnersApi(parentId: string, depth: number): Promise<CallResult<HierarchyNode[]>> {
  await wait(latency());
  return { ok: true, data: generateCorporateOwners(parentId, depth) };
}

export async function callAmlScreening(): Promise<void> {
  await wait(latency() + 1200);
}

export async function callAoaBot(): Promise<void> {
  await wait(latency() + 900);
}
