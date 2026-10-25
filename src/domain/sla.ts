import type { CaseRecord } from './types';

// UC001 SLA rules: <75 % On Track, 75–<100 % At Risk, ≥100 % Breached.
// SLA runs while Open / In Progress, pauses in Need Info, stops at Closed.

export type SlaStatus = 'on_track' | 'at_risk' | 'breached' | 'met';

export interface SlaSnapshot {
  status: SlaStatus;
  paused: boolean;
  /** 0..n, fraction of the SLA consumed. */
  consumed: number;
  /** Positive = remaining, negative = overdue (ms). */
  remainingMs: number;
  /** Working time spent on the case (ms), excluding Need Info pauses. */
  elapsedMs: number;
}

export const AT_RISK_THRESHOLD = 0.75;

export function computeSla(c: Pick<CaseRecord, 'createdAt' | 'dueAt' | 'closedAt' | 'pausedMs' | 'pausedSince' | 'status'>, now = Date.now()): SlaSnapshot {
  const created = Date.parse(c.createdAt);
  const total = Date.parse(c.dueAt) - created;
  const end = c.closedAt ? Date.parse(c.closedAt) : now;
  const currentPause = c.pausedSince ? end - Date.parse(c.pausedSince) : 0;
  const elapsed = Math.max(0, end - created - c.pausedMs - currentPause);
  const consumed = total > 0 ? elapsed / total : 1;
  const remainingMs = total - elapsed;

  let status: SlaStatus;
  if (c.status === 'closed') status = remainingMs >= 0 ? 'met' : 'breached';
  else if (consumed >= 1) status = 'breached';
  else if (consumed >= AT_RISK_THRESHOLD) status = 'at_risk';
  else status = 'on_track';

  return { status, paused: c.status === 'need_info', consumed, remainingMs, elapsedMs: elapsed };
}

/** "2d", "17h", "32m" — matches the CLM chips. */
export function shortDuration(ms: number): string {
  const abs = Math.abs(ms);
  const min = Math.floor(abs / 60000);
  if (min < 60) return `${Math.max(min, 1)}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

/** "3h 22m" — used for Time Tracking on closed cases. */
export function longDuration(ms: number): string {
  const min = Math.max(0, Math.round(ms / 60000));
  const d = Math.floor(min / 1440);
  const h = Math.floor((min % 1440) / 60);
  const m = min % 60;
  const parts: string[] = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m || parts.length === 0) parts.push(`${m}m`);
  return parts.join(' ');
}

export function slaChipLabel(s: SlaSnapshot, closed: boolean): string {
  if (closed && s.status === 'met') return 'SLA met';
  return s.remainingMs >= 0 ? `${shortDuration(s.remainingMs)} left` : `${shortDuration(s.remainingMs)} overdue`;
}

export const SLA_STATUS_LABEL: Record<SlaStatus, string> = {
  on_track: 'On Track',
  at_risk: 'At Risk',
  breached: 'Breached',
  met: 'SLA met',
};
