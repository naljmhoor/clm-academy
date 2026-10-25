import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Check, ChevronDown, ChevronsDown, ChevronsUp, Equal, Pause, Search, Timer } from 'lucide-react';
import type { CaseRecord, CaseStatus, Priority } from '@/domain/types';
import { computeSla, slaChipLabel, type SlaStatus } from '@/domain/sla';
import { STATUS_LABEL, STATUS_ORDER, transitionBlockReason } from '@/domain/transitions';
import { useClm, useUsers } from '@/store/caseStore';
import { Popover, MenuList } from '@/clm/components/ui/Popover';
import { Badge, DOT_CLASSES, TONE_CLASSES, type Tone } from '@/clm/components/ui/Badge';
import { Avatar } from '@/clm/components/ui/misc';
import { useStatusFlow } from './statusFlow';
import { useNow } from './useNow';

export const STATUS_TONE: Record<CaseStatus, Tone> = { open: 'neutral', in_progress: 'orange', need_info: 'purple', closed: 'black' };
export const PRIORITY_TONE: Record<Priority, Tone> = { high: 'red', medium: 'orange', low: 'neutral' };
export const PRIORITY_LABEL: Record<Priority, string> = { high: 'High', medium: 'Medium', low: 'Low' };
export const SLA_TONE: Record<SlaStatus, Tone> = { on_track: 'green', at_risk: 'orange', breached: 'red', met: 'neutral' };

export function PriorityIcon({ p, className }: { p: Priority; className?: string }) {
  const cls = clsx('h-3.5 w-3.5', className);
  if (p === 'high') return <ChevronsUp className={clsx(cls, 'text-red-600')} />;
  if (p === 'medium') return <Equal className={clsx(cls, 'text-orange-600')} />;
  return <ChevronsDown className={clsx(cls, 'text-ink')} />;
}

export function CaseTypeBadge() {
  return <Badge tone="blue">Due Diligence</Badge>;
}

export function ResolutionBadge({ c }: { c: Pick<CaseRecord, 'resolution'> }) {
  if (!c.resolution) return null;
  return <Badge tone={c.resolution === 'approved' ? 'green' : 'red'}>{c.resolution === 'approved' ? 'Approved' : 'Rejected'}</Badge>;
}

export function SlaChip({ c }: { c: CaseRecord }) {
  const now = useNow();
  const s = computeSla(c, now);
  const closed = c.status === 'closed';
  return (
    <Badge tone={s.paused ? 'gray' : SLA_TONE[s.status]} icon={s.paused ? <Pause className="h-3 w-3" /> : <Timer className="h-3 w-3" />}>
      {s.paused ? `Paused · ${slaChipLabel(s, false)}` : slaChipLabel(s, closed)}
    </Badge>
  );
}

const pillBase = 'inline-flex h-6 items-center gap-1 rounded-md px-2 text-2xs font-semibold';

/** Status dropdown. Closed cases show their resolution and are not editable. */
export function StatusControl({ c, variant = 'pill' }: { c: CaseRecord; variant?: 'pill' | 'header' }) {
  const request = useStatusFlow((s) => s.request);
  if (c.status === 'closed') {
    return variant === 'header' ? (
      <span className="inline-flex h-8 w-36 items-center justify-center rounded-md bg-green-50 text-xs font-medium text-green-800">Closed</span>
    ) : (
      <ResolutionBadge c={c} />
    );
  }
  const tone = STATUS_TONE[c.status];
  return (
    <Popover
      align="end"
      trigger={({ toggle, ref }) => (
        <button
          ref={ref}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggle();
          }}
          data-tour="status-control"
          className={clsx(variant === 'header' ? 'inline-flex h-8 w-36 items-center justify-center gap-2 rounded-md text-xs font-medium' : pillBase, TONE_CLASSES[tone], tone === 'neutral' && 'bg-transparent')}
        >
          {STATUS_LABEL[c.status]}
          <ChevronDown className="h-3 w-3" />
        </button>
      )}
    >
      {(close) => (
        <MenuList
          title="Change Status"
          close={close}
          items={STATUS_ORDER.map((st) => {
            const reason = transitionBlockReason(c.status, st);
            return {
              key: st,
              icon: <span className={clsx('h-2 w-2 rounded-full', DOT_CLASSES[STATUS_TONE[st]])} />,
              label: (
                <span className="flex items-center justify-between gap-3">
                  {STATUS_LABEL[st]}
                  {st === c.status && <Check className="h-3.5 w-3.5" />}
                </span>
              ),
              disabled: !!reason,
              hint: reason,
              onSelect: () => request(c.id, st),
            };
          })}
        />
      )}
    </Popover>
  );
}

export function PriorityControl({ c, variant = 'pill' }: { c: CaseRecord; variant?: 'pill' | 'header' }) {
  const setPriority = useClm((s) => s.setPriority);
  const tone = PRIORITY_TONE[c.priority];
  const readOnly = c.status === 'closed';
  const content = (
    <>
      <PriorityIcon p={c.priority} className="h-3 w-3" />
      {PRIORITY_LABEL[c.priority]}
      {!readOnly && <ChevronDown className="h-3 w-3" />}
    </>
  );
  const cls = clsx(variant === 'header' ? 'inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium' : pillBase, TONE_CLASSES[tone], tone === 'neutral' && 'bg-transparent');
  if (readOnly) return <span className={cls}>{content}</span>;
  return (
    <Popover
      align="end"
      trigger={({ toggle, ref }) => (
        <button ref={ref} type="button" data-tour="priority-control" onClick={(e) => (e.stopPropagation(), toggle())} className={cls}>
          {content}
        </button>
      )}
    >
      {(close) => (
        <MenuList
          title="Change Priority"
          close={close}
          items={(['high', 'medium', 'low'] as Priority[]).map((p) => ({
            key: p,
            icon: <PriorityIcon p={p} />,
            label: PRIORITY_LABEL[p],
            onSelect: () => setPriority(c.id, p),
          }))}
        />
      )}
    </Popover>
  );
}

export function AssigneeControl({ c, compact }: { c: CaseRecord; compact?: boolean }) {
  const users = useUsers();
  const setAssignee = useClm((s) => s.setAssignee);
  const [q, setQ] = useState('');
  const user = users.find((u) => u.id === c.assigneeId);
  const shown = useMemo(() => users.filter((u) => u.name.toLowerCase().includes(q.toLowerCase())), [users, q]);
  const readOnly = c.status === 'closed';
  const display = (
    <span className="flex min-w-0 items-center gap-2">
      <Avatar user={user} size={compact ? 'sm' : 'md'} />
      <span className={clsx('truncate text-sm', !user && 'text-ink-muted')}>{user?.name ?? 'Unassigned'}</span>
    </span>
  );
  if (readOnly) return display;
  return (
    <Popover
      width={240}
      onOpenChange={(o) => !o && setQ('')}
      trigger={({ toggle, ref }) => (
        <button ref={ref} type="button" data-tour="assignee-control" onClick={(e) => (e.stopPropagation(), toggle())} className="flex min-w-0 items-center gap-1 rounded-md py-0.5 pr-1 hover:bg-surface-sunken">
          {display}
        </button>
      )}
    >
      {(close) => (
        <div>
          <div className="flex items-center gap-2 border-b border-line px-3 py-2">
            <Search className="h-3.5 w-3.5 text-ink-muted" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search assignee…" className="w-full text-sm outline-none" />
          </div>
          <div className="max-h-64 overflow-auto py-1">
            {[{ id: undefined as string | undefined, name: 'Unassigned', initials: '' }, ...shown].map((u) => (
              <button
                key={u.id ?? 'none'}
                type="button"
                onClick={() => {
                  setAssignee(c.id, u.id);
                  close();
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-surface-sunken"
              >
                <Avatar user={u.id ? u : null} size="sm" />
                <span className="flex-1">{u.name}</span>
                {u.id === c.assigneeId && <Check className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </Popover>
  );
}
