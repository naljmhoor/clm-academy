import type { CaseStatus } from './types';

// Assumption (ANALYSIS.md Q1): the BRD does not define the full transition table.
// Closed is final; Need Info is only reachable once work has started.
// ASQ-5973: On Hold is set only by the system migration (Open → On Hold). An admin can move it
// to In Progress; no other transition into or out of On Hold exists.
const ALLOWED: Record<CaseStatus, CaseStatus[]> = {
  open: ['in_progress', 'closed'],
  in_progress: ['need_info', 'closed'],
  need_info: ['in_progress', 'closed'],
  on_hold: ['in_progress'],
  closed: [],
};

export function canTransition(from: CaseStatus, to: CaseStatus): boolean {
  return ALLOWED[from].includes(to);
}

export function transitionBlockReason(from: CaseStatus, to: CaseStatus): string | undefined {
  if (from === to) return 'Current status';
  if (from === 'closed') return 'Closed cases are read-only';
  if (to === 'on_hold') return 'Set only by the system migration';
  if (from === 'on_hold') return to === 'in_progress' ? undefined : 'An On Hold case can only move to In Progress';
  if (to === 'open') return 'A case cannot return to Open';
  if (to === 'need_info' && from === 'open') return 'Start work (In Progress) before requesting information';
  return canTransition(from, to) ? undefined : 'Not allowed from the current status';
}

export const STATUS_LABEL: Record<CaseStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  need_info: 'Need Info',
  on_hold: 'On Hold',
  closed: 'Closed',
};

export const STATUS_ORDER: CaseStatus[] = ['open', 'in_progress', 'need_info', 'on_hold', 'closed'];

/** Statuses during which the SLA clock is paused. */
export const PAUSED_STATUSES: CaseStatus[] = ['need_info', 'on_hold'];
