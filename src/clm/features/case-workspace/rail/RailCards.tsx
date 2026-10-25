import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronRight, Clock3, Timer } from 'lucide-react';
import clsx from 'clsx';
import { computeSla, longDuration, SLA_STATUS_LABEL, slaChipLabel } from '@/domain/sla';
import { evaluateRequirements } from '@/domain/eddRules';
import { useUsers } from '@/store/caseStore';
import { fmtDateTime } from '@/clm/format';
import { RailCard, RailRow } from '@/clm/components/ui/Card';
import { Badge } from '@/clm/components/ui/Badge';
import { Avatar } from '@/clm/components/ui/misc';
import { AssigneeControl, SLA_TONE } from '../../case-shared/caseControls';
import { goToRequirement } from '../../case-shared/statusFlow';
import { useNow } from '../../case-shared/useNow';
import { useWs } from '../context';
import { HelpTip } from '@/training/help/HelpTip';

/** UC013 AF-3: always visible while mandatory items are incomplete; items link to their section. */
export function RequiredBeforeClosingCard() {
  const { c } = useWs();
  const navigate = useNavigate();
  const reqs = evaluateRequirements(c);
  if (c.status === 'closed' || reqs.length === 0) return null;
  return (
    <RailCard
      id="required-before-closing"
      title={
        <span className="flex items-center gap-1.5">
          Required Before Closing <HelpTip topic="closing" label="Why is approval blocked?" />
        </span>
      }
    >
      <ul className="-mx-1 divide-y divide-line">
        {reqs.map((r, i) => (
          <li key={`${r.key}-${i}`}>
            <button type="button" onClick={() => goToRequirement(navigate, c.id, r)} className="flex w-full items-center gap-2 rounded px-1 py-2 text-left hover:bg-surface-sunken">
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{r.key === 'licenses' ? `Activity License` : r.label}</span>
                  <Badge tone="red">Incomplete</Badge>
                </span>
                <span className="mt-0.5 block text-xs text-ink-muted">{r.detail}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" />
            </button>
          </li>
        ))}
      </ul>
    </RailCard>
  );
}

export function SlaCard() {
  const { c } = useWs();
  const now = useNow();
  const s = computeSla(c, now);
  const closed = c.status === 'closed';
  const tone = SLA_TONE[s.status];
  const bar = { on_track: 'bg-green-600', at_risk: 'bg-orange-600', breached: 'bg-red-600', met: 'bg-ink' }[s.status];
  return (
    <RailCard
      id="sla"
      title={
        <span className="flex items-center gap-1.5">
          SLA <HelpTip topic="sla" />
        </span>
      }
      aside={
        !closed && (
          <Badge tone={s.paused ? 'gray' : tone}>{s.paused ? 'Paused' : SLA_STATUS_LABEL[s.status]}</Badge>
        )
      }
    >
      {!closed && (
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-neutral-200">
          <div className={clsx('h-full rounded-full', s.paused ? 'bg-neutral-400' : bar)} style={{ width: `${Math.min(100, s.consumed * 100)}%` }} />
        </div>
      )}
      <RailRow label="Created Date">{fmtDateTime(c.createdAt)}</RailRow>
      <RailRow label="Due Date">{fmtDateTime(c.dueAt)}</RailRow>
      {closed ? (
        <RailRow label="Time Tracking">{longDuration(s.elapsedMs)}</RailRow>
      ) : (
        <RailRow label="Time remaining">
          <Badge tone={s.paused ? 'gray' : tone} icon={s.paused ? <Clock3 className="h-3 w-3" /> : <Timer className="h-3 w-3" />}>
            {slaChipLabel(s, false)}
          </Badge>
        </RailRow>
      )}
      {s.paused && <p className="mt-2 text-xs text-ink-muted">SLA is paused while the case is in Need Info.</p>}
    </RailCard>
  );
}

export function AssignmentCard() {
  const { c } = useWs();
  return (
    <RailCard id="assignment" title="Assignment">
      <div className="flex flex-col">
        <AssigneeControl c={c} />
        <span className="ml-10 text-xs text-ink-muted">Assignee</span>
      </div>
    </RailCard>
  );
}

export function SystemRecordedCard() {
  const { c } = useWs();
  const users = useUsers();
  const u = (id?: string) => users.find((x) => x.id === id);
  const creator = u(c.createdById);
  const closer = u(c.closedById);
  return (
    <RailCard id="system-recorded" title="System Recorded">
      <RailRow label="Created By">
        <span className="flex items-center gap-2">
          {creator ? <Avatar user={creator} size="sm" /> : null}
          {creator?.name ?? 'System (CRM)'}
        </span>
      </RailRow>
      <RailRow label="Created Date">{fmtDateTime(c.createdAt)}</RailRow>
      <RailRow label="Closed By">
        <span className="flex items-center gap-2">
          <Avatar user={closer} size="sm" />
          {closer?.name ?? '-'}
        </span>
      </RailRow>
      <RailRow label="Closed Date">{fmtDateTime(c.closedAt)}</RailRow>
    </RailCard>
  );
}

export function ConsentCard() {
  const { c } = useWs();
  const { consents } = c.edd;
  return (
    <RailCard id="consents" title="Company Consent" subtitle={`Accepted together · ${fmtDateTime(consents.acceptedAt)}`}>
      <ul className="divide-y divide-line">
        {consents.items.map((i) => (
          <li key={i.type} className="py-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={clsx('h-4 w-4', i.status === 'accepted' ? 'text-green-700' : 'text-ink-faint')} />
              <span className="flex-1 text-sm font-medium">{i.type}</span>
              <Badge tone={i.status === 'accepted' ? 'green' : 'orange'}>{i.status === 'accepted' ? 'Accepted' : 'Pending'}</Badge>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <span className="rounded-md bg-surface-sunken px-2 py-0.5 text-xs font-medium">{i.signerId}</span>
              <span className="bidi truncate text-xs">{i.signerName}</span>
            </div>
          </li>
        ))}
      </ul>
    </RailCard>
  );
}
