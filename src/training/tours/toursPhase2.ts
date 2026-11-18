// Phase II walkthroughs (new case types, Request Compliance Documents, On Hold).
// Structure only — wording lives in ./content/phase2.en.ts and ./content/phase2.ar.ts.

import { evaluateRequirements } from '@/domain/eddRules';
import { useQueueUi } from '@/store/queueUiStore';
import type { Tour, TourCtx } from './types';

const onCase = (id: string) => new RegExp(`^/cases/${id}(\\?|$)`);
const status = (ctx: TourCtx, id: string) => ctx.caseOf(id)?.status;
const decision = (ctx: TourCtx, id: string) => ctx.caseOf(id)?.decision?.outcome;
const startStep = (id: string) => ({
  id: 'start',
  target: 'status-control',
  expectRoute: onCase(id),
  done: (ctx: TourCtx) => status(ctx, id) === 'in_progress' || status(ctx, id) === 'closed',
});
const closeStep = (id: string, expected?: 'approved' | 'rejected') => ({
  id: 'close',
  target: 'status-control',
  expectRoute: onCase(id),
  done: (ctx: TourCtx) => status(ctx, id) === 'closed',
  ...(expected ? { wrong: (ctx: TourCtx) => !!ctx.caseOf(id)?.decision && decision(ctx, id) !== expected } : {}),
});

export const PHASE2_TOURS: Tour[] = [
  {
    id: 'coc',
    minutes: 7,
    level: 'Intermediate',
    caseIds: ['CS-2001'],
    steps: [
      { id: 'changes', target: 'detected-changes', route: '/cases/CS-2001' },
      { id: 'required', target: 'required-before-closing', route: '/cases/CS-2001' },
      startStep('CS-2001'),
      {
        id: 'open-signing',
        target: 'coc-update-signing',
        route: '/cases/CS-2001',
        done: (ctx) => ctx.path.includes('tab=ownership'),
      },
      { id: 'ownership', target: 'ownership-changes', expectRoute: onCase('CS-2001') },
      {
        id: 'fix',
        target: 'signing',
        expectRoute: onCase('CS-2001'),
        done: (ctx) => ctx.dom('confirm-changes-dialog') || (!!ctx.caseOf('CS-2001') && evaluateRequirements(ctx.caseOf('CS-2001')!).length === 0),
      },
      {
        id: 'confirm',
        target: 'confirm-changes-dialog',
        expectRoute: onCase('CS-2001'),
        done: (ctx) => !!ctx.caseOf('CS-2001') && evaluateRequirements(ctx.caseOf('CS-2001')!).length === 0,
      },
      closeStep('CS-2001'),
      { id: 'resolution', target: 'resolution', route: '/cases/CS-2001?tab=resolution' },
    ],
  },
  {
    id: 'zatca-expiry',
    minutes: 5,
    level: 'Beginner',
    caseIds: ['CS-2011'],
    steps: [
      { id: 'banner', target: 'zatca-banner', route: '/cases/CS-2011' },
      { id: 'history', target: 'zatca-retrieval', route: '/cases/CS-2011' },
      startStep('CS-2011'),
      {
        id: 'retry',
        target: 'zatca-retry',
        expectRoute: onCase('CS-2011'),
        done: (ctx) => (ctx.caseOf('CS-2011')?.zatcaExpiry?.attempts.length ?? 0) >= 2,
      },
      {
        id: 'again',
        target: 'zatca-retry',
        expectRoute: onCase('CS-2011'),
        done: (ctx) => !!ctx.caseOf('CS-2011')?.zatcaExpiry?.renewed,
      },
      { id: 'renewed', target: 'zatca-certificate', expectRoute: onCase('CS-2011') },
      closeStep('CS-2011'),
    ],
  },
  {
    id: 'license-expiry',
    minutes: 8,
    level: 'Intermediate',
    caseIds: ['CS-2021'],
    steps: [
      { id: 'expired', target: 'expired-license', route: '/cases/CS-2021' },
      { id: 'task', target: 'borrower-task', route: '/cases/CS-2021' },
      {
        id: 'borrower',
        target: 'view-borrower-side',
        expectRoute: onCase('CS-2021'),
        done: (ctx) => ctx.dom('borrower-preview') || !!ctx.caseOf('CS-2021')?.licenseExpiry?.renewed,
      },
      {
        id: 'upload',
        target: 'borrower-upload-license',
        expectRoute: onCase('CS-2021'),
        done: (ctx) => !!ctx.caseOf('CS-2021')?.licenseExpiry?.renewed,
      },
      {
        id: 'back',
        target: 'borrower-preview',
        expectRoute: onCase('CS-2021'),
        done: (ctx) => !!ctx.caseOf('CS-2021')?.licenseExpiry?.renewed && !ctx.dom('borrower-preview'),
      },
      startStep('CS-2021'),
      {
        id: 'configure',
        target: 'renewed-license',
        expectRoute: onCase('CS-2021'),
        done: (ctx) => decision(ctx, 'CS-2021') === 'approved',
        wrong: (ctx) => decision(ctx, 'CS-2021') === 'rejected',
      },
      closeStep('CS-2021'),
    ],
  },
  {
    id: 'authorization',
    minutes: 6,
    level: 'Intermediate',
    caseIds: ['CS-2031'],
    steps: [
      { id: 'requester', target: 'requester', route: '/cases/CS-2031' },
      { id: 'permissions', target: 'auth-permissions', route: '/cases/CS-2031' },
      startStep('CS-2031'),
      {
        id: 'approve',
        target: 'decision-approve',
        expectRoute: onCase('CS-2031'),
        done: (ctx) => ctx.dom('confirm-approval-dialog') || !!decision(ctx, 'CS-2031'),
      },
      {
        id: 'confirm',
        target: 'confirm-approval-dialog',
        expectRoute: onCase('CS-2031'),
        done: (ctx) => decision(ctx, 'CS-2031') === 'approved',
        wrong: (ctx) => decision(ctx, 'CS-2031') === 'rejected',
      },
      { id: 'granted', target: 'auth-permissions', expectRoute: onCase('CS-2031') },
      closeStep('CS-2031', 'approved'),
    ],
  },
  {
    id: 'delegation',
    minutes: 7,
    level: 'Intermediate',
    caseIds: ['CS-2041'],
    steps: [
      { id: 'permissions', target: 'delegated-permissions', route: '/cases/CS-2041' },
      { id: 'delegators', target: 'delegator-list', route: '/cases/CS-2041' },
      startStep('CS-2041'),
      {
        id: 'add',
        target: 'add-delegator',
        expectRoute: onCase('CS-2041'),
        done: (ctx) => ctx.dom('delegator-dialog') || (ctx.caseOf('CS-2041')?.delegation?.delegators.length ?? 0) > 2,
      },
      {
        id: 'yakeen',
        target: 'delegator-dialog',
        expectRoute: onCase('CS-2041'),
        done: (ctx) => (ctx.caseOf('CS-2041')?.delegation?.delegators.length ?? 0) > 2,
      },
      {
        id: 'approve',
        target: 'decision-approve',
        expectRoute: onCase('CS-2041'),
        done: (ctx) => decision(ctx, 'CS-2041') === 'approved',
        wrong: (ctx) => decision(ctx, 'CS-2041') === 'rejected',
      },
      { id: 'sent', target: 'delegator-list', expectRoute: onCase('CS-2041') },
      closeStep('CS-2041', 'approved'),
    ],
  },
  {
    id: 'iban',
    minutes: 4,
    level: 'Beginner',
    caseIds: ['CS-2051'],
    steps: [
      { id: 'review', target: 'iban', route: '/cases/CS-2051' },
      startStep('CS-2051'),
      {
        id: 'reject',
        target: 'decision-reject',
        expectRoute: onCase('CS-2051'),
        done: (ctx) => ctx.dom('reject-dialog') || !!decision(ctx, 'CS-2051'),
      },
      {
        id: 'reason',
        target: 'reject-dialog',
        expectRoute: onCase('CS-2051'),
        done: (ctx) => decision(ctx, 'CS-2051') === 'rejected',
        wrong: (ctx) => decision(ctx, 'CS-2051') === 'approved',
      },
      closeStep('CS-2051', 'rejected'),
    ],
  },
  {
    id: 'compliance-docs',
    minutes: 5,
    level: 'Beginner',
    caseIds: ['CS-1863'],
    steps: [
      { id: 'documents', target: 'documents', route: '/cases/CS-1863?tab=documents' },
      {
        id: 'request',
        target: 'request-docs',
        expectRoute: onCase('CS-1863'),
        done: (ctx) => ctx.dom('request-docs-dialog') || (ctx.entityOf('CS-1863')?.complianceRequests?.length ?? 0) > 0,
      },
      {
        id: 'choose',
        target: 'request-docs-dialog',
        expectRoute: onCase('CS-1863'),
        done: (ctx) => (ctx.entityOf('CS-1863')?.complianceRequests?.length ?? 0) > 0,
      },
      { id: 'pending', target: 'compliance-row-pending', expectRoute: onCase('CS-1863') },
      {
        id: 'borrower',
        target: 'docs-borrower-side',
        expectRoute: onCase('CS-1863'),
        done: (ctx) => ctx.dom('borrower-preview') || !!ctx.entityOf('CS-1863')?.complianceRequests?.some((r) => r.status === 'uploaded'),
      },
      {
        id: 'upload',
        target: 'borrower-upload-doc',
        expectRoute: onCase('CS-1863'),
        done: (ctx) => !!ctx.entityOf('CS-1863')?.complianceRequests?.some((r) => r.status === 'uploaded'),
      },
      {
        id: 'uploaded',
        target: 'documents',
        expectRoute: onCase('CS-1863'),
        done: (ctx) => !!ctx.entityOf('CS-1863')?.complianceRequests?.some((r) => r.status === 'uploaded') && !ctx.dom('borrower-preview'),
      },
    ],
  },
  {
    id: 'reactivate-on-hold',
    minutes: 4,
    level: 'Beginner',
    caseIds: ['CS-1861'],
    steps: [
      {
        id: 'find',
        target: 'queue-table',
        route: '/cases',
        prepare: () => useQueueUi.setState({ search: '', view: 'table', filters: { status: ['on_hold'] }, page: 1 }),
      },
      {
        id: 'open',
        target: 'case-link-CS-1861',
        route: '/cases',
        done: (ctx) => onCase('CS-1861').test(ctx.path),
      },
      { id: 'paused', target: 'sla', route: '/cases/CS-1861' },
      {
        id: 'history',
        target: 'activity-log-tab',
        route: '/cases/CS-1861',
        done: (ctx) => ctx.dom('activity-log-panel'),
      },
      {
        id: 'reactivate',
        target: 'status-control',
        expectRoute: onCase('CS-1861'),
        done: (ctx) => status(ctx, 'CS-1861') === 'in_progress',
      },
      { id: 'resumed', target: 'sla', expectRoute: onCase('CS-1861') },
    ],
  },
];
