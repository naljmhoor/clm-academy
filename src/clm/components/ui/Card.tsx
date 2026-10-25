import { useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { ChevronDown, ChevronUp } from 'lucide-react';

/** EDD section: white card, grey header bar with title / sub-text / actions, collapsible body. */
export function SectionCard({
  id,
  title,
  titleAside,
  subtitle,
  subtitleTone = 'muted',
  actions,
  children,
  defaultOpen = true,
  bare,
}: {
  id?: string;
  title: ReactNode;
  titleAside?: ReactNode;
  subtitle?: ReactNode;
  subtitleTone?: 'muted' | 'error';
  actions?: ReactNode;
  children?: ReactNode;
  defaultOpen?: boolean;
  /** Render the header without the outer card (used when nested in another card). */
  bare?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section id={id} data-tour={id} className={clsx('scroll-mt-24', !bare && 'rounded-xl border border-line bg-white p-3')}>
      <div className="flex items-start gap-3 rounded-lg bg-surface-sunken px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">{title}</h3>
            {titleAside}
          </div>
          {subtitle && <p className={clsx('mt-0.5 text-xs', subtitleTone === 'error' ? 'text-red-600' : 'text-ink-muted')}>{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1">
          {actions}
          {children !== undefined && (
            <button type="button" onClick={() => setOpen(!open)} aria-label={open ? 'Collapse section' : 'Expand section'} className="rounded p-1 text-ink hover:bg-white">
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
      {open && children !== undefined && <div className="px-1 pb-1 pt-3">{children}</div>}
    </section>
  );
}

/** Right-rail card: title row with collapse chevron. */
export function RailCard({ id, title, aside, subtitle, children }: { id?: string; title: ReactNode; aside?: ReactNode; subtitle?: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <section id={id} data-tour={id} className="rounded-xl border border-line bg-white px-4 py-3.5">
      <div className="flex items-center gap-2">
        <h3 className="flex-1 text-sm font-semibold">{title}</h3>
        {aside}
        <button type="button" onClick={() => setOpen(!open)} aria-label={open ? 'Collapse' : 'Expand'} className="rounded p-0.5 hover:bg-surface-sunken">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>
      {subtitle && open && <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>}
      {open && <div className="mt-3">{children}</div>}
    </section>
  );
}

export function Field({ label, children, className }: { label: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={clsx('min-w-0', className)}>
      <div className="label">{label}</div>
      <div className="bidi mt-1 break-words text-sm text-ink">{children ?? '-'}</div>
    </div>
  );
}

export function FieldGrid({ children, cols = 4 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
  return <div className={clsx('grid gap-x-6 gap-y-4 px-2', cols === 4 ? 'grid-cols-2 lg:grid-cols-4' : cols === 3 ? 'grid-cols-3' : 'grid-cols-2')}>{children}</div>;
}

export function RailRow({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="text-ink-muted">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}
