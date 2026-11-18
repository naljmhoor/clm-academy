// Practice scenarios for the Phase II case types. Each owns one CS-21xx case.

import { evaluateRequirements, impactedSigningDocuments } from '@/domain/eddRules';
import type { TourCtx } from '../tours/types';
import type { PracticeScenario } from './scenarios';

const status = (c: TourCtx, id: string) => c.caseOf(id)?.status;
const decision = (c: TourCtx, id: string) => c.caseOf(id)?.decision;
const closedAs = (c: TourCtx, id: string, r: 'approved' | 'rejected') => status(c, id) === 'closed' && c.caseOf(id)?.resolution === r;

export const PHASE2_SCENARIOS: PracticeScenario[] = [
  {
    id: 'coc-signatory-left',
    title: 'Change of Circumstance: a signatory left',
    difficulty: 'Medium',
    caseId: 'CS-2101',
    context: 'Wathq shows that one owner left the company. CS-2101 is In Progress and assigned to you. Some signing documents still list the person who left.',
    objective: 'Update the signing authority so no document lists the departed signatory, then close the case as Approved.',
    tasks: [
      { id: 'find', label: 'Find which documents are impacted', hint: 'Detected Changes → Update Signing Authority, or the Required Before Closing card.', check: (c) => c.path.startsWith('/cases/CS-2101') && c.path.includes('tab=ownership') },
      { id: 'fix', label: 'Save the signing authority without the departed signatory', hint: 'Remove the struck-through name from each Impacted document → Save changes → Confirm.', check: (c) => !!c.caseOf('CS-2101') && impactedSigningDocuments(c.caseOf('CS-2101')!).length === 0 },
      { id: 'close', label: 'Close the case as Approved', hint: 'Status → Closed → Approved → Done. The approval reason is optional.', check: (c) => closedAs(c, 'CS-2101', 'approved') },
    ],
    fail: (c) => (closedAs(c, 'CS-2101', 'rejected') ? 'The case was closed as Rejected. Updating the signing authority resolves this change — Restart to try again.' : undefined),
    solution: ['Overview → Update Signing Authority.', 'In every Impacted document remove the not-active signatory (keep the active one).', 'Save changes → Confirm. The Required Before Closing card clears.', 'Status → Closed → Approved → Done.'],
    relatedArticle: 'coc',
  },
  {
    id: 'zatca-service-down',
    title: 'ZATCA retrieval fails, then succeeds',
    difficulty: 'Easy',
    caseId: 'CS-2102',
    context: 'A ZATCA certificate expired. CS-2102 is In Progress. ZATCA is having temporary service problems today.',
    objective: 'Keep retrying until a renewed certificate is saved, then resolve the case.',
    tasks: [
      { id: 'retry', label: 'Retry the ZATCA retrieval', hint: 'Use Retry retrieval on the banner or the ZATCA Retrieval section.', check: (c) => (c.caseOf('CS-2102')?.zatcaExpiry?.attempts.length ?? 0) >= 2 },
      { id: 'renewed', label: 'Get a renewed certificate', hint: 'A failed call is temporary — use Try again.', check: (c) => !!c.caseOf('CS-2102')?.zatcaExpiry?.renewed },
      { id: 'close', label: 'Close the case as Approved', hint: 'Status → Closed → Approved → Done.', check: (c) => closedAs(c, 'CS-2102', 'approved') },
    ],
    quiz: {
      question: 'ZATCA returns "Failed · Service unavailable". What should you do?',
      options: ['Reject the case', 'Try again later — the failure is temporary', 'Enter the certificate manually'],
      answer: 1,
      explanation: 'A failed call means ZATCA could not be reached. Retry; it is not a reason to reject the case.',
    },
    solution: ['Retry retrieval → it fails (service unavailable).', 'Try again → renewed certificate saved, status Valid.', 'Status → Closed → Approved → Done.'],
    relatedArticle: 'zatca-expiry',
  },
  {
    id: 'license-wrong-document',
    title: 'Reject a renewed license',
    difficulty: 'Medium',
    caseId: 'CS-2103',
    context: 'The borrower uploaded a "renewed" Activity License for CS-2103. On review, the document is the old, expired license again.',
    objective: 'Reject the renewed license with a reason for the borrower, then close the case.',
    tasks: [
      { id: 'reject', label: 'Reject the renewed license with a reason', hint: 'Renewed License details → Reject → write the reason → Reject license.', check: (c) => decision(c, 'CS-2103')?.outcome === 'rejected' && !!decision(c, 'CS-2103')?.reason },
      { id: 'borrower', label: 'Check what the borrower now sees', hint: 'Borrower Task → View borrower side.', check: (c) => c.dom('borrower-preview') && decision(c, 'CS-2103')?.outcome === 'rejected' },
      { id: 'close', label: 'Close the case', hint: 'Status → Closed → Done. The resolution is set from your decision.', check: (c) => closedAs(c, 'CS-2103', 'rejected') },
    ],
    fail: (c) => (decision(c, 'CS-2103')?.outcome === 'approved' ? 'The license was approved, but the uploaded document is the expired one. Restart to try again.' : undefined),
    solution: ['Renewed License details → Reject.', 'Reason, e.g. "The uploaded file is the expired license. Please upload the renewed license." → Reject license.', 'View borrower side shows the rejection reason.', 'Status → Closed → Done (Rejected).'],
    relatedArticle: 'license-expiry',
  },
  {
    id: 'authorization-adjust',
    title: 'Approve an authorization with fewer permissions',
    difficulty: 'Medium',
    caseId: 'CS-2104',
    context: 'A borrower user asked for several permissions on CS-2104. Your manager agreed to everything except Manage Delegation.',
    objective: 'Approve the request without Manage Delegation, then close the case.',
    tasks: [
      { id: 'approve', label: 'Approve without Manage Delegation', hint: 'Untick Manage Delegation → Approve authorization → confirm.', check: (c) => decision(c, 'CS-2104')?.outcome === 'approved' && !c.caseOf('CS-2104')?.authorization?.granted?.includes('manage_delegation') },
      { id: 'close', label: 'Close the case', hint: 'Status → Closed → Done.', check: (c) => closedAs(c, 'CS-2104', 'approved') },
    ],
    fail: (c) => {
      const d = c.caseOf('CS-2104');
      if (d?.decision?.outcome === 'approved' && d.authorization?.granted?.includes('manage_delegation')) return 'Manage Delegation was granted. Restart and untick it before approving.';
      if (d?.decision?.outcome === 'rejected') return 'The request was rejected, but your manager approved most of it. Restart to try again.';
      return undefined;
    },
    solution: ['Authorization permissions → untick Manage Delegation.', 'Approve authorization → Confirm Approval.', 'Status → Closed → Done.'],
    relatedArticle: 'authorization',
  },
  {
    id: 'delegation-verify',
    title: 'Approve a delegation with a verified delegator',
    difficulty: 'Hard',
    caseId: 'CS-2105',
    context: 'CS-2105 lists two delegators. The borrower wants the one whose name is not verified yet. Their Hijri date of birth is 1405-07-19.',
    objective: 'Verify the first delegator, select them, approve the request and close the case.',
    tasks: [
      { id: 'verify', label: 'Verify the unverified delegator', hint: 'Pencil icon on the row → add the date of birth 1405-07-19 → Save delegator.', check: (c) => !!c.caseOf('CS-2105')?.delegation?.delegators[0]?.verified },
      { id: 'approve', label: 'Approve with that delegator selected', hint: 'Tick the delegator → Approve request.', check: (c) => decision(c, 'CS-2105')?.outcome === 'approved' && !!c.caseOf('CS-2105')?.delegation?.delegators[0]?.sentAt },
      { id: 'close', label: 'Close the case', hint: 'You don’t need to wait for the delegator’s response.', check: (c) => closedAs(c, 'CS-2105', 'approved') },
    ],
    fail: (c) => (decision(c, 'CS-2105')?.outcome === 'rejected' ? 'The request was rejected. Restart to try again.' : undefined),
    solution: ['First delegator → pencil → DOB 1405-07-19 → Save delegator (name from Yakeen).', 'Tick the delegator → Approve request.', 'Status → Closed → Done.'],
    relatedArticle: 'delegation',
  },
  {
    id: 'iban-mismatch',
    title: 'Decide an IBAN review',
    difficulty: 'Easy',
    caseId: 'CS-2106',
    context: 'Spare verification failed for the IBAN on CS-2106. The bank letter names a different legal entity.',
    objective: 'Make the right decision with a reason and close the case.',
    tasks: [
      { id: 'reject', label: 'Reject the IBAN with a reason', hint: 'IBAN section → Reject → reason → Reject IBAN.', check: (c) => decision(c, 'CS-2106')?.outcome === 'rejected' },
      { id: 'close', label: 'Close the case', hint: 'Status → Closed → Done.', check: (c) => closedAs(c, 'CS-2106', 'rejected') },
    ],
    fail: (c) => (decision(c, 'CS-2106')?.outcome === 'approved' ? 'The IBAN was approved although the bank letter is for another entity. Restart to try again.' : undefined),
    solution: ['Reject → "Bank letter is for another legal entity." → Reject IBAN.', 'Status → Closed → Done (Rejected).'],
    relatedArticle: 'iban',
  },
  {
    id: 'on-hold-reactivate',
    title: 'Reactivate an On Hold case',
    difficulty: 'Easy',
    caseId: 'CS-2107',
    context: 'The migration placed CS-2107 On Hold. The company has now been in touch and the review should restart.',
    objective: 'Take ownership of the case and move it back into work.',
    tasks: [
      { id: 'find', label: 'Find CS-2107 using the Status filter', hint: 'Case Queue → Filters → Case Status → On Hold → Apply Filter.', check: (c) => c.path.startsWith('/cases/CS-2107') },
      { id: 'assign', label: 'Assign the case to yourself', hint: 'Assignment card on the right.', check: (c) => c.caseOf('CS-2107')?.assigneeId === c.me },
      { id: 'start', label: 'Move it to In Progress', hint: 'Status → In Progress (the only option from On Hold).', check: (c) => status(c, 'CS-2107') === 'in_progress' },
    ],
    quiz: {
      question: 'What happens to the SLA when an On Hold case moves to In Progress?',
      options: ['It restarts from zero', 'It resumes from where it paused', 'It is marked Breached'],
      answer: 1,
      explanation: 'The SLA pauses while On Hold and resumes without a reset. Breaches recorded before the pause are kept.',
    },
    solution: ['Filters → Case Status: On Hold → open CS-2107.', 'Assignment → Training User.', 'Status → In Progress.'],
    relatedArticle: 'on-hold',
  },
  {
    id: 'compliance-request',
    title: 'Request missing compliance documents',
    difficulty: 'Easy',
    caseId: 'CS-2108',
    context: 'For CS-2108 you need the Register of Shareholder and the MISA License from the borrower.',
    objective: 'Request both documents in one request and confirm the borrower can upload them.',
    tasks: [
      {
        id: 'request',
        label: 'Request Register of Shareholder and MISA License',
        hint: 'Documents tab → Request documents → select both → Send request.',
        check: (c) => {
          const r = c.entityOf('CS-2108')?.complianceRequests ?? [];
          return ['Register of Shareholder', 'MISA License'].every((d) => r.some((x) => x.docType === d));
        },
      },
      { id: 'one-task', label: 'Both documents belong to one borrower task', hint: 'Select both documents in the same request.', check: (c) => (c.entityOf('CS-2108')?.borrowerTasks ?? []).filter((t) => t.kind === 'compliance_documents').length === 1 && (c.entityOf('CS-2108')?.complianceRequests?.length ?? 0) >= 2 },
      { id: 'uploaded', label: 'See one document change to Uploaded', hint: 'Borrower side → upload a document as the borrower.', check: (c) => !!c.entityOf('CS-2108')?.complianceRequests?.some((r) => r.status === 'uploaded') },
    ],
    fail: (c) => ((c.entityOf('CS-2108')?.borrowerTasks ?? []).filter((t) => t.kind === 'compliance_documents').length > 1 ? 'The documents were sent in separate requests, so the borrower got two tasks. Restart and select both in one request.' : undefined),
    solution: ['Documents → Request documents → Register of Shareholder + MISA License → Send request.', 'Borrower side → upload one document.', 'The row changes from Pending to Uploaded.'],
    relatedArticle: 'compliance-documents',
  },
];

/** Requirement keys left on a case (used by assistant hints). */
export const remaining = (c: TourCtx, id: string) => {
  const x = c.caseOf(id);
  return x ? evaluateRequirements(x).map((r) => r.key) : [];
};
