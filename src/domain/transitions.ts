import type { CaseStatus } from './types';

// Assumption (ANALYSIS.md Q1): the BRD does not define the full transition table.
// Closed is final; Need Info is only reachable once work has started.
const ALLOWED: Record<CaseStatus, CaseStatus[]> = {
  open: ['in_progress', 'closed'],
  in_progress: ['need_info', 'closed'],
  need_info: ['in_progress', 'closed'],
  closed: [],
};

export function canTransition(from: CaseStatus, to: CaseStatus): boolean {
  return ALLOWED[from].includes(to);
}

export function transitionBlockReason(from: CaseStatus, to: CaseStatus): string | undefined {
  if (from === to) return 'Current status';
  if (from === 'closed') return 'Closed cases are read-only';
  if (to === 'open') return 'A case cannot return to Open';
  if (to === 'need_info' && from === 'open') return 'Start work (In Progress) before requesting information';
  return canTransition(from, to) ? undefined : 'Not allowed from the current status';
}

export const STATUS_LABEL: Record<CaseStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  need_info: 'Need Info',
  closed: 'Closed',
};

export const STATUS_ORDER: CaseStatus[] = ['open', 'in_progress', 'need_info', 'closed'];
