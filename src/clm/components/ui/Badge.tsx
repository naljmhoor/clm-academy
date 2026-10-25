import type { ReactNode } from 'react';
import clsx from 'clsx';

export type Tone = 'neutral' | 'gray' | 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'black';

export const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'bg-surface-sunken text-ink',
  gray: 'bg-neutral-100 text-neutral-600',
  blue: 'bg-blue-50 text-blue-800',
  green: 'bg-green-50 text-green-700',
  red: 'bg-red-50 text-red-700',
  orange: 'bg-orange-50 text-orange-700',
  purple: 'bg-purple-50 text-purple-700',
  black: 'bg-ink text-white',
};

export const DOT_CLASSES: Record<Tone, string> = {
  neutral: 'bg-ink',
  gray: 'bg-neutral-400',
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  red: 'bg-red-600',
  orange: 'bg-orange-600',
  purple: 'bg-purple-700',
  black: 'bg-ink',
};

export function Badge({ tone = 'neutral', children, className, icon }: { tone?: Tone; children: ReactNode; className?: string; icon?: ReactNode }) {
  return (
    <span className={clsx('inline-flex h-5 shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-1.5 text-2xs font-semibold', TONE_CLASSES[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

export function CountPill({ children }: { children: ReactNode }) {
  return <span className="rounded-md bg-neutral-200/70 px-1.5 text-2xs font-semibold text-ink-soft">{children}</span>;
}
