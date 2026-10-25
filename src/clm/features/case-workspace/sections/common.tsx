import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Pencil, RefreshCw } from 'lucide-react';
import type { AmlResult } from '@/domain/types';
import { Badge, type Tone } from '@/clm/components/ui/Badge';

/** Refresh / retry icon. Spins while loading; honours an optional cooldown (Wathq). */
export function RefreshButton({ onClick, loading, disabled, label = 'Retry retrieval', cooldownUntil, tour }: { onClick: () => void; loading?: boolean; disabled?: boolean; label?: string; cooldownUntil?: number; tour?: string }) {
  const [now, setNow] = useState(Date.now());
  const cooling = !!cooldownUntil && cooldownUntil > now;
  useEffect(() => {
    if (!cooling) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [cooling]);
  const wait = cooling ? Math.ceil((cooldownUntil! - now) / 1000) : 0;
  const title = cooling ? `${label} — available again in ${wait}s (Wathq cooldown)` : label;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading || cooling}
      aria-label={title}
      title={title}
      data-tour={tour}
      className="rounded p-1 text-ink hover:bg-white disabled:cursor-not-allowed disabled:text-ink-faint"
    >
      <RefreshCw className={clsx('h-4 w-4', loading && 'animate-spin')} />
    </button>
  );
}

export function EditButton({ onClick, disabled, label, tour }: { onClick: () => void; disabled?: boolean; label: string; tour?: string }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label} data-tour={tour} className="rounded p-1 text-blue-700 hover:bg-white disabled:cursor-not-allowed disabled:text-ink-faint">
      <Pencil className="h-4 w-4" />
    </button>
  );
}

export const AML_LABEL: Record<AmlResult, string> = {
  not_triggered: 'Not Triggered',
  in_progress: 'In Progress',
  clear: 'Clear',
  pending_review: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  reported: 'Reported to MOZN',
  failed: 'Failed',
  missing_info: 'Missing Information',
};
const AML_TONE: Record<AmlResult, Tone> = {
  not_triggered: 'gray',
  in_progress: 'gray',
  clear: 'green',
  pending_review: 'orange',
  approved: 'green',
  rejected: 'red',
  reported: 'purple',
  failed: 'red',
  missing_info: 'red',
};
export function AmlBadge({ result }: { result: AmlResult }) {
  return <Badge tone={AML_TONE[result]}>{AML_LABEL[result]}</Badge>;
}

export const WATHQ_COOLDOWN_MS = 2 * 60_000;
