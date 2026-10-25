// Training-layer state: learning progress (persisted locally) and Academy UI state.
// Nothing here is part of the CLM simulator; the CLM store never imports this file.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ProgressStatus = 'started' | 'completed';

export interface TourProgress {
  status: ProgressStatus;
  step: number;
  updatedAt: string;
}

export interface PracticeProgress {
  status: ProgressStatus;
  /** Task ids the trainee has completed (latched once satisfied). */
  done: string[];
  hintsShown: string[];
  failed?: string;
  updatedAt: string;
}

interface AcademyState {
  // Persisted progress
  tours: Record<string, TourProgress>;
  practice: Record<string, PracticeProgress>;
  welcomed: boolean;
  helpHints: boolean;

  // Active session (persisted so a refresh resumes where the trainee was)
  activeTour: { id: string; step: number } | null;
  activePractice: string | null;

  // UI only
  assistantOpen: boolean;
  assistantArticle: string | null;
  location: { pathname: string; search: string };

  startTour: (id: string, step?: number) => void;
  setTourStep: (step: number) => void;
  completeTour: () => void;
  exitTour: () => void;

  startPractice: (id: string) => void;
  markTask: (scenarioId: string, taskId: string) => void;
  showHint: (scenarioId: string, taskId: string) => void;
  failPractice: (scenarioId: string, reason: string) => void;
  completePractice: (scenarioId: string) => void;
  exitPractice: () => void;

  openAssistant: (articleId?: string | null) => void;
  closeAssistant: () => void;
  setHelpHints: (v: boolean) => void;
  setWelcomed: () => void;
  setLocation: (pathname: string, search: string) => void;
  resetProgress: () => void;
}

const now = () => new Date().toISOString();

export const useAcademy = create<AcademyState>()(
  persist(
    (set, get) => ({
      tours: {},
      practice: {},
      welcomed: false,
      helpHints: true,
      activeTour: null,
      activePractice: null,
      assistantOpen: false,
      assistantArticle: null,
      location: { pathname: '/', search: '' },

      startTour: (id, step = 0) =>
        set((s) => ({
          activeTour: { id, step },
          activePractice: null,
          tours: { ...s.tours, [id]: { status: s.tours[id]?.status === 'completed' ? 'completed' : 'started', step, updatedAt: now() } },
        })),
      setTourStep: (step) => {
        const t = get().activeTour;
        if (!t) return;
        set((s) => ({ activeTour: { ...t, step }, tours: { ...s.tours, [t.id]: { ...(s.tours[t.id] ?? { status: 'started' }), step, updatedAt: now() } } }));
      },
      completeTour: () => {
        const t = get().activeTour;
        if (!t) return;
        set((s) => ({ tours: { ...s.tours, [t.id]: { status: 'completed', step: 0, updatedAt: now() } } }));
      },
      exitTour: () => set({ activeTour: null }),

      startPractice: (id) =>
        set((s) => ({
          activePractice: id,
          activeTour: null,
          practice: { ...s.practice, [id]: { status: s.practice[id]?.status === 'completed' ? 'completed' : 'started', done: [], hintsShown: [], updatedAt: now() } },
        })),
      markTask: (sid, taskId) =>
        set((s) => {
          const p = s.practice[sid];
          if (!p || p.done.includes(taskId)) return s;
          return { practice: { ...s.practice, [sid]: { ...p, done: [...p.done, taskId], updatedAt: now() } } };
        }),
      showHint: (sid, taskId) =>
        set((s) => {
          const p = s.practice[sid];
          if (!p || p.hintsShown.includes(taskId)) return s;
          return { practice: { ...s.practice, [sid]: { ...p, hintsShown: [...p.hintsShown, taskId] } } };
        }),
      failPractice: (sid, reason) => set((s) => ({ practice: { ...s.practice, [sid]: { ...s.practice[sid], failed: reason, updatedAt: now() } } })),
      completePractice: (sid) => set((s) => ({ practice: { ...s.practice, [sid]: { ...s.practice[sid], status: 'completed', updatedAt: now() } } })),
      exitPractice: () => set({ activePractice: null }),

      openAssistant: (articleId = null) => set({ assistantOpen: true, assistantArticle: articleId }),
      closeAssistant: () => set({ assistantOpen: false, assistantArticle: null }),
      setHelpHints: (helpHints) => set({ helpHints }),
      setWelcomed: () => set({ welcomed: true }),
      setLocation: (pathname, search) => set({ location: { pathname, search } }),
      resetProgress: () => set({ tours: {}, practice: {}, activeTour: null, activePractice: null }),
    }),
    {
      name: 'clm-academy:progress:v1',
      partialize: (s) => ({ tours: s.tours, practice: s.practice, welcomed: s.welcomed, helpHints: s.helpHints, activeTour: s.activeTour, activePractice: s.activePractice }),
    },
  ),
);

/** Current case and tab derived from the tracked route. */
export function routeContext(loc: { pathname: string; search: string }) {
  const m = loc.pathname.match(/^\/cases\/([^/]+)/);
  const params = new URLSearchParams(loc.search);
  const module = loc.pathname.startsWith('/cases/') ? 'case-workspace' : loc.pathname.startsWith('/cases') ? 'case-queue' : loc.pathname.startsWith('/entities') ? 'entities' : loc.pathname.startsWith('/academy') ? 'academy' : 'other';
  return { module, caseId: m?.[1], tab: params.get('tab') ?? (m ? 'overview' : undefined) } as const;
}
