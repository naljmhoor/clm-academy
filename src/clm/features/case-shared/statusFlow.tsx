// Status changes from any surface (table, kanban drag, workspace header) go through this flow,
// so Need Info details, resolution reason and approval preconditions are always enforced.

import { useState } from 'react';
import { create } from 'zustand';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, ChevronRight } from 'lucide-react';
import type { CaseStatus, Resolution } from '@/domain/types';
import { canTransition, STATUS_LABEL } from '@/domain/transitions';
import { evaluateRequirements, type Requirement } from '@/domain/eddRules';
import { useCase, useClm } from '@/store/caseStore';
import { Dialog } from '@/clm/components/ui/Dialog';
import { Button } from '@/clm/components/ui/Button';
import { Badge } from '@/clm/components/ui/Badge';
import { FormField, TextArea } from '@/clm/components/ui/misc';
import { Select } from '@/clm/components/ui/Select';
import { STATUS_TONE } from './caseControls';
import { HelpTip } from '@/training/help/HelpTip';

type Pending = { caseId: string; kind: 'need_info' | 'close' | 'blocked'; requirements?: Requirement[] } | null;

export const useStatusFlow = create<{ pending: Pending; request: (caseId: string, to: CaseStatus) => void; clear: () => void; set: (p: Pending) => void }>((set) => ({
  pending: null,
  request: (caseId, to) => {
    const c = useClm.getState().cases.find((x) => x.id === caseId);
    if (!c || c.status === to || !canTransition(c.status, to)) return;
    if (to === 'need_info') return set({ pending: { caseId, kind: 'need_info' } });
    if (to === 'closed') return set({ pending: { caseId, kind: 'close' } });
    useClm.getState().changeStatus(caseId, to);
  },
  clear: () => set({ pending: null }),
  set: (pending) => set({ pending }),
}));

export function goToRequirement(navigate: ReturnType<typeof useNavigate>, caseId: string, r: Pick<Requirement, 'tab' | 'anchor'>) {
  navigate(`/cases/${caseId}?tab=${r.tab}&focus=${r.anchor}`);
}

function Transition({ from, to }: { from: CaseStatus; to: CaseStatus }) {
  return (
    <div className="flex items-center gap-2">
      <Badge tone={STATUS_TONE[from] === 'neutral' ? 'gray' : STATUS_TONE[from]}>{STATUS_LABEL[from]}</Badge>
      <ArrowRight className="h-3.5 w-3.5 text-ink-muted" />
      <Badge tone={to === 'closed' ? 'gray' : STATUS_TONE[to]}>{STATUS_LABEL[to]}</Badge>
    </div>
  );
}

function NeedInfoDialog({ caseId }: { caseId: string }) {
  const c = useCase(caseId)!;
  const clear = useStatusFlow((s) => s.clear);
  const requestInfo = useClm((s) => s.requestInfo);
  const [text, setText] = useState('');
  const [touched, setTouched] = useState(false);
  const invalid = touched && !text.trim();
  return (
    <Dialog
      open
      onClose={clear}
      width="lg"
      tour="need-info-dialog"
      title={
        <span className="flex items-center gap-1.5">
          Mark case as Need Info <HelpTip topic="need-info" label="What is Need Info?" />
        </span>
      }
      headerAside={<Transition from={c.status} to="need_info" />}
      footer={
        <>
          <Button onClick={clear}>Back</Button>
          <Button
            variant="primary"
            onClick={() => {
              setTouched(true);
              if (!text.trim()) return;
              requestInfo(caseId, text.trim());
              clear();
            }}
          >
            Send request
          </Button>
        </>
      }
    >
      <div className="border-t border-line pt-4">
        <FormField label="Request Details" required error={invalid ? 'Describe the information or documents needed.' : undefined} htmlFor="need-info-details">
          <TextArea
            id="need-info-details"
            rows={4}
            value={text}
            invalid={invalid}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Provide the latest audited financial statements and a bank letter confirming the IBAN holder."
          />
        </FormField>
        <p className="mt-2 text-xs text-ink-muted">The request is saved as a comment on the case. The SLA pauses while the case is in Need Info.</p>
      </div>
    </Dialog>
  );
}

function CloseDialog({ caseId }: { caseId: string }) {
  const c = useCase(caseId)!;
  const { clear, set } = useStatusFlow();
  const closeCase = useClm((s) => s.closeCase);
  const [resolution, setResolution] = useState<Resolution | ''>('');
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const errs = { resolution: touched && !resolution, reason: touched && !reason.trim() };

  const submit = () => {
    setTouched(true);
    if (!resolution || !reason.trim()) return;
    if (resolution === 'approved') {
      const reqs = evaluateRequirements(c);
      if (reqs.length) return set({ caseId, kind: 'blocked', requirements: reqs });
    }
    closeCase(caseId, { resolution, reason: reason.trim() });
    clear();
  };

  return (
    <Dialog
      open
      onClose={clear}
      width="lg"
      tour="close-dialog"
      title={
        <span className="flex items-center gap-1.5">
          Mark case as Closed <HelpTip topic="resolution" label="What happens after I close the case?" />
        </span>
      }
      headerAside={<Transition from={c.status} to="closed" />}
      footer={
        <>
          <Button onClick={clear}>Cancel</Button>
          <Button variant="primary" onClick={submit}>
            Done
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label="Resolution" required error={errs.resolution ? 'Select a resolution.' : undefined}>
          <Select
            value={resolution}
            onChange={(v) => setResolution(v as Resolution)}
            invalid={errs.resolution}
            placeholder="Select resolution"
            options={[
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ]}
          />
        </FormField>
        <FormField label="Resolution reason" required error={errs.reason ? `A ${resolution === 'rejected' ? 'rejection' : 'resolution'} reason is required.` : undefined} htmlFor="resolution-reason">
          <TextArea id="resolution-reason" rows={4} value={reason} invalid={errs.reason} onChange={(e) => setReason(e.target.value)} placeholder="Summarise the evidence and the basis for this decision." />
        </FormField>
        {resolution === 'approved' && <p className="text-xs text-ink-muted">Approval is only possible when every Required Before Closing item is complete.</p>}
      </div>
    </Dialog>
  );
}

function BlockedDialog({ caseId, requirements }: { caseId: string; requirements: Requirement[] }) {
  const clear = useStatusFlow((s) => s.clear);
  const navigate = useNavigate();
  const go = (r: Requirement) => {
    clear();
    goToRequirement(navigate, caseId, r);
  };
  const n = requirements.length;
  return (
    <Dialog
      open
      onClose={clear}
      width="lg"
      tour="blocked-dialog"
      title={
        <span className="flex items-center gap-1.5">
          Case can't be closed yet <HelpTip topic="closing" label="Why is approval blocked?" />
        </span>
      }
      footer={
        <>
          <Button onClick={clear}>Cancel</Button>
          <Button variant="primary" onClick={() => go(requirements[0])}>
            Review
          </Button>
        </>
      }
    >
      <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
        <AlertCircle className="h-4 w-4 shrink-0" />
        {n} required section{n === 1 ? ' is' : 's are'} incomplete. Complete {n === 1 ? 'it' : `all ${n} required sections`} before closing this case.
      </div>
      <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
        {requirements.map((r, i) => (
          <li key={`${r.key}-${i}`}>
            <button type="button" onClick={() => go(r)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-sunken">
              <span className="flex-1">
                <span className="block text-sm font-medium">{r.heading}</span>
                <span className="block text-xs text-ink-muted">{r.detail}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-ink-muted" />
            </button>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}

export function StatusFlowHost() {
  const pending = useStatusFlow((s) => s.pending);
  if (!pending) return null;
  if (pending.kind === 'need_info') return <NeedInfoDialog key={pending.caseId} caseId={pending.caseId} />;
  if (pending.kind === 'close') return <CloseDialog key={pending.caseId} caseId={pending.caseId} />;
  return <BlockedDialog caseId={pending.caseId} requirements={pending.requirements ?? []} />;
}
