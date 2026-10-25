// Synthetic training data set. Every name, ID and number here is invented.

import type {
  ActivityEntry,
  AmlParty,
  CaseDocument,
  CaseRecord,
  CaseStatus,
  Comment,
  EddData,
  Entity,
  FileRef,
  HierarchyNode,
  License,
  OwnerRow,
  Priority,
  Scenario,
  SigningDocument,
  SigningGroup,
  Stakeholder,
  User,
} from '@/domain/types';
import { CAPEX_SIGNING_DOCUMENTS, ISSUING_AUTHORITIES, LICENSE_CATEGORIES, SCF_SIGNING_DOCUMENTS, STANDARD_SIGNING_DOCUMENTS } from './masterData';
import { generateAddress, generateBotSuggestions, generateKyb, generateWorkforce, generateZatca } from './integrations';
import { createRng, type Rng } from './rng';

export const USERS: User[] = [
  { id: 'u-trainee', name: 'Training User', initials: 'TU', title: 'Operations Officer', email: 'trainee@clm-academy.local' },
  { id: 'u-reem', name: 'Reem Al-Harbi', initials: 'RH', title: 'Operations Officer', email: 'reem.h@clm-academy.local' },
  { id: 'u-faisal', name: 'Faisal Al-Dosari', initials: 'FD', title: 'Operations Manager', email: 'faisal.d@clm-academy.local' },
  { id: 'u-lama', name: 'Lama Al-Shehri', initials: 'LS', title: 'Operations Officer', email: 'lama.s@clm-academy.local' },
  { id: 'u-omar', name: 'Omar Al-Mutairi', initials: 'OM', title: 'Compliance Officer', email: 'omar.m@clm-academy.local' },
  { id: 'u-hind', name: 'Hind Al-Zahrani', initials: 'HZ', title: 'Customer Care Officer', email: 'hind.z@clm-academy.local' },
];
export const CURRENT_USER_ID = 'u-trainee';

const COMPANIES: [string, string | undefined][] = [
  ['شركة الأفق للصناعات المعدنية', 'Al Ufuq Metal Industries Co.'],
  ['شركة نخيل الشرق للمقاولات', 'Eastern Palm Contracting Co.'],
  ['شركة مسار اللوجستية', 'Masar Logistics Co.'],
  ['شركة الرواسي للتطوير العقاري', undefined],
  ['مؤسسة سدن التجارية', 'Sadan Trading Est.'],
  ['شركة وهج للطاقة', 'Wahaj Energy Co.'],
  ['شركة دانة الخليج للتجارة', undefined],
  ['شركة البنيان المتين', 'Solid Bunyan Co.'],
  ['شركة أطلس للصناعات الغذائية', 'Atlas Food Industries'],
  ['شركة جسور للتقنية', 'Jusoor Technology Co.'],
  ['شركة ريف للمواد الإنشائية', undefined],
  ['شركة سنام للنقل', 'Sanam Transport Co.'],
  ['شركة نماء الحديثة', 'Namaa Modern Co.'],
  ['شركة فنار للخدمات الهندسية', 'Fanar Engineering Services'],
  ['شركة ميثاق للمقاولات العامة', undefined],
  ['شركة غيمة للتغليف', 'Ghaima Packaging Co.'],
  ['Cedarline Textiles', 'Cedarline Textiles'],
  ['Summit Packaging', 'Summit Packaging'],
  ['Brightway Logistics', 'Brightway Logistics'],
  ['Falcon Steelworks', 'Falcon Steelworks'],
];

const PEOPLE: { ar?: string; en?: string; nationality: string }[] = [
  { ar: 'خالد عبدالله السبيعي', en: 'Khalid Abdullah Al-Subaie', nationality: 'Saudi' },
  { ar: 'نورة فهد العتيبي', en: 'Noura Fahad Al-Otaibi', nationality: 'Saudi' },
  { ar: 'سلطان محمد القحطاني', en: 'Sultan Mohammed Al-Qahtani', nationality: 'Saudi' },
  { ar: 'ريما سعد الدوسري', en: 'Rima Saad Al-Dosari', nationality: 'Saudi' },
  { ar: 'ماجد ناصر الشمري', en: 'Majed Nasser Al-Shammari', nationality: 'Saudi' },
  { ar: 'هيفاء علي الغامدي', en: 'Haifa Ali Al-Ghamdi', nationality: 'Saudi' },
  { ar: 'تركي صالح العنزي', en: 'Turki Saleh Al-Anazi', nationality: 'Saudi' },
  { ar: 'عبدالرحمن يوسف المالكي', en: 'Abdulrahman Yousef Al-Malki', nationality: 'Saudi' },
  { en: 'Rahul Menon', nationality: 'Indian' },
  { en: 'Ahmed Farouk', nationality: 'Egyptian' },
];

const HOUR = 3_600_000;
const iso = (ms: number) => new Date(ms).toISOString();
const SLA_HOURS = 72;

function makeEntity(i: number, r: Rng): Entity {
  const [nameAr, nameEn] = COMPANIES[i % COMPANIES.length];
  const cr = `10${r.digits(8)}`;
  return {
    id: String(32100 + i * 2),
    nameAr,
    nameEn,
    cr,
    unified: `70${r.digits(8)}`,
    clientType: i % 9 === 4 ? 'qualified_investor' : 'borrower',
    registryStatus: r.pick(['New Borrowers', 'New Borrowers', 'Active', 'Compliance Review']),
  };
}

function fileRef(name: string, at: number, r: Rng): FileRef {
  return { id: `f-${r.digits(8)}`, name, sizeKb: r.int(18, 900), uploadedAt: iso(at), mime: 'application/pdf' };
}

function makeStakeholders(r: Rng, kycGood: boolean): Stakeholder[] {
  const start = r.int(0, PEOPLE.length - 4);
  const people = PEOPLE.slice(start, start + 3);
  const shares = [70, 30];
  return people.map((p, i) => {
    const isOwner = i < 2;
    const complete = kycGood ? i !== 2 : i === 1;
    return {
      id: `sh-${r.digits(6)}`,
      nameAr: p.ar,
      nameEn: p.en,
      idNumber: `${p.nationality === 'Saudi' ? 1 : 2}${r.digits(9)}`,
      dateOfBirth: complete ? `19${r.int(60, 95)}-0${r.int(1, 9)}-1${r.int(0, 9)}` : undefined,
      nationality: p.nationality,
      phone: complete || r.chance(0.5) ? `05${r.digits(8)}` : undefined,
      yakeenVerified: complete,
      role: isOwner ? 'Owner' : 'Executive',
      ownership: isOwner ? shares[i] : undefined,
      kind: 'person',
    };
  });
}

interface Preset {
  status: CaseStatus;
  jobs: boolean;
  resolution?: 'approved' | 'rejected';
  scenario: Scenario;
  addressDone?: boolean;
  signingDone?: boolean;
  licensesDone?: boolean;
  aml?: 'clear' | 'pending_review' | 'missing_info';
  kybFailed?: boolean;
  consentsPending?: boolean;
  products?: ('capex' | 'scf')[];
  borrowerLicenses?: number;
  kycGood?: boolean;
  corporateOwner?: boolean;
  workforce?: boolean;
}

const HAPPY: Scenario = {
  spl: 'success',
  shortAddress: 'success',
  zatca: 'success',
  aml: 'clear',
  masdr: 'success',
  wathq: 'success',
  aoa: 'available',
  aoaExtraction: 'success',
};

function buildEdd(entity: Entity, p: Preset, r: Rng, createdAt: number): EddData {
  const stakeholders = makeStakeholders(r, p.kycGood ?? true);
  const persons = stakeholders.filter((s) => s.kind === 'person');
  const owners: OwnerRow[] = stakeholders.map((s) => ({
    id: s.id,
    name: s.nameAr ?? s.nameEn ?? '',
    idNumber: s.idNumber ?? '-',
    role: s.role === 'Owner' ? 'Owner' : 'Executive',
    ownership: s.ownership,
    kind: s.kind,
  }));

  // Ownership hierarchy — optionally replace part of the 30 % owner with a corporate owner.
  const rootId = `n-${entity.id}`;
  const nodes: Record<string, HierarchyNode> = {};
  const childIds: string[] = [];
  stakeholders
    .filter((s) => s.role === 'Owner')
    .forEach((s) => {
      const id = `${rootId}.${s.id}`;
      nodes[id] = { id, name: s.nameAr ?? s.nameEn ?? '', kind: 'person', ownership: p.corporateOwner && s.ownership === 30 ? 15 : s.ownership, retrieval: 'done' };
      childIds.push(id);
    });
  if (p.corporateOwner) {
    const id = `${rootId}.corp`;
    nodes[id] = { id, name: 'شركة الخليج لتجارة المعادن', kind: 'company', ownership: 15, retrieval: 'idle' };
    childIds.push(id);
    owners.push({ id: 'corp-owner', name: 'شركة الخليج لتجارة المعادن', idNumber: `70${r.digits(8)}`, role: 'Owner', ownership: 15, kind: 'company' });
    const second = owners.find((o) => o.ownership === 30);
    if (second) second.ownership = 15;
  }
  nodes[rootId] = { id: rootId, name: entity.nameAr, kind: 'company', children: childIds, retrieval: 'done' };

  // Signing documents
  const groups: SigningGroup[] = [];
  const documents: SigningDocument[] = STANDARD_SIGNING_DOCUMENTS.map((d) => ({ ...d, required: true, signatoryIds: [] }));
  if (p.products?.includes('capex')) {
    groups.push({ id: 'capex', label: 'CapEx Financing' });
    documents.push(...CAPEX_SIGNING_DOCUMENTS.map((d) => ({ ...d, groupId: 'capex', required: false, signatoryIds: [] })));
  }
  if (p.products?.includes('scf')) {
    groups.push({ id: 'scf', label: 'SCF authorization matrix' });
    documents.push(...SCF_SIGNING_DOCUMENTS.map((d) => ({ ...d, groupId: 'scf', required: false, signatoryIds: [] })));
  }
  const suggestions = generateBotSuggestions(stakeholders, documents.filter((d) => !d.groupId).map((d) => d.id));
  if (p.signingDone) {
    for (const s of suggestions) {
      const doc = documents.find((d) => d.id === s.documentId);
      if (doc) doc.signatoryIds = s.signatories.map((x) => x.stakeholderId);
    }
  }

  const licenseCount = p.borrowerLicenses ?? 0;
  const licenses: License[] = Array.from({ length: licenseCount }, (_, i) => ({
    id: `lic-${r.digits(6)}`,
    number: i + 1,
    origin: 'borrower',
    file: fileRef(i === 0 ? 'Commercial_Registration.pdf' : `Activity_License_${i + 1}.pdf`, createdAt - 30 * HOUR, r),
    category: p.licensesDone ? LICENSE_CATEGORIES[i % 3] : undefined,
    authority: p.licensesDone ? ISSUING_AUTHORITIES[i % 2] : undefined,
  }));

  const jobAt = iso(createdAt + 2 * HOUR);
  const amlResult = p.jobs ? (p.aml ?? 'clear') : 'not_triggered';
  const parties: AmlParty[] = [
    { id: `aml-${entity.id}`, name: entity.nameAr, kind: 'company', result: p.jobs ? 'clear' : 'not_triggered' },
    ...stakeholders
      .filter((s) => s.role === 'Owner')
      .map((s, i): AmlParty => ({
        id: `aml-${s.id}`,
        name: s.nameAr ?? s.nameEn ?? '',
        kind: 'owner',
        result: i === 1 && (amlResult === 'pending_review' || amlResult === 'missing_info') ? amlResult : p.jobs ? 'clear' : 'not_triggered',
        matchSummary: i === 1 && amlResult === 'pending_review' ? 'Potential PEP match (domestic) — name similarity 87 %, date of birth not confirmed.' : undefined,
      })),
  ];

  const addressOk = p.jobs && (p.addressDone ?? p.scenario.spl === 'success');
  const zatcaOk = p.jobs && p.scenario.zatca !== 'fail';
  const aoaAvailable = p.scenario.aoa === 'available';

  return {
    stakeholders,
    kyb: p.kybFailed
      ? { status: 'failed', error: 'Wathq request failed. Error Code: WTQ-504.', attempts: 1 }
      : { status: 'success', data: generateKyb(entity), retrievedAt: iso(createdAt - 6 * HOUR), attempts: 1 },
    consents: {
      acceptedAt: iso(createdAt - 26 * HOUR),
      items: (['Qawaem Consent', 'Simah Consent', 'Bayan Consent'] as const).map((type) => ({
        type,
        status: p.consentsPending && type === 'Bayan Consent' ? 'pending' : 'accepted',
        signerName: persons[0]?.nameAr ?? persons[0]?.nameEn ?? '',
        signerId: persons[0]?.idNumber ?? '',
      })),
    },
    address: addressOk
      ? { status: 'success', data: generateAddress(entity), retrievedAt: jobAt, attempts: 1, source: 'spl' }
      : p.jobs
        ? { status: 'failed', error: 'Unable to retrieve the National Address from SPL. Error Code: SPL-503.', attempts: 1 }
        : { status: 'not_triggered', attempts: 0 },
    zatca: zatcaOk
      ? { status: 'success', data: generateZatca(entity, p.scenario.zatca !== 'no_vat'), retrievedAt: jobAt, attempts: 1, entryMethod: 'retrieved' }
      : p.jobs
        ? { status: 'failed', error: 'Failed to retrieve', attempts: 1 }
        : { status: 'not_triggered', attempts: 0 },
    aml: { screenedAt: p.jobs ? jobAt : undefined, attempts: p.jobs ? 1 : 0, parties },
    workforce: p.workforce ? { status: 'success', data: generateWorkforce(entity), retrievedAt: jobAt, attempts: 1 } : { status: 'not_triggered', attempts: 0 },
    owners: p.kybFailed
      ? { status: 'failed', error: 'Wathq request failed. Error Code: WTQ-504.', attempts: 1, data: owners }
      : { status: 'success', data: owners, retrievedAt: iso(createdAt - 6 * HOUR), attempts: 1 },
    hierarchy: { rootId, nodes },
    aoa: !p.jobs
      ? { status: 'not_triggered' }
      : aoaAvailable
        ? { status: 'extracted', source: 'amaly', fileName: 'Articles_of_Association.pdf', retrievedAt: jobAt, suggestions, decision: p.signingDone ? 'applied' : undefined }
        : { status: 'unavailable' },
    signing: {
      defaultManagerId: p.signingDone ? persons[0]?.id : undefined,
      groups,
      documents,
      method: p.signingDone ? (p.jobs && aoaAvailable ? 'bot' : 'manual') : undefined,
    },
    licenses,
  };
}

function seedDocuments(r: Rng, createdAt: number, edd: EddData): CaseDocument[] {
  const docs: [string, string, string][] = [
    ['Commercial_Registration.pdf', 'Commercial Registration', 'u-reem'],
    ['Financial_Statements_2025.pdf', 'Financial Statements', 'u-lama'],
    ['Bank_Statement_Q2.pdf', 'Bank Statement', 'u-lama'],
  ];
  if (edd.aoa.status === 'extracted') docs.unshift(['Articles_of_Association.pdf', 'Articles of Association', 'system']);
  return docs.map(([name, type, by], i) => ({
    id: `doc-${r.digits(6)}`,
    name,
    type,
    uploadedById: by,
    uploadedAt: iso(createdAt - (20 - i) * HOUR),
    file: fileRef(name, createdAt - (20 - i) * HOUR, r),
  }));
}

function seedActivity(c: { id: string; createdAt: number; status: CaseStatus; assigneeId?: string; closedAt?: number; resolution?: string; priority: Priority }): ActivityEntry[] {
  const out: ActivityEntry[] = [
    { id: `${c.id}-a0`, at: iso(c.createdAt), actorId: 'system', action: 'created the case from CRM', detail: c.id },
  ];
  if (c.status !== 'open') {
    out.push({ id: `${c.id}-a1`, at: iso(c.createdAt + 1.5 * HOUR), actorId: c.assigneeId ?? 'u-faisal', action: 'changed the case status', from: 'Open', to: 'In Progress' });
  }
  if (c.status === 'need_info') {
    out.push({ id: `${c.id}-a2`, at: iso(c.createdAt + 5 * HOUR), actorId: c.assigneeId ?? 'u-faisal', action: 'changed the case status', from: 'In Progress', to: 'Need Info' });
  }
  if (c.status === 'closed' && c.closedAt) {
    out.push({
      id: `${c.id}-a3`,
      at: iso(c.closedAt),
      actorId: c.assigneeId ?? 'u-faisal',
      action: 'changed the case status',
      field: 'Resolution',
      from: 'In Progress',
      to: c.resolution === 'approved' ? 'Approved' : 'Rejected',
      tone: c.resolution === 'approved' ? 'positive' : 'negative',
    });
  }
  return out.reverse();
}

export interface SeedData {
  users: User[];
  entities: Entity[];
  cases: CaseRecord[];
}

/** Hero cases used by the training walkthroughs come first and have fixed IDs. */
const HERO_PRESETS: { id: string; preset: Preset; priority: Priority; assigneeId?: string; ageHours: number }[] = [
  // Getting started / first EDD: untouched, nothing triggered yet.
  { id: 'CS-1847', priority: 'high', ageHours: 6, preset: { status: 'open', jobs: false, borrowerLicenses: 1, corporateOwner: true, scenario: { ...HAPPY, spl: 'fail', aoa: 'unavailable' } } },
  // Missing information: SPL failed, AML pending review, AOA unavailable, Masdr flaky.
  { id: 'CS-1845', priority: 'high', assigneeId: 'u-trainee', ageHours: 58, preset: { status: 'in_progress', jobs: true, aml: 'pending_review', borrowerLicenses: 2, products: ['capex'], corporateOwner: true, scenario: { ...HAPPY, spl: 'fail', shortAddress: 'fail_then_success', masdr: 'fail_then_success', aoa: 'unavailable', zatca: 'no_vat' } } },
  // Complete & close: only signing authority and one license remain.
  { id: 'CS-1843', priority: 'medium', assigneeId: 'u-trainee', ageHours: 30, preset: { status: 'in_progress', jobs: true, borrowerLicenses: 1, products: ['scf'], workforce: true, scenario: HAPPY } },
  { id: 'CS-1841', priority: 'medium', assigneeId: 'u-reem', ageHours: 40, preset: { status: 'need_info', jobs: true, addressDone: true, signingDone: true, borrowerLicenses: 1, scenario: HAPPY } },
  { id: 'CS-1839', priority: 'low', assigneeId: 'u-lama', ageHours: 70, preset: { status: 'closed', resolution: 'approved', jobs: true, signingDone: true, licensesDone: true, borrowerLicenses: 1, workforce: true, scenario: HAPPY } },
  { id: 'CS-1837', priority: 'high', assigneeId: 'u-omar', ageHours: 90, preset: { status: 'closed', resolution: 'rejected', jobs: true, aml: 'pending_review', scenario: HAPPY } },
  // Tour 4 — ownership & signing authority: only signing remains, AOA result available, CapEx documents.
  { id: 'CS-1849', priority: 'medium', assigneeId: 'u-trainee', ageHours: 20, preset: { status: 'in_progress', jobs: true, products: ['capex'], corporateOwner: true, scenario: HAPPY } },
  // Tour 5 — activity license: only one borrower-uploaded license remains unconfigured.
  { id: 'CS-1851', priority: 'low', assigneeId: 'u-trainee', ageHours: 12, preset: { status: 'in_progress', jobs: true, signingDone: true, borrowerLicenses: 1, scenario: HAPPY } },
  // Explore — exception states: KYB failed, Bayan consent pending, AML missing information.
  { id: 'CS-1853', priority: 'high', assigneeId: 'u-lama', ageHours: 50, preset: { status: 'in_progress', jobs: true, kybFailed: true, consentsPending: true, aml: 'missing_info', signingDone: true, scenario: { ...HAPPY, wathq: 'fail_then_success' } } },
  // Practice scenarios (see src/training/practice/scenarios.ts)
  { id: 'CS-1901', priority: 'medium', ageHours: 3, preset: { status: 'open', jobs: false, scenario: HAPPY } },
  { id: 'CS-1902', priority: 'high', assigneeId: 'u-trainee', ageHours: 26, preset: { status: 'in_progress', jobs: true, signingDone: true, scenario: { ...HAPPY, spl: 'fail' } } },
  { id: 'CS-1903', priority: 'medium', assigneeId: 'u-trainee', ageHours: 18, preset: { status: 'in_progress', jobs: true, scenario: { ...HAPPY, aoa: 'unavailable' } } },
  { id: 'CS-1904', priority: 'medium', assigneeId: 'u-trainee', ageHours: 22, preset: { status: 'in_progress', jobs: true, signingDone: true, borrowerLicenses: 2, scenario: HAPPY } },
  { id: 'CS-1905', priority: 'high', assigneeId: 'u-trainee', ageHours: 40, preset: { status: 'in_progress', jobs: true, signingDone: true, aml: 'pending_review', scenario: HAPPY } },
  { id: 'CS-1906', priority: 'medium', assigneeId: 'u-trainee', ageHours: 30, preset: { status: 'in_progress', jobs: true, signingDone: true, licensesDone: true, borrowerLicenses: 1, scenario: HAPPY } },
  { id: 'CS-1907', priority: 'high', assigneeId: 'u-trainee', ageHours: 34, preset: { status: 'in_progress', jobs: true, scenario: { ...HAPPY, zatca: 'no_vat' } } },
  { id: 'CS-1908', priority: 'low', assigneeId: 'u-reem', ageHours: 80, preset: { status: 'closed', resolution: 'rejected', jobs: true, signingDone: true, scenario: HAPPY } },
];

export function createSeed(): SeedData {
  const r = createRng(20261025);
  const now = Date.now();
  const entities: Entity[] = [];
  const cases: CaseRecord[] = [];

  const total = 48;
  for (let i = 0; i < total; i++) {
    const entity = makeEntity(i, r);
    entities.push(entity);
    const hero = HERO_PRESETS[i];
    const id = hero?.id ?? `CS-${1835 - (i - HERO_PRESETS.length) * 2}`;

    let preset: Preset;
    let priority: Priority;
    let assigneeId: string | undefined;
    let ageHours: number;
    if (hero) {
      ({ preset, priority, assigneeId, ageHours } = hero);
    } else {
      const status = r.pick<CaseStatus>(['open', 'open', 'in_progress', 'in_progress', 'need_info', 'closed', 'closed', 'closed']);
      const closed = status === 'closed';
      preset = {
        status,
        jobs: status !== 'open',
        resolution: closed ? (r.chance(0.8) ? 'approved' : 'rejected') : undefined,
        signingDone: closed || r.chance(0.3),
        licensesDone: closed,
        borrowerLicenses: r.int(0, 2),
        products: r.chance(0.25) ? ['capex'] : r.chance(0.2) ? ['scf'] : [],
        workforce: r.chance(0.5),
        corporateOwner: r.chance(0.3),
        aml: !closed && r.chance(0.15) ? 'pending_review' : 'clear',
        scenario: { ...HAPPY, spl: closed || r.chance(0.7) ? 'success' : 'fail', aoa: r.chance(0.75) ? 'available' : 'unavailable' },
      };
      priority = r.pick<Priority>(['high', 'high', 'medium', 'medium', 'low']);
      assigneeId = status === 'open' && r.chance(0.6) ? undefined : r.pick(USERS).id;
      ageHours = r.int(2, 24 * 9);
    }

    const createdAt = now - ageHours * HOUR;
    const edd = buildEdd(entity, preset, r, createdAt);
    const closedAt = preset.status === 'closed' ? Math.min(now - HOUR, createdAt + r.int(3, 80) * HOUR) : undefined;
    const needInfoSince = preset.status === 'need_info' ? createdAt + 5 * HOUR : undefined;

    const comments: Comment[] = [];
    if (preset.status === 'need_info') {
      comments.push({
        id: `${id}-c1`,
        authorId: assigneeId ?? 'u-faisal',
        body: 'Information requested: please provide the latest audited financial statements and confirm the source of funds for the 30 % shareholder.',
        createdAt: iso(needInfoSince!),
        attachments: [],
        kind: 'info_request',
      });
    }
    if (preset.jobs && r.chance(0.6)) {
      comments.push({
        id: `${id}-c0`,
        authorId: 'u-reem',
        body: 'Called the company representative; they confirmed the CR details and will share the updated bank letter this week.',
        createdAt: iso(createdAt + 3 * HOUR),
        attachments: r.chance(0.5) ? [fileRef('Call_notes.pdf', createdAt + 3 * HOUR, r)] : [],
      });
    }

    const record: CaseRecord = {
      id,
      entityId: entity.id,
      type: 'edd',
      status: preset.status,
      resolution: preset.resolution,
      resolutionReason:
        preset.resolution === 'approved'
          ? 'All EDD checks completed. Ownership reconciles to 100 %, AML results are clear and signing authority matches the Articles of Association.'
          : preset.resolution === 'rejected'
            ? 'AML match on a 30 % shareholder was confirmed as a true match; source of funds could not be evidenced.'
            : undefined,
      priority,
      assigneeId,
      createdAt: iso(createdAt),
      createdById: 'system',
      dueAt: iso(createdAt + SLA_HOURS * HOUR),
      closedAt: closedAt ? iso(closedAt) : undefined,
      closedById: closedAt ? assigneeId ?? 'u-faisal' : undefined,
      pausedMs: 0,
      pausedSince: needInfoSince ? iso(needInfoSince) : undefined,
      jobsTriggered: preset.jobs,
      edd,
      documents: seedDocuments(r, createdAt, edd),
      comments,
      activity: seedActivity({ id, createdAt, status: preset.status, assigneeId, closedAt, resolution: preset.resolution, priority }),
      scenario: preset.scenario,
    };
    cases.push(record);
  }

  return { users: USERS, entities, cases };
}
