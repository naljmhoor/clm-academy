import type { CaseRecord } from '@/domain/types';

export interface TourCtx {
  /** Current route as "pathname?search". */
  path: string;
  caseOf: (id: string) => CaseRecord | undefined;
  /** True when an element with this data-tour anchor is on screen. */
  dom: (anchor: string) => boolean;
  me: string;
}

export interface TourStep {
  id: string;
  title: string;
  body: string;
  /** data-tour anchor to spotlight. Omit for a centred explanation card. */
  target?: string;
  /** Where the step happens; the engine navigates there when the step starts. */
  route?: string;
  /** If set and the trainee is elsewhere, the card offers to take them back. */
  expectRoute?: RegExp;
  /** Runs once when the step starts (e.g. set the queue search). */
  prepare?: () => void;
  /** Instruction for an action step. The step waits until done() is true. */
  action?: string;
  done?: (ctx: TourCtx) => boolean;
  /** Returns feedback when the trainee did something that defeats the step. */
  wrong?: (ctx: TourCtx) => string | undefined;
}

export interface Tour {
  id: string;
  title: string;
  summary: string;
  minutes: number;
  level: 'Beginner' | 'Intermediate';
  /** Cases restored to their starting state when the tour starts or restarts. */
  caseIds: string[];
  steps: TourStep[];
}
