// Synthetic data for the Phase II case types. Every name, ID, phone, IBAN and certificate number is invented.

import type { BorrowerTask, CaseRecord, Entity, FileRef, Requester, ZatcaAttempt } from '@/domain/types';
import { authoritiesFor } from './masterData';
import type { Rng } from './rng';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const iso = (ms: number) => new Date(ms).toISOString();
const ymd = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export type LifecycleVariant =
  | { type: 'coc'; scenario: 'review' | 'ownership' | 'signing' }
  | { type: 'zatca_expiry'; script: ZatcaAttempt['result'][] }
  | { type: 'license_expiry'; stage: 'not_uploaded' | 'uploaded' | 'approved' }
  | { type: 'authorization'; stage: 'pending' | 'approved' }
  | { type: 'delegation'; stage: 'pending' }
  | { type: 'iban'; stage: 'pending' | 'rejected' };

const REQUESTERS: Omit<Requester, 'nid' | 'phone'>[] = [
  { name: 'بدر سامي الحربي', dobHijri: '1408-06-12 H' },
  { name: 'Lina Waleed Al-Saeed', dobHijri: '1412-02-03 H' },
  { name: 'فهد ماجد العمري', dobHijri: '1405-11-21 H' },
  { name: 'Sara Nabil Al-Qurashi', dobHijri: '1414-09-08 H' },
];
const YAKEEN_NAMES = ['عبدالله ناصر الفيفي', 'Huda Kamal Al-Rashed', 'سعود فيصل البقمي', 'Mona Tariq Al-Harthi'];
export const yakeenNameFor = (nid: string) => YAKEEN_NAMES[Number(nid.slice(-2)) % YAKEEN_NAMES.length];

const BANKS = ['Al Waha Bank (fictional)', 'Najd National Bank (fictional)', 'Red Sea Commercial Bank (fictional)'];

function pdf(name: string, at: number, r: Rng): FileRef {
  return { id: `f-${r.digits(8)}`, name, sizeKb: r.int(40, 700), uploadedAt: iso(at), mime: 'application/pdf' };
}

function requester(r: Rng, i: number): Requester {
  return { ...REQUESTERS[i % REQUESTERS.length], nid: `1${r.digits(9)}`, phone: `+966 5${r.digits(1)} ${r.digits(3)} ${r.digits(4)}` };
}

/** Adds the type-specific data, trigger and borrower tasks to a freshly built case. Mutates `c` and `entity`. */
export function applyLifecycle(c: CaseRecord, entity: Entity, v: LifecycleVariant, r: Rng, createdAt: number, index: number) {
  c.type = v.type;
  c.jobsTriggered = true;
  const me = c.assigneeId ?? 'u-faisal';
  switch (v.type) {
    case 'coc': {
      const people = c.edd.stakeholders;
      const [keep, leaver] = [people[0], people[1]];
      const nm = (p: (typeof people)[number]) => p.nameAr ?? p.nameEn ?? '';
      c.trigger = { label: 'Wathq data changed', initiatedBy: 'System', at: iso(createdAt) };
      const ownershipChanges = [
        { id: `${c.id}-oc1`, name: nm(leaver), ref: `${leaver.idNumber} · Individual`, kind: 'Individual' as const, previous: `${leaver.ownership ?? 30}% · Owner`, next: '-', changeType: 'Owner removed' as const, at: iso(createdAt - 6 * HOUR) },
        { id: `${c.id}-oc2`, name: nm(keep), ref: `${keep.idNumber} · Individual`, kind: 'Individual' as const, previous: `${keep.ownership ?? 70}%`, next: '100%', changeType: '% changed' as const, at: iso(createdAt - 6 * HOUR) },
      ];
      if (v.scenario === 'review') {
        c.coc = {
          scenario: 'review',
          leftIds: [],
          ownershipChanges: [],
          changes: [
            { id: `${c.id}-ch1`, field: 'Company name (English)', previous: entity.nameEn ?? '-', next: `${entity.nameEn ?? 'Company'} Holding`, action: 'review' },
            { id: `${c.id}-ch2`, field: 'Paid-up capital', previous: '500,000 SAR', next: '750,000 SAR', action: 'review' },
          ],
        };
      } else if (v.scenario === 'ownership') {
        c.coc = {
          scenario: 'ownership',
          leftIds: [],
          ownershipChanges: [
            { ...ownershipChanges[1], previous: `${keep.ownership ?? 70}%`, next: '60%' },
            { id: `${c.id}-oc3`, name: nm(leaver), ref: `${leaver.idNumber} · Individual`, kind: 'Individual', previous: `${leaver.ownership ?? 30}%`, next: '40%', changeType: '% changed', at: iso(createdAt - 6 * HOUR) },
          ],
          changes: [{ id: `${c.id}-ch1`, field: 'Ownership %', previous: `${keep.ownership ?? 70}% / ${leaver.ownership ?? 30}%`, next: '60% / 40%', action: 'ownership' }],
        };
        if (keep.ownership) keep.ownership = 60;
        if (leaver.ownership) leaver.ownership = 40;
      } else {
        // Scenario C: a signatory has left the company. Documents that list them must be updated.
        leaver.active = false;
        c.coc = {
          scenario: 'signing',
          leftIds: [leaver.id],
          ownershipChanges,
          changes: [
            { id: `${c.id}-ch1`, field: 'Owners & managers', previous: `${nm(keep)}, ${nm(leaver)}`, next: nm(keep), action: 'ownership' },
            { id: `${c.id}-ch2`, field: 'Authorized signatory', previous: nm(leaver), next: 'Left the company', action: 'configuration' },
          ],
        };
        const affected = ['facility_contract', 'promissory_note', 'assignment_of_proceeds'];
        for (const d of c.edd.signing.documents) {
          if (d.groupId) continue;
          d.signatoryIds = affected.includes(d.id) ? [keep.id, leaver.id] : [keep.id];
        }
        c.edd.signing.defaultManagerId = keep.id;
        c.edd.signing.method = 'manual';
        c.edd.owners.data = (c.edd.owners.data ?? []).filter((o) => o.id !== leaver.id).map((o) => (o.id === keep.id ? { ...o, ownership: 100 } : o));
        if (keep.ownership) keep.ownership = 100;
        const root = c.edd.hierarchy.nodes[c.edd.hierarchy.rootId];
        root.children = root.children?.filter((id) => !id.endsWith(leaver.id));
        const keepNode = Object.values(c.edd.hierarchy.nodes).find((n) => n.id.endsWith(keep.id));
        if (keepNode) keepNode.ownership = 100;
      }
      break;
    }
    case 'zatca_expiry': {
      c.trigger = { label: 'Certificate expired', initiatedBy: 'System', at: iso(createdAt) };
      c.zatcaExpiry = {
        expired: { number: `3${r.digits(9)}`, issueDate: ymd(createdAt - 366 * DAY), expiryDate: ymd(createdAt - DAY) },
        attempts: [{ id: `${c.id}-z0`, at: iso(createdAt), by: 'system', result: 'none', details: 'Expiry reached · no renewed certificate found' }],
        script: v.script,
      };
      break;
    }
    case 'license_expiry': {
      c.trigger = { label: 'Activity License expired', initiatedBy: 'System', at: iso(createdAt) };
      const category = index % 2 ? 'Food' : 'Industrial';
      const taskId = `task-${c.id}`;
      c.licenseExpiry = {
        expired: { id: `lic-${r.digits(6)}`, number: 4, origin: 'borrower', category, authority: authoritiesFor(category)[0], issueDate: ymd(createdAt - 365 * DAY), expiryDate: ymd(createdAt - DAY), file: pdf('Activity_License_4.pdf', createdAt - 365 * DAY, r) },
        taskId,
      };
      const task: BorrowerTask = { id: taskId, kind: 'license_renewal', title: 'Renew Activity License', priority: 'High', createdAt: iso(createdAt), dueAt: iso(createdAt + 30 * DAY), status: 'pending', caseId: c.id };
      if (v.stage !== 'not_uploaded') {
        const at = createdAt + 3 * HOUR;
        c.licenseExpiry.renewed = { file: pdf('Renewed_Activity_License.pdf', at, r), uploadedAt: iso(at) };
        task.status = 'completed';
        c.documents.unshift({ id: `doc-${r.digits(6)}`, name: 'Renewed_Activity_License.pdf', type: 'Activity License', uploadedById: 'borrower', uploadedAt: iso(at), file: c.licenseExpiry.renewed.file });
      }
      if (v.stage === 'approved') {
        Object.assign(c.licenseExpiry.renewed!, { category, authority: authoritiesFor(category)[0], issueDate: ymd(createdAt), expiryDate: ymd(createdAt + 365 * DAY) });
        c.decision = { outcome: 'approved', at: iso(createdAt + 5 * HOUR), byId: me };
      }
      entity.borrowerTasks = [...(entity.borrowerTasks ?? []), task];
      break;
    }
    case 'authorization': {
      c.trigger = { label: 'Authorization request submitted', initiatedBy: 'Borrower', at: iso(createdAt) };
      const requested = ['view_wallet', 'request_withdrawal', 'request_early_payment', 'manage_wallet', 'request_financing', 'view_users', 'add_user', 'manage_delegation', 'accept_financial_offer'];
      c.authorization = { requester: requester(r, index), document: pdf('Authorization_Letter.pdf', createdAt, r), requested };
      if (v.stage === 'approved') {
        c.authorization.granted = requested.filter((x) => x !== 'manage_delegation');
        c.decision = { outcome: 'approved', at: iso(createdAt + 4 * HOUR), byId: me };
      }
      break;
    }
    case 'delegation': {
      c.trigger = { label: 'Delegation request submitted', initiatedBy: 'Borrower', at: iso(createdAt) };
      c.delegation = {
        requester: requester(r, index + 1),
        documents: [pdf('Delegation_Letter.pdf', createdAt, r), pdf('Board_Resolution.pdf', createdAt, r)],
        primary: ['facility_contract', 'promissory_note', 'assignment_of_proceeds'],
        system: ['accept_consents', 'accept_murabaha'],
        delegators: [
          { id: `${c.id}-d1`, nid: `1${r.digits(9)}`, phone: `+966 5${r.digits(1)} ${r.digits(3)} ${r.digits(4)}`, verified: false, selected: false, addedBy: 'borrower' },
          { id: `${c.id}-d2`, name: YAKEEN_NAMES[index % YAKEEN_NAMES.length], nid: `1${r.digits(9)}`, dobHijri: '1394-05-29 H', phone: `+966 5${r.digits(1)} ${r.digits(3)} ${r.digits(4)}`, verified: true, selected: false, addedBy: 'borrower' },
        ],
      };
      break;
    }
    case 'iban': {
      c.trigger = { label: 'IBAN change submitted', initiatedBy: 'Borrower', at: iso(createdAt) };
      c.iban = {
        iban: `SA00 TEST ${r.digits(4)} ${r.digits(4)} ${r.digits(4)} ${r.digits(4)} ${r.digits(2)}`,
        accountName: entity.nameEn ?? entity.nameAr,
        bankName: BANKS[index % BANKS.length],
        document: pdf('Bank_IBAN_Letter.pdf', createdAt, r),
        spareResult: 'Spare verification failed: the account holder name did not match the company name.',
      };
      if (v.stage === 'rejected') c.decision = { outcome: 'rejected', reason: 'The bank letter is for a different legal entity.', at: iso(createdAt + 4 * HOUR), byId: me };
      break;
    }
  }
}
