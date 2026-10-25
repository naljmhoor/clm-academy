// Walkthrough engine: spotlights real CLM elements (by data-tour anchor), navigates between
// screens, waits for action steps to be performed, and recovers when a target is missing.

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowLeft, Check, CircleAlert, GraduationCap, MousePointerClick, RotateCcw, X } from 'lucide-react';
import { useClm } from '@/store/caseStore';
import { useAcademy } from '../academyStore';
import { TOURS, tourById } from './tours';
import type { TourCtx, TourStep } from './types';

const PAD = 6;
const CARD_W = 360;

const findTarget = (anchor?: string) => (anchor ? document.querySelector<HTMLElement>(`[data-tour="${anchor}"]`) : null);

function routeMatches(route: string, pathname: string, search: string) {
  const [p, q] = route.split('?');
  if (p !== pathname) return false;
  const want = new URLSearchParams(q ?? '');
  const have = new URLSearchParams(search);
  for (const [k, v] of want) if (k !== 'focus' && have.get(k) !== v) return false;
  return true;
}

function useCtx(): () => TourCtx {
  const loc = useLocation();
  return useCallback(
    () => ({
      path: `${loc.pathname}${loc.search}`,
      caseOf: (id: string) => useClm.getState().cases.find((c) => c.id === id),
      dom: (a: string) => !!findTarget(a),
      me: useClm.getState().currentUserId,
    }),
    [loc.pathname, loc.search],
  );
}

/** Starts (or restarts) a tour: resets its cases, then opens step 0. */
export function startTour(id: string, step = 0) {
  const t = tourById(id);
  if (!t) return;
  if (step === 0 && t.caseIds.length) useClm.getState().resetCases(t.caseIds);
  useAcademy.getState().startTour(id, step);
}

export function TourHost() {
  const active = useAcademy((s) => s.activeTour);
  const tour = active ? tourById(active.id) : undefined;
  if (!active || !tour) return null;
  return <TourRunner key={`${tour.id}`} tourId={tour.id} stepIndex={Math.min(active.step, tour.steps.length - 1)} />;
}

function TourRunner({ tourId, stepIndex }: { tourId: string; stepIndex: number }) {
  const tour = tourById(tourId)!;
  const step: TourStep = tour.steps[stepIndex];
  const { setTourStep, exitTour, completeTour } = useAcademy();
  const navigate = useNavigate();
  const loc = useLocation();
  const ctx = useCtx();
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [missing, setMissing] = useState(false);
  const [done, setDone] = useState(false);
  const [wrong, setWrong] = useState<string>();
  const [finished, setFinished] = useState(false);
  const scrolledFor = useRef<string | null>(null);
  const isLast = stepIndex === tour.steps.length - 1;
  const onExpected = !step.expectRoute || step.expectRoute.test(loc.pathname + loc.search) || (step.route ? routeMatches(step.route, loc.pathname, loc.search) : false);

  // Enter step: prepare + navigate.
  useEffect(() => {
    setDone(false);
    setWrong(undefined);
    setMissing(false);
    scrolledFor.current = null;
    step.prepare?.();
    if (step.route && !routeMatches(step.route, loc.pathname, loc.search)) navigate(step.route);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourId, stepIndex]);

  // Track the target element every frame (layout shifts, scrolling, dialogs opening).
  useLayoutEffect(() => {
    let raf = 0;
    const started = Date.now();
    const tick = () => {
      const el = findTarget(step.target);
      if (el) {
        if (scrolledFor.current !== step.id) {
          scrolledFor.current = step.id;
          el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
        const r = el.getBoundingClientRect();
        setRect((prev) => (prev && prev.x === r.x && prev.y === r.y && prev.width === r.width && prev.height === r.height ? prev : r));
        setMissing(false);
      } else {
        setRect(null);
        if (step.target && Date.now() - started > 2500) setMissing(true);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [step.id, step.target]);

  // Evaluate action completion against live state.
  useEffect(() => {
    if (!step.done) return;
    const check = () => {
      const c = ctx();
      if (step.done!(c)) setDone(true);
      setWrong(step.wrong?.(c));
    };
    check();
    const unsub = useClm.subscribe(check);
    const t = setInterval(check, 300);
    return () => {
      unsub();
      clearInterval(t);
    };
  }, [step, ctx]);

  // Auto-advance shortly after an action step is completed.
  useEffect(() => {
    if (!done || !step.action) return;
    const t = setTimeout(() => (isLast ? finish() : setTourStep(stepIndex + 1)), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const finish = () => {
    completeTour();
    setFinished(true);
  };
  const restart = () => startTour(tourId, 0);

  const nextTour = TOURS[TOURS.findIndex((t) => t.id === tourId) + 1];

  if (finished) {
    return createPortal(
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30">
        <div role="dialog" aria-label="Tour complete" className="w-[420px] rounded-xl bg-white p-6 shadow-pop">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-700">
            <Check className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold">Tour complete</h2>
          <p className="mt-1 text-sm text-ink-muted">You finished “{tour.title}”. Your progress is saved in this browser.</p>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button type="button" className="h-9 rounded-md border border-line px-3 text-sm font-medium hover:bg-surface-sunken" onClick={() => (exitTour(), navigate('/academy/learn'))}>
              Back to Academy
            </button>
            <button type="button" className="h-9 rounded-md border border-line px-3 text-sm font-medium hover:bg-surface-sunken" onClick={() => exitTour()}>
              Keep exploring
            </button>
            {nextTour && (
              <button type="button" className="h-9 rounded-md bg-academy px-3 text-sm font-medium text-white hover:bg-academy/90" onClick={() => startTour(nextTour.id)}>
                Next: {nextTour.title}
              </button>
            )}
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  const blocking = !step.action; // explanation steps block clicks outside the spotlight
  const hole = rect ? { x: rect.left - PAD, y: rect.top - PAD, w: rect.width + PAD * 2, h: rect.height + PAD * 2 } : null;

  return createPortal(
    <>
      {/* Dimmer with a cut-out. Built from four panels so the target itself stays clickable. */}
      {hole ? (
        <>
          <div aria-hidden className="pointer-events-none fixed z-40 rounded-lg ring-2 ring-academy transition-all duration-150" style={{ left: hole.x, top: hole.y, width: hole.w, height: hole.h, boxShadow: `0 0 0 9999px rgba(15,23,42,${blocking ? 0.45 : 0.25})` }} />
          {blocking && (
            <>
              <div className="fixed left-0 right-0 top-0 z-40" style={{ height: Math.max(0, hole.y) }} />
              <div className="fixed bottom-0 left-0 right-0 z-40" style={{ top: hole.y + hole.h }} />
              <div className="fixed left-0 z-40" style={{ top: hole.y, height: hole.h, width: Math.max(0, hole.x) }} />
              <div className="fixed right-0 z-40" style={{ top: hole.y, height: hole.h, left: hole.x + hole.w }} />
            </>
          )}
        </>
      ) : (
        !step.target && <div className="fixed inset-0 z-40 bg-slate-900/45" />
      )}
      <TourCard
        hole={hole}
        tourTitle={tour.title}
        index={stepIndex}
        total={tour.steps.length}
        step={step}
        done={done}
        wrong={wrong}
        missing={missing && !rect}
        offRoute={!onExpected}
        onBack={() => setTourStep(stepIndex - 1)}
        onNext={() => (isLast ? finish() : setTourStep(stepIndex + 1))}
        onSkip={() => (isLast ? finish() : setTourStep(stepIndex + 1))}
        onExit={exitTour}
        onRestart={restart}
        onGoBack={() => step.route && navigate(step.route)}
      />
    </>,
    document.body,
  );
}

interface CardProps {
  hole: { x: number; y: number; w: number; h: number } | null;
  tourTitle: string;
  index: number;
  total: number;
  step: TourStep;
  done: boolean;
  wrong?: string;
  missing: boolean;
  offRoute: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  onExit: () => void;
  onRestart: () => void;
  onGoBack: () => void;
}

function TourCard(p: CardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: CARD_W, h: 220 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && (el.offsetWidth !== size.w || el.offsetHeight !== size.h)) setSize({ w: el.offsetWidth, h: el.offsetHeight });
  });

  const pos = useMemo(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (!p.hole) return { left: (vw - size.w) / 2, top: Math.max(24, (vh - size.h) / 2) };
    const { x, y, w, h } = p.hole;
    const gap = 12;
    const below = y + h + gap;
    const above = y - gap - size.h;
    const clampX = (v: number) => Math.min(Math.max(12, v), vw - size.w - 12);
    const clampY = (v: number) => Math.min(Math.max(12, v), vh - size.h - 12);
    if (below + size.h < vh) return { left: clampX(x), top: below };
    if (above > 0) return { left: clampX(x), top: above };
    if (x + w + gap + size.w < vw) return { left: x + w + gap, top: clampY(y) };
    if (x - gap - size.w > 0) return { left: x - gap - size.w, top: clampY(y) };
    return { left: vw - size.w - 16, top: vh - size.h - 16 };
  }, [p.hole, size]);

  const canNext = !p.step.action || p.done;
  return (
    <div
      ref={ref}
      role="dialog"
      aria-live="polite"
      aria-label={`${p.tourTitle} — step ${p.index + 1} of ${p.total}`}
      data-training-layer
      className="fixed z-[80] w-[360px] rounded-xl border border-academy/30 bg-white shadow-pop transition-[top,left] duration-150"
      style={{ left: pos.left, top: pos.top }}
    >
      <div className="flex items-center gap-2 rounded-t-xl bg-academy px-4 py-2 text-xs text-white">
        <GraduationCap className="h-3.5 w-3.5" />
        <span className="flex-1 truncate font-medium">{p.tourTitle}</span>
        <span className="text-white/80">
          {p.index + 1} / {p.total}
        </span>
        <button type="button" onClick={p.onRestart} aria-label="Restart tour" title="Restart tour" className="rounded p-0.5 hover:bg-white/15">
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={p.onExit} aria-label="Exit tour" title="Exit tour (back to Explore)" className="rounded p-0.5 hover:bg-white/15">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="h-1 bg-academy-soft">
        <div className="h-1 bg-academy transition-all" style={{ width: `${((p.index + 1) / p.total) * 100}%` }} />
      </div>
      <div className="px-4 py-3">
        <h3 className="text-sm font-semibold">{p.step.title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-ink-soft">{p.step.body}</p>
        {p.step.action && (
          <div className={clsx('mt-3 flex items-start gap-2 rounded-md px-3 py-2 text-sm', p.done ? 'bg-green-50 text-green-800' : 'bg-academy-soft text-academy')}>
            {p.done ? <Check className="mt-0.5 h-4 w-4 shrink-0" /> : <MousePointerClick className="mt-0.5 h-4 w-4 shrink-0" />}
            <span>{p.done ? 'Done — moving on…' : `Your turn: ${p.step.action}`}</span>
          </div>
        )}
        {p.wrong && <Notice>{p.wrong}</Notice>}
        {p.offRoute && !p.done && (
          <Notice>
            This step happens on another screen.{' '}
            {p.step.route && (
              <button type="button" className="font-medium underline" onClick={p.onGoBack}>
                Take me there
              </button>
            )}
          </Notice>
        )}
        {p.missing && !p.offRoute && (
          <Notice>
            The highlighted element isn’t on screen yet{p.step.action ? ' — it may appear after the previous action' : ''}. {p.step.route ? 'Use "Take me there" or ' : ''}skip this step.
            {p.step.route && (
              <>
                {' '}
                <button type="button" className="font-medium underline" onClick={p.onGoBack}>
                  Take me there
                </button>
              </>
            )}
          </Notice>
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-line px-4 py-2.5">
        <button type="button" onClick={p.onBack} disabled={p.index === 0} className="flex items-center gap-1 text-xs font-medium text-ink-soft hover:text-ink disabled:invisible">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
        <span className="flex-1" />
        {p.step.action && !p.done && (
          <button type="button" onClick={p.onSkip} className="text-xs font-medium text-ink-muted hover:text-ink">
            Skip step
          </button>
        )}
        <button type="button" onClick={p.onNext} disabled={!canNext} title={canNext ? undefined : 'Complete the action to continue'} className="h-8 rounded-md bg-academy px-3 text-xs font-medium text-white hover:bg-academy/90 disabled:bg-academy/40">
          {p.index === p.total - 1 ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 flex items-start gap-2 rounded-md bg-orange-50 px-3 py-2 text-xs text-orange-800">
      <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
