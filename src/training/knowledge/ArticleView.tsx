import { CircleHelp, FileText, PlayCircle } from 'lucide-react';
import clsx from 'clsx';
import { articleById, type Article } from './articles';
import { TOUR_TITLES } from '../tours/tourTitles';

const STATUS = {
  confirmed: { label: 'Confirmed in BRD', cls: 'bg-green-50 text-green-700' },
  observed: { label: 'Observed in CLM screens', cls: 'bg-blue-50 text-blue-800' },
  open: { label: 'Includes an open question', cls: 'bg-orange-50 text-orange-700' },
};

export function ArticleBody({ a }: { a: Article }) {
  const blocks: (string | string[])[] = [];
  for (const line of a.body) {
    if (line.startsWith('- ')) {
      const last = blocks[blocks.length - 1];
      if (Array.isArray(last)) last.push(line.slice(2));
      else blocks.push([line.slice(2)]);
    } else blocks.push(line);
  }
  return (
    <div className="space-y-2 text-sm leading-relaxed text-ink-soft">
      {blocks.map((b, i) =>
        Array.isArray(b) ? (
          <ul key={i} className="list-disc space-y-1 pl-5">
            {b.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        ) : (
          <p key={i} className={clsx(b.startsWith('Open question') && 'rounded-md bg-orange-50 px-3 py-2 text-orange-800')}>
            {b}
          </p>
        ),
      )}
    </div>
  );
}

export function ArticleView({ a, onOpenArticle, onStartTour, compact }: { a: Article; onOpenArticle: (id: string) => void; onStartTour: (id: string) => void; compact?: boolean }) {
  const st = STATUS[a.status];
  return (
    <article>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-ink-muted">{a.category}</span>
        <span className={clsx('rounded px-1.5 py-0.5 font-medium', st.cls)}>{st.label}</span>
      </div>
      <h2 className={clsx('mt-1 font-semibold', compact ? 'text-base' : 'text-xl')}>{a.title}</h2>
      <p className="mt-2 text-sm font-medium">{a.summary}</p>
      <p dir="rtl" lang="ar" className="mt-2 rounded-md bg-surface-sunken px-3 py-2 text-right text-sm text-ink-soft">
        {a.summaryAr}
      </p>
      <div className="mt-4">
        <ArticleBody a={a} />
      </div>
      <div className="mt-5 border-t border-line pt-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Sources</div>
        <ul className="mt-1.5 space-y-1 text-xs text-ink-soft">
          {a.sources.map((s) => (
            <li key={s.doc + s.section} className="flex items-start gap-1.5">
              <FileText className="mt-0.5 h-3 w-3 shrink-0" />
              {s.doc} — {s.section}
            </li>
          ))}
        </ul>
      </div>
      {(a.relatedTours?.length || a.relatedArticles?.length) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {a.relatedTours?.map((t) => (
            <button key={t} type="button" onClick={() => onStartTour(t)} className="flex items-center gap-1.5 rounded-md border border-academy/30 px-2.5 py-1 text-xs font-medium text-academy hover:bg-academy-soft">
              <PlayCircle className="h-3.5 w-3.5" />
              Tour: {TOUR_TITLES[t]}
            </button>
          ))}
          {a.relatedArticles?.map((id) => {
            const r = articleById(id);
            return r ? (
              <button key={id} type="button" onClick={() => onOpenArticle(id)} className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 text-xs font-medium hover:bg-surface-sunken">
                <CircleHelp className="h-3.5 w-3.5" />
                {r.title}
              </button>
            ) : null;
          })}
        </div>
      )}
    </article>
  );
}
