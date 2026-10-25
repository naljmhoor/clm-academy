import { useMemo, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { Popover } from './Popover';

export interface Option {
  value: string;
  label: string;
  /** Rendered instead of label in the list. */
  render?: ReactNode;
  hint?: string;
}

interface BaseProps {
  options: Option[];
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  id?: string;
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-line px-3 py-2">
      <Search className="h-3.5 w-3.5 text-ink-muted" />
      <input autoFocus value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-transparent text-sm outline-none placeholder:text-ink-faint" />
    </div>
  );
}

const filterOptions = (options: Option[], q: string) => {
  const s = q.trim().toLowerCase();
  return s ? options.filter((o) => o.label.toLowerCase().includes(s) || o.hint?.toLowerCase().includes(s)) : options;
};

export function Select({ value, onChange, options, placeholder = 'Select', searchable, disabled, invalid, className, id }: BaseProps & { value?: string; onChange: (v: string) => void }) {
  const [q, setQ] = useState('');
  const selected = options.find((o) => o.value === value);
  const shown = useMemo(() => filterOptions(options, q), [options, q]);
  return (
    <Popover
      width="trigger"
      onOpenChange={(o) => !o && setQ('')}
      trigger={({ toggle, ref, open }) => (
        <button
          id={id}
          ref={ref}
          type="button"
          disabled={disabled}
          onClick={toggle}
          className={clsx('input flex items-center justify-between gap-2 text-left', invalid && 'input-error', open && 'border-ink/40', className)}
        >
          <span className={clsx('bidi truncate', !selected && 'text-ink-faint')}>{selected?.label ?? placeholder}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-ink-muted" />
        </button>
      )}
    >
      {(close) => (
        <div>
          {searchable && <SearchBox value={q} onChange={setQ} placeholder="Search…" />}
          <div className="max-h-64 overflow-auto py-1">
            {shown.length === 0 && <div className="px-3 py-2 text-sm text-ink-muted">No results</div>}
            {shown.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  close();
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-surface-sunken"
              >
                <span className="bidi flex-1">{o.render ?? o.label}</span>
                {o.value === value && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </Popover>
  );
}

export function MultiSelect({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  searchable = true,
  disabled,
  invalid,
  className,
  id,
}: BaseProps & { value: string[]; onChange: (v: string[]) => void }) {
  const [q, setQ] = useState('');
  const shown = useMemo(() => filterOptions(options, q), [options, q]);
  const toggleValue = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <Popover
      width="trigger"
      onOpenChange={(o) => !o && setQ('')}
      trigger={({ toggle, ref, open }) => (
        <div
          id={id}
          ref={ref}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled}
          onClick={() => !disabled && toggle()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !disabled && toggle()}
          className={clsx(
            'flex min-h-9 w-full cursor-pointer items-center gap-2 rounded-md border border-line bg-white px-2 py-1 text-sm',
            invalid && 'border-red-500',
            open && 'border-ink/40',
            disabled && 'cursor-not-allowed bg-surface-sunken',
            className,
          )}
        >
          <div className="flex flex-1 flex-wrap gap-1.5">
            {value.length === 0 && <span className="px-1 text-ink-faint">{placeholder}</span>}
            {value.map((v) => {
              const o = options.find((x) => x.value === v);
              return (
                <span key={v} className="bidi inline-flex items-center gap-1 rounded-md border border-line bg-surface-sunken px-2 py-0.5 text-xs">
                  {o?.label ?? v}
                  {!disabled && (
                    <button
                      type="button"
                      aria-label={`Remove ${o?.label ?? v}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleValue(v);
                      }}
                      className="text-ink-muted hover:text-ink"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              );
            })}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-ink-muted" />
        </div>
      )}
    >
      <div>
        {searchable && <SearchBox value={q} onChange={setQ} placeholder="Search…" />}
        <div className="max-h-64 overflow-auto py-1">
          {shown.length === 0 && <div className="px-3 py-2 text-sm text-ink-muted">No results</div>}
          {shown.map((o) => {
            const on = value.includes(o.value);
            return (
              <button key={o.value} type="button" onClick={() => toggleValue(o.value)} className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-surface-sunken">
                <span className={clsx('flex h-4 w-4 shrink-0 items-center justify-center rounded border', on ? 'border-ink bg-ink text-white' : 'border-neutral-300')}>
                  {on && <Check className="h-3 w-3" />}
                </span>
                <span className="bidi flex-1">{o.render ?? o.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </Popover>
  );
}
