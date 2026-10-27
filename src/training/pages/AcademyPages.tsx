import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowRight, BookOpen, Check, Compass, Dumbbell, GraduationCap, MessageCircleQuestion, PlayCircle, RotateCcw, Search } from 'lucide-react';
import { useAcademy } from '../academyStore';
import { TOURS } from '../tours/tours';
import { startTour } from '../tours/TourHost';
import { tourText, tourUi, type TourLang } from '../tours/i18n';
import { SCENARIOS } from '../practice/scenarios';
import { startScenario } from '../practice/PracticePanel';
import { ARTICLES, articleById, type Article } from '../knowledge/articles';
import { searchArticles } from '../knowledge/search';
import { ArticleView } from '../knowledge/ArticleView';
import { Dialog } from '@/clm/components/ui/Dialog';
import { Button } from '@/clm/components/ui/Button';

function useProgress() {
  const tours = useAcademy((s) => s.tours);
  const practice = useAcademy((s) => s.practice);
  const toursDone = TOURS.filter((t) => tours[t.id]?.status === 'completed').length;
  const practiceDone = SCENARIOS.filter((s) => practice[s.id]?.status === 'completed').length;
  const total = TOURS.length + SCENARIOS.length;
  const nextTour = TOURS.find((t) => tours[t.id]?.status !== 'completed');
  const inProgressTour = TOURS.find((t) => tours[t.id]?.status === 'started');
  return { toursDone, practiceDone, total, pct: Math.round(((toursDone + practiceDone) / total) * 100), nextTour, inProgressTour, tours, practice };
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
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-ink">
        <RotateCcw className="h-3.5 w-3.5" />
        Reset progress
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Reset learning progress?"
        description="Completed tours and scenarios are cleared. Case data in the simulator is not changed (use Reset training data for that)."
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

export function AcademyHome() {
  const p = useProgress();
  const navigate = useNavigate();
  const openAssistant = useAcademy((s) => s.openAssistant);
  const continueTour = p.inProgressTour ?? p.nextTour;
  const hasProgress = p.toursDone + p.practiceDone > 0 || !!p.inProgressTour;
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center gap-2 text-sm font-medium text-academy">
        <GraduationCap className="h-4 w-4" />
        CLM Academy
      </div>
      <h1 className="mt-2 text-3xl font-semibold">Welcome to CLM Academy</h1>
      <p className="mt-3 max-w-3xl text-base text-ink-soft">
        CLM — Client Lifecycle Management — is where Manafa Operations receive, investigate and resolve client cases in one place. This Academy runs a realistic copy of CLM with fictional data, so you can learn the screens, practise real work and make mistakes safely.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        {continueTour && (
          <Button variant="academy" onClick={() => startTour(continueTour.id, p.tours[continueTour.id]?.status === 'started' ? p.tours[continueTour.id].step : 0)}>
            <PlayCircle className="h-4 w-4" />
            {hasProgress ? `Continue learning: ${tourText('en', continueTour.id).title}` : 'Start learning'}
          </Button>
        )}
        <Button onClick={() => navigate('/cases')}>
          <Compass className="h-4 w-4" />
          Explore CLM
        </Button>
        <Button onClick={() => navigate('/academy/practice')}>
          <Dumbbell className="h-4 w-4" />
          Practice scenarios
        </Button>
        <Button onClick={() => openAssistant()}>
          <MessageCircleQuestion className="h-4 w-4" />
          Ask CLM
        </Button>
      </div>

      <div className="mt-8 rounded-xl border border-line p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Your progress</h2>
          <ResetProgressButton />
        </div>
        <div className="mt-3 flex items-center gap-4">
          <ProgressBar pct={p.pct} />
          <span className="shrink-0 text-sm font-medium">{p.pct}%</span>
        </div>
        <p className="mt-2 text-xs text-ink-muted">
          {p.toursDone} of {TOURS.length} guided tours · {p.practiceDone} of {SCENARIOS.length} practice scenarios completed. Saved in this browser.
        </p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {[
          { icon: <PlayCircle className="h-5 w-5" />, title: 'Guided learning', body: 'Six short tours that run inside the real screens and wait for you to do each step.', to: '/academy/learn' },
          { icon: <Compass className="h-5 w-5" />, title: 'Explore CLM', body: 'Use the simulator freely: queue, cases, verifications, ownership, licenses, documents.', to: '/cases' },
          { icon: <Dumbbell className="h-5 w-5" />, title: 'Practice scenarios', body: 'Eight realistic exercises. You do the work; CLM Academy checks it and gives hints only when you ask.', to: '/academy/practice' },
        ].map((x) => (
          <Link key={x.title} to={x.to} className="group rounded-xl border border-line p-5 hover:border-academy/40">
            <div className="text-academy">{x.icon}</div>
            <div className="mt-2 font-semibold">{x.title}</div>
            <p className="mt-1 text-sm text-ink-soft">{x.body}</p>
            <div className="mt-3 flex items-center gap-1 text-xs font-medium text-academy">
              Open <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold">Recommended learning path</h2>
        <ol className="mt-3 divide-y divide-line rounded-xl border border-line">
          {TOURS.map((t, i) => {
            const st = p.tours[t.id]?.status;
            return (
              <li key={t.id} className="flex items-center gap-4 px-4 py-3">
                <span className={clsx('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold', st === 'completed' ? 'bg-green-600 text-white' : 'bg-academy-soft text-academy')}>
                  {st === 'completed' ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{tourText('en', t.id).title}</div>
                  <div className="text-xs text-ink-muted">{tourText('en', t.id).summary}</div>
                </div>
                <span className="text-xs text-ink-muted">{t.minutes} min</span>
              </li>
            );
          })}
          <li className="flex items-center gap-4 px-4 py-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-academy-soft text-academy">
              <Dumbbell className="h-3.5 w-3.5" />
            </span>
            <div className="flex-1 text-sm font-medium">Then practise with the eight scenarios</div>
          </li>
        </ol>
      </div>

      <p className="mt-10 text-xs text-ink-muted">
        CLM Academy is a training environment. It never connects to Manafa systems; every company, person, ID and document is fictional. Behaviour follows the CLM BRD Phase I and the observed CLM screens — differences are listed in the Knowledge Base where relevant.
      </p>
    </div>
  );
}

/** Walkthrough language switch (English | العربية). Affects tour guidance only, never the CLM screens. */
export function TourLanguageSwitch() {
  const lang = useAcademy((s) => s.tourLang);
  const setTourLang = useAcademy((s) => s.setTourLang);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-ink-muted">Walkthrough language</span>
      <div role="group" aria-label="Walkthrough language" className="flex overflow-hidden rounded-md border border-line">
        {(['en', 'ar'] as TourLang[]).map((l) => (
          <button key={l} type="button" lang={l} aria-pressed={lang === l} onClick={() => setTourLang(l)} className={clsx('px-2.5 py-1 font-medium', lang === l ? 'bg-academy text-white' : 'hover:bg-surface-sunken')}>
            {l === 'en' ? 'English' : 'العربية'}
          </button>
        ))}
      </div>
    </div>
  );
}

export function LearnPage() {
  const p = useProgress();
  const lang = useAcademy((s) => s.tourLang);
  const ui = tourUi(lang);
  const rtl = lang === 'ar';
  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Guided learning</h1>
          <p className="mt-1 text-sm text-ink-muted">Each tour runs inside the CLM simulator. Steps marked “Your turn” wait until you do the action. The CLM screens stay in English in both languages.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <TourLanguageSwitch />
          <ResetProgressButton />
        </div>
      </div>
      <div className="mt-6 space-y-3">
        {TOURS.map((t, i) => {
          const st = p.tours[t.id];
          return (
            <div key={t.id} className="flex items-center gap-4 rounded-xl border border-line p-4">
              <span className={clsx('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold', st?.status === 'completed' ? 'bg-green-600 text-white' : 'bg-academy-soft text-academy')}>
                {st?.status === 'completed' ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <div className="flex-1" dir={rtl ? 'rtl' : 'ltr'} lang={lang} style={{ textAlign: rtl ? 'right' : 'left' }}>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{tourText(lang, t.id).title}</span>
                  <span className="text-xs text-ink-muted">
                    {t.level === 'Beginner' ? ui.beginner : ui.intermediate} · {ui.minutes(t.minutes)} · {ui.steps(t.steps.length)}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-ink-soft">{tourText(lang, t.id).summary}</p>
                {st?.status === 'started' && <p className="mt-1 text-xs text-academy">In progress — step {st.step + 1} of {t.steps.length}</p>}
                {st?.status === 'completed' && <p className="mt-1 text-xs text-green-700">Completed</p>}
              </div>
              <div className="flex shrink-0 gap-2">
                {st?.status === 'started' && (
                  <Button size="sm" variant="academy" onClick={() => startTour(t.id, st.step)}>
                    Continue
                  </Button>
                )}
                <Button size="sm" variant={st?.status === 'started' ? 'secondary' : 'academy'} onClick={() => startTour(t.id, 0)}>
                  {st ? 'Restart' : 'Start'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PracticePage() {
  const p = useProgress();
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-2xl font-semibold">Practice scenarios</h1>
      <p className="mt-1 text-sm text-ink-muted">Each scenario resets its own case, gives you the situation and objective, and checks your work in the simulator. Hints and explanations appear only when you ask.</p>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {SCENARIOS.map((s) => {
          const st = p.practice[s.id]?.status;
          return (
            <div key={s.id} className="flex flex-col rounded-xl border border-line p-4">
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded bg-academy-soft px-1.5 py-0.5 font-medium text-academy">{s.difficulty}</span>
                <span className="text-ink-muted">{s.caseId}</span>
                {st === 'completed' && (
                  <span className="ml-auto flex items-center gap-1 text-green-700">
                    <Check className="h-3.5 w-3.5" />
                    Completed
                  </span>
                )}
              </div>
              <div className="mt-2 font-semibold">{s.title}</div>
              <p className="mt-1 flex-1 text-sm text-ink-soft">{s.objective}</p>
              <div className="mt-3">
                <Button size="sm" variant="academy" onClick={() => startScenario(s.id, navigate)}>
                  {st ? 'Restart scenario' : 'Start scenario'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
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
