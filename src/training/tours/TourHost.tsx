// Walkthrough engine: spotlights real CLM elements (by data-tour anchor), navigates between
// screens, waits for action steps to be performed, and recovers when a target is missing.
//
// Interaction model
// - The spotlight and dimmer never take pointer events on action steps, so the trainee can use the
//   target and anything it opens (dropdowns z-60, dialogs z-50 sit above the dimmer z-40).
// - On explanation steps, four blocker panels surround the target; the target itself stays clickable.
// - The guidance card is placed every frame by placeCard(): it avoids the target, every open
//   dropdown/popover, dialogs and side panels, and falls back to a docked (or compact) card.

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowLeft, ArrowRight, Check, ChevronDown, ChevronUp, CircleAlert, GraduationCap, MousePointerClick, RotateCcw, X } from 'lucide-react';
import { useClm } from '@/store/caseStore';
import { useAcademy } from '../academyStore';
import { TOURS, tourById } from './tours';
import { stepText, tourText, tourUi, type TourLang } from './i18n';
import { placeCard, type Box, type Placement } from './placement';
import type { TourCtx, TourStep } from './types';

const PAD = 6;
const CARD_W = 360;
const COMPACT_H = 132;

const findTarget = (anchor?: string) => (anchor ? document.querySelector<HTMLElement>(`[data-tour="${anchor}"]`) : null);
const toBox = (r: DOMRect): Box => ({ x: r.left, y: r.top, w: r.width, h: r.height });
const sameBox = (a: Box | null, b: Box | null) => a === b || (!!a && !!b && a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h);

/** Everything the card must not cover: open dropdowns/popovers, dialogs and training side panels. */
function collectObstacles(): Box[] {
  const out: Box[] = [];
  document.querySelectorAll<HTMLElement>('[data-popover-panel], [role="dialog"], aside[aria-label="Ask CLM"]').forEach((el) => {
    if (el.closest('[data-tour-card]')) return;
    if (el.getAttribute('aria-label') === 'Tour complete') return;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) out.push(toBox(r));
  });
  return out;
}

function routeMatches(route: string, pathname: string, search: string) {
  const [p, q] = route.split('?');
  if (p !== pathname) return false;
  const want = new URLSearchParams(q ?? '');
  const have = new URLSearchParams(search);
  for (const [k, v] of want) if (k !== 'focus' && have.get(k) !== v) return false;
  return true;
}

/** Keeps Latin runs (CLM labels, case IDs) left-to-right inside Arabic sentences. */
export function MixedText({ text, lang }: { text: string; lang: TourLang }): ReactNode {
  if (lang !== 'ar') return text;
  // A Latin run, optionally followed by a bracketed Latin qualifier: "AML (Mozn)", "CS-1847", "Required Before Closing".
  const parts = text.split(/([A-Za-z0-9](?:[A-Za-z0-9 &·%/._+'"’\-–]*[A-Za-z0-9%"])?(?: \([A-Za-z0-9 ]+\))?)/g);
  return parts.map((p, i) => (i % 2 === 1 ? <bdi key={i} dir="ltr">{p}</bdi> : p));
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
  const lang = useAcademy((s) => s.tourLang);
  const ui = tourUi(lang);
  const navigate = useNavigate();
  const loc = useLocation();
  const ctx = useCtx();
  const [hole, setHole] = useState<Box | null>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [missing, setMissing] = useState(false);
  const [done, setDone] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [finished, setFinished] = useState(false);
  const scrolledFor = useRef<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  // Height of the full (non-compact) card; used while compact so placement doesn't oscillate.
  const fullHeight = useRef(220);
  const compactHeight = useRef(COMPACT_H);
  const modeRef = useRef<Placement['mode'] | null>(null);
  const isAction = !!step.done;
  const isLast = stepIndex === tour.steps.length - 1;
  const onExpected = !step.expectRoute || step.expectRoute.test(loc.pathname + loc.search) || (step.route ? routeMatches(step.route, loc.pathname, loc.search) : false);

  // Enter step: prepare + navigate.
  useEffect(() => {
    setDone(false);
    setWrong(false);
    setMissing(false);
    scrolledFor.current = null;
    step.prepare?.();
    if (step.route && !routeMatches(step.route, loc.pathname, loc.search)) navigate(step.route);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourId, stepIndex]);

  // Every frame: track the target, collect obstacles (dropdowns, dialogs, panels) and place the card.
  useLayoutEffect(() => {
    let raf = 0;
    const started = Date.now();
    const tick = () => {
      const el = findTarget(step.target);
      let target: Box | null = null;
      if (el) {
        if (scrolledFor.current !== step.id) {
          scrolledFor.current = step.id;
          el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
        const r = toBox(el.getBoundingClientRect());
        target = { x: r.x - PAD, y: r.y - PAD, w: r.w + PAD * 2, h: r.h + PAD * 2 };
        setMissing(false);
      } else if (step.target && Date.now() - started > 2500) setMissing(true);
      setHole((prev) => (sameBox(prev, target) ? prev : target));

      const card = cardRef.current;
      // Measure at full width only, so a narrowed card doesn't feed back into the next decision.
      if (card && card.offsetHeight && card.offsetWidth === CARD_W) {
        if (modeRef.current === 'compact') compactHeight.current = card.offsetHeight;
        else fullHeight.current = card.offsetHeight;
      }
      const size = { w: CARD_W, h: fullHeight.current };
      const trainingBar = 36;
      const next = placeCard(target, collectObstacles(), size, compactHeight.current, { w: window.innerWidth, h: window.innerHeight, top: trainingBar, right: 0 });
      modeRef.current = next.mode;
      setPlacement((prev) => (prev && prev.left === next.left && prev.top === next.top && prev.mode === next.mode && prev.width === next.width ? prev : next));
    };
    // Animation frames keep the card glued to moving targets; the timer keeps it working when
    // frames are throttled (background tabs, some embedded browsers).
    const loop = () => {
      tick();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const timer = setInterval(tick, 150);
    tick();
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(timer);
    };
  }, [step.id, step.target]);

  // Evaluate action completion against live state.
  useEffect(() => {
    if (!step.done) return;
    const check = () => {
      const c = ctx();
      if (step.done!(c)) setDone(true);
      setWrong(!!step.wrong?.(c));
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
    if (!done || !isAction) return;
    const t = setTimeout(() => (isLast ? finish() : setTourStep(stepIndex + 1)), 1100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const finish = () => {
    completeTour();
    setFinished(true);
  };
  const restart = () => startTour(tourId, 0);
  const nextTour = TOURS[TOURS.findIndex((t) => t.id === tourId) + 1];
  const title = tourText(lang, tourId).title;

  if (finished) {
    return createPortal(
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30">
        <div role="dialog" aria-label="Tour complete" dir={lang === 'ar' ? 'rtl' : 'ltr'} className="w-[420px] rounded-xl bg-white p-6 shadow-pop">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-700">
            <Check className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold">{ui.tourComplete}</h2>
          <p className="mt-1 text-sm text-ink-muted">{ui.completeBody(title)}</p>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button type="button" className="h-9 rounded-md border border-line px-3 text-sm font-medium hover:bg-surface-sunken" onClick={() => (exitTour(), navigate('/academy/learn'))}>
              {ui.backToAcademy}
            </button>
            <button type="button" className="h-9 rounded-md border border-line px-3 text-sm font-medium hover:bg-surface-sunken" onClick={() => exitTour()}>
              {ui.keepExploring}
            </button>
            {nextTour && (
              <button type="button" className="h-9 rounded-md bg-academy px-3 text-sm font-medium text-white hover:bg-academy/90" onClick={() => startTour(nextTour.id)}>
                {ui.nextTour(tourText(lang, nextTour.id).title)}
              </button>
            )}
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  const blocking = !isAction; // explanation steps block clicks outside the spotlight
  return createPortal(
    <>
      {/* Spotlight + dimmer (visual only, never receives pointer events). */}
      {hole ? (
        <>
          <div
            aria-hidden
            data-tour-spotlight
            className="pointer-events-none fixed z-40 rounded-lg ring-2 ring-academy"
            style={{ left: hole.x, top: hole.y, width: hole.w, height: hole.h, boxShadow: `0 0 0 9999px rgba(15,23,42,${blocking ? 0.45 : 0.25})` }}
          />
          {blocking && (
            /* Click blockers around (never over) the target. Dropdowns (z-60) and dialogs (z-50) sit above them. */
            <>
              <div data-tour-blocker className="fixed left-0 right-0 top-0 z-40" style={{ height: Math.max(0, hole.y) }} />
              <div data-tour-blocker className="fixed bottom-0 left-0 right-0 z-40" style={{ top: hole.y + hole.h }} />
              <div data-tour-blocker className="fixed left-0 z-40" style={{ top: hole.y, height: hole.h, width: Math.max(0, hole.x) }} />
              <div data-tour-blocker className="fixed right-0 z-40" style={{ top: hole.y, height: hole.h, left: hole.x + hole.w }} />
            </>
          )}
        </>
      ) : (
        !step.target && <div className="fixed inset-0 z-40 bg-slate-900/45" />
      )}
      <TourCard
        cardRef={cardRef}
        placement={placement}
        lang={lang}
        tourId={tourId}
        tourTitle={title}
        index={stepIndex}
        total={tour.steps.length}
        step={step}
        done={done}
        wrong={wrong}
        missing={missing && !hole}
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
  cardRef: React.RefObject<HTMLDivElement>;
  placement: Placement | null;
  lang: TourLang;
  tourId: string;
  tourTitle: string;
  index: number;
  total: number;
  step: TourStep;
  done: boolean;
  wrong: boolean;
  missing: boolean;
  offRoute: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  onExit: () => void;
  onRestart: () => void;
  onGoBack: () => void;
}

function LangSwitch({ lang }: { lang: TourLang }) {
  const setTourLang = useAcademy((s) => s.setTourLang);
  return (
    <div role="group" aria-label={tourUi(lang).language} className="flex overflow-hidden rounded border border-white/40 text-[11px] leading-none" dir="ltr">
      {(['en', 'ar'] as const).map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={lang === l}
          onClick={() => setTourLang(l)}
          className={clsx('px-1.5 py-1 font-medium', lang === l ? 'bg-white text-academy' : 'text-white/85 hover:bg-white/15')}
        >
          {l === 'en' ? 'English' : 'العربية'}
        </button>
      ))}
    </div>
  );
}

function TourCard(p: CardProps) {
  const ui = tourUi(p.lang);
  const t = stepText(p.lang, p.tourId, p.step.id);
  const rtl = p.lang === 'ar';
  const isAction = !!p.step.done;
  const [userExpanded, setUserExpanded] = useState(false);
  const [confirmSkip, setConfirmSkip] = useState(false);
  useEffect(() => {
    setUserExpanded(false);
    setConfirmSkip(false);
  }, [p.step.id]);

  const compact = p.placement?.mode === 'compact' && !userExpanded;
  const canNext = !isAction || p.done;
  const Next = rtl ? ArrowLeft : ArrowRight;
  const Prev = rtl ? ArrowRight : ArrowLeft;

  return (
    <div
      ref={p.cardRef}
      data-tour-card
      data-training-layer
      data-placement={p.placement?.mode}
      role="dialog"
      aria-live="polite"
      aria-label={`${p.tourTitle} — ${ui.stepOf(p.index + 1, p.total)}`}
      lang={p.lang}
      className="fixed z-[80] rounded-xl border border-academy/30 bg-white shadow-pop"
      style={p.placement ? { left: p.placement.left, top: p.placement.top, width: p.placement.width } : { right: 16, bottom: 16, width: CARD_W }}
    >
      <div className="flex items-center gap-2 rounded-t-xl bg-academy px-3 py-2 text-xs text-white" dir={rtl ? 'rtl' : 'ltr'}>
        <GraduationCap className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 truncate font-medium">{p.tourTitle}</span>
        <span className="shrink-0 text-white/80">{ui.stepOf(p.index + 1, p.total)}</span>
        <LangSwitch lang={p.lang} />
        {p.placement?.mode === 'compact' && (
          <button type="button" onClick={() => setUserExpanded(!userExpanded)} aria-label={compact ? ui.expand : ui.collapse} title={compact ? ui.expand : ui.collapse} className="rounded p-0.5 hover:bg-white/15">
            {compact ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        )}
        <button type="button" onClick={p.onRestart} aria-label={ui.restart} title={ui.restart} className="rounded p-0.5 hover:bg-white/15">
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={p.onExit} aria-label={ui.exit} title={ui.exit} className="rounded p-0.5 hover:bg-white/15">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="h-1 bg-academy-soft" dir={rtl ? 'rtl' : 'ltr'}>
        <div className="h-1 bg-academy transition-all" style={{ width: `${((p.index + 1) / p.total) * 100}%` }} />
      </div>
      <div className={clsx('px-4', compact ? 'py-2' : 'py-3')} dir={rtl ? 'rtl' : 'ltr'} style={{ textAlign: rtl ? 'right' : 'left' }}>
        <h3 className="text-sm font-semibold">
          <MixedText text={t.title} lang={p.lang} />
        </h3>
        {!compact && (
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            <MixedText text={t.body} lang={p.lang} />
          </p>
        )}
        {isAction && t.action && (
          <div className={clsx('flex items-start gap-2 rounded-md px-3 py-2 text-sm', compact ? 'mt-1.5' : 'mt-3', p.done ? 'bg-green-50 text-green-800' : 'bg-academy-soft text-academy')}>
            {p.done ? <Check className="mt-0.5 h-4 w-4 shrink-0" /> : <MousePointerClick className="mt-0.5 h-4 w-4 shrink-0" />}
            <span>{p.done ? ui.doneMoving : <>{ui.yourTurn} <MixedText text={t.action} lang={p.lang} /></>}</span>
          </div>
        )}
        {p.wrong && t.wrong && (
          <Notice>
            <MixedText text={t.wrong} lang={p.lang} />
          </Notice>
        )}
        {p.offRoute && !p.done && (
          <Notice>
            {ui.offRoute}{' '}
            {p.step.route && (
              <button type="button" className="font-medium underline" onClick={p.onGoBack}>
                {ui.takeMeThere}
              </button>
            )}
          </Notice>
        )}
        {p.missing && !p.offRoute && (
          <Notice>
            {ui.missingTarget} {isAction ? ui.missingTargetAction : ''} {ui.missingTargetHelp}
            {p.step.route && (
              <>
                {' '}
                <button type="button" className="font-medium underline" onClick={p.onGoBack}>
                  {ui.takeMeThere}
                </button>
              </>
            )}
          </Notice>
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-line px-4 py-2" dir={rtl ? 'rtl' : 'ltr'}>
        <button type="button" onClick={p.onBack} disabled={p.index === 0} className="flex items-center gap-1 text-xs font-medium text-ink-soft hover:text-ink disabled:invisible">
          <Prev className="h-3.5 w-3.5" />
          {ui.back}
        </button>
        <span className="flex-1" />
        {isAction &&
          !p.done &&
          (confirmSkip ? (
            <span className="flex items-center gap-2 text-xs">
              <span className="text-ink-muted">{ui.skipConfirm}</span>
              <button type="button" onClick={p.onSkip} className="font-medium text-orange-700 hover:underline">
                {ui.skipYes}
              </button>
            </span>
          ) : (
            <button type="button" onClick={() => setConfirmSkip(true)} className="text-xs font-medium text-ink-muted hover:text-ink">
              {ui.skip}
            </button>
          ))}
        <button
          type="button"
          onClick={p.onNext}
          disabled={!canNext}
          aria-disabled={!canNext}
          title={canNext ? undefined : ui.completeToContinue}
          className="flex h-8 items-center gap-1 rounded-md bg-academy px-3 text-xs font-medium text-white hover:bg-academy/90 disabled:cursor-not-allowed disabled:bg-academy/40"
        >
          {p.index === p.total - 1 ? ui.finish : ui.next}
          {p.index !== p.total - 1 && <Next className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="mt-2 flex items-start gap-2 rounded-md bg-orange-50 px-3 py-2 text-xs text-orange-800">
      <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
