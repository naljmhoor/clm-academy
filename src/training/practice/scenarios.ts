// Practice scenarios: the trainee performs the work; tasks are checked against live simulator state.
// Each scenario owns one case that is restored to its starting state on start / restart.

import { amlOverall, evaluateRequirements } from '@/domain/eddRules';
import type { TourCtx } from '../tours/types';

export interface PracticeTask {
  id: string;
  label: string;
  hint: string;
  check: (ctx: TourCtx) => boolean;
}

export interface PracticeScenario {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  caseId: string;
  context: string;
  objective: string;
  tasks: PracticeTask[];
  /** Shown only when the trainee asks for the explanation. */
  solution: string[];
  /** Detects a mistake that ends the attempt. */
  fail?: (ctx: TourCtx) => string | undefined;
  quiz?: { question: string; options: string[]; answer: number; explanation: string };
  relatedArticle?: string;
}

const onCase = (ctx: TourCtx, id: string, tab?: string) => {
  const [p, q] = ctx.path.split('?');
  if (p !== `/cases/${id}`) return false;
  if (!tab) return true;
  const t = new URLSearchParams(q ?? '').get('tab');
  return t === tab;
};
const reqs = (ctx: TourCtx, id: string) => {
  const c = ctx.caseOf(id);
  return c ? evaluateRequirements(c).map((r) => r.key) : [];
};

export const SCENARIOS: PracticeScenario[] = [
  {
    id: 'review-open',
    title: 'Review an Open EDD case',
    difficulty: 'Easy',
    caseId: 'CS-1901',
    context: 'A new company finished registration this morning and CLM opened EDD case CS-1901. Nobody owns it yet.',
    objective: 'Take ownership, start the review, and find out what is still required before the case can be approved.',
    tasks: [
      { id: 'open', label: 'Open case CS-1901 from the Case Queue', hint: 'Search the Case Queue for CS-1901 and click the Case ID.', check: (c) => onCase(c, 'CS-1901') },
      { id: 'assign', label: 'Assign the case to yourself', hint: 'Use the Assignment card on the right (or the Assignee column in the queue).', check: (c) => c.caseOf('CS-1901')?.assigneeId === c.me },
      { id: 'start', label: 'Start work on the case', hint: 'Open the status button in the case header.', check: (c) => c.caseOf('CS-1901')?.status === 'in_progress' },
      {
        id: 'identify',
        label: 'Open the section of an item listed in Required Before Closing',
        hint: 'Wait for the checks to finish, then click an item in the Required Before Closing card.',
        check: (c) => c.path.startsWith('/cases/CS-1901') && c.path.includes('focus='),
      },
    ],
    solution: ['Case Queue → search CS-1901 → open it.', 'Assignment card → Training User.', 'Status → In Progress (the EDD jobs run).', 'Required Before Closing → click Signing Authority to jump to it.'],
    relatedArticle: 'edd-overview',
  },
  {
    id: 'spl-failed',
    title: 'Resolve a failed National Address retrieval',
    difficulty: 'Medium',
    caseId: 'CS-1902',
    context: 'SPL could not return the national address for CS-1902. The client confirmed their short address is RIYA4821.',
    objective: 'Retry SPL once, then complete the address yourself so National Address no longer blocks approval.',
    tasks: [
      { id: 'retry', label: 'Retry the SPL request', hint: 'National address section → refresh icon.', check: (c) => (c.caseOf('CS-1902')?.edd.address.attempts ?? 0) >= 2 },
      { id: 'complete', label: 'Complete and confirm the address', hint: 'Pencil icon → Short Address → enter RIYA4821 → Retrieve → Review Changes → Confirm. Manual entry also works.', check: (c) => c.caseOf('CS-1902')?.edd.address.status === 'success' },
      { id: 'cleared', label: 'National Address no longer appears in Required Before Closing', hint: 'Confirming the address updates the card automatically.', check: (c) => c.caseOf('CS-1902') !== undefined && !reqs(c, 'CS-1902').includes('address') },
    ],
    solution: ['Refresh icon on National address (SPL fails again — that is expected here).', 'Pencil → Short Address → RIYA4821 → Retrieve.', 'Review Changes → Confirm.'],
    relatedArticle: 'national-address',
  },
  {
    id: 'signing-missing',
    title: 'Configure missing signing authority',
    difficulty: 'Medium',
    caseId: 'CS-1903',
    context: 'Amaly returned no Articles of Association for CS-1903, so there is no bot suggestion. Legal confirmed from the paper AOA: the first owner is the default authorized manager and signs every document alone, except the Facility Contract, which both owners must sign jointly.',
    objective: 'Configure signing authority manually to match Legal’s instructions and save it.',
    tasks: [
      { id: 'manager', label: 'Select the default authorized manager', hint: 'Ownership & Management → Signing Authority → Default authorized manager.', check: (c) => !!c.caseOf('CS-1903')?.edd.signing.defaultManagerId },
      {
        id: 'joint',
        label: 'Facility Contract is signed jointly by both owners',
        hint: 'Open Facility Contract and select both owners — the summary should read "2 signatories · all must sign".',
        check: (c) => {
          const s = c.caseOf('CS-1903');
          const owners = s?.edd.stakeholders.filter((x) => x.role === 'Owner').map((x) => x.id) ?? [];
          const fc = s?.edd.signing.documents.find((d) => d.id === 'facility_contract');
          return !!fc && owners.length > 1 && owners.every((o) => fc.signatoryIds.includes(o));
        },
      },
      { id: 'all', label: 'Every required document has a signatory and the configuration is saved', hint: 'Fill the other three documents, then click Save changes.', check: (c) => c.caseOf('CS-1903') !== undefined && !reqs(c, 'CS-1903').includes('signing') },
    ],
    solution: ['Ownership & Management tab → Signing Authority.', 'Default authorized manager = first owner.', 'Promissory Note, Assignment of Proceeds, Non-objection Letter = first owner only (single signature).', 'Facility Contract = both owners (joint).', 'Save changes.'],
    relatedArticle: 'signing-authority',
  },
  {
    id: 'license-missing',
    title: 'Complete missing Activity License information',
    difficulty: 'Medium',
    caseId: 'CS-1904',
    context: 'The borrower uploaded two activity licenses for CS-1904 but nobody classified them. The company also holds an industrial license from the Ministry of Industry and Mineral Resources that is not on file — you have the PDF.',
    objective: 'Classify both existing licenses, add the industrial license with its document, and clear the Activity License requirement.',
    tasks: [
      { id: 'existing', label: 'Set category and issuing authority on both existing licenses', hint: 'Activity License tab → each card → choose values → Save.', check: (c) => (c.caseOf('CS-1904')?.edd.licenses.filter((l) => l.origin === 'borrower' && l.category && l.authority).length ?? 0) >= 2 },
      {
        id: 'added',
        label: 'Add the industrial license (Industrial · Ministry of Industry and Mineral Resources) with its document',
        hint: 'Add license → upload any PDF → category Industrial → authority Ministry of Industry and Mineral Resources → Save.',
        check: (c) => !!c.caseOf('CS-1904')?.edd.licenses.some((l) => l.origin === 'admin' && l.file && l.category === 'Industrial' && l.authority === 'Ministry of Industry and Mineral Resources'),
      },
      { id: 'cleared', label: 'Activity License no longer blocks approval', hint: 'Check the Required Before Closing card.', check: (c) => c.caseOf('CS-1904') !== undefined && !reqs(c, 'CS-1904').includes('licenses') },
    ],
    solution: ['Configure License 1 and License 2 and Save each.', 'Add license → Choose file → Industrial → Ministry of Industry and Mineral Resources → Save.'],
    relatedArticle: 'activity-license',
  },
  {
    id: 'aml-pending',
    title: 'Handle an EDD case with a pending AML review',
    difficulty: 'Hard',
    caseId: 'CS-1905',
    context: 'Mozn flagged a potential PEP match on one owner of CS-1905. Compliance investigated and confirmed in writing that it is a false positive: different date of birth and nationality.',
    objective: 'Record the correct AML decision so the case can continue — without ending the EDD.',
    tasks: [
      { id: 'find', label: 'Find the owner with the Pending Review result', hint: 'Overview → AML screening → Individual Owner Statuses.', check: (c) => onCase(c, 'CS-1905') && c.dom('aml') },
      {
        id: 'decide',
        label: 'Record the decision that matches Compliance’s conclusion',
        hint: 'Click the owner’s name. A confirmed false positive means the result is acceptable.',
        check: (c) => !!c.caseOf('CS-1905')?.edd.aml.parties.some((p) => p.result === 'approved'),
      },
      { id: 'verified', label: 'AML no longer blocks approval', hint: 'All parties must be Clear or Approved.', check: (c) => (c.caseOf('CS-1905') ? amlOverall(c.caseOf('CS-1905')!.edd.aml.parties) === 'verified' : false) },
    ],
    fail: (c) =>
      c.caseOf('CS-1905')?.edd.aml.parties.some((p) => p.result === 'rejected')
        ? 'You rejected the AML result. Rejecting any party closes the EDD as Rejected and restricts the entity — but Compliance confirmed a false positive. Restart and choose Approve.'
        : c.caseOf('CS-1905')?.edd.aml.parties.some((p) => p.result === 'reported')
          ? 'Reporting to MOZN is for suspected true matches; the result stays pending and still blocks approval. Restart and choose Approve.'
          : undefined,
    solution: ['Overview → AML screening → click the owner marked Pending Review.', 'Approve → Confirm Approve.'],
    relatedArticle: 'aml',
  },
  {
    id: 'need-info',
    title: 'Move a case to Need Info',
    difficulty: 'Easy',
    caseId: 'CS-1906',
    context: 'While reviewing CS-1906 you notice the bank letter confirming the IBAN holder is missing. You cannot decide without it.',
    objective: 'Put the case on hold correctly and record exactly what the client must provide.',
    tasks: [
      { id: 'status', label: 'Move the case to Need Info', hint: 'Status button in the case header → Need Info.', check: (c) => c.caseOf('CS-1906')?.status === 'need_info' },
      {
        id: 'details',
        label: 'Describe the missing bank letter in the request (at least 20 characters, mention "bank")',
        hint: 'The Request Details field is saved as a comment on the case.',
        check: (c) => !!c.caseOf('CS-1906')?.comments.some((m) => m.kind === 'info_request' && m.body.length >= 20 && /bank|بنك/i.test(m.body)),
      },
      { id: 'paused', label: 'Confirm that the SLA is paused', hint: 'Look at the SLA card on the right.', check: (c) => !!c.caseOf('CS-1906')?.pausedSince && onCase(c, 'CS-1906') },
    ],
    solution: ['Status → Need Info.', 'Request Details: "Please provide a bank letter confirming the IBAN holder name." → Send request.', 'The SLA card shows Paused.'],
    relatedArticle: 'need-info',
  },
  {
    id: 'approve',
    title: 'Complete an EDD approval',
    difficulty: 'Hard',
    caseId: 'CS-1907',
    context: 'CS-1907 is nearly ready. ZATCA returned the Zakat certificate but no VAT number — the client sent their VAT certificate showing 310245678900003. Signing authority has not been configured, but the AOA bot has a result.',
    objective: 'Clear every requirement and close the case as Approved with a proper reason.',
    tasks: [
      { id: 'vat', label: 'Enter the VAT number 310245678900003', hint: 'VAT & Zakat Certificate → pencil icon.', check: (c) => c.caseOf('CS-1907')?.edd.zatca.data?.vatNumber === '310245678900003' },
      { id: 'signing', label: 'Configure signing authority', hint: 'Ownership & Management → View Bot Result → Apply AOA result.', check: (c) => c.caseOf('CS-1907') !== undefined && !reqs(c, 'CS-1907').includes('signing') },
      { id: 'closed', label: 'Close the case as Approved with a resolution reason', hint: 'Status → Closed → Approved → reason → Done.', check: (c) => c.caseOf('CS-1907')?.status === 'closed' && c.caseOf('CS-1907')?.resolution === 'approved' },
    ],
    fail: (c) => (c.caseOf('CS-1907')?.resolution === 'rejected' ? 'The case was closed as Rejected. Nothing in the scenario justified a rejection. Restart to try again.' : undefined),
    solution: ['VAT pencil → 310245678900003 → Save.', 'Ownership & Management → View Bot Result → Apply AOA result.', 'Status → Closed → Approved → reason → Done.'],
    relatedArticle: 'closing',
  },
  {
    id: 'closed-review',
    title: 'Review a closed case and its resolution',
    difficulty: 'Easy',
    caseId: 'CS-1908',
    context: 'A colleague asks why CS-1908 was not approved. You need to find the decision and its history.',
    objective: 'Read the resolution and the activity history, then answer the question.',
    tasks: [
      { id: 'resolution', label: 'Open the Resolution tab of CS-1908', hint: 'Open the case — closed cases open on the Resolution tab.', check: (c) => onCase(c, 'CS-1908') && c.dom('resolution') },
      { id: 'history', label: 'Open the Activity Log', hint: 'Comments & activity → Activity Log.', check: (c) => onCase(c, 'CS-1908') && c.dom('activity-log-panel') },
    ],
    quiz: {
      question: 'What was the outcome of CS-1908?',
      options: ['Approved', 'Rejected', 'Still in Need Info'],
      answer: 1,
      explanation: 'The Resolution tab shows Rejected with the reason recorded at closing. Closed cases are read-only.',
    },
    solution: ['Open CS-1908 → Resolution tab shows Rejected and the reason.', 'Comments & activity → Activity Log shows who closed it and when.'],
    relatedArticle: 'resolution',
  },
];

export const scenarioById = (id: string) => SCENARIOS.find((s) => s.id === id);
