// Guided walkthroughs: structure, targets and completion logic only.
// All wording lives in ./content/en.ts and ./content/ar.ts (see ./i18n.ts), keyed by tour and step id.
// Targets are data-tour anchors in the CLM UI; action steps (those with done()) wait for real state changes.

import { evaluateRequirements } from '@/domain/eddRules';
import { useQueueUi } from '@/store/queueUiStore';
import type { Tour, TourCtx } from './types';

const focusQueueOn = (caseId: string) => () => useQueueUi.setState({ search: caseId, view: 'table', filters: {}, page: 1 });
const onCase = (id: string) => new RegExp(`^/cases/${id}(\\?|$)`);
const reqKeys = (ctx: TourCtx, id: string) => {
  const c = ctx.caseOf(id);
  return c ? evaluateRequirements(c).map((r) => r.key) : [];
};

export const TOURS: Tour[] = [
  {
    id: 'intro',
    minutes: 5,
    level: 'Beginner',
    caseIds: [],
    steps: [
      {
        id: 'welcome',
      },
      {
        id: 'why',
      },
      {
        id: 'nav',
        target: 'nav-case-queue',
        route: '/cases',
        prepare: () => useQueueUi.setState({ search: '', view: 'table', filters: {}, page: 1 }),
      },
      {
        id: 'intake',
        target: 'queue-table',
        route: '/cases',
      },
      {
        id: 'status',
        target: 'queue-col-status',
        route: '/cases',
      },
      {
        id: 'priority',
        target: 'queue-col-priority',
        route: '/cases',
      },
      {
        id: 'sla',
        target: 'queue-col-sla',
        route: '/cases',
      },
      {
        id: 'assignee',
        target: 'queue-col-assignee',
        route: '/cases',
      },
      {
        id: 'views',
        target: 'queue-view-toggle',
        route: '/cases',
      },
      {
        id: 'filters',
        target: 'queue-filters',
        route: '/cases',
      },
      {
        id: 'open',
        target: 'case-link-CS-1847',
        route: '/cases',
        prepare: focusQueueOn('CS-1847'),
        done: (ctx) => onCase('CS-1847').test(ctx.path),
      },
      {
        id: 'workspace',
        target: 'workspace-header',
        expectRoute: onCase('CS-1847'),
        route: '/cases/CS-1847',
      },
    ],
  },
  {
    id: 'first-edd',
    minutes: 8,
    level: 'Beginner',
    caseIds: ['CS-1847'],
    steps: [
      {
        id: 'pick',
        target: 'case-link-CS-1847',
        route: '/cases',
        prepare: focusQueueOn('CS-1847'),
        done: (ctx) => onCase('CS-1847').test(ctx.path),
      },
      {
        id: 'summary',
        target: 'workspace-header',
        route: '/cases/CS-1847',
      },
      {
        id: 'assign',
        target: 'assignment',
        route: '/cases/CS-1847',
        done: (ctx) => ctx.caseOf('CS-1847')?.assigneeId === ctx.me,
      },
      {
        id: 'start',
        target: 'status-control',
        route: '/cases/CS-1847',
        done: (ctx) => ctx.caseOf('CS-1847')?.status === 'in_progress',
        wrong: (ctx) => ctx.caseOf('CS-1847')?.status === 'closed',
      },
      {
        id: 'client',
        target: 'entity-details',
        route: '/cases/CS-1847',
      },
      {
        id: 'kyc',
        target: 'kyc',
        route: '/cases/CS-1847',
      },
      {
        id: 'kyb',
        target: 'kyb',
        route: '/cases/CS-1847',
      },
      {
        id: 'address',
        target: 'address',
        route: '/cases/CS-1847',
      },
      {
        id: 'aml',
        target: 'aml',
        route: '/cases/CS-1847',
      },
      {
        id: 'required',
        target: 'required-before-closing',
        route: '/cases/CS-1847',
      },
      {
        id: 'prepare',
      },
    ],
  },
  {
    id: 'missing-info',
    minutes: 7,
    level: 'Intermediate',
    caseIds: ['CS-1845'],
    steps: [
      {
        id: 'missing',
        target: 'required-before-closing',
        route: '/cases/CS-1845',
      },
      {
        id: 'failed',
        target: 'address',
        route: '/cases/CS-1845?tab=overview&focus=address',
      },
      {
        id: 'retry',
        target: 'address-retry',
        expectRoute: onCase('CS-1845'),
        done: (ctx) => (ctx.caseOf('CS-1845')?.edd.address.attempts ?? 0) >= 2,
      },
      {
        id: 'still-failing',
        target: 'address',
        expectRoute: onCase('CS-1845'),
      },
      {
        id: 'edit',
        target: 'address-edit',
        expectRoute: onCase('CS-1845'),
        done: (ctx) => ctx.dom('address-dialog') || ctx.caseOf('CS-1845')?.edd.address.status === 'success',
      },
      {
        id: 'manual',
        target: 'address-mode-manual',
        expectRoute: onCase('CS-1845'),
        done: (ctx) => ctx.dom('address-manual-form') || ctx.caseOf('CS-1845')?.edd.address.status === 'success',
      },
      {
        id: 'fill',
        target: 'address-dialog',
        expectRoute: onCase('CS-1845'),
        done: (ctx) => ctx.dom('address-review-dialog') || ctx.caseOf('CS-1845')?.edd.address.status === 'success',
      },
      {
        id: 'confirm',
        target: 'address-review-dialog',
        expectRoute: onCase('CS-1845'),
        done: (ctx) => ctx.caseOf('CS-1845')?.edd.address.status === 'success',
      },
      {
        id: 'recheck',
        target: 'required-before-closing',
        route: '/cases/CS-1845',
      },
    ],
  },
  {
    id: 'signing',
    minutes: 7,
    level: 'Intermediate',
    caseIds: ['CS-1849'],
    steps: [
      {
        id: 'owners',
        target: 'owners',
        route: '/cases/CS-1849?tab=ownership',
      },
      {
        id: 'hierarchy',
        target: 'hierarchy-retrieve',
        route: '/cases/CS-1849?tab=ownership',
        done: (ctx) => {
          const c = ctx.caseOf('CS-1849');
          return !!c && Object.values(c.edd.hierarchy.nodes).some((n) => n.kind === 'company' && n.id !== c.edd.hierarchy.rootId && !!n.children?.length);
        },
      },
      {
        id: 'authority',
        target: 'signing',
        expectRoute: onCase('CS-1849'),
      },
      {
        id: 'bot',
        target: 'view-bot-result',
        expectRoute: onCase('CS-1849'),
        done: (ctx) => ctx.dom('bot-result-dialog') || ctx.caseOf('CS-1849')?.edd.signing.method === 'bot',
      },
      {
        id: 'joint',
        target: 'bot-result-dialog',
        expectRoute: onCase('CS-1849'),
        done: (ctx) => ctx.caseOf('CS-1849')?.edd.signing.method === 'bot',
      },
      {
        id: 'docs',
        target: 'signing-docs',
        expectRoute: onCase('CS-1849'),
      },
      {
        id: 'resolved',
        target: 'case-rail',
        expectRoute: onCase('CS-1849'),
      },
    ],
  },
  {
    id: 'license',
    minutes: 5,
    level: 'Intermediate',
    caseIds: ['CS-1851'],
    steps: [
      {
        id: 'list',
        target: 'licenses',
        route: '/cases/CS-1851?tab=license',
      },
      {
        id: 'existing',
        target: 'license-1',
        route: '/cases/CS-1851?tab=license',
        done: (ctx) => {
          const l = ctx.caseOf('CS-1851')?.edd.licenses[0];
          return !!l?.category && !!l?.authority;
        },
      },
      {
        id: 'add',
        target: 'license-add',
        expectRoute: onCase('CS-1851'),
        done: (ctx) => ctx.dom('license-new') || (ctx.caseOf('CS-1851')?.edd.licenses.length ?? 0) > 1,
      },
      {
        id: 'new',
        target: 'license-new',
        expectRoute: onCase('CS-1851'),
      },
      {
        id: 'effect',
        target: 'case-rail',
        expectRoute: onCase('CS-1851'),
      },
    ],
  },
  {
    id: 'close-edd',
    minutes: 9,
    level: 'Intermediate',
    caseIds: ['CS-1843'],
    steps: [
      {
        id: 'review',
        target: 'required-before-closing',
        route: '/cases/CS-1843',
      },
      {
        id: 'attempt',
        target: 'status-control',
        expectRoute: onCase('CS-1843'),
        done: (ctx) => ctx.dom('blocked-dialog') || (ctx.caseOf('CS-1843') ? reqKeys(ctx, 'CS-1843').length === 0 : false),
      },
      {
        id: 'feedback',
        target: 'blocked-dialog',
        expectRoute: onCase('CS-1843'),
        done: (ctx) => !ctx.dom('blocked-dialog'),
      },
      {
        id: 'signing',
        target: 'signing',
        route: '/cases/CS-1843?tab=ownership&focus=signing',
        done: (ctx) => !reqKeys(ctx, 'CS-1843').includes('signing'),
      },
      {
        id: 'license',
        target: 'license-1',
        route: '/cases/CS-1843?tab=license&focus=license-1',
        done: (ctx) => !reqKeys(ctx, 'CS-1843').includes('licenses'),
      },
      {
        id: 'close',
        target: 'status-control',
        expectRoute: onCase('CS-1843'),
        done: (ctx) => ctx.caseOf('CS-1843')?.status === 'closed',
        wrong: (ctx) => ctx.caseOf('CS-1843')?.resolution === 'rejected',
      },
      {
        id: 'resolution',
        target: 'resolution',
        route: '/cases/CS-1843?tab=resolution',
      },
      {
        id: 'recorded',
        target: 'system-recorded',
        route: '/cases/CS-1843?tab=resolution',
      },
      {
        id: 'history',
        target: 'activity-log-tab',
        route: '/cases/CS-1843?tab=resolution',
        done: (ctx) => ctx.dom('activity-log-panel'),
      },
    ],
  },
];

export const tourById = (id: string) => TOURS.find((t) => t.id === id);
