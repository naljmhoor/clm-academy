import { forwardRef, useRef, type ReactNode } from 'react';
import clsx from 'clsx';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useToasts } from '@/store/toastStore';
import type { User } from '@/domain/types';

export function Avatar({ user, size = 'md', className }: { user?: Pick<User, 'initials'> | null; size?: 'sm' | 'md'; className?: string }) {
  const dim = size === 'sm' ? 'h-6 w-6 text-2xs' : 'h-8 w-8 text-xs';
  if (!user) return <span className={clsx('inline-block shrink-0 rounded-full border border-dashed border-neutral-300', dim, className)} aria-hidden />;
  return <span className={clsx('inline-flex shrink-0 items-center justify-center rounded-full bg-neutral-100 font-medium text-ink-soft', dim, className)}>{user.initials}</span>;
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={clsx('h-4 w-4 animate-spin text-ink-muted', className)} />;
}

export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      {icon && <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink-soft">{icon}</div>}
      <div className="text-sm font-semibold">{title}</div>
      {body && <p className="mt-1 max-w-md text-xs text-ink-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Toaster() {
  const { toasts, dismiss } = useToasts();
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[70] flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => dismiss(t.id)}
          className={clsx(
            'pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2.5 text-left text-sm shadow-pop',
            t.tone === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800',
          )}
        >
          {t.tone === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          <span>{t.message}</span>
        </button>
      ))}
    </div>
  );
}

/** "Choose file  No file chosen" control matching the CLM upload fields. */
export function FileInput({ file, onChange, accept, invalid, id }: { file?: File | null; onChange: (f: File | null) => void; accept?: string; invalid?: boolean; id?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className={clsx('flex h-9 items-center gap-3 rounded-md border bg-white pr-3 text-sm', invalid ? 'border-red-500' : 'border-line')}>
      <input id={id} ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
      <button type="button" onClick={() => ref.current?.click()} className="h-full rounded-l-md border-r border-line px-3 font-medium hover:bg-surface-sunken">
        Choose file
      </button>
      <span className={clsx('truncate', !file && 'text-ink-soft')}>{file ? file.name : 'No file chosen'}</span>
    </div>
  );
}

export function SegmentedTabs<T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode; icon?: ReactNode; tour?: string }[]; className?: string }) {
  return (
    <div className={clsx('inline-flex rounded-lg bg-surface-sunken p-1', className)} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          data-tour={o.tour}
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={clsx('flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium', value === o.value ? 'bg-white shadow-sm' : 'text-ink-soft hover:text-ink')}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function UnderlineTabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode; tour?: string }[] }) {
  return (
    <div className="flex gap-1 border-b border-line" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          data-tour={o.tour}
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={clsx('-mb-px border-b-2 px-3 pb-2.5 pt-1 text-sm', value === o.value ? 'border-ink font-medium text-ink' : 'border-transparent text-ink-muted hover:text-ink')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const TextArea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(function TextArea({ invalid, className, ...rest }, ref) {
  return <textarea ref={ref} dir="auto" {...rest} className={clsx('w-full rounded-md border bg-white px-3 py-2 text-sm placeholder:text-ink-faint focus:border-ink/40 focus:outline-none', invalid ? 'border-red-500' : 'border-line', className)} />;
});

export function FormField({ label, required, error, children, htmlFor }: { label: ReactNode; required?: boolean; error?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
