import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { BookOpen, Check, ChevronDown, ChevronUp, CircleAlert, Dumbbell, Lightbulb, RotateCcw, X } from 'lucide-react';
import { useClm } from '@/store/caseStore';
import { useAcademy } from '../academyStore';
import { SCENARIOS, scenarioById } from './scenarios';
import type { TourCtx } from '../tours/types';

/** Starts (or restarts) a scenario: restores its case and opens the Case Queue. */
export function startScenario(id: string, navigate: (to: string) => void) {
  const s = scenarioById(id);
  if (!s) return;
  useClm.getState().resetCases([s.caseId]);
  useAcademy.getState().startPractice(id);
  navigate(s.tasks[0]?.id === 'open' ? '/cases' : `/cases/${s.caseId}`);
}

export function PracticePanel() {
  const id = useAcademy((s) => s.activePractice);
  const scenario = id ? scenarioById(id) : undefined;
  if (!scenario) return null;
  return <Panel key={scenario.id} scenarioId={scenario.id} />;
}

function Panel({ scenarioId }: { scenarioId: string }) {
  const s = scenarioById(scenarioId)!;
  const progress = useAcademy((st) => st.practice[scenarioId]);
  const assistantOpen = useAcademy((st) => st.assistantOpen);
  const { markTask, showHint, failPractice, completePractice, exitPractice, openAssistant } = useAcademy();
  const loc = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [showSolution, setShowSolution] = useState(false);
  const [quizPick, setQuizPick] = useState<number | null>(null);

  const ctx = useCallback(
    (): TourCtx => ({
      path: `${loc.pathname}${loc.search}`,
      caseOf: (cid) => useClm.getState().cases.find((c) => c.id === cid),
      dom: (a) => !!document.querySelector(`[data-tour="${a}"]`),
      me: useClm.getState().currentUserId,
    }),
    [loc.pathname, loc.search],
  );

  // Latch tasks as they are satisfied; detect mistakes.
  useEffect(() => {
    const check = () => {
      const p = useAcademy.getState().practice[scenarioId];
      if (!p || p.status === 'completed' || p.failed) return;
      const c = ctx();
      const reason = s.fail?.(c);
      if (reason) return failPractice(scenarioId, reason);
      s.tasks.forEach((t) => !p.done.includes(t.id) && t.check(c) && markTask(scenarioId, t.id));
    };
    check();
    const unsub = useClm.subscribe(check);
    const t = setInterval(check, 400);
    return () => {
      unsub();
      clearInterval(t);
    };
  }, [ctx, s, scenarioId, markTask, failPractice]);

  const done = progress?.done ?? [];
  const tasksDone = s.tasks.every((t) => done.includes(t.id));
  const quizOk = !s.quiz || quizPick === s.quiz.answer;
  useEffect(() => {
    if (tasksDone && quizOk && progress?.status !== 'completed' && !progress?.failed) completePractice(scenarioId);
  }, [tasksDone, quizOk, progress?.status, progress?.failed, completePractice, scenarioId]);

  const completed = progress?.status === 'completed' && tasksDone && quizOk;
  const next = SCENARIOS[SCENARIOS.findIndex((x) => x.id === scenarioId) + 1];
  const restart = () => {
    setShowSolution(false);
    setQuizPick(null);
    startScenario(scenarioId, navigate);
  };

  return (
    <div
      data-training-layer
      role="region"
      aria-label={`Practice scenario: ${s.title}`}
      className={clsx('fixed bottom-4 z-[55] w-[360px] rounded-xl border border-academy/30 bg-white shadow-pop', assistantOpen ? 'right-[436px]' : 'right-4')}
    >
      <div className="flex items-center gap-2 rounded-t-xl bg-academy px-4 py-2 text-xs text-white">
        <Dumbbell className="h-3.5 w-3.5" />
        <span className="flex-1 truncate font-medium">Practice · {s.title}</span>
        <button type="button" onClick={() => setOpen(!open)} aria-label={open ? 'Minimise' : 'Expand'} className="rounded p-0.5 hover:bg-white/15">
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        </button>
        <button type="button" onClick={restart} aria-label="Restart scenario" title="Restart scenario" className="rounded p-0.5 hover:bg-white/15">
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={exitPractice} aria-label="Exit practice" title="Exit practice" className="rounded p-0.5 hover:bg-white/15">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {open && (
        <div className="max-h-[60vh] overflow-y-auto px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded bg-academy-soft px-1.5 py-0.5 font-medium text-academy">{s.difficulty}</span>
            <span className="text-ink-muted">Case {s.caseId}</span>
          </div>
          <p className="mt-2 text-ink-soft">{s.context}</p>
          <p className="mt-2 font-medium">Objective: {s.objective}</p>

          {progress?.failed ? (
            <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-red-800">
              <div className="flex items-center gap-1.5 font-medium">
                <CircleAlert className="h-4 w-4" />
                Not quite
              </div>
              <p className="mt-1 text-xs">{progress.failed}</p>
              <button type="button" onClick={restart} className="mt-2 text-xs font-medium underline">
                Restart scenario
              </button>
            </div>
          ) : (
            <ol className="mt-3 space-y-2">
              {s.tasks.map((t, i) => {
                const ok = done.includes(t.id);
                const hint = progress?.hintsShown.includes(t.id);
                return (
                  <li key={t.id} className="flex gap-2">
                    <span className={clsx('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-2xs font-semibold', ok ? 'bg-green-600 text-white' : 'border border-line text-ink-muted')}>
                      {ok ? <Check className="h-3 w-3" /> : i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className={clsx(ok && 'text-ink-muted line-through')}>{t.label}</div>
                      {!ok &&
                        (hint ? (
                          <div className="mt-1 flex gap-1.5 rounded bg-yellow-50 px-2 py-1 text-xs text-yellow-900">
                            <Lightbulb className="mt-0.5 h-3 w-3 shrink-0" />
                            {t.hint}
                          </div>
                        ) : (
                          <button type="button" onClick={() => showHint(scenarioId, t.id)} className="mt-0.5 text-xs text-academy hover:underline">
                            Show hint
                          </button>
                        ))}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          {s.quiz && tasksDone && !progress?.failed && (
            <div className="mt-3 rounded-md border border-line p-3">
              <div className="font-medium">{s.quiz.question}</div>
              <div className="mt-2 space-y-1">
                {s.quiz.options.map((o, i) => (
                  <label key={o} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input type="radio" name={`quiz-${s.id}`} checked={quizPick === i} onChange={() => setQuizPick(i)} />
                    {o}
                  </label>
                ))}
              </div>
              {quizPick !== null && (
                <p className={clsx('mt-2 text-xs', quizPick === s.quiz.answer ? 'text-green-700' : 'text-red-700')}>{quizPick === s.quiz.answer ? s.quiz.explanation : 'Not correct — check the Resolution tab again.'}</p>
              )}
            </div>
          )}

          {completed && (
            <div className="mt-3 rounded-md bg-green-50 px-3 py-2 text-green-800">
              <div className="flex items-center gap-1.5 font-medium">
                <Check className="h-4 w-4" />
                Scenario complete
              </div>
              <p className="mt-1 text-xs">Well done. The simulator now reflects your work; restart to repeat it from the beginning.</p>
              <div className="mt-2 flex gap-3 text-xs font-medium">
                {next && (
                  <button type="button" className="underline" onClick={() => startScenario(next.id, navigate)}>
                    Next scenario
                  </button>
                )}
                <button type="button" className="underline" onClick={() => (exitPractice(), navigate('/academy/practice'))}>
                  Return to Academy
                </button>
              </div>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-2 text-xs">
            <button type="button" className="text-academy hover:underline" onClick={() => setShowSolution(!showSolution)}>
              {showSolution ? 'Hide explanation' : 'Explain the solution'}
            </button>
            {s.relatedArticle && (
              <button type="button" className="flex items-center gap-1 text-academy hover:underline" onClick={() => openAssistant(s.relatedArticle)}>
                <BookOpen className="h-3 w-3" />
                Related article
              </button>
            )}
            <span className="flex-1" />
            <button type="button" className="text-ink-muted hover:text-ink" onClick={() => (exitPractice(), navigate('/academy/practice'))}>
              Return to Academy
            </button>
          </div>
          {showSolution && (
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-ink-soft">
              {s.solution.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
