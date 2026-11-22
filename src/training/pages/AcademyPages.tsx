import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowRight, BookOpen, Check, Compass, Dumbbell, GraduationCap, LogOut, MessageCircleQuestion, PlayCircle, RotateCcw, Search } from 'lucide-react';
import { useAcademy } from '../academyStore';
import { TOURS, tourById } from '../tours/tours';
import { startTour } from '../tours/TourHost';
import { tourText, tourUi, type TourLang } from '../tours/i18n';
import { SCENARIOS, scenarioById } from '../practice/scenarios';
import { startScenario } from '../practice/PracticePanel';
import { CATALOG, scenarioText } from '../catalog';
import { ARTICLES, articleById, type Article } from '../knowledge/articles';
import { searchArticles } from '../knowledge/search';
import { ArticleView } from '../knowledge/ArticleView';
import { Dialog } from '@/clm/components/ui/Dialog';
import { Button } from '@/clm/components/ui/Button';

// Academy page wording. Pages read the language from the Academy store only (useAcademy.tourLang);
// they never set it. The CLM simulator screens are always English.
const PAGE = {
  en: {
    welcome: 'Welcome to CLM Academy',
    intro: 'CLM — Client Lifecycle Management — is where Manafa Operations receive, investigate and resolve client cases in one place. This Academy runs a realistic copy of CLM with fictional data, so you can learn the screens, practise real work and make mistakes safely.',
    browse: 'Browse scenarios',
    continueX: (t: string) => `Continue: ${t}`,
    explore: 'Explore CLM',
    practice: 'Practice scenarios',
    ask: 'Ask CLM',
    progress: 'Your progress',
    progressLine: (a: number, b: number, c: number, d: number) => `${a} of ${b} guided walkthroughs · ${c} of ${d} practice scenarios completed. Saved in this browser.`,
    cards: [
      { title: 'Guided walkthroughs', body: (n: number) => `${n} walkthroughs that run inside the real screens and wait for you to do each step. Start any of them.` },
      { title: 'Explore CLM', body: () => 'Use the simulator freely: queue, cases, verifications, ownership, licenses, documents.' },
      { title: 'Practice scenarios', body: (n: number) => `${n} realistic exercises. You do the work; CLM Academy checks it and gives hints only when you ask.` },
    ],
    open: 'Open',
    recommended: 'Suggested learning path (optional)',
    recommendedNote: 'A suggested order for new joiners. You can start any walkthrough or scenario at any time — nothing is locked.',
    showPath: 'Show suggested path',
    hidePath: 'Hide suggested path',
    footer: 'CLM Academy is a training environment. It never connects to Manafa systems; every company, person, ID and document is fictional. The CLM screens are always in English; the language switch changes the Academy guidance only.',
    catalogTitle: 'Scenario catalog',
    catalogIntro: 'Pick any case type and start a walkthrough or a practice scenario directly. Each one has its own case data and its own progress; restarting one never affects the others. The CLM screens stay in English.',
    practiceIntro: 'Each scenario resets only its own case, gives you the situation and objective, and checks your work in the simulator. Hints appear only when you ask.',
    all: 'All case types',
    kindAll: 'All',
    kindTours: 'Walkthroughs',
    kindPractice: 'Practice',
    walkthrough: 'Walkthrough',
    practiceTag: 'Practice',
    start: 'Start',
    cont: 'Continue',
    restart: 'Restart',
    exit: 'Exit',
    active: 'Active now',
    inProgress: (i: number, n: number) => `In progress — step ${i} of ${n}`,
    tasksDone: (i: number, n: number) => `In progress — ${i} of ${n} tasks done`,
    completed: 'Completed',
    reset: 'Reset progress',
  },
  ar: {
    welcome: 'أهلاً بك في أكاديمية CLM',
    intro: 'نظام CLM (إدارة دورة حياة العميل) هو المكان اللي يستقبل فيه فريق العمليات في منافع كيسات العملاء ويراجعها ويتخذ القرار فيها. الأكاديمية تشغّل نسخة واقعية من CLM ببيانات وهمية، عشان تتعلم الشاشات وتتدرّب على العمل الحقيقي بأمان.',
    browse: 'تصفّح السيناريوهات',
    continueX: (t: string) => `متابعة: ${t}`,
    explore: 'استكشف CLM',
    practice: 'سيناريوهات التدريب',
    ask: 'اسأل CLM',
    progress: 'تقدّمك',
    progressLine: (a: number, b: number, c: number, d: number) => `${a} من ${b} جولات إرشادية · ${c} من ${d} سيناريوهات تدريب مكتملة. محفوظ في هذا المتصفح.`,
    cards: [
      { title: 'الجولات الإرشادية', body: (n: number) => `${n} جولة تعمل داخل الشاشات الحقيقية وتنتظرك تنفّذ كل خطوة. ابدأ أي جولة تريدها.` },
      { title: 'استكشف CLM', body: () => 'استخدم المحاكي بحرية: قائمة الكيسات، والكيسات، والتحققات، والملكية، والتراخيص، والمستندات.' },
      { title: 'سيناريوهات التدريب', body: (n: number) => `${n} تمرين واقعي. أنت تنفّذ العمل، والأكاديمية تتحقق منه وتعطيك تلميحات فقط عند الطلب.` },
    ],
    open: 'فتح',
    recommended: 'مسار تعلّم مقترح (اختياري)',
    recommendedNote: 'ترتيب مقترح للموظفين الجدد. تقدر تبدأ أي جولة أو سيناريو في أي وقت — لا شيء مقفل.',
    showPath: 'عرض المسار المقترح',
    hidePath: 'إخفاء المسار المقترح',
    footer: 'أكاديمية CLM بيئة تدريب ولا تتصل بأنظمة منافع؛ كل الشركات والأشخاص والأرقام والمستندات وهمية. شاشات CLM دائماً بالإنجليزية، ومبدّل اللغة يغيّر إرشادات الأكاديمية فقط.',
    catalogTitle: 'دليل السيناريوهات',
    catalogIntro: 'اختر أي نوع كيس وابدأ جولة أو سيناريو تدريب مباشرة. لكل واحد بياناته وتقدّمه الخاص، وإعادة أي واحد لا تؤثر على الباقي. شاشات CLM تبقى بالإنجليزية.',
    practiceIntro: 'كل سيناريو يعيد ضبط كيسه فقط، ويعطيك الموقف والهدف، ويتحقق من عملك في المحاكي. التلميحات تظهر فقط عند الطلب.',
    all: 'كل أنواع الكيسات',
    kindAll: 'الكل',
    kindTours: 'الجولات',
    kindPractice: 'التدريب',
    walkthrough: 'جولة إرشادية',
    practiceTag: 'تدريب',
    start: 'ابدأ',
    cont: 'متابعة',
    restart: 'إعادة',
    exit: 'خروج',
    active: 'نشط الآن',
    inProgress: (i: number, n: number) => `قيد التقدّم — الخطوة ${i} من ${n}`,
    tasksDone: (i: number, n: number) => `قيد التقدّم — ${i} من ${n} مهام منجزة`,
    completed: 'مكتمل',
    reset: 'إعادة ضبط التقدّم',
  },
};

function useLang() {
  const lang = useAcademy((s) => s.tourLang);
  return { lang, t: PAGE[lang], ui: tourUi(lang), rtl: lang === 'ar' };
}

function useProgress() {
  const tours = useAcademy((s) => s.tours);
  const practice = useAcademy((s) => s.practice);
  const toursDone = TOURS.filter((t) => tours[t.id]?.status === 'completed').length;
  const practiceDone = SCENARIOS.filter((s) => practice[s.id]?.status === 'completed').length;
  const total = TOURS.length + SCENARIOS.length;
  const inProgressTour = TOURS.find((t) => tours[t.id]?.status === 'started');
  return { toursDone, practiceDone, total, pct: Math.round(((toursDone + practiceDone) / total) * 100), inProgressTour, tours, practice };
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-academy" style={{ width: `${pct}%` }} />
    </div>
  );
}

function ResetProgressButton() {
  const [open, setOpen] = useState(false);
  const reset = useAcademy((s) => s.resetProgress);
  const { t } = useLang();
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-ink">
        <RotateCcw className="h-3.5 w-3.5" />
        {t.reset}
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Reset learning progress?"
        description="Completed tours and scenarios are cleared. Case data in the simulator is not changed (use Reset training data for that). Your language choice is kept."
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => (reset(), setOpen(false))}>
              Reset progress
            </Button>
          </>
        }
      />
    </>
  );
}

/**
 * Walkthrough language switch (English | العربية). The single place (with the tour card) that changes
 * the Academy language. It affects Academy guidance only, never the CLM screens.
 */
export function TourLanguageSwitch({ variant = 'page' }: { variant?: 'page' | 'bar' }) {
  const lang = useAcademy((s) => s.tourLang);
  const setTourLang = useAcademy((s) => s.setTourLang);
  const bar = variant === 'bar';
  return (
    <div className="flex items-center gap-1.5 text-xs" data-training-layer>
      <span className={bar ? 'text-white/70' : 'text-ink-muted'}>{bar ? 'Guidance' : 'Walkthrough language'}</span>
      <div role="group" aria-label="Academy guidance language" className={clsx('flex overflow-hidden rounded-md', bar ? 'bg-white/10 p-0.5' : 'border border-line')}>
        {(['en', 'ar'] as TourLang[]).map((l) => (
          <button
            key={l}
            type="button"
            lang={l}
            aria-pressed={lang === l}
            data-lang-option={l}
            onClick={() => setTourLang(l)}
            className={clsx(bar ? 'rounded px-2 py-0.5 font-medium' : 'px-2.5 py-1 font-medium', lang === l ? (bar ? 'bg-white text-academy' : 'bg-academy text-white') : bar ? 'text-white/85 hover:text-white' : 'hover:bg-surface-sunken')}
          >
            {l === 'en' ? 'English' : 'العربية'}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---- Catalog items ------------------------------------------------------------

function StatusLine({ children, tone }: { children: React.ReactNode; tone: 'academy' | 'green' }) {
  return <p className={clsx('mt-1 text-xs', tone === 'green' ? 'text-green-700' : 'text-academy')}>{children}</p>;
}

function TourItem({ id }: { id: string }) {
  const tour = tourById(id)!;
  const st = useAcademy((s) => s.tours[id]);
  const active = useAcademy((s) => s.activeTour?.id === id);
  const exitTour = useAcademy((s) => s.exitTour);
  const { lang, t, ui, rtl } = useLang();
  const started = st?.status === 'started';
  return (
    <li className="flex items-center gap-4 rounded-xl border border-line p-4" data-catalog-item={`tour:${id}`}>
      <span className={clsx('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', st?.status === 'completed' ? 'bg-green-600 text-white' : 'bg-academy-soft text-academy')}>
        {st?.status === 'completed' ? <Check className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
      </span>
      <div className="min-w-0 flex-1" dir={rtl ? 'rtl' : 'ltr'} lang={lang} style={{ textAlign: rtl ? 'right' : 'left' }}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-academy-soft px-1.5 py-0.5 text-2xs font-semibold text-academy">{t.walkthrough}</span>
          <span className="font-semibold">{tourText(lang, id).title}</span>
          <span className="text-xs text-ink-muted">
            {tour.level === 'Beginner' ? ui.beginner : ui.intermediate} · {ui.minutes(tour.minutes)} · {ui.steps(tour.steps.length)}
          </span>
          {active && <span className="text-2xs font-semibold text-academy">{t.active}</span>}
        </div>
        <p className="mt-0.5 text-sm text-ink-soft">{tourText(lang, id).summary}</p>
        {started && <StatusLine tone="academy">{t.inProgress(st.step + 1, tour.steps.length)}</StatusLine>}
        {st?.status === 'completed' && <StatusLine tone="green">{t.completed}</StatusLine>}
      </div>
      <div className="flex shrink-0 gap-2">
        {active && (
          <Button size="sm" variant="ghost" onClick={exitTour} aria-label={`${t.exit}: ${tourText('en', id).title}`}>
            <LogOut className="h-3.5 w-3.5" />
            {t.exit}
          </Button>
        )}
        {started && (
          <Button size="sm" variant="academy" onClick={() => startTour(id, st.step)}>
            {t.cont}
          </Button>
        )}
        <Button size="sm" variant={started ? 'secondary' : 'academy'} onClick={() => startTour(id, 0)} data-catalog-start={`tour:${id}`}>
          {st ? t.restart : t.start}
        </Button>
      </div>
    </li>
  );
}

function ScenarioItem({ id }: { id: string }) {
  const s = scenarioById(id)!;
  const st = useAcademy((x) => x.practice[id]);
  const active = useAcademy((x) => x.activePractice === id);
  const { resumePractice, exitPractice } = useAcademy();
  const navigate = useNavigate();
  const { lang, t, rtl } = useLang();
  const text = scenarioText(lang, s);
  const started = st?.status === 'started' && !st.failed;
  return (
    <li className="flex items-center gap-4 rounded-xl border border-line p-4" data-catalog-item={`practice:${id}`}>
      <span className={clsx('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', st?.status === 'completed' ? 'bg-green-600 text-white' : 'bg-academy-soft text-academy')}>
        {st?.status === 'completed' ? <Check className="h-4 w-4" /> : <Dumbbell className="h-4 w-4" />}
      </span>
      <div className="min-w-0 flex-1" dir={rtl ? 'rtl' : 'ltr'} lang={lang} style={{ textAlign: rtl ? 'right' : 'left' }}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-orange-50 px-1.5 py-0.5 text-2xs font-semibold text-orange-700">{t.practiceTag}</span>
          <span className="font-semibold">{text.title}</span>
          <span className="text-xs text-ink-muted" dir="ltr">
            {s.difficulty} · {s.caseId}
          </span>
          {active && <span className="text-2xs font-semibold text-academy">{t.active}</span>}
        </div>
        <p className="mt-0.5 text-sm text-ink-soft">{text.objective}</p>
        {started && <StatusLine tone="academy">{t.tasksDone(st.done.length, s.tasks.length)}</StatusLine>}
        {st?.status === 'completed' && <StatusLine tone="green">{t.completed}</StatusLine>}
      </div>
      <div className="flex shrink-0 gap-2">
        {active && (
          <Button size="sm" variant="ghost" onClick={exitPractice}>
            <LogOut className="h-3.5 w-3.5" />
            {t.exit}
          </Button>
        )}
        {started && (
          <Button
            size="sm"
            variant="academy"
            onClick={() => {
              resumePractice(id);
              navigate(`/cases/${s.caseId}`);
            }}
          >
            {t.cont}
          </Button>
        )}
        <Button size="sm" variant={started ? 'secondary' : 'academy'} onClick={() => startScenario(id, navigate)} data-catalog-start={`practice:${id}`}>
          {st ? t.restart : t.start}
        </Button>
      </div>
    </li>
  );
}

type Kind = 'all' | 'tours' | 'practice';

/** One catalog for every case type; used by Guided learning (walkthroughs first) and Practice. */
function Catalog({ defaultKind }: { defaultKind: Kind }) {
  const [params, setParams] = useSearchParams();
  const { lang, t, rtl } = useLang();
  const type = params.get('type') ?? 'all';
  const kind = (params.get('kind') as Kind | null) ?? defaultKind;
  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    next.set(k, v);
    setParams(next, { replace: true });
  };
  const groups = CATALOG.filter((g) => type === 'all' || g.id === type);
  const chip = (active: boolean) => clsx('rounded-full border px-3 py-1 text-xs font-medium', active ? 'border-academy bg-academy text-white' : 'border-line hover:bg-surface-sunken');
  return (
    <>
      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Case type" dir={rtl ? 'rtl' : 'ltr'}>
        <button type="button" className={chip(type === 'all')} aria-pressed={type === 'all'} onClick={() => set('type', 'all')}>
          {t.all}
        </button>
        {CATALOG.map((g) => (
          <button key={g.id} type="button" className={chip(type === g.id)} aria-pressed={type === g.id} onClick={() => set('type', g.id)} data-catalog-type={g.id}>
            {lang === 'ar' ? g.labelAr : g.label}
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-1 text-xs" role="group" aria-label="Kind">
        {(['all', 'tours', 'practice'] as Kind[]).map((k) => (
          <button key={k} type="button" aria-pressed={kind === k} onClick={() => set('kind', k)} className={clsx('rounded-md px-2.5 py-1 font-medium', kind === k ? 'bg-ink text-white' : 'text-ink-soft hover:bg-surface-sunken')}>
            {k === 'all' ? t.kindAll : k === 'tours' ? t.kindTours : t.kindPractice}
          </button>
        ))}
      </div>
      <div className="mt-5 space-y-8">
        {groups.map((g) => {
          const tours = kind === 'practice' ? [] : g.tours;
          const scenarios = kind === 'tours' ? [] : g.scenarios;
          if (!tours.length && !scenarios.length) return null;
          return (
            <section key={g.id} data-catalog-group={g.id}>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted" dir={rtl ? 'rtl' : 'ltr'}>
                {lang === 'ar' ? g.labelAr : g.label}
              </h2>
              <ul className="mt-2 space-y-2">
                {tours.map((id) => (
                  <TourItem key={id} id={id} />
                ))}
                {scenarios.map((id) => (
                  <ScenarioItem key={id} id={id} />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}

// ---- Pages ------------------------------------------------------------------

export function AcademyHome() {
  const p = useProgress();
  const navigate = useNavigate();
  const openAssistant = useAcademy((s) => s.openAssistant);
  const { lang, t, ui, rtl } = useLang();
  const [showPath, setShowPath] = useState(false);
  const cont = p.inProgressTour;
  const counts = [TOURS.length, 0, SCENARIOS.length];
  const links = ['/academy/learn', '/cases', '/academy/practice'];
  const icons = [<PlayCircle key="p" className="h-5 w-5" />, <Compass key="c" className="h-5 w-5" />, <Dumbbell key="d" className="h-5 w-5" />];
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div dir={rtl ? 'rtl' : 'ltr'} lang={lang}>
        <div className="flex items-center gap-2 text-sm font-medium text-academy">
          <GraduationCap className="h-4 w-4" />
          CLM Academy
        </div>
        <h1 className="mt-2 text-3xl font-semibold">{t.welcome}</h1>
        <p className="mt-3 max-w-3xl text-base text-ink-soft">{t.intro}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="academy" onClick={() => navigate('/academy/learn')} data-home-browse>
            <PlayCircle className="h-4 w-4" />
            {t.browse}
          </Button>
          {cont && (
            <Button onClick={() => startTour(cont.id, p.tours[cont.id].step)}>
              <RotateCcw className="h-4 w-4" />
              {t.continueX(tourText(lang, cont.id).title)}
            </Button>
          )}
          <Button onClick={() => navigate('/cases')}>
            <Compass className="h-4 w-4" />
            {t.explore}
          </Button>
          <Button onClick={() => navigate('/academy/practice')}>
            <Dumbbell className="h-4 w-4" />
            {t.practice}
          </Button>
          <Button onClick={() => openAssistant()}>
            <MessageCircleQuestion className="h-4 w-4" />
            {t.ask}
          </Button>
        </div>

        <div className="mt-8 rounded-xl border border-line p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{t.progress}</h2>
            <ResetProgressButton />
          </div>
          <div className="mt-3 flex items-center gap-4">
            <ProgressBar pct={p.pct} />
            <span className="shrink-0 text-sm font-medium">{p.pct}%</span>
          </div>
          <p className="mt-2 text-xs text-ink-muted">{t.progressLine(p.toursDone, TOURS.length, p.practiceDone, SCENARIOS.length)}</p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {t.cards.map((x, i) => (
            <Link key={x.title} to={links[i]} className="group rounded-xl border border-line p-5 hover:border-academy/40">
              <div className="text-academy">{icons[i]}</div>
              <div className="mt-2 font-semibold">{x.title}</div>
              <p className="mt-1 text-sm text-ink-soft">{x.body(counts[i])}</p>
              <div className="mt-3 flex items-center gap-1 text-xs font-medium text-academy">
                {t.open} <ArrowRight className={clsx('h-3.5 w-3.5 transition-transform', rtl ? 'rotate-180' : 'group-hover:translate-x-0.5')} />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-dashed border-line p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{t.recommended}</h2>
              <p className="mt-0.5 text-xs text-ink-muted">{t.recommendedNote}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setShowPath(!showPath)} aria-expanded={showPath}>
              {showPath ? t.hidePath : t.showPath}
            </Button>
          </div>
          {showPath && (
            <ol className="mt-3 divide-y divide-line rounded-xl border border-line">
              {TOURS.map((tour, i) => {
                const st = p.tours[tour.id]?.status;
                return (
                  <li key={tour.id} className="flex items-center gap-4 px-4 py-3">
                    <span className={clsx('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold', st === 'completed' ? 'bg-green-600 text-white' : 'bg-academy-soft text-academy')}>
                      {st === 'completed' ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{tourText(lang, tour.id).title}</div>
                      <div className="text-xs text-ink-muted">{tourText(lang, tour.id).summary}</div>
                    </div>
                    <span className="text-xs text-ink-muted">{ui.minutes(tour.minutes)}</span>
                    <Button size="sm" variant="secondary" onClick={() => startTour(tour.id, p.tours[tour.id]?.status === 'started' ? p.tours[tour.id].step : 0)}>
                      {p.tours[tour.id]?.status === 'started' ? t.cont : st === 'completed' ? t.restart : t.start}
                    </Button>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <p className="mt-10 text-xs text-ink-muted">{t.footer}</p>
      </div>
    </div>
  );
}

export function LearnPage() {
  const { lang, t, rtl } = useLang();
  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-end justify-between gap-4" dir={rtl ? 'rtl' : 'ltr'} lang={lang}>
        <div>
          <h1 className="text-2xl font-semibold">{t.catalogTitle}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t.catalogIntro}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <TourLanguageSwitch />
          <ResetProgressButton />
        </div>
      </div>
      <Catalog defaultKind="all" />
    </div>
  );
}

export function PracticePage() {
  const { lang, t, rtl } = useLang();
  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div dir={rtl ? 'rtl' : 'ltr'} lang={lang}>
        <h1 className="text-2xl font-semibold">{t.practice}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t.practiceIntro}</p>
      </div>
      <Catalog defaultKind="practice" />
    </div>
  );
}

export function KnowledgePage() {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const results: Article[] = useMemo(() => (q.trim() ? searchArticles(q, 20).map((h) => h.article) : ARTICLES), [q]);
  const categories = [...new Set(results.map((a) => a.category))];
  const article = articleId ? articleById(articleId) : undefined;

  if (article) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <Link to="/academy/kb" className="text-xs font-medium text-academy hover:underline">
          ← All articles
        </Link>
        <div className="mt-4">
          <ArticleView a={article} onOpenArticle={(id) => navigate(`/academy/kb/${id}`)} onStartTour={(id) => startTour(id)} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-2xl font-semibold">Knowledge Base</h1>
      <p className="mt-1 text-sm text-ink-muted">Short articles traced to the CLM BRD Phase I and the observed CLM screens. Search in English or Arabic.</p>
      <label className="mt-5 flex h-10 items-center gap-2 rounded-md border border-line px-3 focus-within:border-ink/40">
        <Search className="h-4 w-4 text-ink-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} dir="auto" placeholder="e.g. short address, joint signing, لماذا لا أستطيع الإغلاق" className="w-full text-sm outline-none" aria-label="Search the knowledge base" />
      </label>
      {results.length === 0 && <p className="mt-6 text-sm text-ink-muted">No article matches “{q}”. Try other words or ask the Ask CLM assistant.</p>}
      {categories.map((cat) => (
        <section key={cat} className="mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{cat}</h2>
          <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
            {results
              .filter((a) => a.category === cat)
              .map((a) => (
                <li key={a.id}>
                  <Link to={`/academy/kb/${a.id}`} className="flex items-start gap-3 px-4 py-3 hover:bg-surface-sunken">
                    <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-academy" />
                    <span className="flex-1">
                      <span className="block text-sm font-medium">{a.title}</span>
                      <span className="block text-xs text-ink-muted">{a.summary}</span>
                    </span>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
