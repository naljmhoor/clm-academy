import type { CaseRecord } from '@/domain/types';

export interface TourCtx {
  /** Current route as "pathname?search". */
  path: string;
  caseOf: (id: string) => CaseRecord | undefined;
  /** True when an element with this data-tour anchor is on screen. */
  dom: (anchor: string) => boolean;
  me: string;
}

/**
 * Structure and behaviour of one step. Wording is not here: it comes from the
 * localized content files (content/en.ts, content/ar.ts) using the same step id.
 */
export interface TourStep {
  id: string;
  /** data-tour anchor to spotlight. Omit for a centred explanation card. */
  target?: string;
  /** Where the step happens; the engine navigates there when the step starts. */
  route?: string;
  /** If set and the trainee is elsewhere, the card offers to take them back. */
  expectRoute?: RegExp;
  /** Runs once when the step starts (e.g. set the queue search). */
  prepare?: () => void;
  /** Present on action steps: the step waits until this returns true. */
  done?: (ctx: TourCtx) => boolean;
  /** True when the trainee did something that defeats the step (message: content `wrong`). */
  wrong?: (ctx: TourCtx) => boolean;
}

export interface Tour {
  id: string;
  minutes: number;
  level: 'Beginner' | 'Intermediate';
  /** Cases restored to their starting state when the tour starts or restarts. */
  caseIds: string[];
  steps: TourStep[];
}
