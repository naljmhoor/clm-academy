import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Building2 } from 'lucide-react';
import type { CaseStatus } from '@/domain/types';
import { STATUS_LABEL, STATUS_ORDER, canTransition } from '@/domain/transitions';
import { useUsers } from '@/store/caseStore';
import { toast } from '@/store/toastStore';
import { Avatar } from '@/clm/components/ui/misc';
import { CountPill, DOT_CLASSES } from '@/clm/components/ui/Badge';
import { CaseTypeBadge, PriorityIcon, ResolutionBadge, SlaChip, STATUS_TONE } from '../case-shared/caseControls';
import { useStatusFlow } from '../case-shared/statusFlow';
import type { QueueRow } from './selectQueue';
import { fmtDate } from '@/clm/format';

function Card({ row, dragging, onDragStart, onDragEnd }: { row: QueueRow; dragging: boolean; onDragStart: () => void; onDragEnd: () => void }) {
  const { c, entity } = row;
  const users = useUsers();
  const navigate = useNavigate();
  const user = users.find((u) => u.id === c.assigneeId);
  return (
    <div
      role="button"
      tabIndex={0}
      draggable={c.status !== 'closed'}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', c.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onClick={() => navigate(`/cases/${c.id}`)}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/cases/${c.id}`)}
      data-tour={`case-card-${c.id}`}
      className={clsx('cursor-pointer rounded-lg border border-line bg-white p-3 shadow-sm transition hover:border-neutral-300', dragging && 'opacity-40')}
    >
      <div className="bidi truncate text-sm font-semibold" title={entity.nameAr}>
        {entity.nameAr}
      </div>
      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-muted">
        <Building2 className="h-3.5 w-3.5" />
        {c.id} ·
        <CaseTypeBadge />
        <PriorityIcon p={c.priority} className="h-4 w-4" />
        <span className="ml-auto">{fmtDate(c.createdAt).slice(0, 6)}</span>
      </div>
      {c.status === 'closed' && (
        <div className="mt-1.5">
          <ResolutionBadge c={c} />
        </div>
      )}
      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-line pt-2.5">
        <span className="flex min-w-0 items-center gap-1.5">
          <Avatar user={user} size="sm" />
          <span className={clsx('truncate text-xs', !user && 'text-ink-muted')}>{user?.name ?? 'Unassigned'}</span>
        </span>
        <SlaChip c={c} />
      </div>
    </div>
  );
}

export function CaseKanban({ rows }: { rows: QueueRow[] }) {
  const request = useStatusFlow((s) => s.request);
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<CaseStatus | null>(null);
  const dragged = rows.find((r) => r.c.id === dragId)?.c;

  const drop = (to: CaseStatus) => {
    setOver(null);
    if (!dragged || dragged.status === to) return;
    if (!canTransition(dragged.status, to)) {
      toast(`A case can't move from ${STATUS_LABEL[dragged.status]} to ${STATUS_LABEL[to]}.`, 'error');
      return;
    }
    request(dragged.id, to);
  };

  return (
    <div className="grid min-h-[560px] grid-cols-4 gap-4" data-tour="queue-kanban">
      {STATUS_ORDER.map((st) => {
        const col = rows.filter((r) => r.c.status === st);
        const allowed = dragged ? dragged.status !== st && canTransition(dragged.status, st) : false;
        return (
          <div
            key={st}
            onDragOver={(e) => {
              if (!dragged) return;
              e.preventDefault();
              setOver(st);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              drop(st);
            }}
            className={clsx(
              'flex max-h-[calc(100vh-260px)] min-h-[560px] flex-col rounded-xl border bg-surface-sunken/70 p-2',
              over === st ? (allowed ? 'border-2 border-dashed border-ink' : 'border-2 border-dashed border-red-400') : 'border-line',
            )}
          >
            <div className="flex items-center gap-2 px-1.5 pb-2 pt-1 text-sm font-medium">
              <span className={clsx('h-2 w-2 rounded-full', DOT_CLASSES[STATUS_TONE[st] === 'black' ? 'green' : STATUS_TONE[st]])} />
              {STATUS_LABEL[st]}
              <CountPill>{col.length}</CountPill>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto pr-0.5">
              {col.map((r) => (
                <Card key={r.c.id} row={r} dragging={dragId === r.c.id} onDragStart={() => setDragId(r.c.id)} onDragEnd={() => (setDragId(null), setOver(null))} />
              ))}
              {col.length === 0 && <div className="px-2 py-6 text-center text-xs text-ink-muted">No cases</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
